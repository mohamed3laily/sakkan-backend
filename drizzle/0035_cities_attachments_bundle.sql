ALTER TABLE "cities" ADD COLUMN "listing_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "areas" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "areas" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_city_id_cities_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas" ADD COLUMN "geometry" jsonb;--> statement-breakpoint
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
CREATE INDEX "idx_attachments_entity" ON "attachments" USING btree ("attachable_type","attachable_id");--> statement-breakpoint
ALTER TABLE "attachments" ALTER COLUMN "attachable_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."attachment_entity_type";--> statement-breakpoint
CREATE TYPE "public"."attachment_entity_type" AS ENUM('LISTING');--> statement-breakpoint
ALTER TABLE "attachments" ALTER COLUMN "attachable_type" SET DATA TYPE "public"."attachment_entity_type" USING "attachable_type"::"public"."attachment_entity_type";--> statement-breakpoint
ALTER TABLE "attachments" ALTER COLUMN "file_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."attachment_file_type";--> statement-breakpoint
CREATE TYPE "public"."attachment_file_type" AS ENUM('IMAGE');--> statement-breakpoint
ALTER TABLE "attachments" ALTER COLUMN "file_type" SET DATA TYPE "public"."attachment_file_type" USING "file_type"::"public"."attachment_file_type";
