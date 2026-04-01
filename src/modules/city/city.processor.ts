import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { eq, sql } from 'drizzle-orm';
import { IncrementListingCountJob } from './city.queue';

import { DrizzleService } from '../db/drizzle.service';
import { CITY_JOBS, QUEUES } from 'src/common/queues/queue.constants';
import { cities } from '../db/schemas/schema-index';
@Processor(QUEUES.CITY)
export class CityProcessor extends WorkerHost {
  private readonly logger = new Logger(CityProcessor.name);

  constructor(private readonly drizzleService: DrizzleService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case CITY_JOBS.INCREMENT_LISTING_COUNT:
        return this.handleIncrementListingCount(job.data as IncrementListingCountJob);
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async handleIncrementListingCount({ cityId }: IncrementListingCountJob) {
    await this.drizzleService.db
      .update(cities)
      .set({ listingCount: sql`${cities.listingCount} + 1` })
      .where(eq(cities.id, cityId));
  }
}
