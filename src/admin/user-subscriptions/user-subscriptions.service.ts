import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { PaginationService } from 'src/common/services/pagination.service';
import { UserSessionService } from 'src/modules/auth/user-session.service';
import { AdminUserSubscriptionQueryDto } from './dto/user-subscription-query.dto';
import { UserSubscriptionsRepo } from './user-subscriptions.repo';

@Injectable()
export class UserSubscriptionsService {
  private readonly logger = new Logger(UserSubscriptionsService.name);

  constructor(
    private readonly repo: UserSubscriptionsRepo,
    private readonly paginationService: PaginationService,
    private readonly userSessionService: UserSessionService,
  ) {}

  getInsights() {
    return this.repo.getInsights();
  }

  async getSubscriptions(query: AdminUserSubscriptionQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.repo.findAll(query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getSubscriptionById(id: number) {
    const subscription = await this.repo.findById(id);
    if (!subscription) {
      throw new NotFoundException('SUBSCRIPTION_NOT_FOUND');
    }
    return subscription;
  }

  async cancelSubscription(adminId: number, id: number) {
    const row = await this.repo.findRowById(id);
    if (!row) {
      throw new NotFoundException('SUBSCRIPTION_NOT_FOUND');
    }

    const isActive =
      row.status === 'active' && new Date(row.periodEnd as string | Date) > new Date();
    if (!isActive) {
      throw new ConflictException('SUBSCRIPTION_NOT_ACTIVE');
    }

    const cancelled = await this.repo.cancel(id);
    if (!cancelled) {
      throw new NotFoundException('SUBSCRIPTION_NOT_FOUND');
    }

    await this.userSessionService.revokeAllForUser(
      cancelled.userId,
      'subscription_cancelled',
    );

    this.logger.warn(
      ({
        action: LogAction.ADMIN_SUBSCRIPTION_CANCELLED,
        adminId,
        subscriptionId: id,
        userId: cancelled.userId,
      }),
      'Admin cancelled user subscription',
    );

    return { id: cancelled.id, cancelled: true };
  }
}
