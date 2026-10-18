export class ExerciseDto {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export class CreateWorkoutDto {
  name: string;
  exercises: ExerciseDto[];
}
