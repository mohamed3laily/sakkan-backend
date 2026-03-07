CREATE TABLE "property_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent" "property_parents_type",
	"name_ar" varchar(255),
	"name_en" varchar(255)
);
--> statement-breakpoint
DROP INDEX "idx_property_listings_property_type";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "property_type_id" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_property_type_id_property_type_id_fk" FOREIGN KEY ("property_type_id") REFERENCES "public"."property_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_listings_property_type" ON "listings" USING btree ("property_type_id");--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "property_type";