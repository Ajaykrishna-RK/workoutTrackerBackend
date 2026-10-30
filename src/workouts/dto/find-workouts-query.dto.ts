export const WORKOUT_RANGES = ['7d', '15d', '30d', '3m', '6m', '1y', 'custom'] as const;
export type WorkoutRange = (typeof WORKOUT_RANGES)[number];

export class FindWorkoutsQueryDto {
  range?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
}
