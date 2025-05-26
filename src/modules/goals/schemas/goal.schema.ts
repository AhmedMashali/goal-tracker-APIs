import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type GoalDocument = Goal & Document;

@Schema({ timestamps: true })
export class Goal {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true, type: String })
  deadline: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Goal', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ unique: true, sparse: true, type: String, default: null })
  publicId: string | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);

GoalSchema.index({ ownerId: 1, parentId: 1, order: 1 });
GoalSchema.index({ isPublic: 1 });
GoalSchema.index({ publicId: 1 }, { unique: true, sparse: true });
