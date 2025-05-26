import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { Goal, GoalSchema } from './schemas/goal.schema';
import { AuthModule } from '../auth/auth.module'; // For AuthGuard and GetUser decorator

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }]),
    AuthModule, // Import AuthModule to make Passport/JWT utilities available
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
