ALTER TABLE "user_fcm_tokens" DROP CONSTRAINT "user_fcm_tokens_token_unique";--> statement-breakpoint
ALTER TABLE "credit_products" ADD COLUMN "apple_product_id" varchar(255);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "apple_product_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "apple_transaction_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "apple_environment" varchar(20);