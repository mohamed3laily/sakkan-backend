ALTER TABLE "cities" ADD COLUMN "areas_count" integer DEFAULT 0;--> statement-breakpoint
UPDATE "cities" SET "areas_count" = (
  SELECT COUNT(*)::integer FROM "areas" WHERE "areas"."city_id" = "cities"."id"
);
