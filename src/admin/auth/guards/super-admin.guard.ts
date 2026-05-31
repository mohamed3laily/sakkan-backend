import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthenticatedAdmin } from '../interfaces/authenticated-admin.interface';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';

@Injectable()
export class SuperAdminGuard extends AdminJwtAuthGuard {
  handleRequest<TUser = AuthenticatedAdmin>(
    err: Error | null,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    const admin = super.handleRequest(err, user, info, context, status) as AuthenticatedAdmin;

    if (admin.type !== 'super_admin') {
      throw new ForbiddenException('ADMIN_FORBIDDEN');
    }

    return admin as TUser;
  }
}
