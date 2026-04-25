ALTER TABLE "user_subscriptions" ADD COLUMN "paid_egp" integer;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "plan_snapshot" jsonb;
