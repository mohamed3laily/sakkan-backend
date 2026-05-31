import { index, integer, pgTable, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { timestamps } from '../timestamps';

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: serial('id').primaryKey(),
    adminId: integer('admin_id')
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
    tokenLookup: varchar('token_lookup', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'string' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    ...timestamps,
  },
  (table) => ({
    tokenLookupUnique: unique('admin_sessions_token_lookup_unique').on(table.tokenLookup),
    adminIdx: index('idx_admin_sessions_admin').on(table.adminId),
  }),
);

export type SelectAdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;
