import { index, integer, pgTable, serial, unique } from 'drizzle-orm/pg-core';
import { creditTypeEnum } from './enums';
import { users } from '../user/user';
import { timestamps } from '../timestamps';

export const oneTimeCredits = pgTable(
  'one_time_credits',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: creditTypeEnum('type').notNull(),
    totalCredits: integer('total_credits').notNull().default(0),
    usedCredits: integer('used_credits').notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    userIdx: index('idx_one_time_credits_user').on(table.userId),
    userTypeUnique: unique('one_time_credits_user_type_unique').on(table.userId, table.type),
  }),
);
