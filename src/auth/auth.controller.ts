import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions = (): CookieOptions => {
  const sameSite = (process.env.COOKIE_SAME_SITE ?? 'lax') as CookieOptions['sameSite'];
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    path: '/auth',
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.sendTokens(res, await this.authService.register(dto));
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.sendTokens(res, await this.authService.login(dto));
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.readCookie(req, REFRESH_COOKIE);
    return this.sendTokens(res, await this.authService.refresh(refreshToken));
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Req() request: Request & { user: { userId: string; email: string } }) {
    return request.user;
  }

  private sendTokens(
    res: Response,
    tokens: { refreshToken: string; refreshMaxAgeMs: number; body: object },
  ) {
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...refreshCookieOptions(),
      maxAge: tokens.refreshMaxAgeMs,
    });
    return tokens.body;
  }

  private readCookie(req: Request, name: string): string | undefined {
    for (const part of req.headers.cookie?.split(';') ?? []) {
      const [key, ...value] = part.trim().split('=');
      if (key === name) return decodeURIComponent(value.join('='));
    }
    return undefined;
  }
}
