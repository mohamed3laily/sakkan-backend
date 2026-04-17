DO $m$ BEGIN
 IF EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'display_name'
 ) THEN
   ALTER TABLE "subscription_plans" RENAME COLUMN "display_name" TO "display_name_en";
 END IF;
END $m$;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "display_name_ar" varchar(100) NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE "subscription_plans" SET "display_name_ar" = "display_name_en" WHERE "display_name_ar" = '';--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "display_name_ar" DROP DEFAULT;
