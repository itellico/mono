# RBAC System Architecture Explanation

## Why is `user_permissions` Table Empty?

The `user_permissions` table being **empty is correct and expected**. Here's why:

## 🏗️ RBAC Permission Flow

The itellico Mono platform uses a **Role-Based Access Control (RBAC)** system with two methods for assigning permissions:

### 1. Role-Based Permissions (Primary Method) ✅
```
Users → user_roles → roles → role_permissions → permissions
```
- **Currently Used**: All 19 users get permissions through roles
- **How it works**: Users are assigned roles, roles have permissions
- **Example**: `admin` user → `super_admin` role → 125 permissions

### 2. Direct User Permissions (Override Method) ⚠️
```
Users → user_permissions → permissions
```
- **Currently Empty**: No direct permission overrides needed
- **Purpose**: Special cases and exceptions only

## 📋 When Would `user_permissions` Be Used?

The `user_permissions` table is for **exceptional cases** only:

| Use Case | Example | SQL |
|----------|---------|-----|
| **Temporary Access** | Grant developer debug permissions for 24 hours | `INSERT INTO user_permissions (user_id, permission_id, expires_at)` |
| **Permission Override** | Accountant needs billing access their role lacks | `INSERT INTO user_permissions (user_id, permission_id)` |
| **Permission Denial** | Block user from specific action despite role | `INSERT INTO user_permissions (user_id, permission_id, is_denied: true)` |
| **Custom Access** | One-time approval for special operation | `INSERT INTO user_permissions (user_id, permission_id, condition)` |

## ✅ Current System Status

All users have proper permissions through the role-based system:

| Role Type | Users | Permissions (via roles) | Direct Permissions |
|-----------|-------|------------------------|-------------------|
| super_admin | 1 | 125 | 0 |
| tenant_admin | 4 | 25 | 0 |
| account_admin | 5 | 17 | 0 |
| account_manager | 3 | 14 | 0 |
| user | 6 | 11 | 0 |

## 🎯 Summary

**The empty `user_permissions` table indicates a clean, well-structured RBAC implementation:**

1. ✅ All permissions handled through roles (best practice)
2. ✅ No special exceptions needed
3. ✅ Simpler permission management
4. ✅ Easier to audit and maintain

**This is the ideal state** - direct user permissions should only be used when role-based permissions can't handle a specific requirement.

## 🔍 How to Verify User Has Permissions

To check a user's effective permissions:

```sql
-- Get all permissions for a user (through roles)
SELECT DISTINCT p.name, p.resource, p.action
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.username = 'admin'
ORDER BY p.name;
```

This query shows that users DO have permissions - just through their assigned roles, not through direct assignments.