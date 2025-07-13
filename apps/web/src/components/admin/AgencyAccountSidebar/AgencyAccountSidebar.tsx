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
  UserPlus,
  Calendar,
  Mail,
  Camera,
  DollarSign,
  FileText,
  BarChart3,
  Building2,
  Settings,
  Bell,
  Clock,
  FileImage,
  User,
  Briefcase
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
  count?: number;
  description?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  requiredRole?: string[];
  showForAgency?: boolean;
  showForAll?: boolean;
}

function canAccessItem(userPermissions: string[], userRoles: string[], item: MenuItem): boolean {
  // No permission required = always accessible
  if (!item.permission) return true;
  
  // Agency account owners have access to everything
  if (userRoles.includes('account_owner')) return true;
  
  // Check if user has exact permission
  if (userPermissions.includes(item.permission)) return true;
  
  // Check wildcard permissions
  if (userPermissions.includes('agency.*.account') || 
      userPermissions.includes('*.*.account') ||
      userPermissions.includes('account.*')) {
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
                      (scope === 'account' && userScope === 'managed');
    
    return resourceMatch && actionMatch && scopeMatch;
  });
}

function shouldShowSection(section: MenuSection, userRoles: string[]): boolean {
  if (section.showForAll) return true;
  if (section.showForAgency && userRoles.includes('account_owner')) return true;
  if (section.requiredRole && section.requiredRole.some(role => userRoles.includes(role))) return true;
  return false;
}

function getMenuSections(t: any): MenuSection[] {
  return [
    // Agency Overview - Always visible
    {
      title: '',
      showForAll: true,
      items: [
        { 
          name: 'Dashboard', 
          href: '/agency', 
          icon: LayoutDashboard,
          description: 'Agency overview and metrics'
        },
      ]
    },

    // Talent Management - Core agency functionality
    {
      title: 'Talent Management',
      showForAgency: true,
      items: [
        { 
          name: 'Our Talents', 
          href: '/agency/talents', 
          icon: Users,
          permission: 'talents.manage.account',
          count: 25,
          description: 'Manage your talent roster'
        },
        { 
          name: 'Add New Talent', 
          href: '/agency/talents/new', 
          icon: UserPlus,
          permission: 'talents.create.account',
          description: 'Onboard new talent'
        },
        { 
          name: 'Portfolios', 
          href: '/agency/portfolios', 
          icon: Camera,
          permission: 'portfolios.manage.account',
          description: 'Manage talent portfolios'
        },
        { 
          name: 'Availability', 
          href: '/agency/availability', 
          icon: Clock,
          permission: 'schedules.manage.account',
          description: 'Talent scheduling'
        },
        { 
          name: 'Documents', 
          href: '/agency/documents', 
          icon: FileText,
          permission: 'documents.manage.account',
          description: 'Contracts and paperwork'
        },
      ]
    },

    // Bookings & Work - Business operations
    {
      title: 'Bookings & Work',
      showForAgency: true,
      items: [
        { 
          name: 'Active Bookings', 
          href: '/agency/bookings', 
          icon: Calendar,
          permission: 'bookings.manage.account',
          count: 8,
          badge: 'ACTIVE',
          description: 'Current bookings and projects'
        },
        { 
          name: 'Applications', 
          href: '/agency/applications', 
          icon: Mail,
          permission: 'applications.manage.account',
          count: 12,
          description: 'Job applications and casting calls'
        },
        { 
          name: 'Job Board', 
          href: '/agency/jobs', 
          icon: Briefcase,
          permission: 'jobs.view.tenant',
          description: 'Available opportunities'
        },
      ]
    },

    // Business Management - Financial and operational
    {
      title: 'Business',
      showForAgency: true,
      items: [
        { 
          name: 'Earnings', 
          href: '/agency/earnings', 
          icon: DollarSign,
          permission: 'finances.view.account',
          description: 'Revenue and commissions'
        },
        { 
          name: 'Invoices', 
          href: '/agency/invoices', 
          icon: FileText,
          permission: 'invoices.manage.account',
          description: 'Billing and payments'
        },
        { 
          name: 'Contracts', 
          href: '/agency/contracts', 
          icon: FileImage,
          permission: 'contracts.manage.account',
          description: 'Legal agreements'
        },
        { 
          name: 'Statistics', 
          href: '/agency/statistics', 
          icon: BarChart3,
          permission: 'analytics.view.account',
          description: 'Performance analytics'
        },
      ]
    },

    // Agency Settings - Configuration and team
    {
      title: 'Agency Settings',
      showForAgency: true,
      items: [
        { 
          name: 'Agency Profile', 
          href: '/agency/profile', 
          icon: Building2,
          permission: 'profile.manage.account',
          description: 'Agency information and branding'
        },
        { 
          name: 'Team Members', 
          href: '/agency/team', 
          icon: Users,
          permission: 'team.manage.account',
          count: 5,
          description: 'Staff and permissions'
        },
        { 
          name: 'Notifications', 
          href: '/agency/notifications', 
          icon: Bell,
          permission: 'notifications.manage.account',
          description: 'Alert preferences'
        },
        { 
          name: 'Preferences', 
          href: '/agency/preferences', 
          icon: Settings,
          description: 'Account settings'
        },
      ]
    },

    // Personal - Always available
    {
      title: 'Personal',
      showForAll: true,
      items: [
        { 
          name: 'My Profile', 
          href: '/agency/my-profile', 
          icon: User,
          description: 'Your personal account'
        },
      ]
    },
  ];
}

interface AgencyAccountSidebarProps {
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
  const accountName = (user as any).account?.name || 'Agency Account';
  const isAccountOwner = userContext.roles?.includes('account_owner') || false;
  
  return (
    <div className="p-4 space-y-3">
      {/* Role Badge */}
      {userContext.roles && userContext.roles.length > 0 && (
        <div className="flex items-center justify-center">
          <Badge variant={isAccountOwner ? "default" : "secondary"} className="text-xs capitalize bg-green-100 text-green-800">
            {userContext.roles[0].replace('_', ' ')}
          </Badge>
        </div>
      )}
      
      {/* Agency Info */}
      <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-green-50 rounded-md p-2">
        <Building2 className="h-3 w-3 text-green-500" />
        <span className="truncate">
          {accountName}
        </span>
      </div>

      {/* Tenant Context */}
      {sessionTenant && (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
          <div className="h-2 w-2 bg-green-500 rounded-full" />
          <span className="truncate">
            {sessionTenant.name}
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

export function AgencyAccountSidebar({ isLoading = false }: AgencyAccountSidebarProps) {
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
    <div className="fixed inset-y-0 left-0 z-50 w-96 bg-card border-r border-green-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center justify-center h-20 px-6 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-green-600" />
          <h1 className="text-xl font-bold text-green-800">Agency</h1>
        </div>
        <p className="text-xs text-green-600 mt-1">
          Talent Management
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
                  <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/agency' && pathname.startsWith(item.href));
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-auto p-3",
                          isActive 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : "text-muted-foreground hover:text-green-700 hover:bg-green-50"
                        )}
                        onClick={() => {
                          browserLogger.userAction('agency_navigation', `Navigate from ${pathname} to ${item.href}`);
                        }}
                      >
                        <div className="flex items-center w-full">
                          <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-1">
                                {item.count && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                                    {item.count}
                                  </Badge>
                                )}
                                {item.badge && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
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
                <Separator className="mt-4 border-green-200" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Info Section */}
      <div className="border-t border-green-200 bg-green-50/50">
        <UserInfoSection />
      </div>
    </div>
  );
}