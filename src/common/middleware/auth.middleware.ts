import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { NextFunction, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('You must be logged in');
    }

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userExists = await this.users.exists({ where: { id: payload.sub } });
    if (!userExists) throw new UnauthorizedException('User no longer exists');

    (req as AuthenticatedRequest).user = {
      userId: payload.sub,
      email: payload.email,
    };
    next();
  }
}
