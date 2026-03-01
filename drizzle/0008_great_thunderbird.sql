ALTER TABLE "listings" DROP CONSTRAINT "listings_area_id_areas_id_fk";
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "property_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."property_type";--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('LAND', 'VILLA_PALACE', 'APARTMENT_ROOM', 'FLOOR', 'BUILDING_TOWER', 'SHOP_SHOWROOM', 'CHALET_RESORT', 'FARM_YARD', 'COMMERCIAL_SERVICE', 'INDUSTRIAL_LOGISTICS');--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "property_type" SET DATA TYPE "public"."property_type" USING "property_type"::"public"."property_type";--> statement-breakpoint
DROP INDEX "idx_property_listings_area";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "area_ids" integer[];--> statement-breakpoint
CREATE INDEX "idx_property_listings_area_ids" ON "listings" USING gin ("area_ids");--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "area_id";