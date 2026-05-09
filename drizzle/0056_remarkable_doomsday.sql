ALTER TYPE "public"."payment_method" ADD VALUE 'FINANCING' BEFORE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."attachment_entity_type" ADD VALUE 'DEVELOPER_PROJECT';--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "developer_payment_methods" "payment_method"[];--> statement-breakpoint
ALTER TABLE "developers_projects" ADD COLUMN "whatsapp_phone" varchar;--> statement-breakpoint
ALTER TABLE "developers_projects" DROP COLUMN "banner";