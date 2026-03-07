CREATE TYPE "public"."type" AS ENUM('BROKER', 'DEVELOPER', 'OWNER', 'SEEKER');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_picture" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "type" "type";