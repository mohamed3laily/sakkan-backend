import { pgEnum } from 'drizzle-orm/pg-core';

export const favoritableTypeEnum = pgEnum('favoritable_type', [
  'LISTING',
  'USER',
  'DEVELOPER_PROJECT',
  'NOTIFICATION',
]);
