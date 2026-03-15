import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';
import { users } from '../schema-index';
import { timestamps } from '../timestamps';
import { reviewableTypeEnum, reviewServiceTypeEnum } from './enums';

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  reviewerId: integer('reviewer_id')
    .references(() => users.id)
    .notNull(),
  reviewableId: integer('reviewable_id').notNull(),
  reviewableType: reviewableTypeEnum('reviewable_type').notNull(),
  serviceType: reviewServiceTypeEnum('service_type').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  ...timestamps,
});
