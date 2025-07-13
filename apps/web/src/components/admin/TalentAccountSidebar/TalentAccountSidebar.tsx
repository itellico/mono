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
  User, 
  Camera,
  CreditCard,
  Briefcase,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Lock,
  Bell,
  Clock,
  Eye,
  Star
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
  showForTalent?: boolean;
  showForAll?: boolean;
}

function canAccessItem(userPermissions: string[], userRoles: string[], item: MenuItem): boolean {
  // No permission required = always accessible
  if (!item.permission) return true;
  
  // Talent users have access to their own content
  if (userRoles.includes('talent')) return true;
  
  // Check if user has exact permission
  if (userPermissions.includes(item.permission)) return true;
  
  // Check wildcard permissions for own content
  if (userPermissions.includes('*.*.own') || 
      userPermissions.includes('profiles.*.own') ||
      userPermissions.includes('media.*.own')) {
    return true;
  }
  
  // Check permission with scope flexibility
  const [resource, action, scope] = item.permission.split('.');
  return userPermissions.some(userPerm => {
    const [userResource, userAction, userScope] = userPerm.split('.');
    
    const resourceMatch = userResource === resource || userResource === '*';
    const actionMatch = userAction === action || userAction === '*' || 
                       (userAction === 'manage' && ['read', 'view', 'update'].includes(action));
    const scopeMatch = userScope === scope || userScope === '*' || 
                      (scope === 'own' && userScope === 'managed');
    
    return resourceMatch && actionMatch && scopeMatch;
  });
}

function shouldShowSection(section: MenuSection, userRoles: string[]): boolean {
  if (section.showForAll) return true;
  if (section.showForTalent && userRoles.includes('talent')) return true;
  if (section.requiredRole && section.requiredRole.some(role => userRoles.includes(role))) return true;
  return false;
}

function getMenuSections(t: any): MenuSection[] {
  return [
    // My Career - Always visible
    {
      title: '',
      showForAll: true,
      items: [
        { 
          name: 'Dashboard', 
          href: '/talent', 
          icon: LayoutDashboard,
          description: 'Career overview and stats'
        },
      ]
    },

    // My Career - Profile and portfolio
    {
      title: 'My Career',
      showForTalent: true,
      items: [
        { 
          name: 'My Profile', 
          href: '/talent/profile', 
          icon: User,
          permission: 'profiles.update.own',
          description: 'Professional profile'
        },
        { 
          name: 'Portfolio', 
          href: '/talent/portfolio', 
          icon: Camera,
          permission: 'media.manage.own',
          count: 45,
          description: 'Photos and media gallery'
        },
        { 
          name: 'Comp Cards', 
          href: '/talent/comp-cards', 
          icon: CreditCard,
          permission: 'compcards.manage.own',
          description: 'Digital composite cards'
        },
      ]
    },

    // Work - Job applications and bookings
    {
      title: 'Work',
      showForTalent: true,
      items: [
        { 
          name: 'Job Board', 
          href: '/talent/jobs', 
          icon: Briefcase,
          permission: 'jobs.view.tenant',
          count: 23,
          badge: 'NEW',
          description: 'Available opportunities'
        },
        { 
          name: 'My Applications', 
          href: '/talent/applications', 
          icon: Mail,
          permission: 'applications.view.own',
          count: 5,
          description: 'Submitted applications'
        },
        { 
          name: 'Bookings', 
          href: '/talent/bookings', 
          icon: Calendar,
          permission: 'bookings.view.own',
          count: 3,
          badge: 'ACTIVE',
          description: 'Confirmed jobs'
        },
        { 
          name: 'Availability', 
          href: '/talent/availability', 
          icon: Clock,
          permission: 'schedules.manage.own',
          description: 'Calendar and schedule'
        },
      ]
    },

    // Earnings - Financial information
    {
      title: 'Earnings',
      showForTalent: true,
      items: [
        { 
          name: 'Income', 
          href: '/talent/income', 
          icon: DollarSign,
          permission: 'finances.view.own',
          description: 'Earnings overview'
        },
        { 
          name: 'Invoices', 
          href: '/talent/invoices', 
          icon: FileText,
          permission: 'invoices.view.own',
          description: 'Payment history'
        },
        { 
          name: 'Tax Documents', 
          href: '/talent/tax-documents', 
          icon: FileText,
          permission: 'taxes.view.own',
          description: '1099s and tax forms'
        },
      ]
    },

    // Account - Settings and preferences
    {
      title: 'Account',
      showForAll: true,
      items: [
        { 
          name: 'Settings', 
          href: '/talent/settings', 
          icon: Settings,
          description: 'Account preferences'
        },
        { 
          name: 'Privacy', 
          href: '/talent/privacy', 
          icon: Lock,
          description: 'Privacy controls'
        },
        { 
          name: 'Notifications', 
          href: '/talent/notifications', 
          icon: Bell,
          description: 'Alert preferences'
        },
        { 
          name: 'Subscription', 
          href: '/talent/subscription', 
          icon: Star,
          description: 'Plan and billing'
        },
      ]
    },
  ];
}

interface TalentAccountSidebarProps {
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
  const userName = user.name || user.email || 'Talent User';
  const isTalent = userContext.roles?.includes('talent') || false;
  
  return (
    <div className="p-4 space-y-3">
      {/* Role Badge */}
      {userContext.roles && userContext.roles.length > 0 && (
        <div className="flex items-center justify-center">
          <Badge variant={isTalent ? "default" : "secondary"} className="text-xs capitalize bg-orange-100 text-orange-800">
            {userContext.roles[0].replace('_', ' ')}
          </Badge>
        </div>
      )}
      
      {/* User Info */}
      <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-orange-50 rounded-md p-2">
        <User className="h-3 w-3 text-orange-500" />
        <span className="truncate">
          {userName}
        </span>
      </div>

      {/* Tenant Context */}
      {sessionTenant && (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
          <div className="h-2 w-2 bg-orange-500 rounded-full" />
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

export function TalentAccountSidebar({ isLoading = false }: TalentAccountSidebarProps) {
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
    <div className="fixed inset-y-0 left-0 z-50 w-96 bg-card border-r border-orange-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center justify-center h-20 px-6 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-orange-600" />
          <h1 className="text-xl font-bold text-orange-800">Talent</h1>
        </div>
        <p className="text-xs text-orange-600 mt-1">
          Creative Professional
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
                  <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/talent' && pathname.startsWith(item.href));
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-auto p-3",
                          isActive 
                            ? "bg-orange-100 text-orange-800 border-orange-200" 
                            : "text-muted-foreground hover:text-orange-700 hover:bg-orange-50"
                        )}
                        onClick={() => {
                          browserLogger.userAction('talent_navigation', `Navigate from ${pathname} to ${item.href}`);
                        }}
                      >
                        <div className="flex items-center w-full">
                          <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-1">
                                {item.count && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-700 border-orange-300">
                                    {item.count}
                                  </Badge>
                                )}
                                {item.badge && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-700 border-orange-300">
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
                <Separator className="mt-4 border-orange-200" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Info Section */}
      <div className="border-t border-orange-200 bg-orange-50/50">
        <UserInfoSection />
      </div>
    </div>
  );
}