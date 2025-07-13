-- Database Normalization: Create Addresses Table
-- Addresses Task 30 - Subtask 126: Create addresses table and move scattered address fields
-- Created: 2025-01-12

-- ============================================================================
-- STEP 1: CREATE ADDRESSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    
    -- Entity relation (polymorphic)
    entity_type VARCHAR(20) NOT NULL, -- 'account', 'user', 'tenant'
    entity_id INTEGER NOT NULL,
    
    -- Address type
    address_type VARCHAR(20) DEFAULT 'primary', -- 'primary', 'billing', 'shipping', 'office'
    
    -- Address fields
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
    
    -- Additional fields
    label VARCHAR(100), -- Custom label like 'Home', 'Office', etc.
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 2: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_addresses_entity ON addresses(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_addresses_country_code ON addresses(country_code);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(address_type);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(entity_type, entity_id, is_default) WHERE is_default = true;

-- ============================================================================
-- STEP 3: MIGRATE EXISTING ADDRESS DATA FROM ACCOUNTS
-- ============================================================================

-- Insert addresses for accounts that have city or country_code
INSERT INTO addresses (
    entity_type,
    entity_id,
    address_type,
    city,
    country_code,
    label,
    is_default,
    created_at,
    updated_at
)
SELECT 
    'account' as entity_type,
    a.id as entity_id,
    'primary' as address_type,
    a.city,
    COALESCE(a.country_code, 'US') as country_code, -- Default to US if null
    'Primary Address' as label,
    true as is_default,
    a.created_at,
    a.updated_at
FROM accounts a
WHERE a.city IS NOT NULL OR a.country_code IS NOT NULL;

-- ============================================================================
-- STEP 4: ADD FOREIGN KEY REFERENCES (polymorphic pattern)
-- ============================================================================

-- Note: We can't add direct FK constraints for polymorphic relations
-- but we can add CHECK constraints to ensure valid entity_type values
ALTER TABLE addresses 
ADD CONSTRAINT chk_addresses_entity_type 
CHECK (entity_type IN ('account', 'user', 'tenant'));

-- ============================================================================
-- STEP 5: ADD TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER addresses_updated_at_trigger
BEFORE UPDATE ON addresses
FOR EACH ROW
EXECUTE FUNCTION update_addresses_updated_at();

-- ============================================================================
-- STEP 6: CREATE VIEW FOR EASY ACCESS
-- ============================================================================

-- View for account addresses
CREATE OR REPLACE VIEW v_account_addresses AS
SELECT 
    a.id as account_id,
    a.email,
    addr.id as address_id,
    addr.uuid as address_uuid,
    addr.address_type,
    addr.address_line_1,
    addr.address_line_2,
    addr.city,
    addr.state_province,
    addr.postal_code,
    addr.country_code,
    c.name as country_name,
    addr.label,
    addr.is_default,
    addr.is_active
FROM accounts a
LEFT JOIN addresses addr ON a.id = addr.entity_id AND addr.entity_type = 'account'
LEFT JOIN countries c ON addr.country_code = c.code
WHERE addr.is_active = true OR addr.id IS NULL;

-- View for user addresses (for future use)
CREATE OR REPLACE VIEW v_user_addresses AS
SELECT 
    u.id as user_id,
    u.username,
    addr.id as address_id,
    addr.uuid as address_uuid,
    addr.address_type,
    addr.address_line_1,
    addr.address_line_2,
    addr.city,
    addr.state_province,
    addr.postal_code,
    addr.country_code,
    c.name as country_name,
    addr.label,
    addr.is_default,
    addr.is_active
FROM users u
LEFT JOIN addresses addr ON u.id = addr.entity_id AND addr.entity_type = 'user'
LEFT JOIN countries c ON addr.country_code = c.code
WHERE addr.is_active = true OR addr.id IS NULL;

-- ============================================================================
-- STEP 7: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE addresses IS 'Normalized addresses table supporting polymorphic relations to accounts, users, and tenants';
COMMENT ON COLUMN addresses.entity_type IS 'Type of entity this address belongs to: account, user, or tenant';
COMMENT ON COLUMN addresses.entity_id IS 'ID of the entity (account.id, user.id, or tenant.id)';
COMMENT ON COLUMN addresses.address_type IS 'Type of address: primary, billing, shipping, or office';
COMMENT ON COLUMN addresses.is_default IS 'Whether this is the default address for the entity';

-- ============================================================================
-- STEP 8: REPORT MIGRATION RESULTS
-- ============================================================================

DO $$
DECLARE
    addresses_created INTEGER;
    accounts_with_addresses INTEGER;
    countries_available INTEGER;
BEGIN
    SELECT COUNT(*) INTO addresses_created FROM addresses;
    SELECT COUNT(DISTINCT entity_id) INTO accounts_with_addresses 
    FROM addresses WHERE entity_type = 'account';
    SELECT COUNT(*) INTO countries_available FROM countries;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Addresses Table Migration Complete ===';
    RAISE NOTICE 'Created addresses table with polymorphic relations';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration results:';
    RAISE NOTICE '  - % addresses created', addresses_created;
    RAISE NOTICE '  - % accounts have addresses', accounts_with_addresses;
    RAISE NOTICE '  - % countries available for reference', countries_available;
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  - v_account_addresses (easy account address access)';
    RAISE NOTICE '  - v_user_addresses (ready for user addresses)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update application code to use addresses table';
    RAISE NOTICE '  2. Drop city and country_code columns from accounts table';
    RAISE NOTICE '  3. Test address functionality thoroughly';
    RAISE NOTICE '';
    RAISE NOTICE 'Benefits:';
    RAISE NOTICE '  ✅ Proper address normalization';
    RAISE NOTICE '  ✅ Support for multiple addresses per entity';
    RAISE NOTICE '  ✅ Polymorphic pattern for reusability';
    RAISE NOTICE '  ✅ Country validation via FK';
    RAISE NOTICE '  ✅ Address type categorization';
END $$;