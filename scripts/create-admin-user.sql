-- Create admin user in Keycloak database
-- This script adds an admin user with username: admin@example.com, password: admin

-- First, check if the onesso realm exists
DO $$
DECLARE
    realm_id VARCHAR;
    user_id VARCHAR := gen_random_uuid()::VARCHAR;
    role_id VARCHAR;
    tenant_role_id VARCHAR;
    tenant_admin_role_id VARCHAR;
    default_org_id VARCHAR := 'default-org';
BEGIN
    -- Get the realm ID for 'onesso'
    SELECT id INTO realm_id FROM realm WHERE name = 'onesso';
    
    IF realm_id IS NULL THEN
        RAISE NOTICE 'Realm "onesso" does not exist. Please create it first.';
        RETURN;
    END IF;
    
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM user_entity WHERE email = 'admin@example.com' AND realm_id = realm_id) THEN
        RAISE NOTICE 'User admin@example.com already exists. Updating password...';
        
        -- Get the user ID
        SELECT id INTO user_id FROM user_entity WHERE email = 'admin@example.com' AND realm_id = realm_id;
        
        -- Delete existing credentials
        DELETE FROM credential WHERE user_id = user_id;
        
        -- Insert new credential (password: admin)
        INSERT INTO credential (id, salt, type, user_id, created_date, user_label, secret_data, credential_data, priority)
        VALUES (
            gen_random_uuid()::VARCHAR,
            encode(gen_random_bytes(16), 'hex'),
            'password',
            user_id,
            extract(epoch from now()) * 1000,
            NULL,
            '{"value":"7kIqmDQQUl/PjYtrKSTuDXV0zXVh3AXz","salt":"YWRtaW4="}',
            '{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}',
            10
        );
        
        -- Make sure user is enabled
        UPDATE user_entity 
        SET enabled = true, email_verified = true 
        WHERE id = user_id;
    ELSE
        -- Create new admin user
        INSERT INTO user_entity (
            id, email, email_verified, enabled, first_name, last_name, realm_id, username, created_timestamp
        ) VALUES (
            user_id,
            'admin@example.com',
            true,
            true,
            'Admin',
            'User',
            realm_id,
            'admin@example.com',
            extract(epoch from now()) * 1000
        );
        
        -- Insert credential (password: admin)
        INSERT INTO credential (id, salt, type, user_id, created_date, user_label, secret_data, credential_data, priority)
        VALUES (
            gen_random_uuid()::VARCHAR,
            encode(gen_random_bytes(16), 'hex'),
            'password',
            user_id,
            extract(epoch from now()) * 1000,
            NULL,
            '{"value":"7kIqmDQQUl/PjYtrKSTuDXV0zXVh3AXz","salt":"YWRtaW4="}',
            '{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}',
            10
        );
        
        -- Add user attributes
        INSERT INTO user_attribute (id, name, value, user_id)
        VALUES (
            gen_random_uuid()::VARCHAR,
            'provider',
            'LOCAL',
            user_id
        );
        
        -- Add tenant_id attribute
        INSERT INTO user_attribute (id, name, value, user_id)
        VALUES (
            gen_random_uuid()::VARCHAR,
            'tenant_id',
            default_org_id,
            user_id
        );
    END IF;
    
    -- Get the admin role ID
    SELECT id INTO role_id FROM keycloak_role WHERE name = 'admin' AND realm_id = realm_id;
    
    -- Assign admin role if it exists
    IF role_id IS NOT NULL THEN
        -- Check if role mapping already exists
        IF NOT EXISTS (SELECT 1 FROM user_role_mapping WHERE role_id = role_id AND user_id = user_id) THEN
            INSERT INTO user_role_mapping (role_id, user_id)
            VALUES (role_id, user_id);
            RAISE NOTICE 'Assigned admin role to user.';
        END IF;
    ELSE
        RAISE NOTICE 'Admin role not found.';
    END IF;
    
    -- Get the tenant-admin role ID
    SELECT id INTO tenant_admin_role_id FROM keycloak_role WHERE name = 'tenant-admin' AND realm_id = realm_id;
    
    -- Assign tenant-admin role if it exists
    IF tenant_admin_role_id IS NOT NULL THEN
        -- Check if role mapping already exists
        IF NOT EXISTS (SELECT 1 FROM user_role_mapping WHERE role_id = tenant_admin_role_id AND user_id = user_id) THEN
            INSERT INTO user_role_mapping (role_id, user_id)
            VALUES (tenant_admin_role_id, user_id);
            RAISE NOTICE 'Assigned tenant-admin role to user.';
        END IF;
    ELSE
        RAISE NOTICE 'Tenant-admin role not found.';
    END IF;
    
    -- Check if tenant role exists
    SELECT id INTO tenant_role_id FROM keycloak_role WHERE name = 'tenant:' || default_org_id AND realm_id = realm_id;
    
    -- Create tenant role if it doesn't exist
    IF tenant_role_id IS NULL THEN
        tenant_role_id := gen_random_uuid()::VARCHAR;
        
        -- Create tenant role
        INSERT INTO keycloak_role (id, client_role, name, realm_id, client, description)
        VALUES (
            tenant_role_id,
            false,
            'tenant:' || default_org_id,
            realm_id,
            NULL,
            'Tenant: Default Organization'
        );
        
        -- Add role attributes
        INSERT INTO role_attribute (id, name, value, role_id)
        VALUES (
            gen_random_uuid()::VARCHAR,
            'tenant_display_name',
            'Default Organization',
            tenant_role_id
        );
        
        INSERT INTO role_attribute (id, name, value, role_id)
        VALUES (
            gen_random_uuid()::VARCHAR,
            'tenant_description',
            'Default organization for testing',
            tenant_role_id
        );
        
        RAISE NOTICE 'Created tenant role for organization: Default Organization (%).',  default_org_id;
    END IF;
    
    -- Assign tenant role to user
    IF NOT EXISTS (SELECT 1 FROM user_role_mapping WHERE role_id = tenant_role_id AND user_id = user_id) THEN
        INSERT INTO user_role_mapping (role_id, user_id)
        VALUES (tenant_role_id, user_id);
        RAISE NOTICE 'Assigned tenant role to user.';
    END IF;
    
    RAISE NOTICE 'Admin user creation completed successfully!';
END $$;
