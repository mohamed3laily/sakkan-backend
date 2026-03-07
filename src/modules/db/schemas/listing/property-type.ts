import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { propertyParentTypeEnum } from './enums';

export const propertyType = pgTable('property_type', {
  id: serial('id').primaryKey(),
  parent: propertyParentTypeEnum('parent'),
  nameAr: varchar('name_ar', { length: 255 }),
  nameEn: varchar('name_en', { length: 255 }),
});
