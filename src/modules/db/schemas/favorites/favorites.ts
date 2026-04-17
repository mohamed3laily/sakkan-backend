import { pgTable, serial, integer, unique, index } from 'drizzle-orm/pg-core';
import { users } from '../schema-index';
import { timestamps } from '../timestamps';
import { favoritableTypeEnum } from './enums';

export const favorites = pgTable(
  'favorites',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    favoritableType: favoritableTypeEnum('favoritable_type').notNull(),
    favoritableId: integer('favoritable_id').notNull(),
    ...timestamps,
  },
  (table) => [
    unique('unique_user_entity_favorite').on(
      table.userId,
      table.favoritableType,
      table.favoritableId,
    ),
    index('idx_favorites_user').on(table.userId),
    index('idx_favorites_favoritable').on(table.favoritableType, table.favoritableId),
  ],
);

export type SelectFavorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;
