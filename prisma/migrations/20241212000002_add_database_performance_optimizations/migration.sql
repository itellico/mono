-- Migration: Add database performance optimizations
-- Created: 2024-12-12
-- Description: Add composite indexes and constraints for international reference tables

BEGIN;

-- Step 1: Add composite indexes for frequent query patterns

-- Countries: Common search patterns
CREATE INDEX IF NOT EXISTS idx_countries_active_region ON countries(is_active, region) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_countries_active_name ON countries(is_active, name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_countries_phone_code ON countries(phone_code) WHERE phone_code IS NOT NULL;

-- Languages: Language selection patterns
CREATE INDEX IF NOT EXISTS idx_languages_active_direction ON languages(is_active, direction) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_languages_family_active ON languages(family, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_languages_speakers ON languages(speakers DESC) WHERE speakers IS NOT NULL;

-- Timezones: Time-based filtering patterns
CREATE INDEX IF NOT EXISTS idx_timezones_active_utc_offset ON timezones(is_active, utc_offset) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_timezones_region_active ON timezones(region, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_timezones_has_dst ON timezones(has_dst, is_active) WHERE is_active = true;

-- Currencies: Financial operations patterns
CREATE INDEX IF NOT EXISTS idx_currencies_active_decimal_places ON currencies(is_active, decimal_places) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_currencies_symbol_position ON currencies(symbol_position, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_currencies_numeric_code ON currencies(numeric_code) WHERE numeric_code IS NOT NULL;

-- Step 2: Add performance indexes for user preferences relationships
CREATE INDEX IF NOT EXISTS idx_user_preferences_active_lookup ON user_preferences(
    country_id, language_id, timezone_id, currency_id
) WHERE country_id IS NOT NULL OR language_id IS NOT NULL OR timezone_id IS NOT NULL OR currency_id IS NOT NULL;

-- Step 3: Add indexes for tenant allowed countries performance
CREATE INDEX IF NOT EXISTS idx_tenant_countries_active ON tenant_allowed_countries(tenant_id, country_id)
INCLUDE (created_at);

-- Step 4: Add constraints for data integrity

-- Ensure country codes are always uppercase
ALTER TABLE countries ADD CONSTRAINT chk_countries_code_uppercase 
CHECK (code = UPPER(code));

ALTER TABLE countries ADD CONSTRAINT chk_countries_alpha3_uppercase 
CHECK (alpha3 = UPPER(alpha3));

-- Ensure currency codes are always uppercase
ALTER TABLE currencies ADD CONSTRAINT chk_currencies_code_uppercase 
CHECK (code = UPPER(code));

-- Ensure valid symbol position
ALTER TABLE currencies ADD CONSTRAINT chk_currencies_symbol_position 
CHECK (symbol_position IN ('before', 'after'));

-- Ensure positive decimal places
ALTER TABLE currencies ADD CONSTRAINT chk_currencies_decimal_places_positive 
CHECK (decimal_places >= 0 AND decimal_places <= 4);

-- Ensure valid language direction
ALTER TABLE languages ADD CONSTRAINT chk_languages_direction_valid 
CHECK (direction IN ('ltr', 'rtl'));

-- Ensure valid UTC offset range (±18 hours = ±64800 seconds)
ALTER TABLE timezones ADD CONSTRAINT chk_timezones_utc_offset_range 
CHECK (utc_offset >= -64800 AND utc_offset <= 64800);

-- Step 5: Add partial indexes for common filtered queries

-- Active records only (most common case)
CREATE INDEX IF NOT EXISTS idx_countries_active_only ON countries(display_order, name) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_languages_active_only ON languages(display_order, name) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_timezones_active_only ON timezones(region, city, name) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_currencies_active_only ON currencies(display_order, name) 
WHERE is_active = true;

-- Step 6: Add statistics collection for query optimization
ANALYZE countries;
ANALYZE languages;
ANALYZE timezones;
ANALYZE currencies;
ANALYZE user_preferences;
ANALYZE tenant_allowed_countries;

-- Step 7: Add helpful comments for maintenance
COMMENT ON INDEX idx_countries_active_region IS 'Optimizes country lookups by region for active countries';
COMMENT ON INDEX idx_languages_active_direction IS 'Optimizes language selection by writing direction';
COMMENT ON INDEX idx_timezones_active_utc_offset IS 'Optimizes timezone selection by UTC offset';
COMMENT ON INDEX idx_currencies_active_decimal_places IS 'Optimizes currency formatting queries';

-- Step 8: Create performance monitoring views
CREATE OR REPLACE VIEW international_data_stats AS
SELECT 
    'countries' as table_name,
    (SELECT COUNT(*) FROM countries WHERE is_active = true) as active_count,
    (SELECT COUNT(*) FROM countries) as total_count,
    (SELECT COUNT(DISTINCT region) FROM countries WHERE is_active = true) as unique_regions
UNION ALL
SELECT 
    'languages' as table_name,
    (SELECT COUNT(*) FROM languages WHERE is_active = true) as active_count,
    (SELECT COUNT(*) FROM languages) as total_count,
    (SELECT COUNT(DISTINCT family) FROM languages WHERE is_active = true) as unique_regions
UNION ALL
SELECT 
    'timezones' as table_name,
    (SELECT COUNT(*) FROM timezones WHERE is_active = true) as active_count,
    (SELECT COUNT(*) FROM timezones) as total_count,
    (SELECT COUNT(DISTINCT region) FROM timezones WHERE is_active = true) as unique_regions
UNION ALL
SELECT 
    'currencies' as table_name,
    (SELECT COUNT(*) FROM currencies WHERE is_active = true) as active_count,
    (SELECT COUNT(*) FROM currencies) as total_count,
    (SELECT COUNT(DISTINCT symbol_position) FROM currencies WHERE is_active = true) as unique_regions;

COMMENT ON VIEW international_data_stats IS 'Performance monitoring view for international reference data';

-- Performance report
DO $$
DECLARE
    countries_indexes INTEGER;
    languages_indexes INTEGER;
    timezones_indexes INTEGER;
    currencies_indexes INTEGER;
    constraints_added INTEGER;
BEGIN
    -- Count indexes added
    SELECT COUNT(*) INTO countries_indexes FROM pg_indexes WHERE tablename = 'countries';
    SELECT COUNT(*) INTO languages_indexes FROM pg_indexes WHERE tablename = 'languages';
    SELECT COUNT(*) INTO timezones_indexes FROM pg_indexes WHERE tablename = 'timezones';
    SELECT COUNT(*) INTO currencies_indexes FROM pg_indexes WHERE tablename = 'currencies';
    
    -- Count constraints added
    SELECT COUNT(*) INTO constraints_added FROM pg_constraint WHERE conname LIKE 'chk_%';
    
    RAISE NOTICE 'Performance optimization completed:';
    RAISE NOTICE '- Countries indexes: %', countries_indexes;
    RAISE NOTICE '- Languages indexes: %', languages_indexes;
    RAISE NOTICE '- Timezones indexes: %', timezones_indexes;
    RAISE NOTICE '- Currencies indexes: %', currencies_indexes;
    RAISE NOTICE '- Check constraints added: %', constraints_added;
    RAISE NOTICE '- Performance monitoring view created: international_data_stats';
END $$;

COMMIT;