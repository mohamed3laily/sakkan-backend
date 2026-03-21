import { pgTable, serial, varchar, text, integer } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { users } from '../user/user';

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ...timestamps,
});

export type SelectNote = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;
