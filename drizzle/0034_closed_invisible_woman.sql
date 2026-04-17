ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "display_name_en" varchar(100) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "display_name_ar" varchar(100) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "display_name_en" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "display_name_ar" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "display_name";
