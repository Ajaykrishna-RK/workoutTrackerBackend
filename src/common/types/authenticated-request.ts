import type { Request } from 'express';

export type AuthUser = { userId: string; email: string };

export type AuthenticatedRequest = Request & { user: AuthUser };
