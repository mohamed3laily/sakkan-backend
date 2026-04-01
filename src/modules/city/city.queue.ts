import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CITY_JOBS, QUEUES } from 'src/common/queues/queue.constants';

export interface IncrementListingCountJob {
  cityId: number;
}

@Injectable()
export class CityQueue {
  constructor(@InjectQueue(QUEUES.CITY) private readonly cityQueue: Queue) {}

  async incrementListingCount(cityId: number) {
    await this.cityQueue.add(
      CITY_JOBS.INCREMENT_LISTING_COUNT,
      { cityId } satisfies IncrementListingCountJob,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
