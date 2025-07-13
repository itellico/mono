'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Cog,
  Briefcase,
  MessageCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { browserLogger } from '@/lib/browser-logger';
import { extractUserContext } from '@/lib/permissions/client-permissions';

// Enhanced permission-based access matrix
const ADMIN_ACCESS_MATRIX = {
  '/admin/users': ['users.manage.global'],
  '/admin/tenants': ['tenants.manage.global'],
  '/admin/jobs': ['jobs.manage.global', 'jobs.read.global'],
  '/messages': ['conversations.read.own', 'conversations.manage.own'], // All authenticated users can access messages
  '/admin/settings': ['settings.manage.global'],
  '/admin/subscriptions': ['subscriptions.manage.global'],
  '/admin/categories': ['categories.manage.global'],
  '/admin/tags': ['tags.manage.global'],
  '/admin/model-schemas': ['model_schemas.manage.global'],
  '/admin/option-sets': ['option_sets.manage.global'],
  '/admin/entity-metadata': ['entity_attributes.manage.global'],
  '/admin/form-builder': ['model_schemas.manage.global'],
  '/admin/zone-editor': ['zone_editor.manage.global'],
  '/admin/industry-templates': ['industry_templates.manage.global'],
  '/admin/industry-content': ['industry_content.manage.global', 'industry_templates.manage.global'],
  '/admin/build-system': ['build_system.manage.global'],
  '/admin/search': ['search.manage.global'],
  '/admin/saved-searches': ['saved_searches.manage.global'],
  '/admin/test-template': ['template_testing.manage.global'],
  '/admin/translations': ['translations.manage.global'],
  '/admin/integrations': ['integrations.manage.global'],
  '/admin/llm-integrations': ['llm_integrations.manage.global'],
  '/admin/workflows': ['workflows.manage.global'],
  '/admin/email': ['email.manage.global'],
  '/admin/modules': ['modules.manage.global'],
  '/admin/backup': ['backup.manage.global'],
  '/admin/audit': ['audit.read.global'],
  '/admin/permissions': ['permissions.manage.global'],
  '/admin/dev': ['dev_tools.manage.global'],
  '/admin/preferences': ['preferences.manage.own', 'preferences.read.own'], // All admins can access
  '/admin/import-export': ['import_export.manage.global'],
  '/admin/monitoring': ['super_admin'], // Super admin only
  // '/admin/platform-config': ['super_admin'], // Consolidated into Platform Settings
} as const;

function canAccessAdminRoute(userPermissions: string[], path: string): boolean {
  const requiredPermissions = ADMIN_ACCESS_MATRIX[path as keyof typeof ADMIN_ACCESS_MATRIX];
  if (!requiredPermissions) return true; // If route not in matrix, allow access
  
  // Check if user has any of the required permissions
  return requiredPermissions.some(permission => {
    // Check exact match
    if (userPermissions.includes(permission)) return true;
    
    // Check wildcards
    if (userPermissions.includes('platform.*.global') || 
        userPermissions.includes('admin.*') ||
        userPermissions.includes('*.*.global')) {
      return true;
    }
    
    // Check if user has the permission with different scope
    const [resource, action, scope] = permission.split('.');
    return userPermissions.some(userPerm => {
      const [userResource, userAction, userScope] = userPerm.split('.');
      
      // Check resource and action match with wildcard support
      const resourceMatch = userResource === resource || userResource === '*';
      const actionMatch = userAction === action || userAction === '*' || 
                         (userAction === 'manage' && ['read', 'view', 'list'].includes(action));
      
      // For admin routes, accept tenant scope as well as global
      const scopeMatch = userScope === scope || userScope === '*' || 
                        (scope === 'global' && userScope === 'tenant');
      
      return resourceMatch && actionMatch && scopeMatch;
    });
  });
}

function getAdminMenuItems(userPermissions: string[], t: any) {
  const allMenuItems = [
    { name: t('navigation.dashboard'), href: '/admin', icon: 'LayoutDashboard' },
    { name: t('navigation.users'), href: '/admin/users', icon: 'Users', requiresPath: '/admin/users' },
    { name: t('navigation.tenants'), href: '/admin/tenants', icon: 'Building2', requiresPath: '/admin/tenants' },
    { name: 'Messages', href: '/messages', icon: 'MessageCircle', requiresPath: '/messages', badge: 'NEW' },
    { name: 'Job Management', href: '/admin/jobs', icon: 'Briefcase', requiresPath: '/admin/jobs', badge: 'NEW' },
    { name: t('navigation.workflows'), href: '/admin/workflows/manage', icon: 'Workflow', requiresPath: '/admin/workflows' },
    { name: t('navigation.integrations'), href: '/admin/integrations', icon: 'Puzzle', requiresPath: '/admin/integrations' },
    { name: t('navigation.llmIntegrations'), href: '/admin/llm-integrations', icon: 'Brain', requiresPath: '/admin/llm-integrations' },
    { name: t('navigation.subscriptions'), href: '/admin/subscriptions', icon: 'CreditCard', requiresPath: '/admin/subscriptions' },
    { name: t('navigation.categories'), href: '/admin/categories', icon: 'Tags', requiresPath: '/admin/categories' },
    { name: t('navigation.tags'), href: '/admin/tags', icon: 'Tag', requiresPath: '/admin/tags' },
    { name: t('navigation.modelSchemas'), href: '/admin/model-schemas', icon: 'Layers', requiresPath: '/admin/model-schemas' },
    { name: t('navigation.optionSets'), href: '/admin/option-sets', icon: 'List', requiresPath: '/admin/option-sets' },
    { name: t('navigation.entityMetadata'), href: '/admin/entity-metadata', icon: 'Database', requiresPath: '/admin/entity-metadata' },
    { name: t('navigation.formBuilder'), href: '/admin/form-builder', icon: 'Wrench', requiresPath: '/admin/form-builder' },
    { name: t('navigation.zoneEditor'), href: '/admin/zone-editor', icon: 'Layers', requiresPath: '/admin/zone-editor' },
    { name: t('navigation.savedZones'), href: '/admin/zones', icon: 'Layers', requiresPath: '/admin/zones' },
    { name: t('navigation.industryTemplates'), href: '/admin/industry-templates', icon: 'FileText', requiresPath: '/admin/industry-templates', badge: 'ENHANCED' },
    { name: t('navigation.industryContent'), href: '/admin/industry-content', icon: 'Building2', requiresPath: '/admin/industry-content', badge: 'NEW' },
    { name: t('navigation.buildSystem'), href: '/admin/build-system', icon: 'Zap', requiresPath: '/admin/build-system', badge: 'NEW' },
    { name: t('navigation.searchManagement'), href: '/admin/search', icon: 'Search', requiresPath: '/admin/search', badge: 'NEW' },
    { name: t('navigation.savedSearches'), href: '/admin/saved-searches', icon: 'BookmarkIcon', requiresPath: '/admin/saved-searches', badge: 'NEW' },
    { name: t('navigation.translations'), href: '/admin/translations', icon: 'Languages', requiresPath: '/admin/translations' },
    { name: t('navigation.emailSystem'), href: '/admin/email', icon: 'Mail', requiresPath: '/admin/email' },
    { name: t('navigation.modules'), href: '/admin/modules', icon: 'Code', requiresPath: '/admin/modules' },
    { name: t('navigation.backupManagement'), href: '/admin/backup', icon: 'Database', requiresPath: '/admin/backup' },
    { name: t('navigation.importExport'), href: '/admin/import-export', icon: 'ArrowUpDown', requiresPath: '/admin/import-export', badge: 'NEW' },
    { name: t('navigation.auditSystem'), href: '/admin/audit', icon: 'Shield', requiresPath: '/admin/audit' },
    { name: t('navigation.monitoring'), href: '/admin/monitoring', icon: 'Eye', requiresPath: '/admin/monitoring', badge: 'NEW' },
    { name: t('navigation.permissions'), href: '/admin/permissions', icon: 'Key', requiresPath: '/admin/permissions' },
    { name: t('navigation.devTools'), href: '/admin/dev', icon: 'Code', requiresPath: '/admin/dev' },
    { name: 'Documentation', href: '/docs', icon: 'BookOpen' }, // Always show documentation
    { name: t('navigation.preferences'), href: '/admin/preferences', icon: 'User' }, // No access restriction - all admins can access
    { name: 'Platform Settings', href: '/admin/settings', icon: 'Settings', requiresPath: '/admin/settings' },
  ];
  
  return allMenuItems.filter(item => {
    if (!item.requiresPath) return true; // Always show dashboard and preferences
    return canAccessAdminRoute(userPermissions, item.requiresPath);
  });
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
      {/* Tenant Info - only show this in sidebar */}
      {sessionTenant && isSuperAdmin && (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
          <Building2 className="h-3 w-3 text-emerald-500" />
          <span className="truncate">
            {sessionTenant.name}
          </span>
          {/* Hide development domains and only show production domains */}
          {sessionTenant.domain && 
           !sessionTenant.domain.includes('mono.dev') && 
           !sessionTenant.domain.includes('localhost') &&
           !sessionTenant.domain.includes('.local') &&
           process.env.NODE_ENV === 'production' && (
            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
              {sessionTenant.domain}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-sm">
      {/* Header Skeleton */}
      <div className="flex flex-col items-center justify-center h-20 px-6 border-b border-border relative">
        <div className="absolute top-4 right-4">
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>
      {/* Navigation Skeleton */}
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
      {/* Tenant Info Skeleton */}
      <div className="border-t border-border">
        <div className="p-4 space-y-3">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ isLoading = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('admin-common');
  const { user, loading: authLoading } = useAuth();
  const userContext = extractUserContext({ user });

  if (isLoading || authLoading || !userContext.isAuthenticated) {
    return <SidebarSkeleton />;
  }

  // Get user permissions from the context
  const userPermissions = userContext.permissions || [];
  
  // If user has super admin role, add wildcard permissions
  const isSuperAdmin = userContext.roles?.includes('super_admin') || false;
  const effectivePermissions = isSuperAdmin ? 
    [...userPermissions, 'platform.*.global', 'admin.*', '*.*.global'] : userPermissions;

  const navigation = getAdminMenuItems(effectivePermissions, t).map(item => ({
    name: item.name,
    href: item.href,
    icon: item.icon === 'LayoutDashboard' ? LayoutDashboard :
          item.icon === 'Users' ? Users :
          item.icon === 'Building2' ? Building2 :
          item.icon === 'MessageCircle' ? MessageCircle :
          item.icon === 'Briefcase' ? Briefcase :
          item.icon === 'CreditCard' ? CreditCard :
          item.icon === 'Tags' ? Tags :
          item.icon === 'Tag' ? Tag :
          item.icon === 'Database' ? Database :
          item.icon === 'Layers' ? Layers :
          item.icon === 'List' ? List :
          item.icon === 'FileText' ? FileText :
          item.icon === 'Languages' ? Languages :
          item.icon === 'Puzzle' ? Puzzle :
          item.icon === 'Brain' ? Brain :
          item.icon === 'Workflow' ? Workflow :
          item.icon === 'Mail' ? Mail :
          item.icon === 'Code' ? Code :
          item.icon === 'Wrench' ? Wrench :
          item.icon === 'Shield' ? Shield :
          item.icon === 'Key' ? Key :
          item.icon === 'User' ? User :
          item.icon === 'Settings' ? Settings :
          item.icon === 'Zap' ? Zap :
          item.icon === 'Search' ? Search :
          item.icon === 'BookmarkIcon' ? BookmarkIcon :
          item.icon === 'BookOpen' ? BookOpen :
          item.icon === 'ArrowUpDown' ? ArrowUpDown :
          item.icon === 'Eye' ? Eye : LayoutDashboard,
    badge: (item as any).badge
  }));

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center justify-center h-20 px-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">mono Admin</h1>
        {userContext.roles && userContext.roles.length > 0 && (
          <Badge variant="outline" className="mt-1 text-xs capitalize">
            {userContext.roles[0].replace('_', ' ')}
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    isActive 
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  onClick={() => {
                    browserLogger.userAction('admin_navigation', `Navigate from ${pathname} to ${item.href}`);
                  }}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tenant Info Section */}
      <div className="border-t border-border">
        <UserInfoSection />
      </div>
    </div>
  );
} 