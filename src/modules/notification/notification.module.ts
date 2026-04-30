import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { QUEUES } from 'src/common/queues/queue.constants';

import { NotificationController } from './controllers/notification.controller';
import { FcmService } from './fcm/fcm.service';
import { FirebaseProvider } from './fcm/firebase.provider';
import { NotificationProcessor } from './jobs/notification.processor';
import { NotificationQueue } from './jobs/notification.queue';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.NOTIFICATION })],
  controllers: [NotificationController],
  providers: [
    FirebaseProvider,
    FcmService,
    NotificationService,
    NotificationRepository,
    NotificationProcessor,
    NotificationQueue,
  ],
  exports: [NotificationQueue],
})
export class NotificationModule {}
