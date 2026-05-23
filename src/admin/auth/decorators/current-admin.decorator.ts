import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthenticatedAdmin } from '../interfaces/authenticated-admin.interface';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedAdmin => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedAdmin }>();
    return request.user;
  },
);
