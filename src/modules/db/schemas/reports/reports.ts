import { pgTable, serial, integer, varchar, text, index } from 'drizzle-orm/pg-core';
import { users } from '../schema-index';
import { timestamps } from '../timestamps';
import { reportableTypeEnum, reportReasonEnum, reportStatusEnum } from './enums';

export const reports = pgTable(
  'reports',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    reportableType: reportableTypeEnum('reportable_type').notNull(),
    reportableId: integer('reportable_id').notNull(),
    reason: reportReasonEnum('reason').notNull(),
    description: text('description'),
    status: reportStatusEnum('status').default('PENDING').notNull(),
    ...timestamps,
  },
  (table) => ({
    entityCompositeIdx: index('idx_reports_entity_composite').on(table.reportableType, table.reportableId),
  }),
);

export type SelectReport = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
