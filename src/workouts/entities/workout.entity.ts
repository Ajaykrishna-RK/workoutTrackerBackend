import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export class WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  exercises: WorkoutExercise[];

  @CreateDateColumn()
  createdAt: Date;

  @Column('uuid')
  userId: string;
}
