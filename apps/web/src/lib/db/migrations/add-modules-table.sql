-- Migration: Add modules table for JSON-driven page configurations
-- This table stores module configurations that reference model schemas and option sets

-- Create enum for module types
CREATE TYPE module_type AS ENUM (
  'profile_form',
  'search_interface', 
  'detail_page',
  'listing_page',
  'application_form',
  'card_component'
);

-- Create enum for module status
CREATE TYPE module_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  module_type module_type NOT NULL,
  model_schema_id UUID,
  configuration JSONB NOT NULL DEFAULT '{}',
  status module_status DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  -- Ensure unique module names per tenant
  CONSTRAINT unique_module_name_per_tenant UNIQUE(tenant_id, name),
  
  -- Ensure configuration is valid JSON
  CONSTRAINT valid_configuration CHECK (jsonb_typeof(configuration) = 'object')
);

-- Add foreign key constraints separately
DO $$
BEGIN
  -- Add tenant foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'modules_tenant_id_fkey' 
    AND table_name = 'modules'
  ) THEN
    ALTER TABLE modules ADD CONSTRAINT modules_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
  END IF;

  -- Add model_schema foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'modules_model_schema_id_fkey' 
    AND table_name = 'modules'
  ) THEN
    ALTER TABLE modules ADD CONSTRAINT modules_model_schema_id_fkey 
    FOREIGN KEY (model_schema_id) REFERENCES model_schemas(id) ON DELETE SET NULL;
  END IF;

  -- Add user foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'modules_created_by_fkey' 
    AND table_name = 'modules'
  ) THEN
    ALTER TABLE modules ADD CONSTRAINT modules_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(uuid) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_tenant_id ON modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_modules_module_type ON modules(module_type);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_model_schema_id ON modules(model_schema_id);
CREATE INDEX IF NOT EXISTS idx_modules_created_at ON modules(created_at);
CREATE INDEX IF NOT EXISTS idx_modules_name_search ON modules USING gin(to_tsvector('english', name));

-- Create GIN index for JSONB configuration queries
CREATE INDEX idx_modules_configuration ON modules USING GIN (configuration);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_modules_updated_at();

-- Add comments for documentation
COMMENT ON TABLE modules IS 'JSON-driven module configurations for dynamic page rendering';
COMMENT ON COLUMN modules.configuration IS 'JSONB configuration defining fields, layout, and behavior';
COMMENT ON COLUMN modules.model_schema_id IS 'References the model schema this module is based on';
COMMENT ON COLUMN modules.version IS 'Version number for configuration changes'; 