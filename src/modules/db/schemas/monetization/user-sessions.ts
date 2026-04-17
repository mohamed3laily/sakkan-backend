import { index, integer, pgTable, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core';
import { users } from '../user/user';
import { timestamps } from '../timestamps';

export const userSessions = pgTable(
  'user_sessions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deviceFingerprint: varchar('device_fingerprint', { length: 255 }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'string' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    ...timestamps,
  },
  (table) => ({
    userDeviceUnique: unique('user_sessions_user_device_unique').on(
      table.userId,
      table.deviceFingerprint,
    ),
    userIdx: index('idx_user_sessions_user').on(table.userId),
  }),
);
