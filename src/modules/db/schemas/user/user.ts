import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  jsonb,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { userTypeEnum } from './enums';
import { cities } from '../schema-index';

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type SocialMediaLinks = {
  facebook?: string | null;
  instagram?: string | null;
  x?: string | null;
  website?: string | null;
};

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  phone: varchar('phone').notNull().unique(),
  profilePicture: text('profile_picture'),
  type: userTypeEnum('type'),
  bio: text('bio'),
  organizationNameAr: varchar('organization_name_ar'),
  organizationNameEn: varchar('organization_name_en'),
  socialMediaLinks: jsonb('social_media_links').$type<SocialMediaLinks>().default({
    facebook: null,
    instagram: null,
    x: null,
    website: null,
  }),
  cityId: integer('city_id').references(() => cities.id),
  contactViaWhatsapp: boolean('contact_via_whatsapp').default(true),
  contactViaPhone: boolean('contact_via_phone').default(true),
  verifyPhoneToken: varchar('verify_phone_token'),
  verifyPhoneTokenExpiry: timestamp('verify_phone_token_expiry'),
  verifiedPhoneAt: timestamp('verified_phone_at'),
  password: varchar('password').notNull(),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  ...timestamps,
});
