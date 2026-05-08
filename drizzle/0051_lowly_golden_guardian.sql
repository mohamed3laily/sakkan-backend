CREATE TABLE "real_state_developers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "developers_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"developer_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"banner" text NOT NULL,
	"address" text NOT NULL,
	"city_id" integer NOT NULL,
	"area_id" integer,
	"latitude" double precision,
	"longitude" double precision,
	"price_starting_from" integer,
	"commission_percentage" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "developers_projects" ADD CONSTRAINT "developers_projects_developer_id_real_state_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."real_state_developers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developers_projects" ADD CONSTRAINT "developers_projects_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developers_projects" ADD CONSTRAINT "developers_projects_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_project_id_developers_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."developers_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_property_listings_project_id" ON "listings" USING btree ("project_id");