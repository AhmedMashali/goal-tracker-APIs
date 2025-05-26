import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ValidatedUser } from '../strategies/jwt.strategy';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ValidatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
