import { pgTable, serial, integer, unique, index } from 'drizzle-orm/pg-core';
import { users } from '../schema-index';
import { timestamps } from '../timestamps';
import { preferableTypeEnum } from './enums';

export const preferences = pgTable(
  'preferences',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    preferableType: preferableTypeEnum('preferable_type').notNull(),
    preferableId: integer('preferable_id').notNull(),
    ...timestamps,
  },
  (table) => [
    unique('unique_user_preference').on(table.userId, table.preferableType, table.preferableId),
  ],
);

export type SelectPreference = typeof preferences.$inferSelect;
export type InsertPreference = typeof preferences.$inferInsert;
