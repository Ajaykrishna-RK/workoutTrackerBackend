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

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        tokenUse: string;
      }>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.tokenUse !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User no longer exists');
      return await this.issueToken(user);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
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
      tokenUse: 'access',
    });
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, tokenUse: 'refresh' },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
    const { password: _password, ...safeUser } = user;
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      refreshExpiresIn,
      user: safeUser,
    };
  }

  
}
