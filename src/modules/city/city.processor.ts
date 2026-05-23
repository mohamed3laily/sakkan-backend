import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { eq, sql } from 'drizzle-orm';
import { IncrementListingCountJob } from './city.queue';

import { DrizzleService } from '../db/drizzle.service';
import { CITY_JOBS, QUEUES } from 'src/common/queues/queue.constants';
import { cities } from '../db/schemas/schema-index';
import { LogAction } from 'src/common/logging';

@Processor(QUEUES.CITY)
export class CityProcessor extends WorkerHost {
  private readonly logger = new Logger(CityProcessor.name);

  constructor(private readonly drizzleService: DrizzleService) {
    super();
  }

  async process(job: Job) {
    try {
      switch (job.name) {
        case CITY_JOBS.INCREMENT_LISTING_COUNT:
          return await this.handleIncrementListingCount(job.data as IncrementListingCountJob);
        default:
          this.logger.warn(`Unknown job: ${job.name}`);
      }
    } catch (err) {
      this.logger.error(
        ({
          action: LogAction.BULLMQ_JOB_FAILED,
          jobName: job.name,
          jobId: job.id,
        }),
        err instanceof Error ? err.message : 'City job failed',
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  private async handleIncrementListingCount({ cityId }: IncrementListingCountJob) {
    await this.drizzleService.db
      .update(cities)
      .set({ listingCount: sql`${cities.listingCount} + 1` })
      .where(eq(cities.id, cityId));
  }
}
