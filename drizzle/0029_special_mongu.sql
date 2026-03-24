CREATE TYPE "public"."listing_status" AS ENUM('PUBLISHED', 'UNLISTED', 'PENDING');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"password" varchar NOT NULL,
	"password_reset_token" text,
	"password_reset_token_expiry" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "admins_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deactivated_at" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "status" "listing_status" DEFAULT 'PUBLISHED';--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "is_serious";