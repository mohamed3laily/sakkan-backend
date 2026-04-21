-- Backfill: promote any listing that was serious or featured to the new 'premium' tier
-- before we drop those columns and change the enum.
UPDATE "listings"
SET "listing_tier" = 'standard'
WHERE "listing_tier" IN ('serious', 'featured');
--> statement-breakpoint

-- Promote listings that had is_serious=true or is_featured_ad=true to premium.
UPDATE "listings"
SET "listing_tier" = 'premium'
WHERE "is_serious" = true OR "is_featured_ad" = true;
--> statement-breakpoint

-- Rename featured_expires_at -> premium_expires_at before altering enum
-- (keeps existing expiry data intact).
ALTER TABLE "listings" RENAME COLUMN "featured_expires_at" TO "premium_expires_at";
--> statement-breakpoint

-- Alter listing_tier enum: standard | serious | featured  ->  standard | premium
-- Step 1: convert column to text so we can drop the old enum type
ALTER TABLE "listings" ALTER COLUMN "listing_tier" SET DATA TYPE text;
--> statement-breakpoint

-- Step 2: drop old enum
DROP TYPE "public"."listing_tier";
--> statement-breakpoint

-- Step 3: create new enum
CREATE TYPE "public"."listing_tier" AS ENUM('standard', 'premium');
--> statement-breakpoint

-- Step 4: cast column back
ALTER TABLE "listings"
  ALTER COLUMN "listing_tier"
  SET DATA TYPE "public"."listing_tier"
  USING "listing_tier"::"public"."listing_tier";
--> statement-breakpoint

-- Set the default on the enum column
ALTER TABLE "listings" ALTER COLUMN "listing_tier" SET DEFAULT 'standard';
--> statement-breakpoint

-- Drop the two redundant boolean columns
ALTER TABLE "listings" DROP COLUMN "is_serious";
--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "is_featured_ad";
--> statement-breakpoint

-- Create serious_request_unlocks table
CREATE TABLE "serious_request_unlocks" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "listing_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone,
  CONSTRAINT "serious_request_unlocks_user_listing_unique" UNIQUE("user_id","listing_id")
);
--> statement-breakpoint
ALTER TABLE "serious_request_unlocks"
  ADD CONSTRAINT "serious_request_unlocks_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "serious_request_unlocks"
  ADD CONSTRAINT "serious_request_unlocks_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_serious_request_unlocks_user" ON "serious_request_unlocks" USING btree ("user_id");
