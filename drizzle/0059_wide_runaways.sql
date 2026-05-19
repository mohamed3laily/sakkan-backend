ALTER TABLE "real_estate_developers" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "real_estate_developers" ADD COLUMN "name_ar" text;--> statement-breakpoint
ALTER TABLE "developers_projects" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "developers_projects" ADD COLUMN "name_ar" text;--> statement-breakpoint
ALTER TABLE "developers_projects" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "developers_projects" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "developers_projects" ADD COLUMN "address_en" text;--> statement-breakpoint
ALTER TABLE "developers_projects" ADD COLUMN "address_ar" text;--> statement-breakpoint
ALTER TABLE "real_estate_developers" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "developers_projects" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "developers_projects" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "developers_projects" DROP COLUMN "address";