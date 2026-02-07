CREATE TYPE "public"."budget_type" AS ENUM('MARKET', 'FIXED');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('OFFER', 'REQUEST');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('LAND', 'VILLA_PALACE', 'FLOOR', 'BUILDING_TOWER', 'APARTMENT_ROOM');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"name_ar" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"name_en" varchar(150) NOT NULL,
	"name_ar" varchar(150) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"deal_type" "listing_type" NOT NULL,
	"listing_type" "listing_type" NOT NULL,
	"property_type" "property_type" NOT NULL,
	"city_id" integer NOT NULL,
	"area_id" integer,
	"budget_type" "budget_type" NOT NULL,
	"price" integer,
	"space_sqm" integer,
	"payment_method" "payment_method",
	"description" text,
	"contact_whatsapp" boolean DEFAULT true,
	"contact_phone" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_property_listings_city" ON "listings" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "idx_property_listings_area" ON "listings" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "idx_property_listings_property_type" ON "listings" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "idx_property_listings_price" ON "listings" USING btree ("price");--> statement-breakpoint
CREATE INDEX "idx_property_listings_user" ON "listings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_property_listings_created_at" ON "listings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_property_listings_city_deal_listing" ON "listings" USING btree ("city_id","deal_type","listing_type");