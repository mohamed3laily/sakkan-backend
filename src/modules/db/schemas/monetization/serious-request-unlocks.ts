import { index, integer, pgTable, serial, unique } from 'drizzle-orm/pg-core';

import { listings } from '../listing/listing';
import { timestamps } from '../timestamps';
import { users } from '../user/user';

export const seriousRequestUnlocks = pgTable(
  'serious_request_unlocks',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    listingId: integer('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => ({
    userListingUnique: unique('serious_request_unlocks_user_listing_unique').on(
      table.userId,
      table.listingId,
    ),
    userIdx: index('idx_serious_request_unlocks_user').on(table.userId),
  }),
);
