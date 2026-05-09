import { Injectable } from '@nestjs/common';

import { PaginationService } from 'src/common/services/pagination.service';

import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationQueryDto } from '../dto/notification-query.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async getNotifications(userId: number, query: NotificationQueryDto) {
    const { page = 1, limit = 10, favorited } = query;
    const { data, total } = await this.repo.findForUser(userId, page, limit, {
      favorited,
    });
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async markAllAsRead(userId: number) {
    await this.repo.markAllAsRead(userId);
    return { message: 'ALL_NOTIFICATIONS_MARKED_AS_READ' };
  }

  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.repo.unreadCount(userId);
    return { count };
  }
}
