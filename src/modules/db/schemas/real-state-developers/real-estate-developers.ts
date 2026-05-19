import { pgTable, serial,  text } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';

export const realEstateDevelopers = pgTable('real_estate_developers', {
  id: serial('id').primaryKey(),
  nameEn: text('name_en'),
  nameAr: text('name_ar'),
  logo: text('logo').notNull(),
  ...timestamps,
});
