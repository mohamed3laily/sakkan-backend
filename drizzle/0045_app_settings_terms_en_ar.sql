ALTER TABLE "app_settings" ADD COLUMN "terms_and_conditions_en" text;
ALTER TABLE "app_settings" ADD COLUMN "terms_and_conditions_ar" text;
UPDATE "app_settings" SET "terms_and_conditions_en" = "terms_and_conditions", "terms_and_conditions_ar" = "terms_and_conditions";
ALTER TABLE "app_settings" DROP COLUMN "terms_and_conditions";
ALTER TABLE "app_settings" ALTER COLUMN "terms_and_conditions_en" SET NOT NULL;
ALTER TABLE "app_settings" ALTER COLUMN "terms_and_conditions_ar" SET NOT NULL;
