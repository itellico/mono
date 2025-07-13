"use client"

import * as React from "react"
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronDown, 
  ChevronRight,
  Home,
  User,
  Users,
  Calendar,
  FileText,
  Camera,
  TrendingUp,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  Search,
  Heart,
  Star,
  Plus,
  Play,
  CheckCircle,
  Archive,
  Megaphone,
  Eye,
  Inbox,
  BarChart,
  CreditCard,
  Building,
  Building2,
  FolderOpen,
  Copy,
  BookOpen,
  GraduationCap,
  Receipt,
  Database,
  Globe,
  MapPin,
  Filter,
  Grid3X3,
  Layout,
  Layers,
  Clock
} from 'lucide-react';

// Component interfaces
interface SidebarItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: SidebarItem[];
  requiresSubscription?: string[]; // Subscription tiers required
}

interface UserProfile {
  id: string;
  name: string;
  category: string;
  isPrimary: boolean;
  completeness: number;
  isActive: boolean;
}

type UserRole = 'talent' | 'professional' | 'admin';

const getTalentSidebarItems = (activeProfile: UserProfile | null): SidebarItem[] => [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Portfolio Hub',
    icon: Camera,
    children: [
      { title: 'All Media', href: '/portfolio', icon: Grid3X3 },
      { title: 'Photos', href: '/portfolio/photos', icon: Camera },
      { title: 'Videos', href: '/portfolio/videos', icon: Play },
      { title: 'Collections', href: '/portfolio/collections', icon: Layers },
      { title: 'Favorites', href: '/portfolio/favorites', icon: Heart },
      { title: 'Comp Card', href: '/dashboard/compcard', icon: Layout },
    ],
  },
  {
    title: 'Career',
    icon: TrendingUp,
    children: [
      { title: 'Find Jobs', href: '/jobs', icon: Search },
      { title: 'My Applications', href: '/applications', icon: FileText },
      { title: 'Saved Jobs', href: '/jobs/saved', icon: Heart },
      { title: 'Application History', href: '/applications/history', icon: Archive },
    ],
  },
  {
    title: 'Bookings',
    icon: Calendar,
    children: [
      { title: 'Schedule', href: '/bookings', icon: Calendar },
      { title: 'Upcoming', href: '/bookings/upcoming', icon: Clock },
      { title: 'Past Bookings', href: '/bookings/history', icon: Archive },
      { title: 'Availability', href: '/bookings/availability', icon: CheckCircle, requiresSubscription: ['premium', 'professional'] },
    ],
  },
  {
    title: 'Networking',
    icon: Users,
    children: [
      { title: 'Connections', href: '/network', icon: Users },
      { title: 'Industry Events', href: '/events', icon: Calendar, requiresSubscription: ['premium', 'professional'] },
      { title: 'Groups', href: '/groups', icon: Users, requiresSubscription: ['premium', 'professional'] },
    ],
  },
  {
    title: 'Earnings',
    icon: TrendingUp,
    children: [
      { title: 'Overview', href: '/earnings', icon: TrendingUp },
      { title: 'Invoices', href: '/earnings/invoices', icon: FileText, requiresSubscription: ['premium', 'professional'] },
      { title: 'Tax Center', href: '/earnings/taxes', icon: Receipt, requiresSubscription: ['professional'] },
    ],
  },
  {
    title: 'Development',
    icon: GraduationCap,
    children: [
      { title: 'Courses', href: '/courses', icon: BookOpen },
      { title: 'Workshops', href: '/learning/workshops', icon: Users, requiresSubscription: ['premium', 'professional'] },
      { title: 'Coaching', href: '/learning/coaching', icon: User, requiresSubscription: ['professional'] },
    ],
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    badge: 3,
  },
  {
    title: 'Profile Management',
    href: '/profiles',
    icon: User,
  },
  {
    title: 'Community',
    href: '/community',
    icon: Users,
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: 5,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Help & Support',
    href: '/support',
    icon: HelpCircle,
  },
];

const getProfessionalSidebarItems = (): SidebarItem[] => [
  {
    title: 'Projects',
    icon: FolderOpen,
    children: [
      { title: 'Dashboard', href: '/dashboard', icon: TrendingUp },
      { title: 'Active Projects', href: '/projects/active', icon: Play },
      { title: 'Planning', href: '/projects/planning', icon: Calendar },
      { title: 'Completed', href: '/projects/completed', icon: CheckCircle },
      { title: 'Templates', href: '/projects/templates', icon: Copy, requiresSubscription: ['professional'] },
    ],
  },
  {
    title: 'Talent Management',
    icon: Users,
    children: [
      { title: 'Discover Talent', href: '/talent/discover', icon: Search },
      { title: 'Saved Profiles', href: '/talent/saved', icon: Heart },
      { title: 'My Roster', href: '/talent/roster', icon: Star, requiresSubscription: ['premium', 'professional'] },
      { title: 'Talent Database', href: '/talent/database', icon: Database, requiresSubscription: ['professional'] },
    ],
  },
  {
    title: 'Casting & Jobs',
    icon: Megaphone,
    children: [
      { title: 'Post New Job', href: '/jobs/create', icon: Plus },
      { title: 'Active Castings', href: '/jobs/active', icon: Eye },
      { title: 'Applications', href: '/jobs/applications', icon: Inbox },
      { title: 'Job History', href: '/jobs/history', icon: Archive },
    ],
  },
  {
    title: 'Business',
    icon: BarChart,
    children: [
      { title: 'Analytics', href: '/analytics', icon: TrendingUp, requiresSubscription: ['premium', 'professional'] },
      { title: 'Invoicing', href: '/billing/invoices', icon: FileText },
      { title: 'Payments', href: '/billing/payments', icon: CreditCard },
      { title: 'Clients', href: '/clients', icon: Building2, requiresSubscription: ['professional'] },
    ],
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    badge: 7,
  },
  {
    title: 'Company Profile',
    href: '/company',
    icon: Building,
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: 3,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Help & Support',
    href: '/support',
    icon: HelpCircle,
  },
];

interface UserSidebarProps {
  className?: string;
  userRole?: UserRole;
  userProfiles?: UserProfile[];
  activeProfileId?: string;
  subscriptionTier?: string;
}

export function UserSidebar({ 
  className, 
  userRole, 
  userProfiles = [],
  activeProfileId,
  subscriptionTier = 'free'
}: UserSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Determine user role
  const currentUserRole: UserRole = userRole || determineUserRole(user);

  // Find active profile
  const activeProfile = userProfiles.find(p => p.id === activeProfileId) || userProfiles[0] || null;

  // Get appropriate sidebar items based on role
  const sidebarItems = currentUserRole === 'professional' 
    ? getProfessionalSidebarItems() 
    : getTalentSidebarItems(activeProfile);

  // Set default open sections based on role
  const defaultOpenSections = currentUserRole === 'professional' 
    ? ['Projects', 'Talent Management'] 
    : ['Portfolio Hub', 'Career'];

  const [openSections, setOpenSections] = useState<string[]>(defaultOpenSections);

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(section => section !== title)
        : [...prev, title]
    );
  };

  const isPathActive = (href: string | undefined) => {
    if (!href) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const isSectionActive = (item: SidebarItem) => {
    if (item.href && isPathActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isPathActive(child.href));
    }
    return false;
  };

  const hasSubscriptionAccess = (item: SidebarItem) => {
    if (!item.requiresSubscription) return true;
    return item.requiresSubscription.includes(subscriptionTier);
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openSections.includes(item.title);
    const isActive = isSectionActive(item);
    const hasAccess = hasSubscriptionAccess(item);

    if (hasChildren) {
      return (
        <Collapsible
          key={item.title}
          open={isOpen}
          onOpenChange={() => toggleSection(item.title)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-10 px-4 font-normal",
                level > 0 && "pl-8",
                isActive && "bg-muted text-accent-foreground"
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
              {isOpen ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronRight className="ml-2 h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0">
            {item.children?.map((child) => renderSidebarItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.title}
        variant="ghost"
        asChild
        className={cn(
          "w-full justify-start h-10 px-4 font-normal",
          level > 0 && "pl-8",
          isPathActive(item.href) && "bg-muted text-accent-foreground",
          !hasAccess && "opacity-50 cursor-not-allowed"
        )}
        disabled={!hasAccess}
      >
        <a href={hasAccess ? item.href : undefined}>
          <item.icon className="mr-3 h-4 w-4" />
          <span className="flex-1 text-left">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
              {item.badge}
            </Badge>
          )}
          {!hasAccess && item.requiresSubscription && (
            <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs">
              Pro
            </Badge>
          )}
        </a>
      </Button>
    );
  };

  return (
    <div className={cn("flex h-full w-64 flex-col border-r bg-muted/20", className)}>
      {/* User Profile Section */}
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.image || undefined} 
              alt={user?.name || user?.email || 'User'} 
            />
            <AvatarFallback className="text-xs">
              {getUserInitials(user?.name || user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || user?.email || 'User'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {currentUserRole}
            </p>
          </div>
        </div>
      </div>

      {/* Active Profile Indicator for Talent */}
      {currentUserRole === 'talent' && activeProfile && (
        <div className="border-b px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Active Profile</p>
              <p className="text-sm font-medium">{activeProfile.name}</p>
              <div className="mt-1 flex items-center space-x-2">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${activeProfile.completeness}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{activeProfile.completeness}%</span>
              </div>
            </div>
            {activeProfile.isActive && (
              <div className="h-2 w-2 rounded-full bg-green-500" />
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-2">
          {sidebarItems.map((item) => renderSidebarItem(item))}
        </div>
      </ScrollArea>

      {/* Subscription Notice for Free Users */}
      {subscriptionTier === 'free' && (
        <div className="border-t p-4">
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs font-medium">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground mt-1">
              Unlock premium features
            </p>
            <Button size="sm" className="mt-2 w-full">
              Upgrade Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function determineUserRole(user: any): UserRole {
  // Default logic - can be enhanced based on user data
  if (!user) return 'talent';
  
  // Check if user has admin roles
  if (user.roles?.some((role: string) => ['Admin', 'Super Admin', 'super_admin'].includes(role))) {
    return 'admin';
  }
  
  // Check for professional role
  if (user.roles?.includes('professional') || user.role === 'professional') {
    return 'professional';
  }
  
  return 'talent';
} 