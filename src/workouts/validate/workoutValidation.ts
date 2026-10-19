import { BadRequestException } from '@nestjs/common';
import { CreateWorkoutDto } from '../dto/create-workout.dto.js';
import { UpdateWorkoutDto } from '../dto/update-workout.dto.js';

export function validateWorkout(
  dto: CreateWorkoutDto | UpdateWorkoutDto,
  partial = false,
) {
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
