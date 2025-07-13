# Database Redesign Documentation

## Overview

This directory contains migration scripts to fix critical database normalization violations identified in the audit. The redesign addresses:

1. **User preferences incorrectly stored in accounts table**
2. **account_role stored as TEXT instead of foreign key**
3. **Boolean permission columns instead of proper RBAC**

## Migration Files

### Forward Migrations (Apply in order)

1. **01-create-user-preferences-table.sql**
   - Creates proper `user_preferences` table
   - One-to-one relationship with users
   - Includes all user-specific settings

2. **02-migrate-user-preferences-data.sql**
   - Migrates existing data from accounts to user_preferences
   - Creates transition view for backward compatibility
   - Logs migration statistics

3. **03-convert-account-role-to-fk.sql**
   - Adds `account_role_id` foreign key column
   - Maps TEXT values to role IDs
   - Creates missing roles if needed
   - Maintains backward compatibility view

4. **04-remove-boolean-permissions.sql**
   - Creates proper RBAC permissions
   - Backs up boolean permission values
   - Assigns permissions via user_permission_grants
   - Creates compatibility view

### Rollback Scripts

Located in `rollback/` subdirectory:
- `01-rollback-user-preferences.sql`
- `03-rollback-account-role-fk.sql`
- `04-rollback-boolean-permissions.sql`

## Running Migrations

### Automated (Recommended)
```bash
./run-database-redesign.sh
```

### Manual
```bash
# Connect to database
psql "postgresql://developer:developer@192.168.178.94:5432/mono"

# Run each migration
\i 01-create-user-preferences-table.sql
\i 02-migrate-user-preferences-data.sql
\i 03-convert-account-role-to-fk.sql
\i 04-remove-boolean-permissions.sql
```

## Code Updates Required

After running migrations, update:

### 1. User Preferences Access
```typescript
// OLD: Access via account
const dateFormat = user.account.date_format;

// NEW: Access via user_preferences
const dateFormat = user.preferences.date_format;
```

### 2. Account Role Access
```typescript
// OLD: Text field
if (user.account_role === 'admin') { }

// NEW: Foreign key relation
if (user.accountRole.code === 'admin') { }
```

### 3. Permission Checks
```typescript
// OLD: Boolean columns
if (user.can_create_profiles) { }

// NEW: RBAC permissions
if (hasPermission(user, 'account.profiles.create')) { }
```

## Backward Compatibility

### Transition Period
- Views maintain old column names
- Both old and new access patterns work
- Allows gradual code migration

### Views Created
- `v_user_preferences_legacy` - User preferences access
- `v_users_with_text_role` - Account role text access
- `v_users_with_boolean_permissions` - Boolean permission simulation

## Testing Checklist

- [ ] User login/authentication works
- [ ] User preferences load correctly
- [ ] Theme switching works
- [ ] Timezone/locale settings apply
- [ ] Role-based access control works
- [ ] Permission checks function properly
- [ ] Admin panel access control
- [ ] API endpoints respect permissions

## Final Cleanup

After all code is updated:

1. **Drop deprecated columns**
   ```sql
   ALTER TABLE users DROP COLUMN account_role;
   ALTER TABLE users DROP COLUMN can_create_profiles;
   -- etc...
   ```

2. **Drop transition views**
   ```sql
   DROP VIEW v_user_preferences_legacy;
   DROP VIEW v_users_with_text_role;
   DROP VIEW v_users_with_boolean_permissions;
   ```

3. **Drop backup tables**
   ```sql
   DROP TABLE users_boolean_permissions_backup;
   ```

## Rollback Procedure

If issues arise:

```bash
# Run rollback scripts in reverse order
psql "postgresql://developer:developer@192.168.178.94:5432/mono"
\i rollback/04-rollback-boolean-permissions.sql
\i rollback/03-rollback-account-role-fk.sql
\i rollback/01-rollback-user-preferences.sql
```

## Performance Impact

- New indexes on foreign keys
- Views add minimal overhead
- Permission checks via joins (cached)
- Overall performance should improve with proper normalization

## Security Benefits

1. **Proper RBAC**: Fine-grained permission control
2. **Foreign Key Integrity**: No invalid role assignments
3. **Audit Trail**: Permission grants tracked with timestamps
4. **No Hardcoded Permissions**: All permissions database-driven