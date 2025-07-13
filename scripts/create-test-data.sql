-- Create test tenant if not exists
INSERT INTO tenants (name, domain, slug, is_active, created_at, updated_at)
VALUES ('Test Tenant', 'test.itellico.com', 'test-tenant', true, NOW(), NOW())
ON CONFLICT (domain) DO NOTHING;

-- Get tenant ID
DO $$
DECLARE
    v_tenant_id INTEGER;
    v_account_id INTEGER;
    v_user_id INTEGER;
    v_role_id INTEGER;
    v_permission_id INTEGER;
BEGIN
    -- Get tenant ID
    SELECT id INTO v_tenant_id FROM tenants WHERE domain = 'test.itellico.com';
    
    -- Create account if not exists
    INSERT INTO accounts (tenant_id, email, password_hash, email_verified, is_active, is_verified, account_type, created_at, updated_at)
    VALUES (
        v_tenant_id,
        '1@1.com',
        '$2a$12$4SqZ8H.Kd8wNbQZDfPYXKO8QH.5zFGPBkNYBZgQHkBkGOsaT5QMOy', -- bcrypt hash for '12345678'
        true,
        true,
        true,
        'personal',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        email_verified = true,
        is_active = true,
        is_verified = true,
        updated_at = NOW()
    RETURNING id INTO v_account_id;
    
    -- Create user if not exists
    INSERT INTO users (account_id, first_name, last_name, username, user_type, is_active, is_verified, account_role, created_at, updated_at)
    SELECT 
        v_account_id,
        'Super',
        'Admin',
        'superadmin',
        'individual',
        true,
        true,
        'entity_owner',
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE account_id = v_account_id
    )
    RETURNING id INTO v_user_id;
    
    -- If user already exists, get its ID
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users WHERE account_id = v_account_id LIMIT 1;
    END IF;
    
    -- Get platform super admin role
    SELECT id INTO v_role_id FROM roles WHERE code = 'platform_super_admin';
    
    -- Assign role to user if not already assigned
    INSERT INTO user_roles (user_id, role_id, is_active, assigned_at, created_at, updated_at)
    VALUES (v_user_id, v_role_id, true, NOW(), NOW(), NOW())
    ON CONFLICT (user_id, role_id) DO UPDATE
    SET is_active = true,
        updated_at = NOW();
    
    -- Create super permission if not exists
    INSERT INTO permissions (name, module, resource, action, scope, description, is_system, priority, created_at, updated_at)
    VALUES (
        'platform.admin.super',
        'platform',
        'platform', 
        'super_admin',
        'platform',
        'Super admin access to everything',
        true,
        1000,
        NOW(),
        NOW()
    )
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO v_permission_id;
    
    -- If permission already exists, get its ID
    IF v_permission_id IS NULL THEN
        SELECT id INTO v_permission_id FROM permissions WHERE name = 'platform.admin.super';
    END IF;
    
    -- Assign permission to role if not already assigned
    INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
    VALUES (v_role_id, v_permission_id, NOW(), NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    RAISE NOTICE 'Test user setup complete!';
    RAISE NOTICE 'Email: 1@1.com';
    RAISE NOTICE 'Password: 12345678';
    RAISE NOTICE 'Tenant ID: %', v_tenant_id;
    RAISE NOTICE 'Account ID: %', v_account_id;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Role: Platform Super Admin';
END $$;