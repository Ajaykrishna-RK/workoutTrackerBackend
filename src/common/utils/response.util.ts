import { HttpException, InternalServerErrorException } from '@nestjs/common';

export function handleSuccess<T extends object = object>(
  message: string,
  data?: T,
) {
  return { message, ...data } as { message: string } & T;
}

export function handleError(error: unknown, message: string): never {
  if (error instanceof HttpException) throw error;
  throw new InternalServerErrorException(message);
}
