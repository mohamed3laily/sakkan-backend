-- Idempotent migration: overlaps with 0031 / 0036 / 0037; safe if those already ran.
DO $m$ BEGIN
 CREATE TYPE "public"."listing_quota_source" AS ENUM('subscription', 'credits');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 CREATE TYPE "public"."listing_tier" AS ENUM('standard', 'premium');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_enum e
   JOIN pg_type t ON e.enumtypid = t.oid
   WHERE t.typname = 'payment_type' AND e.enumlabel = 'serious_request'
 ) THEN
   ALTER TYPE "public"."payment_type" ADD VALUE 'serious_request';
 END IF;
END $m$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) NOT NULL,
	"display_name_en" varchar(100) NOT NULL,
	"display_name_ar" varchar(100) NOT NULL,
	"credit_type" "credit_type" NOT NULL,
	"credits" integer NOT NULL,
	"price_egp" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "credit_products_key_unique" UNIQUE("key")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_fingerprint" varchar(255) NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_sessions_user_device_unique" UNIQUE("user_id","device_fingerprint")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "serious_request_unlocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "serious_request_unlocks_user_listing_unique" UNIQUE("user_id","listing_id")
);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "listing_tier" "listing_tier" DEFAULT 'standard';--> statement-breakpoint
DO $m$ BEGIN
 IF EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'featured_expires_at'
 ) AND NOT EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'premium_expires_at'
 ) THEN
   ALTER TABLE "listings" RENAME COLUMN "featured_expires_at" TO "premium_expires_at";
 END IF;
END $m$;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "premium_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "monetization_payment_id" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "quota_source" "listing_quota_source";--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "display_name_en" varchar(100);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "display_name_ar" varchar(100);--> statement-breakpoint
DO $m$ BEGIN
 IF EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'serious_request_quota_per_month'
 ) AND EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'serious_request_views_quota_per_month'
 ) THEN
   UPDATE "subscription_plans" SET "serious_request_views_quota_per_month" = COALESCE("serious_request_quota_per_month", "serious_request_views_quota_per_month");
   ALTER TABLE "subscription_plans" DROP COLUMN "serious_request_quota_per_month";
 ELSIF EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'serious_request_quota_per_month'
 ) AND NOT EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'serious_request_views_quota_per_month'
 ) THEN
   ALTER TABLE "subscription_plans" ADD COLUMN "serious_request_views_quota_per_month" integer DEFAULT 0 NOT NULL;
   UPDATE "subscription_plans" SET "serious_request_views_quota_per_month" = COALESCE("serious_request_quota_per_month", 0);
   ALTER TABLE "subscription_plans" DROP COLUMN "serious_request_quota_per_month";
 ELSIF NOT EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'serious_request_views_quota_per_month'
 ) THEN
   ALTER TABLE "subscription_plans" ADD COLUMN "serious_request_views_quota_per_month" integer DEFAULT 0 NOT NULL;
 END IF;
END $m$;--> statement-breakpoint
ALTER TABLE "quota_usage" ADD COLUMN IF NOT EXISTS "serious_request_views_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $m$ BEGIN
 IF EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'quota_usage' AND column_name = 'serious_request_used'
 ) THEN
   UPDATE "quota_usage" SET "serious_request_views_used" = COALESCE("serious_request_used", "serious_request_views_used");
   ALTER TABLE "quota_usage" DROP COLUMN "serious_request_used";
 END IF;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "serious_request_unlocks" ADD CONSTRAINT "serious_request_unlocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "serious_request_unlocks" ADD CONSTRAINT "serious_request_unlocks_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_serious_request_unlocks_user" ON "serious_request_unlocks" USING btree ("user_id");--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "listings" ADD CONSTRAINT "listings_monetization_payment_id_payments_id_fk" FOREIGN KEY ("monetization_payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quota_usage_user" ON "quota_usage" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN IF EXISTS "is_serious";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "display_name";--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "quota_usage" ADD CONSTRAINT "quota_usage_user_billing_unique" UNIQUE("user_id","billing_month");
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;
