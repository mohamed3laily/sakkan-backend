import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { QUEUES } from 'src/common/queues/queue.constants';

import { NotificationController } from './controllers/notification.controller';
import { FcmService } from './fcm/fcm.service';
import { FirebaseProvider } from './fcm/firebase.provider';
import { NotificationProcessor } from './jobs/notification.processor';
import { NotificationQueue } from './jobs/notification.queue';
import { SubscriptionExpiryScheduler } from './jobs/subscription-expiry.scheduler';
import { TodoReminderScheduler } from './jobs/todo-reminder.scheduler';
import { NotificationRepository } from './repositories/notification.repository';
import { FcmTokenRepo } from './repositories/fcm-token.repo';
import { NotificationService } from './services/notification.service';
import { FcmTokenService } from './services/fcm-token.service';
import { NotificationTestService } from './services/notification-test.service';
import { FcmTokenCleanupScheduler } from './jobs/fcm-token-cleanup.scheduler';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.NOTIFICATION })],
  controllers: [NotificationController],
  providers: [
    FirebaseProvider,
    FcmService,
    FcmTokenRepo,
    FcmTokenService,
    NotificationService,
    NotificationTestService,
    NotificationRepository,
    NotificationProcessor,
    NotificationQueue,
    TodoReminderScheduler,
    SubscriptionExpiryScheduler,
    FcmTokenCleanupScheduler,
  ],
  exports: [NotificationQueue, FcmTokenService],
})
export class NotificationModule {}
