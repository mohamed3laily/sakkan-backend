import { pgEnum } from 'drizzle-orm/pg-core';

export const adminTypeEnum = pgEnum('admin_type', ['admin', 'super_admin']);
