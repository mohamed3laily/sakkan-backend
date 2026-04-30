import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { NOTIFICATION_JOBS, QUEUES } from 'src/common/queues/queue.constants';

import { type NotificationJobPayload } from './notification.jobs';

@Injectable()
export class NotificationQueue {
  constructor(@InjectQueue(QUEUES.NOTIFICATION) private readonly queue: Queue) {}

  async dispatch(payload: NotificationJobPayload): Promise<void> {
    await this.queue.add(NOTIFICATION_JOBS.DISPATCH, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }
}
