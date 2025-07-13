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
  Search,
  Bookmark,
  Heart,
  FolderOpen,
  Plus,
  Megaphone,
  Mail,
  Calendar,
  FileText,
  DollarSign,
  MessageSquare,
  Star,
  Building2,
  Users,
  CreditCard,
  Settings,
  Film
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
  showForClient?: boolean;
  showForAll?: boolean;
}

function canAccessItem(userPermissions: string[], userRoles: string[], item: MenuItem): boolean {
  // No permission required = always accessible
  if (!item.permission) return true;
  
  // Client users have access to client functionality
  if (userRoles.includes('client')) return true;
  
  // Check if user has exact permission
  if (userPermissions.includes(item.permission)) return true;
  
  // Check wildcard permissions for client content
  if (userPermissions.includes('*.*.tenant') || 
      userPermissions.includes('jobs.*.tenant') ||
      userPermissions.includes('castings.*.tenant')) {
    return true;
  }
  
  // Check permission with scope flexibility
  const [resource, action, scope] = item.permission.split('.');
  return userPermissions.some(userPerm => {
    const [userResource, userAction, userScope] = userPerm.split('.');
    
    const resourceMatch = userResource === resource || userResource === '*';
    const actionMatch = userAction === action || userAction === '*' || 
                       (userAction === 'manage' && ['read', 'view', 'create'].includes(action));
    const scopeMatch = userScope === scope || userScope === '*' || 
                      (scope === 'tenant' && userScope === 'managed');
    
    return resourceMatch && actionMatch && scopeMatch;
  });
}

function shouldShowSection(section: MenuSection, userRoles: string[]): boolean {
  if (section.showForAll) return true;
  if (section.showForClient && userRoles.includes('client')) return true;
  if (section.requiredRole && section.requiredRole.some(role => userRoles.includes(role))) return true;
  return false;
}

function getMenuSections(t: any): MenuSection[] {
  return [
    // Discover Talent - Always visible
    {
      title: '',
      showForAll: true,
      items: [
        { 
          name: 'Dashboard', 
          href: '/client', 
          icon: LayoutDashboard,
          description: 'Client overview and metrics'
        },
      ]
    },

    // Discover Talent - Search and discovery
    {
      title: 'Discover Talent',
      showForClient: true,
      items: [
        { 
          name: 'Search Talents', 
          href: '/client/search', 
          icon: Search,
          permission: 'talents.search.tenant',
          description: 'Advanced talent search'
        },
        { 
          name: 'Saved Searches', 
          href: '/client/saved-searches', 
          icon: Bookmark,
          permission: 'searches.manage.own',
          count: 8,
          description: 'Your search queries'
        },
        { 
          name: 'Favorites', 
          href: '/client/favorites', 
          icon: Heart,
          permission: 'favorites.manage.own',
          count: 45,
          description: 'Favorite talents'
        },
        { 
          name: 'Collections', 
          href: '/client/collections', 
          icon: FolderOpen,
          permission: 'collections.manage.own',
          count: 12,
          description: 'Talent collections'
        },
      ]
    },

    // Projects - Casting and booking management
    {
      title: 'Projects',
      showForClient: true,
      items: [
        { 
          name: 'Create Casting', 
          href: '/client/castings/new', 
          icon: Plus,
          permission: 'castings.create.tenant',
          description: 'Post new casting call'
        },
        { 
          name: 'Active Castings', 
          href: '/client/castings', 
          icon: Megaphone,
          permission: 'castings.manage.own',
          count: 3,
          badge: 'ACTIVE',
          description: 'Your casting calls'
        },
        { 
          name: 'Applications', 
          href: '/client/applications', 
          icon: Mail,
          permission: 'applications.review.own',
          count: 127,
          description: 'Received applications'
        },
        { 
          name: 'Bookings', 
          href: '/client/bookings', 
          icon: Calendar,
          permission: 'bookings.manage.own',
          count: 15,
          description: 'Confirmed bookings'
        },
      ]
    },

    // Management - Business operations
    {
      title: 'Management',
      showForClient: true,
      items: [
        { 
          name: 'Contracts', 
          href: '/client/contracts', 
          icon: FileText,
          permission: 'contracts.manage.own',
          description: 'Legal agreements'
        },
        { 
          name: 'Invoices', 
          href: '/client/invoices', 
          icon: DollarSign,
          permission: 'invoices.manage.own',
          description: 'Billing and payments'
        },
        { 
          name: 'Messages', 
          href: '/client/messages', 
          icon: MessageSquare,
          permission: 'messages.manage.own',
          count: 23,
          description: 'Talent communication'
        },
        { 
          name: 'Reviews', 
          href: '/client/reviews', 
          icon: Star,
          permission: 'reviews.manage.own',
          description: 'Talent feedback'
        },
      ]
    },

    // Company - Organization settings
    {
      title: 'Company',
      showForClient: true,
      items: [
        { 
          name: 'Company Profile', 
          href: '/client/company', 
          icon: Building2,
          permission: 'company.manage.own',
          description: 'Company information'
        },
        { 
          name: 'Team', 
          href: '/client/team', 
          icon: Users,
          permission: 'team.manage.own',
          count: 8,
          description: 'Team members and roles'
        },
        { 
          name: 'Billing', 
          href: '/client/billing', 
          icon: CreditCard,
          permission: 'billing.manage.own',
          description: 'Subscription and payments'
        },
        { 
          name: 'Settings', 
          href: '/client/settings', 
          icon: Settings,
          description: 'Account preferences'
        },
      ]
    },
  ];
}

interface ClientAccountSidebarProps {
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
  const companyName = (user as any).company?.name || 'Client Company';
  const isClient = userContext.roles?.includes('client') || false;
  
  return (
    <div className="p-4 space-y-3">
      {/* Role Badge */}
      {userContext.roles && userContext.roles.length > 0 && (
        <div className="flex items-center justify-center">
          <Badge variant={isClient ? "default" : "secondary"} className="text-xs capitalize bg-red-100 text-red-800">
            {userContext.roles[0].replace('_', ' ')}
          </Badge>
        </div>
      )}
      
      {/* Company Info */}
      <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-red-50 rounded-md p-2">
        <Film className="h-3 w-3 text-red-500" />
        <span className="truncate">
          {companyName}
        </span>
      </div>

      {/* Tenant Context */}
      {sessionTenant && (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
          <div className="h-2 w-2 bg-red-500 rounded-full" />
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

export function ClientAccountSidebar({ isLoading = false }: ClientAccountSidebarProps) {
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
    <div className="fixed inset-y-0 left-0 z-50 w-96 bg-card border-r border-red-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center justify-center h-20 px-6 border-b border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-red-600" />
          <h1 className="text-xl font-bold text-red-800">Client</h1>
        </div>
        <p className="text-xs text-red-600 mt-1">
          Talent Booking
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
                  <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/client' && pathname.startsWith(item.href));
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-auto p-3",
                          isActive 
                            ? "bg-red-100 text-red-800 border-red-200" 
                            : "text-muted-foreground hover:text-red-700 hover:bg-red-50"
                        )}
                        onClick={() => {
                          browserLogger.userAction('client_navigation', `Navigate from ${pathname} to ${item.href}`);
                        }}
                      >
                        <div className="flex items-center w-full">
                          <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-1">
                                {item.count && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-red-100 text-red-700 border-red-300">
                                    {item.count}
                                  </Badge>
                                )}
                                {item.badge && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-red-100 text-red-700 border-red-300">
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
                <Separator className="mt-4 border-red-200" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Info Section */}
      <div className="border-t border-red-200 bg-red-50/50">
        <UserInfoSection />
      </div>
    </div>
  );
}