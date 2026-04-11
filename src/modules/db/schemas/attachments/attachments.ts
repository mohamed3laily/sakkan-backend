import { pgTable, serial, text, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { attachableTypeEnum, attachmentFileTypeEnum } from './enums';
import { timestamps } from '../timestamps';

export type SelectAttachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

export const attachments = pgTable(
  'attachments',
  {
    id: serial('id').primaryKey(),
    attachableType: attachableTypeEnum('attachable_type').notNull(),
    attachableId: integer('attachable_id').notNull(),
    fileType: attachmentFileTypeEnum('file_type').notNull(),
    url: text('url').notNull(),
    key: varchar('key').notNull(),
    mimeType: varchar('mime_type').notNull(),
    size: integer('size').notNull(),
    ...timestamps,
  },
  (table) => ({
    entityIdx: index('idx_attachments_entity').on(table.attachableType, table.attachableId),
  }),
);
