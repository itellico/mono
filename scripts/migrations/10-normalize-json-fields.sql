-- Database Normalization: Convert JSON fields to proper tables
-- Addresses Task 30 - Subtask 125: Normalize Tenant JSON fields
-- Created: 2025-01-12

-- ============================================================================
-- STEP 1: CREATE NORMALIZED TABLES FOR TENANT JSON FIELDS
-- ============================================================================

-- Features table and junction
CREATE TABLE IF NOT EXISTS features (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_features (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, feature_id)
);

-- Settings table and junction
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    default_value TEXT,
    category VARCHAR(50),
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_settings (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    setting_id INTEGER NOT NULL REFERENCES settings(id) ON DELETE CASCADE,
    value TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, setting_id)
);

-- Categories table and junction
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_categories (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, category_id)
);

-- Countries table and junction
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code VARCHAR(2) NOT NULL UNIQUE, -- ISO 3166-1 alpha-2
    name VARCHAR(255) NOT NULL,
    phone_code VARCHAR(10),
    currency_code VARCHAR(3),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_countries (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, country_id)
);

-- Capabilities table for accounts
CREATE TABLE IF NOT EXISTS capabilities (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_capabilities (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    capability_id INTEGER NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, capability_id)
);

-- ============================================================================
-- STEP 2: POPULATE DEFAULT DATA
-- ============================================================================

-- Insert common countries
INSERT INTO countries (code, name, phone_code, currency_code) VALUES
('US', 'United States', '+1', 'USD'),
('CA', 'Canada', '+1', 'CAD'),
('GB', 'United Kingdom', '+44', 'GBP'),
('DE', 'Germany', '+49', 'EUR'),
('FR', 'France', '+33', 'EUR'),
('AU', 'Australia', '+61', 'AUD'),
('JP', 'Japan', '+81', 'JPY'),
('CN', 'China', '+86', 'CNY'),
('IN', 'India', '+91', 'INR'),
('BR', 'Brazil', '+55', 'BRL')
ON CONFLICT (code) DO NOTHING;

-- Insert common features
INSERT INTO features (code, name, description, category) VALUES
('billing', 'Billing System', 'Access to billing and subscription management', 'core'),
('analytics', 'Analytics Dashboard', 'Access to analytics and reporting', 'insights'),
('api_access', 'API Access', 'Access to REST/GraphQL APIs', 'integration'),
('white_label', 'White Label', 'Custom branding and white labeling', 'branding'),
('custom_domain', 'Custom Domain', 'Use custom domain names', 'branding'),
('advanced_permissions', 'Advanced Permissions', 'Fine-grained permission controls', 'security'),
('sso', 'Single Sign-On', 'SSO integration capabilities', 'security'),
('bulk_operations', 'Bulk Operations', 'Bulk import/export operations', 'productivity'),
('webhooks', 'Webhooks', 'Webhook integrations', 'integration'),
('rate_limiting', 'Rate Limiting', 'API rate limiting controls', 'performance')
ON CONFLICT (code) DO NOTHING;

-- Insert common settings
INSERT INTO settings (key, name, description, data_type, default_value, category) VALUES
('max_users', 'Maximum Users', 'Maximum number of users allowed', 'number', '100', 'limits'),
('storage_limit_gb', 'Storage Limit (GB)', 'Storage limit in gigabytes', 'number', '10', 'limits'),
('session_timeout_minutes', 'Session Timeout', 'Session timeout in minutes', 'number', '60', 'security'),
('enable_2fa', 'Two-Factor Authentication', 'Enable 2FA requirement', 'boolean', 'false', 'security'),
('default_theme', 'Default Theme', 'Default UI theme', 'string', 'light', 'ui'),
('logo_url', 'Logo URL', 'Custom logo URL', 'string', '', 'branding'),
('support_email', 'Support Email', 'Support contact email', 'string', '', 'contact'),
('timezone', 'Default Timezone', 'Default timezone for tenant', 'string', 'UTC', 'general'),
('currency', 'Default Currency', 'Default currency code', 'string', 'USD', 'general'),
('maintenance_mode', 'Maintenance Mode', 'Enable maintenance mode', 'boolean', 'false', 'system')
ON CONFLICT (key) DO NOTHING;

-- Insert common categories
INSERT INTO categories (code, name, description) VALUES
('services', 'Services', 'Service-related categories'),
('products', 'Products', 'Product-related categories'),
('marketplace', 'Marketplace', 'Marketplace-specific categories'),
('freelance', 'Freelance', 'Freelance work categories'),
('consulting', 'Consulting', 'Consulting services'),
('digital', 'Digital Services', 'Digital and online services'),
('physical', 'Physical Products', 'Physical goods and products'),
('education', 'Education', 'Educational services and products'),
('healthcare', 'Healthcare', 'Healthcare-related services'),
('finance', 'Finance', 'Financial services')
ON CONFLICT (code) DO NOTHING;

-- Insert common capabilities
INSERT INTO capabilities (code, name, description, category) VALUES
('dual_side', 'Dual-Side Access', 'Access both buyer and seller sides', 'marketplace'),
('advanced_search', 'Advanced Search', 'Advanced search capabilities', 'search'),
('bulk_messaging', 'Bulk Messaging', 'Send bulk messages', 'communication'),
('priority_support', 'Priority Support', 'Priority customer support', 'support'),
('custom_fields', 'Custom Fields', 'Create custom profile fields', 'customization'),
('reporting', 'Advanced Reporting', 'Advanced reporting features', 'analytics'),
('export_data', 'Data Export', 'Export user and transaction data', 'data'),
('api_webhooks', 'API & Webhooks', 'API and webhook integrations', 'integration'),
('whitelabel', 'White Label', 'White label branding options', 'branding'),
('multi_currency', 'Multi-Currency', 'Multiple currency support', 'finance')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_feature_id ON tenant_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_setting_id ON tenant_settings(setting_id);
CREATE INDEX IF NOT EXISTS idx_tenant_categories_tenant_id ON tenant_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_categories_category_id ON tenant_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_tenant_countries_tenant_id ON tenant_countries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_countries_country_id ON tenant_countries(country_id);
CREATE INDEX IF NOT EXISTS idx_account_capabilities_account_id ON account_capabilities(account_id);
CREATE INDEX IF NOT EXISTS idx_account_capabilities_capability_id ON account_capabilities(capability_id);

-- ============================================================================
-- STEP 4: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE features IS 'System features that can be enabled for tenants';
COMMENT ON TABLE tenant_features IS 'Features enabled for specific tenants';
COMMENT ON TABLE settings IS 'System-wide settings definitions';
COMMENT ON TABLE tenant_settings IS 'Tenant-specific setting values';
COMMENT ON TABLE categories IS 'Hierarchical categories for content organization';
COMMENT ON TABLE tenant_categories IS 'Categories enabled for specific tenants';
COMMENT ON TABLE countries IS 'Master list of countries with ISO codes';
COMMENT ON TABLE tenant_countries IS 'Countries allowed for specific tenants';
COMMENT ON TABLE capabilities IS 'Account-level capabilities definitions';
COMMENT ON TABLE account_capabilities IS 'Capabilities enabled for specific accounts';

-- ============================================================================
-- STEP 5: REPORT MIGRATION RESULTS
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    countries_count INTEGER;
    features_count INTEGER;
    settings_count INTEGER;
    categories_count INTEGER;
    capabilities_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('features', 'tenant_features', 'settings', 'tenant_settings', 
                          'categories', 'tenant_categories', 'countries', 'tenant_countries',
                          'capabilities', 'account_capabilities');
    
    SELECT COUNT(*) INTO countries_count FROM countries;
    SELECT COUNT(*) INTO features_count FROM features;
    SELECT COUNT(*) INTO settings_count FROM settings;
    SELECT COUNT(*) INTO categories_count FROM categories;
    SELECT COUNT(*) INTO capabilities_count FROM capabilities;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== JSON Normalization Complete ===';
    RAISE NOTICE 'Created % normalized tables', table_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Populated default data:';
    RAISE NOTICE '  - % countries', countries_count;
    RAISE NOTICE '  - % features', features_count;
    RAISE NOTICE '  - % settings', settings_count;
    RAISE NOTICE '  - % categories', categories_count;
    RAISE NOTICE '  - % capabilities', capabilities_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Migrate existing JSON data to normalized tables';
    RAISE NOTICE '  2. Update application code to use new tables';
    RAISE NOTICE '  3. Drop JSON columns after verification';
    RAISE NOTICE '';
    RAISE NOTICE 'Benefits:';
    RAISE NOTICE '  ✅ Proper relational structure';
    RAISE NOTICE '  ✅ Foreign key constraints';
    RAISE NOTICE '  ✅ Queryable data';
    RAISE NOTICE '  ✅ Data integrity enforced';
END $$;