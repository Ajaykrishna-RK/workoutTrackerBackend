import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkoutDto } from './create-workout.dto.js';

export class UpdateWorkoutDto extends PartialType(CreateWorkoutDto) {}
