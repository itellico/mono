import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import postgres from 'postgres';

const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mono',
  username: process.env.DB_USER || 'developer',
  password: process.env.DB_PASSWORD || 'developer',
  ssl: false
});

// Platform components and their required permissions - based on actual enhanced system permissions
const PLATFORM_COMPONENTS = {
  dashboards: [
    { name: "Admin Dashboard", path: "/admin", permissions: ["users.manage.global"], description: "Main administrative interface - requires super admin access" },
    { name: "User Dashboard", path: "/dashboard", permissions: [], description: "User personal dashboard - available to all authenticated users" },
    { name: "Analytics Dashboard", path: "/admin/analytics", permissions: ["analytics.read.global"], description: "Platform analytics and insights" },
    { name: "Audit Dashboard", path: "/admin/audit", permissions: ["audit.read.global"], description: "System audit logs and compliance tracking" },
    { name: "Media Dashboard", path: "/admin/media", permissions: ["media.read.tenant"], description: "Media management interface" },
  ],
  pages: [
    { name: "User Management", path: "/admin/users", permissions: ["users.manage.global"], description: "Create, edit, delete user accounts" },
    { name: "Tenant Management", path: "/admin/tenants", permissions: ["tenants.manage.global"], description: "Manage tenant accounts and configuration" },
    { name: "Media Library", path: "/admin/media", permissions: ["media.read.tenant"], description: "View and manage uploaded media files" },
    { name: "Media Upload", path: "/admin/media/upload", permissions: ["media.create.tenant"], description: "Upload new media files" },
    { name: "Media Edit", path: "/admin/media/edit", permissions: ["media.update.tenant"], description: "Edit existing media files" },
    { name: "Profile Management", path: "/profiles", permissions: ["profiles.read.tenant"], description: "User profile management" },
    { name: "Settings", path: "/admin/settings", permissions: ["settings.manage.global"], description: "System configuration and settings" },
    { name: "Translations", path: "/admin/translations", permissions: ["translations.update.tenant"], description: "Manage translation keys and content" },
  ],
  actions: [
    { name: "Create User", action: "users.create", permissions: ["users.manage.global"], description: "Add new user accounts to the system" },
    { name: "Delete User", action: "users.delete", permissions: ["users.manage.global"], description: "Remove user accounts from the system" },
    { name: "Manage Users", action: "users.manage", permissions: ["users.manage.global"], description: "Full user management capabilities" },
    { name: "Upload Media", action: "media.upload", permissions: ["media.create.tenant"], description: "Upload files to media library" },
    { name: "View Media", action: "media.view", permissions: ["media.read.tenant"], description: "View media files and library" },
    { name: "Edit Media", action: "media.edit", permissions: ["media.update.tenant"], description: "Edit media file metadata and properties" },
    { name: "View Analytics", action: "analytics.view", permissions: ["analytics.read.global"], description: "Access platform analytics and reports" },
    { name: "Manage Settings", action: "settings.update", permissions: ["settings.manage.global"], description: "Update system settings and configuration" },
    { name: "View Audit Logs", action: "audit.view", permissions: ["audit.read.global"], description: "Access system audit trail and logs" },
    { name: "Manage Tenants", action: "tenants.manage", permissions: ["tenants.manage.global"], description: "Create and manage tenant accounts" },
    { name: "Read Profiles", action: "profiles.read", permissions: ["profiles.read.tenant"], description: "View user profile information" },
    { name: "Update Translations", action: "translations.update", permissions: ["translations.update.tenant"], description: "Modify translation keys and content" },
  ],
  apis: [
    { name: "User API", endpoint: "/api/v1/users", permissions: ["users.manage.global"], description: "User CRUD operations and management" },
    { name: "Media API (Read)", endpoint: "/api/v1/media (GET)", permissions: ["media.read.tenant"], description: "Retrieve media files and metadata" },
    { name: "Media API (Create)", endpoint: "/api/v1/media (POST)", permissions: ["media.create.tenant"], description: "Upload new media files" },
    { name: "Media API (Update)", endpoint: "/api/v1/media (PUT)", permissions: ["media.update.tenant"], description: "Update media file properties" },
    { name: "Analytics API", endpoint: "/api/v1/analytics", permissions: ["analytics.read.global"], description: "Access analytics data and reports" },
    { name: "Audit API", endpoint: "/api/v1/audit", permissions: ["audit.read.global"], description: "Retrieve audit logs and events" },
    { name: "Settings API", endpoint: "/api/v1/settings", permissions: ["settings.manage.global"], description: "System configuration management" },
    { name: "Tenant API", endpoint: "/api/v1/tenants", permissions: ["tenants.manage.global"], description: "Tenant account management" },
    { name: "Profiles API", endpoint: "/api/v1/profiles", permissions: ["profiles.read.tenant"], description: "User profile data access" },
    { name: "Translations API", endpoint: "/api/v1/translations", permissions: ["translations.update.tenant"], description: "Translation management operations" },
  ],
  features: [
    { name: "Super Admin Access", permissions: ["users.manage.global"], description: "Full administrative access to the platform" },
    { name: "Analytics Access", permissions: ["analytics.read.global"], description: "View platform usage analytics and reports" },
    { name: "Audit Trail Access", permissions: ["audit.read.global"], description: "Access comprehensive audit logs" },
    { name: "Media Content Creation", permissions: ["media.create.tenant"], description: "Upload and create media content" },
    { name: "Media Content Viewing", permissions: ["media.read.tenant"], description: "View and browse media library" },
    { name: "Media Content Editing", permissions: ["media.update.tenant"], description: "Edit and modify media files" },
    { name: "Tenant Management", permissions: ["tenants.manage.global"], description: "Manage tenant accounts and settings" },
    { name: "System Configuration", permissions: ["settings.manage.global"], description: "Configure system-wide settings" },
    { name: "Profile Management", permissions: ["profiles.read.tenant"], description: "Access and view user profiles" },
    { name: "Translation Management", permissions: ["translations.update.tenant"], description: "Manage multi-language content" },
  ]
};

export default async function PermissionMatrixPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Get all roles and their permissions
  const rolesWithPermissions = await sql`
    SELECT 
      r.id,
      r.name,
      r.display_name,
      r.description,
      r.level,
      r.is_active,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'permission_name', p.name,
            'permission_display', p.display_name,
            'action', p.action,
            'resource', p.resource,
            'scope', p.scope
          )
        ) FILTER (WHERE p.id IS NOT NULL), 
        '[]'::json
      ) as permissions
    FROM roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
    WHERE r.is_active = true
    GROUP BY r.id, r.name, r.display_name, r.description, r.level, r.is_active
    ORDER BY r.level DESC, r.name
  `;

  // Get current user's roles for highlighting
  const userRoles = await sql`
    SELECT DISTINCT r.name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN users u ON ur.user_id = u.id
    JOIN accounts a ON u.account_id = a.id
    WHERE a.email = ${session.user.email}
    AND ur.is_active = true
    AND r.is_active = true
  `;

  const userRoleNames = userRoles.map(role => role.name);

  // Helper function to check if a role has a specific permission
  const roleHasPermission = (role: any, requiredPermissions: string[]) => {
    if (!role.permissions || role.permissions.length === 0) return false;
    return requiredPermissions.some(reqPerm => 
      role.permissions.some((perm: any) => 
        perm.permission_name === reqPerm || 
        `${perm.action}.${perm.resource}.${perm.scope}` === reqPerm
      )
    );
  };

  // Helper function to get permission badge variant
  const getPermissionBadgeVariant = (hasPermission: boolean, isUserRole: boolean) => {
    if (hasPermission && isUserRole) return "default";
    if (hasPermission) return "secondary";
    return "outline";
  };

  const renderComponentMatrix = (components: any[], title: string) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Access control matrix for {title.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Component</th>
                <th className="text-left p-3 font-medium">Required Permissions</th>
                {rolesWithPermissions.map((role: any) => (
                  <th key={role.id} className="text-center p-3 font-medium min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <span className="text-sm">{role.display_name}</span>
                      {userRoleNames.includes(role.name) && (
                        <Badge variant="outline" className="text-xs mt-1">Your Role</Badge>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {components.map((component, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{component.name}</div>
                      <div className="text-sm text-gray-600">{component.description}</div>
                      {component.path && (
                        <div className="text-xs text-blue-600 mt-1">{component.path}</div>
                      )}
                      {component.endpoint && (
                        <div className="text-xs text-blue-600 mt-1">{component.endpoint}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {component.permissions.map((perm: string, permIndex: number) => (
                        <Badge key={permIndex} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  {rolesWithPermissions.map((role: any) => {
                    const hasPermission = roleHasPermission(role, component.permissions);
                    const isUserRole = userRoleNames.includes(role.name);
                    return (
                      <td key={role.id} className="p-3 text-center">
                        <Badge 
                          variant={getPermissionBadgeVariant(hasPermission, isUserRole)}
                          className="text-xs"
                        >
                          {hasPermission ? "✓" : "✗"}
                        </Badge>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Permission Matrix</h1>
          <p className="text-gray-600 mt-2">Complete audit of component access controls</p>
        </div>
        <Badge variant="outline">Audit Mode</Badge>
      </div>

      {/* Current User Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your Access Summary</CardTitle>
          <CardDescription>Your current roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {userRoleNames.length > 0 ? (
              userRoleNames.map((roleName, index) => (
                <Badge key={index} variant="default">
                  {rolesWithPermissions.find((r: any) => r.name === roleName)?.display_name || roleName}
                </Badge>
              ))
            ) : (
              <Badge variant="destructive">No roles assigned</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">10</div>
            <p className="text-sm text-gray-600">Total Enhanced Permissions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{rolesWithPermissions.length}</div>
            <p className="text-sm text-gray-600">Configured User Roles</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Access Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {userRoleNames.length > 0 ? userRoleNames.join(", ") : "No Roles"}
            </div>
            <p className="text-sm text-gray-600">Assigned Roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">✓</Badge>
              <span className="text-sm">Your role has access</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✓</Badge>
              <span className="text-sm">Role has access</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">✗</Badge>
              <span className="text-sm">No access</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Matrices */}
      <Tabs defaultValue="dashboards" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards" className="mt-6">
          {renderComponentMatrix(PLATFORM_COMPONENTS.dashboards, "Dashboards & Interfaces")}
        </TabsContent>

        <TabsContent value="pages" className="mt-6">
          {renderComponentMatrix(PLATFORM_COMPONENTS.pages, "Pages & Views")}
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          {renderComponentMatrix(PLATFORM_COMPONENTS.actions, "User Actions & Operations")}
        </TabsContent>

        <TabsContent value="apis" className="mt-6">
          {renderComponentMatrix(PLATFORM_COMPONENTS.apis, "API Endpoints")}
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          {renderComponentMatrix(PLATFORM_COMPONENTS.features, "Platform Features")}
        </TabsContent>
      </Tabs>

      {/* Role Details */}
      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
          <CardDescription>Complete breakdown of all roles and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rolesWithPermissions.map((role: any) => (
              <div key={role.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {role.display_name}
                      {userRoleNames.includes(role.name) && (
                        <Badge variant="outline" className="text-xs">Your Role</Badge>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                  <Badge variant="outline">{role.level}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {role.permissions && role.permissions.length > 0 ? (
                    role.permissions.map((perm: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {perm.permission_name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs">No permissions</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <a href="/debug/permissions" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            User Debug Page
          </a>
          <a href="/admin" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Try Admin Access
          </a>
          <a href="/dashboard" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            User Dashboard
          </a>
        </CardContent>
      </Card>
    </div>
  );
} 