import {
  HttpException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { UpdateWorkoutDto } from './dto/update-workout.dto.js';
import { Workout } from './entities/workout.entity.js';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(Workout)
    private readonly workouts: Repository<Workout>,
  ) {}

  async findAll(userId: string) {
    try {
      return await this.workouts.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.handleError(error, 'Failed to retrieve workouts');
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const workout = await this.workouts.findOne({ where: { id, userId } });
      if (!workout) throw new NotFoundException('Workout not found');
      return workout;
    } catch (error) {
      this.handleError(error, 'Failed to retrieve workout');
    }
  }

  async create(dto: CreateWorkoutDto, userId: string) {
    try {
      this.validate(dto);
      const workout = this.workouts.create({
        name: dto.name.trim(),
        exercises: dto.exercises.map((exercise) => ({
          ...exercise,
          name: exercise.name.trim(),
        })),
        userId,
      });
      return await this.workouts.save(workout);
    } catch (error) {
      this.handleError(error, 'Failed to create workout');
    }
  }

  async update(id: string, dto: UpdateWorkoutDto, userId: string) {
    try {
      const workout = await this.findOne(id, userId);
      this.validate(dto, true);
      if (dto.name !== undefined) workout.name = dto.name.trim();
      if (dto.exercises !== undefined)
        workout.exercises = dto.exercises.map((exercise) => ({
          ...exercise,
          name: exercise.name.trim(),
        }));
      return await this.workouts.save(workout);
    } catch (error) {
      this.handleError(error, 'Failed to update workout');
    }
  }

  async remove(id: string, userId: string) {
    try {
      const workout = await this.findOne(id, userId);
      await this.workouts.remove(workout);
      return { message: 'Workout deleted successfully' };
    } catch (error) {
      this.handleError(error, 'Failed to delete workout');
    }
  }

  private handleError(error: unknown, message: string): never {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException(message);
  }

  private validate(dto: CreateWorkoutDto | UpdateWorkoutDto, partial = false) {
    if (!partial || dto.name !== undefined) {
      if (!dto.name?.trim())
        throw new BadRequestException('Workout name is required');
    }
    if (!partial || dto.exercises !== undefined) {
      if (!Array.isArray(dto.exercises))
        throw new BadRequestException('exercises must be an array');
      for (const exercise of dto.exercises) {
        if (
          !exercise.name?.trim() ||
          !Number.isInteger(exercise.sets) || exercise.sets <= 0 ||
          !Number.isInteger(exercise.reps) || exercise.reps <= 0 ||
          typeof exercise.weight !== 'number' || !Number.isFinite(exercise.weight) || exercise.weight < 0
        ) {
          throw new BadRequestException(
            'Each exercise needs a name, positive sets and reps, and a non-negative weight',
          );
        }
      }
    }
  }
}
