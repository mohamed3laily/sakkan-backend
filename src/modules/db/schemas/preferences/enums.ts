import { pgEnum } from 'drizzle-orm/pg-core';

export const preferableTypeEnum = pgEnum('preferable_type', ['AREA', 'PROPERTY_TYPE']);
export type PreferableType = 'AREA' | 'PROPERTY_TYPE';
