import { index, integer, pgTable, serial, unique, varchar } from 'drizzle-orm/pg-core';
import { users } from '../user/user';
import { userSubscriptions } from './user-subscriptions';
import { timestamps } from '../timestamps';

export const quotaUsage = pgTable(
  'quota_usage',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subscriptionId: integer('subscription_id')
      .notNull()
      .references(() => userSubscriptions.id, { onDelete: 'cascade' }),
    billingMonth: varchar('billing_month', { length: 7 }).notNull(),
    seriousRequestViewsUsed: integer('serious_request_views_used').notNull().default(0),
    featuredAdUsed: integer('featured_ad_used').notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    userBillingUnique: unique('quota_usage_user_billing_unique').on(
      table.userId,
      table.billingMonth,
    ),
    userIdx: index('idx_quota_usage_user').on(table.userId),
  }),
);
