import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { handleError, handleSuccess } from '../common/utils/response.util.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { FindWorkoutsQueryDto } from './dto/find-workouts-query.dto.js';
import { UpdateWorkoutDto } from './dto/update-workout.dto.js';
import { Workout } from './entities/workout.entity.js';
import { validateWorkout } from './validate/workoutValidation.js';
import { validateWorkoutQuery } from './validate/workoutQueryValidation.js';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(Workout)
    private readonly workouts: Repository<Workout>,
  ) {}

  async findAll(userId: string, query: FindWorkoutsQueryDto) {
    try {
      const { page, limit, from, to } = validateWorkoutQuery(query);
      const createdAt =
        from && to ? Between(from, to)
        : from ? MoreThanOrEqual(from)
        : to ? LessThanOrEqual(to)
        : undefined;
      const [data, total] = await this.workouts.findAndCount({
        where: { userId, ...(createdAt && { createdAt }) },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        data,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      handleError(error, 'Failed to retrieve workouts');
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const workout = await this.workouts.findOne({ where: { id, userId } });
      if (!workout) throw new NotFoundException('Workout not found');
      return workout;
    } catch (error) {
      handleError(error, 'Failed to retrieve workout');
    }
  }

  async create(dto: CreateWorkoutDto, userId: string) {
    try {
      validateWorkout(dto);
      const workout = this.workouts.create({
        name: dto.name.trim(),
        exercises: dto.exercises.map((exercise) => ({
          ...exercise,
          name: exercise.name.trim(),
        })),
        userId,
      });
      const savedWorkout = await this.workouts.save(workout);
      return handleSuccess('Workout created successfully', { workout: savedWorkout });
    } catch (error) {
      handleError(error, 'Failed to create workout');
    }
  }

  async update(id: string, dto: UpdateWorkoutDto, userId: string) {
    try {
      const workout = await this.findOne(id, userId);
      validateWorkout(dto, true);
      if (dto.name !== undefined) workout.name = dto.name.trim();
      if (dto.exercises !== undefined)
        workout.exercises = dto.exercises.map((exercise) => ({
          ...exercise,
          name: exercise.name.trim(),
        }));
      const savedWorkout = await this.workouts.save(workout);
      return handleSuccess('Workout updated successfully', { workout: savedWorkout });
    } catch (error) {
      handleError(error, 'Failed to update workout');
    }
  }

  async remove(id: string, userId: string) {
    try {
      const workout = await this.findOne(id, userId);
      await this.workouts.remove(workout);
      return handleSuccess('Workout deleted successfully');
    } catch (error) {
      handleError(error, 'Failed to delete workout');
    }
  }


}
