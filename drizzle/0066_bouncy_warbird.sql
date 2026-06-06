CREATE TABLE "user_fcm_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" integer NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_fcm_tokens_session_unique" UNIQUE("session_id"),
	CONSTRAINT "user_fcm_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "user_fcm_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "user_fcm_tokens_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_fcm_tokens_user" ON "user_fcm_tokens" USING btree ("user_id");--> statement-breakpoint
INSERT INTO "user_fcm_tokens" ("user_id", "session_id", "token")
SELECT u.id, us.id, u.fcm_token
FROM "users" u
INNER JOIN LATERAL (
  SELECT id
  FROM "user_sessions"
  WHERE user_id = u.id
    AND revoked_at IS NULL
    AND expires_at > NOW()
  ORDER BY last_seen_at DESC
  LIMIT 1
) us ON true
WHERE u.fcm_token IS NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "fcm_token";