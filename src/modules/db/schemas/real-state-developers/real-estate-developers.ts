import { pgTable, serial,  text } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';

export const realEstateDevelopers = pgTable('real_estate_developers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo').notNull(),
  ...timestamps,
});
