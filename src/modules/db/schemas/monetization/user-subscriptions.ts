import { boolean, index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { subscriptionStatusEnum } from './enums';
import { subscriptionPlans } from './subscription-plans';
import { users } from '../user/user';
import { timestamps } from '../timestamps';

export const userSubscriptions = pgTable(
  'user_subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: integer('plan_id')
      .notNull()
      .references(() => subscriptionPlans.id),
    status: subscriptionStatusEnum('status').notNull().default('pending'),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    autoRenew: boolean('auto_renew').notNull().default(true),
    paymobOrderId: varchar('paymob_order_id', { length: 255 }),
    paymobSubscriptionId: varchar('paymob_subscription_id', { length: 255 }),
    cancelledAt: timestamp('cancelled_at'),
    cancellationReason: varchar('cancellation_reason', { length: 500 }),
    ...timestamps,
  },
  (table) => ({
    userIdx: index('idx_user_subscriptions_user').on(table.userId),
    statusIdx: index('idx_user_subscriptions_status').on(table.status),
    periodEndIdx: index('idx_user_subscriptions_period_end').on(table.periodEnd),
  }),
);
