import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ATTACHMENT_JOBS, QUEUES } from 'src/common/queues/queue.constants';

@Injectable()
export class AttachmentQueue {
  constructor(@InjectQueue(QUEUES.ATTACHMENT) private readonly queue: Queue) {}

  async scheduleOrphanCleanup() {
    await this.queue.add(
      ATTACHMENT_JOBS.CLEANUP_ORPHANS,
      {},
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
