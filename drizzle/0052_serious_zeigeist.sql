CREATE TABLE "real_estate_developers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "real_state_developers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "real_state_developers" CASCADE;--> statement-breakpoint
ALTER TABLE "developers_projects" DROP CONSTRAINT IF EXISTS "developers_projects_developer_id_real_state_developers_id_fk";
--> statement-breakpoint
ALTER TABLE "developers_projects" ADD CONSTRAINT "developers_projects_developer_id_real_estate_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."real_estate_developers"("id") ON DELETE cascade ON UPDATE no action;