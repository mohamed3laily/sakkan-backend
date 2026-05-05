import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationRepository } from '../repositories/notification.repository';

import { NotificationQueue } from './notification.queue';

const DAYS_BEFORE_EXPIRY = 3;
/** Must match cron cadence (half-open window width). */
const WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class SubscriptionExpiryScheduler {
  private readonly logger = new Logger(SubscriptionExpiryScheduler.name);

  constructor(
    private readonly repo: NotificationRepository,
    private readonly notificationQueue: NotificationQueue,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendSubscriptionExpiryReminders(): Promise<void> {
    this.logger.debug('Running subscription expiry reminder check...');

    const rows = await this.repo.findSubscriptionsNearingExpiry(DAYS_BEFORE_EXPIRY, WINDOW_MS);
    if (!rows.length) {
      return;
    }

    this.logger.debug(`Found ${rows.length} subscriptions nearing expiry`);

    await Promise.all(
      rows.map((row) =>
        this.notificationQueue.dispatch({
          type: 'SUBSCRIPTION_GOING_TO_EXPIRE',
          userSubscriptionId: row.userSubscriptionId,
          userId: row.userId,
          planNameEn: row.planNameEn,
          planNameAr: row.planNameAr,
        }),
      ),
    );
  }
}
