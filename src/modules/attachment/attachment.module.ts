import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AttachmentRepository } from './attachment.repo';
import { StorageModule } from 'src/modules/storage/storage.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from 'src/common/queues/queue.constants';
import { AttachmentProcessor } from './attachment.processor';
import { AttachmentQueue } from './attachment.queue';

@Module({
  imports: [StorageModule, BullModule.registerQueue({ name: QUEUES.ATTACHMENT })],
  providers: [AttachmentService, AttachmentRepository, AttachmentProcessor, AttachmentQueue],
  exports: [AttachmentService, AttachmentQueue],
})
export class AttachmentModule {}
