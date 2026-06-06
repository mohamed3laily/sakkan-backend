import { index, integer, pgTable, serial, text, unique } from 'drizzle-orm/pg-core';

import { userSessions } from '../monetization/user-sessions';
import { users } from '../user/user';
import { timestamps } from '../timestamps';

export const userFcmTokens = pgTable(
  'user_fcm_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: integer('session_id')
      .notNull()
      .references(() => userSessions.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    ...timestamps,
  },
  (table) => ({
    sessionUnique: unique('user_fcm_tokens_session_unique').on(table.sessionId),
    userIdx: index('idx_user_fcm_tokens_user').on(table.userId),
  }),
);

export type SelectUserFcmToken = typeof userFcmTokens.$inferSelect;
export type InsertUserFcmToken = typeof userFcmTokens.$inferInsert;
