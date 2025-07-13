import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import postgres from 'postgres';

const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mono',
  username: process.env.DB_USER || 'developer',
  password: process.env.DB_PASSWORD || 'developer',
  ssl: false
});

interface LegacyRole {
  id: number;
  role: string;
  tenant_id: string;
  is_active: boolean;
  created_at: string;
}

// Helper function to format dates safely
function formatDate(date: any): string {
  if (!date) return 'N/A';
  try {
    if (typeof date === 'string') {
      return new Date(date).toLocaleString();
    }
    if (date instanceof Date) {
      return date.toLocaleString();
    }
    return String(date);
  } catch {
    return 'Invalid Date';
  }
}

// Helper function to safely convert values to strings
function safeString(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return formatDate(value);
  return JSON.stringify(value);
}

export default async function PermissionsDebugPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Get comprehensive user data
  const userData = await sql`
    SELECT 
      a.id as account_id,
      a.uuid as account_uuid,
      a.email,
      a.tenant_id,
      a.account_type,
      a.is_active as account_active,
      a.is_verified as account_verified,
      u.id as user_id,
      u.uuid as user_uuid,
      u.first_name,
      u.last_name,
      u.username,
      u.user_type,
      u.account_role,
      u.is_active as user_active,
      u.is_verified as user_verified,
      u.can_create_profiles,
      u.can_manage_all_profiles,
      u.can_access_billing,
      u.can_book_jobs
    FROM accounts a
    LEFT JOIN users u ON a.id = u.account_id
    WHERE a.email = ${session.user.email}
  `;

  // Get enhanced roles
  const roles = await sql`
    SELECT 
      r.id as role_id,
      r.name as role_name,
      r.display_name,
      r.description,
      r.level,
      r.is_system_role,
      r.is_active as role_active,
      ur.is_active as assignment_active,
      ur.granted_at,
      ur.expires_at,
      ur.tenant_id as role_tenant_id,
      ur.resource_id,
      ur.resource_type
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN users u ON ur.user_id = u.id
    JOIN accounts a ON u.account_id = a.id
    WHERE a.email = ${session.user.email}
    ORDER BY r.level DESC, r.name
  `;

  // Get enhanced permissions
  const enhancedPermissions = await sql`
    SELECT DISTINCT
      p.id as permission_id,
      p.name as permission_name,
      p.display_name as permission_display,
      p.action,
      p.resource,
      p.scope,
      p.level,
      p.is_active as permission_active,
      'role' as source_type,
      r.name as source_name
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    JOIN roles r ON rp.role_id = r.id
    JOIN user_roles ur ON r.id = ur.role_id
    JOIN users u ON ur.user_id = u.id
    JOIN accounts a ON u.account_id = a.id
    WHERE a.email = ${session.user.email}
    AND ur.is_active = true
    AND r.is_active = true
    AND p.is_active = true
    
    UNION
    
    SELECT DISTINCT
      p.id as permission_id,
      p.name as permission_name,
      p.display_name as permission_display,
      p.action,
      p.resource,
      p.scope,
      p.level,
      p.is_active as permission_active,
      'direct' as source_type,
      'Direct Assignment' as source_name
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    JOIN users u ON up.user_id = u.id
    JOIN accounts a ON u.account_id = a.id
    WHERE a.email = ${session.user.email}
    AND up.is_active = true
    AND p.is_active = true
    
    ORDER BY level DESC, permission_name
  `;

  // Get legacy admin roles (if any)
  let legacyRoles: LegacyRole[] = [];
  try {
    legacyRoles = await sql`
      SELECT 
        ar.id,
        ar.role,
        ar.tenant_id,
        ar.is_active,
        ar.created_at
      FROM admin_roles ar
      JOIN users u ON ar.user_id = u.id
      JOIN accounts a ON u.account_id = a.id
      WHERE a.email = ${session.user.email}
    `;
  } catch (error) {
    // Table might not exist in enhanced system
    legacyRoles = [];
  }

  // Get session information
  const sessionInfo = {
    user: session.user,
    expires: session.expires,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Permission Debug Information</h1>
        <Badge variant="outline">Debug Mode</Badge>
      </div>

      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>Current NextAuth session data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Email:</strong> {safeString(sessionInfo.user?.email)}
            </div>
            <div>
              <strong>Name:</strong> {safeString(sessionInfo.user?.name)}
            </div>
            <div>
              <strong>Session Expires:</strong> {formatDate(sessionInfo.expires)}
            </div>
            <div>
              <strong>User ID (Session):</strong> {safeString(sessionInfo.user?.id)}
            </div>
          </div>
          <Separator className="my-4" />
          <details>
            <summary className="cursor-pointer font-medium">Raw Session Data</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Account & User Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account & User Information</CardTitle>
          <CardDescription>Database user and account details</CardDescription>
        </CardHeader>
        <CardContent>
          {userData.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <strong>Account ID:</strong> {safeString(userData[0].account_id)}
                </div>
                <div>
                  <strong>Account UUID:</strong> {safeString(userData[0].account_uuid)}
                </div>
                <div>
                  <strong>Tenant ID:</strong> {safeString(userData[0].tenant_id)}
                </div>
                <div>
                  <strong>User ID:</strong> {safeString(userData[0].user_id)}
                </div>
                <div>
                  <strong>User UUID:</strong> {safeString(userData[0].user_uuid)}
                </div>
                <div>
                  <strong>Username:</strong> {safeString(userData[0].username)}
                </div>
                <div>
                  <strong>Full Name:</strong> {safeString(userData[0].first_name)} {safeString(userData[0].last_name)}
                </div>
                <div>
                  <strong>Account Type:</strong> 
                  <Badge variant="outline" className="ml-2">{safeString(userData[0].account_type)}</Badge>
                </div>
                <div>
                  <strong>User Type:</strong> 
                  <Badge variant="outline" className="ml-2">{safeString(userData[0].user_type)}</Badge>
                </div>
                <div>
                  <strong>Account Role:</strong> 
                  <Badge variant="outline" className="ml-2">{safeString(userData[0].account_role)}</Badge>
                </div>
                <div>
                  <strong>Account Active:</strong> 
                  <Badge variant={userData[0].account_active ? "default" : "destructive"} className="ml-2">
                    {userData[0].account_active ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <strong>User Active:</strong> 
                  <Badge variant={userData[0].user_active ? "default" : "destructive"} className="ml-2">
                    {userData[0].user_active ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <details>
                <summary className="cursor-pointer font-medium">Raw Account Data</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(userData[0], null, 2)}
                </pre>
              </details>
            </>
          ) : (
            <p className="text-red-600">❌ No account data found!</p>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced System Roles</CardTitle>
          <CardDescription>Roles from the new enhanced RBAC system</CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length > 0 ? (
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.role_id} className="border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{safeString(role.display_name)}</h4>
                    <div className="flex gap-2">
                      <Badge variant={role.role_active ? "default" : "destructive"}>
                        Role: {role.role_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant={role.assignment_active ? "default" : "destructive"}>
                        Assignment: {role.assignment_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{safeString(role.level)}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Role Name:</strong> {safeString(role.role_name)}</div>
                    <div><strong>Role ID:</strong> {safeString(role.role_id)}</div>
                    <div><strong>System Role:</strong> {role.is_system_role ? "Yes" : "No"}</div>
                    <div><strong>Granted At:</strong> {formatDate(role.granted_at)}</div>
                    <div><strong>Tenant ID:</strong> {safeString(role.role_tenant_id) || "Global"}</div>
                    <div><strong>Resource:</strong> {safeString(role.resource_id) || "All"}</div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{safeString(role.description)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ No enhanced roles found!</p>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced System Permissions</CardTitle>
          <CardDescription>Permissions from roles and direct assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {enhancedPermissions.length > 0 ? (
            <div className="space-y-2">
              {enhancedPermissions.map((perm) => (
                <div key={`${perm.permission_id}-${perm.source_type}`} className="flex items-center justify-between border p-3 rounded">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{safeString(perm.action)}</Badge>
                    <span className="font-medium">{safeString(perm.permission_name)}</span>
                    <span className="text-sm text-gray-600">{safeString(perm.permission_display)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{safeString(perm.resource)}</Badge>
                    <Badge variant="outline">{safeString(perm.scope)}</Badge>
                    <Badge variant="default">{safeString(perm.level)}</Badge>
                    <Badge variant="secondary">{safeString(perm.source_name)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">❌ No enhanced permissions found!</p>
          )}
        </CardContent>
      </Card>

      {/* Legacy Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Legacy Admin Roles</CardTitle>
          <CardDescription>Old admin_roles table (if exists)</CardDescription>
        </CardHeader>
        <CardContent>
          {legacyRoles.length > 0 ? (
            <div className="space-y-2">
              {legacyRoles.map((role) => (
                <div key={role.id} className="flex items-center justify-between border p-3 rounded">
                  <div>
                    <span className="font-medium">{safeString(role.role)}</span>
                    <span className="text-sm text-gray-600 ml-2">Tenant: {safeString(role.tenant_id)}</span>
                  </div>
                  <Badge variant={role.is_active ? "default" : "destructive"}>
                    {role.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">ℹ️ No legacy admin roles found (this is expected)</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <a href="/admin" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Try Admin Access
          </a>
          <a href="/dashboard" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Go to Dashboard
          </a>
          <a href="/auth/signout" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Sign Out
          </a>
        </CardContent>
      </Card>
    </div>
  );
} 