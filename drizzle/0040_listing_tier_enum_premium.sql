-- 0038 created listing_tier only when the type was missing. If 0031 already created
-- listing_tier as ('standard','serious','featured'), 0038 skipped CREATE TYPE and the
-- column kept the old enum — app uses 'premium' and Postgres rejects it.
-- This migration replaces the old enum with ('standard','premium') when 'premium' is absent.

DO $migrate$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_type t
		JOIN pg_enum e ON e.enumtypid = t.oid
		WHERE t.typname = 'listing_tier'
			AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
			AND e.enumlabel = 'premium'
	) THEN
		RAISE NOTICE '0040: public.listing_tier already has premium — nothing to do';
	ELSIF NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'listings'
			AND column_name = 'listing_tier'
	) THEN
		RAISE NOTICE '0040: listings.listing_tier missing — skip (run earlier migrations)';
	ELSE
		ALTER TABLE public.listings ALTER COLUMN listing_tier DROP DEFAULT;
		ALTER TABLE public.listings ALTER COLUMN listing_tier SET DATA TYPE text USING listing_tier::text;

		UPDATE public.listings
		SET listing_tier = 'standard'
		WHERE listing_tier IN ('serious', 'featured');

		IF EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_schema = 'public'
				AND table_name = 'listings'
				AND column_name = 'is_serious'
		) THEN
			UPDATE public.listings SET listing_tier = 'premium' WHERE is_serious = true;
		END IF;
		IF EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_schema = 'public'
				AND table_name = 'listings'
				AND column_name = 'is_featured_ad'
		) THEN
			UPDATE public.listings SET listing_tier = 'premium' WHERE is_featured_ad = true;
		END IF;

		DROP TYPE public.listing_tier;
		CREATE TYPE public.listing_tier AS ENUM ('standard', 'premium');

		ALTER TABLE public.listings
			ALTER COLUMN listing_tier SET DATA TYPE public.listing_tier USING listing_tier::public.listing_tier;

		ALTER TABLE public.listings ALTER COLUMN listing_tier SET DEFAULT 'standard';
	END IF;
END
$migrate$;
