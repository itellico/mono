-- Migration: Add missing performance indexes identified in audit
-- Created: 2024-12-12
-- Description: Add composite indexes for user preferences and covering indexes for optimal performance

BEGIN;

-- Step 1: Add composite indexes for user preferences (most common query patterns)

-- User preferences with language, timezone, currency lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_lang_tz_curr ON user_preferences(
    user_id, language_id, timezone_id, currency_id
) WHERE language_id IS NOT NULL OR timezone_id IS NOT NULL OR currency_id IS NOT NULL;

-- Active preferences lookup (common pattern for user settings)
CREATE INDEX IF NOT EXISTS idx_user_preferences_active_preferences ON user_preferences(
    language_id, timezone_id, currency_id
) WHERE language_id IS NOT NULL OR timezone_id IS NOT NULL OR currency_id IS NOT NULL;

-- User timezone preferences (for time display)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_timezone ON user_preferences(
    user_id, timezone_id, language_id
) WHERE timezone_id IS NOT NULL;

-- Step 2: Add covering indexes for tenant allowed countries (avoids table lookups)

-- Covering index including timestamp for audit queries
CREATE INDEX IF NOT EXISTS idx_tenant_allowed_countries_covering ON tenant_allowed_countries(
    tenant_id, country_id
) INCLUDE (created_at);

-- Reverse lookup for country-to-tenants queries
CREATE INDEX IF NOT EXISTS idx_tenant_allowed_countries_country_tenants ON tenant_allowed_countries(
    country_id, tenant_id
) INCLUDE (created_at);

-- Step 3: Add specialized indexes for international reference tables

-- Countries: Most common search patterns
CREATE INDEX IF NOT EXISTS idx_countries_active_name_pattern ON countries(name varchar_pattern_ops) 
WHERE is_active = true; -- For pattern matching searches

CREATE INDEX IF NOT EXISTS idx_countries_phone_region ON countries(
    phone_code, region
) WHERE phone_code IS NOT NULL AND is_active = true;

-- Languages: Common filtering patterns
CREATE INDEX IF NOT EXISTS idx_languages_direction_family ON languages(
    direction, family, is_active
) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_languages_speakers_active ON languages(
    speakers DESC, is_active
) WHERE speakers IS NOT NULL AND is_active = true;

-- Timezones: UTC offset and region combinations
CREATE INDEX IF NOT EXISTS idx_timezones_region_offset ON timezones(
    region, utc_offset, is_active
) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_timezones_dst_aware ON timezones(
    has_dst, utc_offset, is_active
) WHERE is_active = true;

-- Currencies: Formatting and symbol queries
CREATE INDEX IF NOT EXISTS idx_currencies_symbol_decimal ON currencies(
    symbol_position, decimal_places, is_active
) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_currencies_formatting ON currencies(
    decimal_places, thousands_separator, decimal_separator
) WHERE is_active = true;

-- Step 4: Add indexes for JOIN operations (foreign key optimization)

-- User preferences foreign key performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_fk_country ON user_preferences(country_id) 
WHERE country_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_preferences_fk_language ON user_preferences(language_id) 
WHERE language_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_preferences_fk_timezone ON user_preferences(timezone_id) 
WHERE timezone_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_preferences_fk_currency ON user_preferences(currency_id) 
WHERE currency_id IS NOT NULL;

-- Tenants and accounts foreign key performance
CREATE INDEX IF NOT EXISTS idx_tenants_fk_country ON tenants(country_id) 
WHERE country_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_fk_country ON accounts(country_id) 
WHERE country_id IS NOT NULL;

-- Step 5: Add partial functional indexes for specific use cases

-- Country code normalization (case-insensitive lookups)
CREATE INDEX IF NOT EXISTS idx_countries_code_upper ON countries(UPPER(code)) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_countries_alpha3_upper ON countries(UPPER(alpha3)) 
WHERE is_active = true;

-- Currency code normalization
CREATE INDEX IF NOT EXISTS idx_currencies_code_upper ON currencies(UPPER(code)) 
WHERE is_active = true;

-- Language code normalization  
CREATE INDEX IF NOT EXISTS idx_languages_code_upper ON languages(UPPER(code)) 
WHERE is_active = true;

-- Step 6: Add statistics and analyze tables for query optimization
ANALYZE countries;
ANALYZE languages;
ANALYZE timezones;
ANALYZE currencies;
ANALYZE user_preferences;
ANALYZE tenant_allowed_countries;
ANALYZE tenants;
ANALYZE accounts;

-- Step 7: Add helpful comments for maintenance
COMMENT ON INDEX idx_user_preferences_user_lang_tz_curr IS 'Composite index for user international preferences lookup';
COMMENT ON INDEX idx_tenant_allowed_countries_covering IS 'Covering index to avoid table lookups for tenant country access';
COMMENT ON INDEX idx_countries_active_name_pattern IS 'Pattern matching index for country name searches';
COMMENT ON INDEX idx_timezones_region_offset IS 'Optimized index for timezone selection by region and offset';
COMMENT ON INDEX idx_currencies_symbol_decimal IS 'Currency formatting optimization index';

-- Performance report
DO $$
DECLARE
    total_indexes INTEGER;
    user_pref_indexes INTEGER;
    tenant_country_indexes INTEGER;
    reference_indexes INTEGER;
BEGIN
    -- Count indexes created
    SELECT COUNT(*) INTO total_indexes FROM pg_indexes 
    WHERE tablename IN ('countries', 'languages', 'timezones', 'currencies', 'user_preferences', 'tenant_allowed_countries');
    
    SELECT COUNT(*) INTO user_pref_indexes FROM pg_indexes WHERE tablename = 'user_preferences';
    SELECT COUNT(*) INTO tenant_country_indexes FROM pg_indexes WHERE tablename = 'tenant_allowed_countries';
    SELECT COUNT(*) INTO reference_indexes FROM pg_indexes 
    WHERE tablename IN ('countries', 'languages', 'timezones', 'currencies');
    
    RAISE NOTICE 'Additional performance indexes created:';
    RAISE NOTICE '- Total international data indexes: %', total_indexes;
    RAISE NOTICE '- User preferences indexes: %', user_pref_indexes;
    RAISE NOTICE '- Tenant allowed countries indexes: %', tenant_country_indexes;
    RAISE NOTICE '- Reference tables indexes: %', reference_indexes;
    RAISE NOTICE 'Database optimization completed for optimal query performance';
END $$;

COMMIT;