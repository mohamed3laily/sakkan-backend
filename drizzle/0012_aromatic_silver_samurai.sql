CREATE TYPE "public"."report_reason" AS ENUM('SPAM', 'INAPPROPRIATE', 'FRAUD', 'MISLEADING', 'OFFENSIVE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."report_entity_type" AS ENUM('LISTING', 'USER');--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reportable_type" "report_entity_type" NOT NULL,
	"reportable_id" integer NOT NULL,
	"reason" "report_reason" NOT NULL,
	"description" text,
	"status" "report_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reports_entity_composite" ON "reports" USING btree ("reportable_type","reportable_id");