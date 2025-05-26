import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ValidatedUser } from '../auth/strategies/jwt.strategy';

import { ParseMongoIdPipe } from '../../common/pipes/parse-mongo-id.pipe';

@Controller()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('goals')
  async create(
    @Body() createGoalDto: CreateGoalDto,
    @GetUser() user: ValidatedUser,
  ) {
    return this.goalsService.create(createGoalDto, user._id.toString());
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('goals')
  async findAllByUser(@GetUser() user: ValidatedUser) {
    return this.goalsService.findAllByUser(user._id.toString());
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('goals/:id')
  async findOne(
    @Param('id', ParseMongoIdPipe) id: string,
    @GetUser() user: ValidatedUser,
  ) {
    return this.goalsService.findOne(id, user._id.toString());
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('goals/:id')
  async update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @GetUser() user: ValidatedUser,
  ) {
    return this.goalsService.update(id, updateGoalDto, user._id.toString());
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('goals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseMongoIdPipe) id: string,
    @GetUser() user: ValidatedUser,
  ) {
    await this.goalsService.remove(id, user._id.toString());
  }

  @Get('public-goals')
  async findAllPublic() {
    return this.goalsService.findAllPublic();
  }

  @Get('public-goals/:publicId')
  async findOneByPublicId(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
  ) {
    return this.goalsService.findOneByPublicId(publicId);
  }
}
