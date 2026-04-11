CREATE TYPE "public"."attachment_entity_type" AS ENUM('listing');--> statement-breakpoint
CREATE TYPE "public"."attachment_file_type" AS ENUM('image');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"attachable_type" "attachment_entity_type" NOT NULL,
	"attachable_id" integer NOT NULL,
	"file_type" "attachment_file_type" NOT NULL,
	"url" text NOT NULL,
	"key" varchar NOT NULL,
	"mime_type" varchar NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_attachments_entity" ON "attachments" USING btree ("attachable_type","attachable_id");