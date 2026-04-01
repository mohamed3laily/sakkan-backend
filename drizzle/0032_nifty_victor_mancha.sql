ALTER TABLE "cities" ADD COLUMN "listing_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "areas" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "areas" ADD COLUMN "longitude" double precision;