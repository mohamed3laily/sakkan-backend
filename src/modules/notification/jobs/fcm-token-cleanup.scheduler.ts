import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { FcmTokenService } from '../services/fcm-token.service';

@Injectable()
export class FcmTokenCleanupScheduler {
  private readonly logger = new Logger(FcmTokenCleanupScheduler.name);

  constructor(private readonly fcmTokenService: FcmTokenService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOrphanedTokens(): Promise<void> {
    const deleted = await this.fcmTokenService.cleanupOrphanedTokens();
    if (deleted > 0) {
      this.logger.log(`Removed ${deleted} orphaned FCM token(s)`);
    }
  }
}
