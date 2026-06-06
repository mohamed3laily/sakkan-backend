import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { PaginationService } from 'src/common/services/pagination.service';
import { UsersRepo } from './users.repo';
import { AdminUserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly repo: UsersRepo,
    private readonly paginationService: PaginationService,
  ) {}

  async getUsers(query: AdminUserQueryDto) {
    const { page = 1, limit = 20 } = query;
    const { data, total } = await this.repo.findAll(query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getUserById(id: number) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async toggleDeactivate(adminId: number, targetUserId: number) {
    const result = await this.repo.toggleDeactivate(targetUserId);
    if (!result) throw new NotFoundException(`User ${targetUserId} not found`);

    this.logger.log(
      ({
        action: LogAction.ADMIN_USER_DEACTIVATED,
        adminId,
        targetUserId,
        active: result.deactivatedAt === null,
      }),
      'Admin toggled user active status',
    );

    return {
      id: result.id,
      active: result.deactivatedAt === null,
      deactivatedAt: result.deactivatedAt,
    };
  }

  async deleteUser(adminId: number, targetUserId: number) {
    const result = await this.repo.delete(targetUserId);
    if (!result) throw new NotFoundException(`User ${targetUserId} not found`);

    this.logger.warn(
      ({
        action: LogAction.ADMIN_USER_DELETED,
        adminId,
        targetUserId,
      }),
      'Admin deleted user',
    );

    return { id: result.id, deleted: true };
  }
}
