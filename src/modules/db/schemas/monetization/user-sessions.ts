import { index, integer, pgTable, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core';
import { users } from '../user/user';
import { timestamps } from '../timestamps';
import { sessionRevokeReasonEnum } from './enums';

export const userSessions = pgTable(
  'user_sessions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deviceFingerprint: varchar('device_fingerprint', { length: 255 }).notNull(),
    deviceLabel: varchar('device_label', { length: 100 }),
    refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
    tokenLookup: varchar('token_lookup', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'string' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    revokedReason: sessionRevokeReasonEnum('revoked_reason'),
    ...timestamps,
  },
  (table) => ({
    userDeviceUnique: unique('user_sessions_user_device_unique').on(
      table.userId,
      table.deviceFingerprint,
    ),
    tokenLookupUnique: unique('user_sessions_token_lookup_unique').on(table.tokenLookup),
    userIdx: index('idx_user_sessions_user').on(table.userId),
  }),
);

export type SelectUserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
