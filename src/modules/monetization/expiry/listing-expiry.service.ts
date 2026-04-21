import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lt, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { listings } from '../../db/schemas/listing/listing';

@Injectable()
export class ListingExpiryService {
  private readonly logger = new Logger(ListingExpiryService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expirePremiumListings() {
    const expired = await this.drizzle.db
      .update(listings)
      .set({
        listingTier: 'standard',
        status: 'UNLISTED',
        premiumExpiresAt: null,
        quotaSource: null,
      })
      .where(and(eq(listings.listingTier, 'premium'), lt(listings.premiumExpiresAt, sql`NOW()`)))
      .returning({ id: listings.id });

    if (expired.length > 0) {
      this.logger.log(`Expired ${expired.length} premium listing(s)`);
    }
  }
}
