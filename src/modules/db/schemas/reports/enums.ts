import { pgEnum } from 'drizzle-orm/pg-core';

export const reportableTypeEnum = pgEnum('report_entity_type', ['LISTING', 'USER']);

export const reportReasonEnum = pgEnum('report_reason', [
  'SPAM',
  'INAPPROPRIATE',
  'FRAUD',
  'MISLEADING',
  'OFFENSIVE',
  'OTHER',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'PENDING',
  'REVIEWED',
  'RESOLVED',
  'DISMISSED',
]);
