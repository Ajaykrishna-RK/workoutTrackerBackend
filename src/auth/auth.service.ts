import {
  ConflictException,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const email = dto.email?.trim().toLowerCase();
      if (
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !dto.password ||
        dto.password.length < 8
      ) {
        throw new BadRequestException(
          'Provide a valid email and a password of at least 8 characters',
        );
      }

      const existingUser = await this.users.findOne({ where: { email } });
      if (existingUser) {
        throw new ConflictException('An account with this email already exists');
      }

      const user = this.users.create({
        name: dto.name?.trim(),
        email,
        password: await bcrypt.hash(dto.password, 10),
      });
      const savedUser = await this.users.save(user);
      return await this.issueToken(savedUser);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('An account with this email already exists');
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async login(dto: LoginDto) {
    try {
      const email = dto.email?.trim().toLowerCase();
      const user = email ? await this.users.findOne({ where: { email } }) : null;
      if (!user || !(await bcrypt.compare(dto.password ?? '', user.password))) {
        throw new UnauthorizedException('Invalid email or password');
      }
      return await this.issueToken(user);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Login failed');
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }

  private async issueToken(user: User) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
    const { password: _password, ...safeUser } = user;
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      user: safeUser,
    };
  }
}
