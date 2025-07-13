'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { 
  LayoutDashboard, 
  Users, 
  User,
  Settings, 
  Building2,
  CreditCard,
  Tags,
  Tag,
  Database,
  Workflow,
  Mail,
  Layers,
  List,
  Code,
  Languages,
  FileText,
  Puzzle,
  Brain,
  Shield,
  Wrench,
  Key,
  Zap,
  Search,
  ArrowUpDown,
  BookmarkIcon,
  BookOpen,
  Eye,
  Globe,
  Home,
  Sliders
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { browserLogger } from '@/lib/browser-logger';
import { extractUserContext } from '@/lib/permissions/client-permissions';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  permission?: string;
  badge?: string;
  description?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  requiredRole?: string[];
  showForSuperAdmin?: boolean;
  showForTenantAdmin?: boolean;
  showForAll?: boolean;
}

function canAccessItem(userPermissions: string[], userRoles: string[], item: MenuItem): boolean {
  // No permission required = always accessible
  if (!item.permission) return true;
  
  // Super admin has access to everything
  if (userRoles.includes('super_admin')) return true;
  
  // Check if user has exact permission
  if (userPermissions.includes(item.permission)) return true;
  
  // Check wildcard permissions
  if (userPermissions.includes('platform.*.global') || 
      userPermissions.includes('admin.*') ||
      userPermissions.includes('*.*.global')) {
    return true;
  }
  
  // Check permission with scope flexibility
  const [resource, action, scope] = item.permission.split('.');
  return userPermissions.some(userPerm => {
    const [userResource, userAction, userScope] = userPerm.split('.');
    
    const resourceMatch = userResource === resource || userResource === '*';
    const actionMatch = userAction === action || userAction === '*' || 
                       (userAction === 'manage' && ['read', 'view', 'list'].includes(action));
    const scopeMatch = userScope === scope || userScope === '*' || 
                      (scope === 'global' && userScope === 'tenant');
    
    return resourceMatch && actionMatch && scopeMatch;
  });
}

function shouldShowSection(section: MenuSection, userRoles: string[]): boolean {
  if (section.showForAll) return true;
  if (section.showForSuperAdmin && userRoles.includes('super_admin')) return true;
  if (section.showForTenantAdmin && userRoles.includes('tenant_admin')) return true;
  if (section.requiredRole && section.requiredRole.some(role => userRoles.includes(role))) return true;
  return false;
}

function getMenuSections(t: any): MenuSection[] {
  return [
    // Core Dashboard - Always visible to admin users
    {
      title: '',
      showForAll: true,
      items: [
        { 
          name: t('navigation.dashboard'), 
          href: '/admin', 
          icon: LayoutDashboard,
          description: 'Main admin dashboard'
        },
      ]
    },

    // Platform Management - Super Admin Only
    {
      title: 'Platform Management',
      showForSuperAdmin: true,
      items: [
        { 
          name: 'Tenant Management', 
          href: '/admin/tenants', 
          icon: Building2,
          permission: 'tenants.manage.global',
          description: 'Manage all platform tenants'
        },
        { 
          name: 'Platform Users', 
          href: '/admin/platform-users', 
          icon: Users,
          permission: 'users.manage.global',
          description: 'Cross-tenant user management'
        },
        { 
          name: 'Platform Settings', 
          href: '/admin/platform-settings', 
          icon: Sliders,
          permission: 'settings.manage.global',
          description: 'Global platform configuration'
        },
        { 
          name: 'Platform Integrations', 
          href: '/admin/platform-integrations', 
          icon: Globe,
          permission: 'integrations.manage.global',
          description: 'Platform-wide integrations'
        },
        { 
          name: 'Permissions', 
          href: '/admin/permissions', 
          icon: Key,
          permission: 'permissions.manage.global',
          description: 'Manage platform permissions'
        },
        { 
          name: 'Monitoring', 
          href: '/admin/monitoring', 
          icon: Eye,
          permission: 'monitoring.access.global',
          badge: 'NEW',
          description: 'Platform monitoring & metrics'
        },
        { 
          name: 'Audit', 
          href: '/admin/audit', 
          icon: Shield,
          permission: 'audit.read.global',
          description: 'Platform audit logs'
        },
      ]
    },

    // Tenant Management - Tenant Admin and above
    {
      title: 'Tenant Management',
      showForSuperAdmin: true,
      showForTenantAdmin: true,
      items: [
        { 
          name: 'Users', 
          href: '/admin/users', 
          icon: Users,
          permission: 'users.manage.tenant',
          description: 'Manage tenant users'
        },
        { 
          name: 'Subscriptions', 
          href: '/admin/subscriptions', 
          icon: CreditCard,
          permission: 'subscriptions.manage.tenant',
          description: 'Manage tenant subscriptions'
        },
        { 
          name: 'Integrations', 
          href: '/admin/integrations', 
          icon: Puzzle,
          permission: 'integrations.manage.tenant',
          description: 'Tenant-specific integrations'
        },
        { 
          name: 'Settings', 
          href: '/admin/settings', 
          icon: Settings,
          permission: 'settings.manage.tenant',
          description: 'Tenant settings & configuration'
        },
        { 
          name: 'Translations', 
          href: '/admin/translations', 
          icon: Languages,
          permission: 'translations.manage.tenant',
          description: 'Manage tenant translations'
        },
      ]
    },

    // Content Management - Role-based access
    {
      title: 'Content Management',
      showForSuperAdmin: true,
      showForTenantAdmin: true,
      requiredRole: ['content_moderator', 'approver'],
      items: [
        { 
          name: 'Categories', 
          href: '/admin/categories', 
          icon: Tags,
          permission: 'categories.manage.tenant',
          description: 'Manage content categories'
        },
        { 
          name: 'Tags', 
          href: '/admin/tags', 
          icon: Tag,
          permission: 'tags.manage.tenant',
          description: 'Manage content tags'
        },
        { 
          name: 'Option Sets', 
          href: '/admin/option-sets', 
          icon: List,
          permission: 'option_sets.manage.tenant',
          description: 'Manage dropdown options'
        },
        { 
          name: 'Model Schemas', 
          href: '/admin/model-schemas', 
          icon: Layers,
          permission: 'model_schemas.manage.tenant',
          description: 'Manage data models'
        },
        { 
          name: 'Industry Templates', 
          href: '/admin/industry-templates', 
          icon: FileText,
          permission: 'industry_templates.manage.global',
          badge: 'ENHANCED',
          description: 'Industry-specific schema templates'
        },
        { 
          name: 'Industry Content', 
          href: '/admin/industry-content', 
          icon: Building2,
          permission: 'industry_content.manage.global',
          badge: 'NEW',
          description: 'Industry-specific tags and categories'
        },
      ]
    },

    // Development Tools - Super Admin and developers
    {
      title: 'Development Tools',
      showForSuperAdmin: true,
      requiredRole: ['developer'],
      items: [
        { 
          name: 'Form Builder', 
          href: '/admin/form-builder', 
          icon: Wrench,
          permission: 'form_builder.manage.tenant',
          description: 'Build custom forms'
        },
        { 
          name: 'Workflows', 
          href: '/admin/workflows', 
          icon: Workflow,
          permission: 'workflows.manage.tenant',
          description: 'Manage automation workflows'
        },
        { 
          name: 'Email System', 
          href: '/admin/email', 
          icon: Mail,
          permission: 'email.manage.tenant',
          description: 'Email templates & campaigns'
        },
        { 
          name: 'Import/Export', 
          href: '/admin/import-export', 
          icon: ArrowUpDown,
          permission: 'import_export.manage.tenant',
          badge: 'NEW',
          description: 'Data import & export tools'
        },
      ]
    },

    // Personal & Documentation - Always available
    {
      title: 'Personal & Help',
      showForAll: true,
      items: [
        { 
          name: 'Documentation', 
          href: '/docs', 
          icon: BookOpen,
          description: 'Platform documentation'
        },
        { 
          name: 'Personal Preferences', 
          href: '/admin/preferences', 
          icon: User,
          description: 'Your account preferences'
        },
      ]
    },
  ];
}

interface AdminSidebarProps {
  isLoading?: boolean;
}

function UserInfoSection() {
  const { user } = useAuth();
  const userContext = extractUserContext({ user });
  
  if (!user || !userContext.isAuthenticated) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    );
  }

  const sessionTenant = (user as any).tenant;
  const isSuperAdmin = userContext.roles?.includes('super_admin') || false;
  
  return (
    <div className="p-4 space-y-3">
      {/* Role Badge */}
      {userContext.roles && userContext.roles.length > 0 && (
        <div className="flex items-center justify-center">
          <Badge variant={isSuperAdmin ? "default" : "secondary"} className="text-xs capitalize">
            {userContext.roles[0].replace('_', ' ')}
          </Badge>
        </div>
      )}
      
      {/* Tenant Info - contextual based on role */}
      {sessionTenant && (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
          <Building2 className="h-3 w-3 text-emerald-500" />
          <span className="truncate">
            {isSuperAdmin ? `Platform: ${sessionTenant.name}` : sessionTenant.name}
          </span>
        </div>
      )}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="fixed inset-y-0 left-0 z-50 w-96 bg-card border-r border-border shadow-sm">
      <div className="flex flex-col items-center justify-center h-20 px-6 border-b border-border">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>
      <div className="flex-1">
        <nav className="px-4 py-6 space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center px-3 py-2">
              <Skeleton className="h-5 w-5 mr-3" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="p-4 space-y-3">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function AdminSidebarNew({ isLoading = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('admin-common');
  const { user, loading: authLoading } = useAuth();
  const userContext = extractUserContext({ user });

  if (isLoading || authLoading || !userContext.isAuthenticated) {
    return <SidebarSkeleton />;
  }

  const userPermissions = userContext.permissions || [];
  const userRoles = userContext.roles || [];
  
  const sections = getMenuSections(t);
  const visibleSections = sections
    .filter(section => shouldShowSection(section, userRoles))
    .map(section => ({
      ...section,
      items: section.items.filter(item => canAccessItem(userPermissions, userRoles, item))
    }))
    .filter(section => section.items.length > 0);

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-96 bg-card border-r border-border shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center justify-center h-20 px-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">mono Admin</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {userRoles.includes('super_admin') ? 'Platform Management' : 'Tenant Management'}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 py-6 space-y-6">
          {visibleSections.map((section, sectionIndex) => (
            <div key={section.title || sectionIndex}>
              {/* Section Title */}
              {section.title && (
                <div className="px-3 mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin' && pathname.startsWith(item.href));
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-auto p-3",
                          isActive 
                            ? "bg-secondary text-secondary-foreground" 
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        onClick={() => {
                          browserLogger.userAction('admin_navigation', `Navigate from ${pathname} to ${item.href}`);
                        }}
                      >
                        <div className="flex items-center w-full">
                          <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-sm font-medium">{item.name}</span>
                              {item.badge && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Button>
                    </Link>
                  );
                })}
              </div>
              
              {/* Separator between sections (except last one) */}
              {sectionIndex < visibleSections.length - 1 && section.title && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Info Section */}
      <div className="border-t border-border">
        <UserInfoSection />
      </div>
    </div>
  );
}