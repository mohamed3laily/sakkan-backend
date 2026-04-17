DO $m$ BEGIN
 CREATE TYPE "public"."listing_quota_source" AS ENUM('subscription', 'credits');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 CREATE TYPE "public"."listing_tier" AS ENUM('standard', 'serious', 'featured');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 CREATE TYPE "public"."billing_period" AS ENUM('monthly', 'yearly');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 CREATE TYPE "public"."credit_type" AS ENUM('serious', 'featured');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 CREATE TYPE "public"."payment_type" AS ENUM('subscription', 'featured_single', 'featured_bundle', 'serious_request');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired', 'past_due', 'pending');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name_en" varchar(100) NOT NULL,
	"display_name_ar" varchar(100) NOT NULL,
	"billing_period" "billing_period" NOT NULL,
	"price_egp" integer NOT NULL,
	"device_limit" integer DEFAULT 1 NOT NULL,
	"serious_request_quota_per_month" integer DEFAULT 0 NOT NULL,
	"featured_ad_quota_per_month" integer DEFAULT 0 NOT NULL,
	"has_priority_listing" boolean DEFAULT false NOT NULL,
	"has_verified_badge" boolean DEFAULT false NOT NULL,
	"has_dedicated_support" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"paymob_order_id" varchar(255),
	"paymob_subscription_id" varchar(255),
	"cancelled_at" timestamp,
	"cancellation_reason" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quota_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subscription_id" integer NOT NULL,
	"billing_month" varchar(7) NOT NULL,
	"serious_request_used" integer DEFAULT 0 NOT NULL,
	"featured_ad_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "quota_usage_user_billing_unique" UNIQUE("user_id","billing_month")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "one_time_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "credit_type" NOT NULL,
	"total_credits" integer DEFAULT 0 NOT NULL,
	"used_credits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "one_time_credits_user_type_unique" UNIQUE("user_id","type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "payment_type" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"amount_piasters" integer NOT NULL,
	"paymob_order_id" varchar(255),
	"paymob_transaction_id" varchar(255),
	"paymob_payment_key" varchar(1000),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_fingerprint" varchar(255) NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_sessions_user_device_unique" UNIQUE("user_id","device_fingerprint")
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "listing_tier" "listing_tier" DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "is_featured_ad" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "featured_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "monetization_payment_id" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "quota_source" "listing_quota_source";--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "quota_usage" ADD CONSTRAINT "quota_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "quota_usage" ADD CONSTRAINT "quota_usage_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "one_time_credits" ADD CONSTRAINT "one_time_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_user" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_status" ON "user_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_period_end" ON "user_subscriptions" USING btree ("period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quota_usage_user" ON "quota_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_one_time_credits_user" ON "one_time_credits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_user" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
DO $m$ BEGIN
 ALTER TABLE "listings" ADD CONSTRAINT "listings_monetization_payment_id_payments_id_fk" FOREIGN KEY ("monetization_payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $m$;