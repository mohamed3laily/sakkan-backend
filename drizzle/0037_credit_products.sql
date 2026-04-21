CREATE TABLE "credit_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) NOT NULL,
	"display_name_en" varchar(100) NOT NULL,
	"display_name_ar" varchar(100) NOT NULL,
	"credit_type" "credit_type" NOT NULL,
	"credits" integer NOT NULL,
	"price_egp" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "credit_products_key_unique" UNIQUE("key")
);
