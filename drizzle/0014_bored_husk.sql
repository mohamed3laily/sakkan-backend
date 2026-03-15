ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_name_ar" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_name_en" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "social_media_links" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_via_whatsapp" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_via_phone" boolean DEFAULT true;