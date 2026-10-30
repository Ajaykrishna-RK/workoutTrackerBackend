import { BadRequestException } from '@nestjs/common';
import {
  FindWorkoutsQueryDto,
  WORKOUT_RANGES,
  type WorkoutRange,
} from '../dto/find-workouts-query.dto.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export interface WorkoutQuery {
  page: number;
  limit: number;
  from?: Date;
  to?: Date;
}

export function validateWorkoutQuery(query: FindWorkoutsQueryDto): WorkoutQuery {
  const page = parsePositiveInt(query.page, 'page') ?? 1;
  const limit = parsePositiveInt(query.limit, 'limit') ?? DEFAULT_LIMIT;
  if (limit > MAX_LIMIT)
    throw new BadRequestException(`limit cannot be greater than ${MAX_LIMIT}`);

  if (query.range === undefined || query.range === '') {
    if (query.from || query.to)
      throw new BadRequestException('from and to require range=custom');
    return { page, limit };
  }
  if (!WORKOUT_RANGES.includes(query.range as WorkoutRange))
    throw new BadRequestException(`range must be one of: ${WORKOUT_RANGES.join(', ')}`);

  const range = query.range as WorkoutRange;
  if (range !== 'custom') {
    if (query.from || query.to)
      throw new BadRequestException('from and to are only allowed with range=custom');
    return { page, limit, from: rangeStart(range) };
  }

  const from = parseDate(query.from, 'from', false);
  const to = parseDate(query.to, 'to', true);
  if (!from && !to)
    throw new BadRequestException('range=custom needs from, to, or both');
  if (from && to && from > to)
    throw new BadRequestException('from must be on or before to');
  return { page, limit, from, to };
}

function rangeStart(range: Exclude<WorkoutRange, 'custom'>): Date {
  const start = new Date();
  switch (range) {
    case '7d': start.setDate(start.getDate() - 7); break;
    case '15d': start.setDate(start.getDate() - 15); break;
    case '30d': start.setDate(start.getDate() - 30); break;
    case '3m': start.setMonth(start.getMonth() - 3); break;
    case '6m': start.setMonth(start.getMonth() - 6); break;
    case '1y': start.setFullYear(start.getFullYear() - 1); break;
  }
  return start;
}

function parsePositiveInt(value: string | undefined, field: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new BadRequestException(`${field} must be a positive integer`);
  return parsed;
}

function parseDate(value: string | undefined, field: string, endOfDay: boolean): Date | undefined {
  if (value === undefined || value === '') return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new BadRequestException(`${field} must be a valid date (e.g. 2026-10-01)`);
  if (endOfDay && DATE_ONLY.test(value)) date.setUTCHours(23, 59, 59, 999);
  return date;
}
