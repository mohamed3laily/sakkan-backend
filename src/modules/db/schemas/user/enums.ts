import { pgEnum } from 'drizzle-orm/pg-core';

export const userTypeEnum = pgEnum('type', ['BROKER', 'DEVELOPER', 'OWNER', 'SEEKER']);
