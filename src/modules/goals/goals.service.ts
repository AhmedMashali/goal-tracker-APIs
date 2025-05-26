import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Goal, GoalDocument } from './schemas/goal.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GoalsService {
  constructor(@InjectModel(Goal.name) private goalModel: Model<GoalDocument>) {}

  private async getGoalDepth(
    goalId: Types.ObjectId | string | null,
  ): Promise<number> {
    if (!goalId) return 0;

    let currentGoal = await this.goalModel
      .findById(goalId)
      .select('parentId')
      .lean();
    let depth = 0;
    while (currentGoal && currentGoal.parentId) {
      depth++;
      currentGoal = await this.goalModel
        .findById(currentGoal.parentId)
        .select('parentId')
        .lean();
    }
    return depth;
  }

  async create(
    createGoalDto: CreateGoalDto,
    ownerId: string,
  ): Promise<GoalDocument> {
    const { parentId, isPublic, ...goalData } = createGoalDto;
    const ownerObjectId = new Types.ObjectId(ownerId);

    if (parentId) {
      const parentGoal = await this.goalModel.findOne({
        _id: new Types.ObjectId(parentId),
        ownerId: ownerObjectId,
      });
      if (!parentGoal) {
        throw new NotFoundException(
          `Parent goal with ID "${parentId}" not found or not owned by user.`,
        );
      }
      const parentDepth = await this.getGoalDepth(
        parentGoal._id as Types.ObjectId,
      );
      if (parentDepth >= 2) {
        throw new BadRequestException(
          'Cannot create goal: Maximum nesting depth of 2 levels exceeded.',
        );
      }
    }

    const newGoal = new this.goalModel({
      ...goalData,
      ownerId: ownerObjectId,
      parentId: parentId ? new Types.ObjectId(parentId) : null,
      isPublic: isPublic ?? false,
      publicId: (isPublic ?? false) ? uuidv4() : null,
      order: createGoalDto.order ?? 0,
    });

    try {
      return await newGoal.save();
    } catch (error) {
      if (
        error.code === 11000 &&
        error.keyPattern &&
        error.keyPattern.publicId
      ) {
        newGoal.publicId = uuidv4();
        try {
          return await newGoal.save();
        } catch (innerError) {
          throw new ConflictException(
            'Failed to generate a unique public ID. Please try again.',
          );
        }
      }
      throw error;
    }
  }

  async findAllByUser(ownerId: string): Promise<GoalDocument[]> {
    return this.goalModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ parentId: 1, order: 1 })
      .exec();
  }

  async findOne(id: string, ownerId: string): Promise<GoalDocument> {
    const goal = await this.goalModel.findOne({
      _id: new Types.ObjectId(id),
      ownerId: new Types.ObjectId(ownerId),
    });
    if (!goal) {
      throw new NotFoundException(
        `Goal with ID "${id}" not found or not owned by user.`,
      );
    }
    return goal;
  }

  async update(
    id: string,
    updateGoalDto: UpdateGoalDto,
    ownerId: string,
  ): Promise<GoalDocument> {
    const goalToUpdate = await this.findOne(id, ownerId);
    const ownerObjectId = new Types.ObjectId(ownerId);

    const { parentId, isPublic, ...goalData } = updateGoalDto;

    if (parentId !== undefined) {
      if (parentId === id) {
        throw new BadRequestException('A goal cannot be its own parent.');
      }
      if (parentId === null) {
        goalToUpdate.parentId = null;
      } else {
        const newParentGoal = await this.goalModel.findOne({
          _id: new Types.ObjectId(parentId),
          ownerId: ownerObjectId,
        });
        if (!newParentGoal) {
          throw new NotFoundException(
            `New parent goal with ID "${parentId}" not found or not owned by user.`,
          );
        }
        const newParentDepth = await this.getGoalDepth(
          newParentGoal._id as Types.ObjectId,
        );
        const currentGoalChildrenDepth = await this.getMaxDepthOfChildren(
          goalToUpdate._id as Types.ObjectId,
        );

        if (newParentDepth + 1 + currentGoalChildrenDepth > 2) {
          throw new BadRequestException(
            'Cannot update goal: Maximum nesting depth of 2 levels exceeded for the goal or its children.',
          );
        }
        goalToUpdate.parentId = new Types.ObjectId(parentId);
      }
    }

    if (isPublic !== undefined && goalToUpdate.isPublic !== isPublic) {
      goalToUpdate.isPublic = isPublic;
      goalToUpdate.publicId = isPublic
        ? goalToUpdate.publicId || uuidv4()
        : null;
    } else if (isPublic === true && !goalToUpdate.publicId) {
      goalToUpdate.publicId = uuidv4();
    }

    Object.assign(goalToUpdate, goalData);

    try {
      return await goalToUpdate.save();
    } catch (error) {
      if (
        error.code === 11000 &&
        error.keyPattern &&
        error.keyPattern.publicId
      ) {
        goalToUpdate.publicId = uuidv4();
        try {
          return await goalToUpdate.save();
        } catch (innerError) {
          throw new ConflictException(
            'Failed to generate a unique public ID during update. Please try again.',
          );
        }
      }
      throw error;
    }
  }

  private async getMaxDepthOfChildren(goalId: Types.ObjectId): Promise<number> {
    const children = await this.goalModel
      .find({ parentId: goalId })
      .select('_id')
      .lean();
    if (children.length === 0) return 0;

    let maxChildDepth = 0;
    for (const child of children) {
      const grandChildren = await this.goalModel.countDocuments({
        parentId: child._id,
      });
      if (grandChildren > 0) {
        maxChildDepth = Math.max(maxChildDepth, 1);
      }
    }
    return maxChildDepth;
  }

  async remove(id: string, ownerId: string): Promise<{ message: string }> {
    const goal = await this.findOne(id, ownerId);

    const childrenCount = await this.goalModel.countDocuments({
      parentId: goal._id,
    });
    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete goal: It has sub-goals. Please delete them first or reassign them.',
      );
    }

    const result = await this.goalModel.deleteOne({
      _id: goal._id,
      ownerId: new Types.ObjectId(ownerId),
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Goal with ID "${id}" not found or not owned by user.`,
      );
    }
    return { message: `Goal with ID "${id}" successfully deleted.` };
  }

  async findAllPublic(): Promise<GoalDocument[]> {
    return this.goalModel
      .find({ isPublic: true })
      .populate('ownerId', 'email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneByPublicId(publicId: string): Promise<GoalDocument> {
    const goal = await this.goalModel
      .findOne({ publicId, isPublic: true })
      .populate('ownerId', 'email')
      .exec();
    if (!goal) {
      throw new NotFoundException(
        `Public goal with public ID "${publicId}" not found.`,
      );
    }
    return goal;
  }
}
