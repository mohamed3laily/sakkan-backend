import { pgEnum } from 'drizzle-orm/pg-core';

export const userTypeEnum = pgEnum('type', ['BROKER', 'DEVELOPER', 'OWNER', 'SEEKER']);

export const userLanguageEnum = pgEnum('user_language', ['AR', 'EN']);
export type UserLanguage = (typeof userLanguageEnum.enumValues)[number];
