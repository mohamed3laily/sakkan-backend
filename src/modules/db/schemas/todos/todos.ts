import { pgTable, serial, varchar, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { users } from '../user/user';

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  dueDate: timestamp('due_date', {
    withTimezone: true,
    mode: 'string',
  }),
  doneAt: timestamp('done_at', {
    withTimezone: true,
    mode: 'string',
  }),
  remindMe: boolean('remind_me').default(false),
  ...timestamps,
});
