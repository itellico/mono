-- Create test tenant with UUID generated by database
INSERT INTO tenants (uuid, name, domain, slug, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Test Tenant',
    'test.itellico.com',
    'test-tenant',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (domain) DO NOTHING;

-- Create test account and user
DO $$
DECLARE
    v_tenant_id INTEGER;
    v_account_id INTEGER;
    v_user_id INTEGER;
    v_role_id INTEGER := 1; -- platform_super_admin role ID
    v_permission_id INTEGER;
BEGIN
    -- Get tenant ID
    SELECT id INTO v_tenant_id FROM tenants WHERE domain = 'test.itellico.com';
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant not found! Please check the tenant creation.';
        RETURN;
    END IF;
    
    -- Create or update account
    INSERT INTO accounts (
        uuid,
        tenant_id,
        email,
        password_hash,
        email_verified,
        is_active,
        is_verified,
        account_type,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
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
    SET 
        password_hash = EXCLUDED.password_hash,
        email_verified = true,
        is_active = true,
        is_verified = true,
        updated_at = NOW()
    RETURNING id INTO v_account_id;
    
    -- Get account ID if it was updated
    IF v_account_id IS NULL THEN
        SELECT id INTO v_account_id FROM accounts WHERE email = '1@1.com';
    END IF;
    
    -- Check if user exists
    SELECT id INTO v_user_id FROM users WHERE account_id = v_account_id LIMIT 1;
    
    -- Create user if not exists
    IF v_user_id IS NULL THEN
        INSERT INTO users (
            uuid,
            account_id,
            first_name,
            last_name,
            username,
            user_type,
            is_active,
            is_verified,
            account_role,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            v_account_id,
            'Super',
            'Admin',
            'superadmin_' || extract(epoch from now())::int,
            'individual',
            true,
            true,
            'entity_owner',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_user_id;
    END IF;
    
    -- Assign platform_super_admin role if not already assigned
    INSERT INTO user_roles (uuid, user_id, role_id, is_active, assigned_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, v_role_id, true, NOW(), NOW(), NOW())
    ON CONFLICT (user_id, role_id) DO UPDATE
    SET 
        is_active = true,
        updated_at = NOW();
    
    -- Ensure platform.admin.super permission exists
    INSERT INTO permissions (
        uuid,
        name,
        module,
        resource,
        action,
        scope,
        description,
        is_system,
        priority,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
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
    
    -- Get permission ID if it exists
    IF v_permission_id IS NULL THEN
        SELECT id INTO v_permission_id FROM permissions WHERE name = 'platform.admin.super';
    END IF;
    
    -- Assign permission to role
    INSERT INTO role_permissions (uuid, role_id, permission_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_role_id, v_permission_id, NOW(), NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Test user setup complete!';
    RAISE NOTICE '📧 Email: 1@1.com';
    RAISE NOTICE '🔐 Password: 12345678';
    RAISE NOTICE '🏷️  Role: Platform Super Admin';
    RAISE NOTICE '🔑 Permission: platform.admin.super';
    RAISE NOTICE '';
    RAISE NOTICE 'Database IDs:';
    RAISE NOTICE '- Tenant ID: %', v_tenant_id;
    RAISE NOTICE '- Account ID: %', v_account_id;
    RAISE NOTICE '- User ID: %', v_user_id;
    RAISE NOTICE '- Role ID: %', v_role_id;
END $$;