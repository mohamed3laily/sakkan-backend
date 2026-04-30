CREATE TYPE "public"."user_language" AS ENUM('AR', 'EN');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('LISTING_PREFERENCE_MATCH', 'SERIOUS_LISTING_CREATED', 'LISTING_REQUEST_RECEIVED');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"body_ar" text NOT NULL,
	"body_en" text NOT NULL,
	"notifiable_id" integer,
	"notifiable_type" text,
	"read_at" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" "user_language" DEFAULT 'AR' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "fcm_token" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;