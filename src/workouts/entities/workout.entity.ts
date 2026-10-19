import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

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

  @ManyToOne(() => User, (user) => user.workouts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;
}
