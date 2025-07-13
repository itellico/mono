-- Migration: Normalize JSON fields to foreign key references
-- Created: 2024-12-12
-- Description: Replace JSON fields with proper foreign key references to international reference tables

BEGIN;

-- Step 1: Add new foreign key columns
-- Add country_id to tenants table
ALTER TABLE tenants 
ADD COLUMN country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL;

-- Add foreign key columns to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL,
ADD COLUMN language_id INTEGER REFERENCES languages(id) ON DELETE SET NULL,
ADD COLUMN timezone_id INTEGER REFERENCES timezones(id) ON DELETE SET NULL,
ADD COLUMN currency_id INTEGER REFERENCES currencies(id) ON DELETE SET NULL;

-- Step 2: Migrate existing data

-- Migrate tenant allowed_countries (JSON array) to individual country_tenant_access table
-- First create the junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS tenant_allowed_countries (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, country_id)
);

-- Migrate tenant allowed_countries JSON to the junction table
-- This handles JSON arrays like ["US", "CA", "GB"]
DO $$
DECLARE
    tenant_rec RECORD;
    country_code TEXT;
    country_rec RECORD;
BEGIN
    FOR tenant_rec IN 
        SELECT id, allowed_countries 
        FROM tenants 
        WHERE allowed_countries IS NOT NULL 
        AND jsonb_array_length(allowed_countries::jsonb) > 0
    LOOP
        -- Extract each country code from the JSON array
        FOR country_code IN 
            SELECT jsonb_array_elements_text(tenant_rec.allowed_countries::jsonb)
        LOOP
            -- Find the country by code
            SELECT id INTO country_rec FROM countries 
            WHERE code = UPPER(country_code) OR alpha3 = UPPER(country_code)
            LIMIT 1;
            
            -- Insert into junction table if country found
            IF country_rec.id IS NOT NULL THEN
                INSERT INTO tenant_allowed_countries (tenant_id, country_id)
                VALUES (tenant_rec.id, country_rec.id)
                ON CONFLICT (tenant_id, country_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Migrate accounts.country_code to country_id
UPDATE accounts 
SET country_id = countries.id
FROM countries 
WHERE accounts.country_code = countries.code 
AND accounts.country_code IS NOT NULL;

-- Migrate user_preferences.currency_code to currency_id
UPDATE user_preferences 
SET currency_id = currencies.id
FROM currencies 
WHERE user_preferences.currency_code = currencies.code 
AND user_preferences.currency_code IS NOT NULL;

-- Migrate user_preferences.language_locale to language_id
-- Handle both full locales (en-US) and language codes (en)
UPDATE user_preferences 
SET language_id = languages.id
FROM languages 
WHERE (
    user_preferences.language_locale = languages.code 
    OR user_preferences.language_locale = languages.locale
    OR LEFT(user_preferences.language_locale, 2) = languages.code
) 
AND user_preferences.language_locale IS NOT NULL;

-- Migrate user_preferences.timezone to timezone_id
UPDATE user_preferences 
SET timezone_id = timezones.id
FROM timezones 
WHERE user_preferences.timezone = timezones.name 
AND user_preferences.timezone IS NOT NULL;

-- Step 3: Add indexes for new foreign key columns
CREATE INDEX IF NOT EXISTS idx_tenants_country_id ON tenants(country_id);
CREATE INDEX IF NOT EXISTS idx_accounts_country_id ON accounts(country_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_country_id ON user_preferences(country_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_language_id ON user_preferences(language_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_timezone_id ON user_preferences(timezone_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_currency_id ON user_preferences(currency_id);
CREATE INDEX IF NOT EXISTS idx_tenant_allowed_countries_tenant_id ON tenant_allowed_countries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_allowed_countries_country_id ON tenant_allowed_countries(country_id);

-- Step 4: Add helpful comments
COMMENT ON COLUMN tenants.country_id IS 'Primary country for tenant operations (replaces country-related data from settings JSON)';
COMMENT ON COLUMN accounts.country_id IS 'Account country (replaces country_code string field)';
COMMENT ON COLUMN user_preferences.country_id IS 'User preferred country';
COMMENT ON COLUMN user_preferences.language_id IS 'User preferred language (replaces language_locale string field)';
COMMENT ON COLUMN user_preferences.timezone_id IS 'User preferred timezone (replaces timezone string field)';
COMMENT ON COLUMN user_preferences.currency_id IS 'User preferred currency (replaces currency_code string field)';
COMMENT ON TABLE tenant_allowed_countries IS 'Many-to-many relationship: countries allowed for tenant operations (replaces allowed_countries JSON array)';

-- Step 5: Create helpful views for backward compatibility
CREATE OR REPLACE VIEW tenant_countries_view AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    array_agg(c.code ORDER BY c.name) as allowed_country_codes,
    array_agg(c.name ORDER BY c.name) as allowed_country_names
FROM tenants t
LEFT JOIN tenant_allowed_countries tac ON t.id = tac.tenant_id
LEFT JOIN countries c ON tac.country_id = c.id
GROUP BY t.id, t.name;

COMMENT ON VIEW tenant_countries_view IS 'Backward compatibility view: shows tenant allowed countries as arrays';

-- Migration report
DO $$
DECLARE
    tenant_countries_migrated INTEGER;
    account_countries_migrated INTEGER;
    user_currencies_migrated INTEGER;
    user_languages_migrated INTEGER;
    user_timezones_migrated INTEGER;
BEGIN
    -- Count successful migrations
    SELECT COUNT(*) INTO tenant_countries_migrated FROM tenant_allowed_countries;
    SELECT COUNT(*) INTO account_countries_migrated FROM accounts WHERE country_id IS NOT NULL;
    SELECT COUNT(*) INTO user_currencies_migrated FROM user_preferences WHERE currency_id IS NOT NULL;
    SELECT COUNT(*) INTO user_languages_migrated FROM user_preferences WHERE language_id IS NOT NULL;
    SELECT COUNT(*) INTO user_timezones_migrated FROM user_preferences WHERE timezone_id IS NOT NULL;
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Tenant allowed countries: % relationships created', tenant_countries_migrated;
    RAISE NOTICE '- Account countries: % records migrated', account_countries_migrated;
    RAISE NOTICE '- User currencies: % records migrated', user_currencies_migrated;
    RAISE NOTICE '- User languages: % records migrated', user_languages_migrated;
    RAISE NOTICE '- User timezones: % records migrated', user_timezones_migrated;
END $$;

COMMIT;