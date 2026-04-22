import { pgEnum } from 'drizzle-orm/pg-core';

export const billingPeriodEnum = pgEnum('billing_period', ['monthly', 'yearly']);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'cancelled',
  'expired',
  'pending',
]);

export const paymentTypeEnum = pgEnum('payment_type', [
  'subscription',
  'featured_single',
  'featured_bundle',
  'serious_request',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'success',
  'failed',
  'refunded',
]);

export const creditTypeEnum = pgEnum('credit_type', ['serious', 'featured']);
