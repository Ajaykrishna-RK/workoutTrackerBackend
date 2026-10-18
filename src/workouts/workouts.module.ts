import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from './entities/workout.entity.js';
import { WorkoutsController } from './workouts.controller.js';
import { WorkoutsService } from './workouts.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workout])],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
})
export class WorkoutsModule {}
