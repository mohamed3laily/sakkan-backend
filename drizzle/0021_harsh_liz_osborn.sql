CREATE TYPE "public"."review_service_type" AS ENUM('PROPERTY_REQUEST_SERVICE', 'PROPERTY_LISTING_SERVICE', 'PROPERTY_MARKETING_SERVICE');--> statement-breakpoint
CREATE TYPE "public"."reviewable_type" AS ENUM('USER');--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"reviewable_id" integer NOT NULL,
	"reviewable_type" "reviewable_type" NOT NULL,
	"service_type" "review_service_type" NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;