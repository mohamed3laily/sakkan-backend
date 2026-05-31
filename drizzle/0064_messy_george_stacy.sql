CREATE TYPE "public"."admin_type" AS ENUM('admin', 'super_admin');--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "type" "admin_type" DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
