import { boolean, integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { billingPeriodEnum } from './enums';
import { timestamps } from '../timestamps';

export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  billingPeriod: billingPeriodEnum('billing_period').notNull(),
  priceEgp: integer('price_egp').notNull(),
  deviceLimit: integer('device_limit').notNull().default(1),
  seriousRequestQuotaPerMonth: integer('serious_request_quota_per_month').notNull().default(0),
  featuredAdQuotaPerMonth: integer('featured_ad_quota_per_month').notNull().default(0),
  hasPriorityListing: boolean('has_priority_listing').notNull().default(false),
  hasVerifiedBadge: boolean('has_verified_badge').notNull().default(false),
  hasDedicatedSupport: boolean('has_dedicated_support').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});
