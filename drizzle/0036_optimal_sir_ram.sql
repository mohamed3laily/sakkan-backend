ALTER TABLE "attachments" ALTER COLUMN "attachable_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."attachment_entity_type";--> statement-breakpoint
CREATE TYPE "public"."attachment_entity_type" AS ENUM('LISTING');--> statement-breakpoint
ALTER TABLE "attachments" ALTER COLUMN "attachable_type" SET DATA TYPE "public"."attachment_entity_type" USING "attachable_type"::"public"."attachment_entity_type";--> statement-breakpoint
ALTER TABLE "attachments" ALTER COLUMN "file_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."attachment_file_type";--> statement-breakpoint
CREATE TYPE "public"."attachment_file_type" AS ENUM('IMAGE');--> statement-breakpoint
ALTER TABLE "attachments" ALTER COLUMN "file_type" SET DATA TYPE "public"."attachment_file_type" USING "file_type"::"public"."attachment_file_type";