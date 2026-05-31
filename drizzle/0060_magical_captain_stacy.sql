ALTER TABLE "user_sessions" ADD COLUMN "refresh_token_hash" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "token_lookup" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_token_lookup_unique" UNIQUE("token_lookup");