import { boolean, integer, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from '../user/user';
import { timestamps } from '../timestamps';

export const notifiableTypeEnum = pgEnum('notification_type', [
  'LISTING_PREFERENCE_MATCH',
  'SERIOUS_LISTING_CREATED',
  'LISTING_REQUEST_RECEIVED',
  'TODO_REMINDER',
]);

export type NotifiableType = (typeof notifiableTypeEnum.enumValues)[number];

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  type: notifiableTypeEnum('type').notNull(),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  bodyAr: text('body_ar').notNull(),
  bodyEn: text('body_en').notNull(),
  notifiableId: integer('notifiable_id'),
  notifiableType: text('notifiable_type'),
  readAt: timestamp('read_at'),
  ...timestamps,
});

export type SelectNotification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
