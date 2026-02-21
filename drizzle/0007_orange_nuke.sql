ALTER TABLE "users" ADD COLUMN "verify_phone_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verify_phone_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verified_phone_at" timestamp;