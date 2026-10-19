import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { UpdateWorkoutDto } from './dto/update-workout.dto.js';
import { WorkoutsService } from './workouts.service.js';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  create(
    @Body() dto: CreateWorkoutDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workoutsService.create(dto, request.user.userId);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.workoutsService.findAll(request.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.workoutsService.findOne(id, request.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workoutsService.update(id, dto, request.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.workoutsService.remove(id, request.user.userId);
  }
}
