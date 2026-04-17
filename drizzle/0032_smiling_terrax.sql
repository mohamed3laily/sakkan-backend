ALTER TABLE "one_time_credits" DROP CONSTRAINT IF EXISTS "one_time_credits_user_type_unique";--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "serious_request_views_quota_per_month" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "serious_request_quota_per_month";
