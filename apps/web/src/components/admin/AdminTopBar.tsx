'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, Sun, Moon, Monitor, LogOut, User, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDatabaseTheme } from '@/components/providers/database-theme-provider';
import { browserLogger } from '@/lib/browser-logger';
import { useSignout } from '@/hooks/useSignout';
import { extractUserContext } from '@/lib/permissions/client-permissions';

// No props needed for AdminTopBar component

function ThemeToggle() {
  try {
    const { theme, setTheme, isLoading } = useDatabaseTheme();
  
  // Don't render until the theme provider is ready
  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 hover:bg-accent"
        disabled
      >
        <Monitor className="h-4 w-4 opacity-50" />
        <span className="sr-only">Loading theme</span>
      </Button>
    );
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      default: return Monitor;
    }
  };

  const getNextTheme = () => {
    switch (theme) {
      case 'light': return 'dark';
      case 'dark': return 'system';
      default: return 'light';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      default: return 'System';
    }
  };

  const ThemeIcon = getThemeIcon();

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(getNextTheme(), true)} // true = persistent change
        className="h-9 w-9 p-0 hover:bg-accent"
        title={`Current: ${getThemeLabel()}. Click to switch to ${getNextTheme()}`}
      >
        <ThemeIcon className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  } catch (error) {
    // Fallback if DatabaseThemeProvider is not available
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 hover:bg-accent"
        disabled
        title="Theme toggle unavailable"
      >
        <Monitor className="h-4 w-4 opacity-50" />
        <span className="sr-only">Theme toggle unavailable</span>
      </Button>
    );
  }
}

function NotificationButton() {
  const [hasNotifications] = useState(true); // Mock notification state
  const [notificationCount] = useState(3); // Mock notification count

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative h-9 w-9 p-0 hover:bg-accent"
      onClick={() => {
        browserLogger.info('Notifications button clicked');
        // TODO: Implement notifications panel
      }}
    >
      <Bell className="h-4 w-4" />
      {hasNotifications && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {notificationCount > 9 ? '9+' : notificationCount}
        </Badge>
      )}
      <span className="sr-only">View notifications</span>
    </Button>
  );
}

function UserDropdown() {
  const { user } = useAuth();
  const { adminSignOut } = useSignout();
  const [displayName, setDisplayName] = useState(user?.name || 'Admin User');

  // Extract user context from user
  const userContext = extractUserContext({ user });

  // Update display name when user changes
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
      browserLogger.info('UserDropdown name updated from user', { 
        newName: user.name,
        timestamp: new Date().toISOString()
      });
    }
  }, [user?.name]);

  // Listen for simple refresh events
  useEffect(() => {
    const handleNameUpdate = (event: CustomEvent) => {
      const newName = event.detail?.name;
      if (newName) {
        setDisplayName(newName);
        browserLogger.info('🔄 Name updated via event', { 
          newName,
          previousName: displayName
        });
      }
    };

    const handleRefresh = () => {
      browserLogger.info('🔄 Force refresh requested');
      // Refresh functionality removed - auth context handles updates automatically
    };

    window.addEventListener('updateTopBarName', handleNameUpdate as EventListener);
    window.addEventListener('forceRefresh', handleRefresh);

    return () => {
      window.removeEventListener('updateTopBarName', handleNameUpdate as EventListener);
      window.removeEventListener('forceRefresh', handleRefresh);
    };
  }, [displayName]);

  // Fix condition: use userContext instead of adminInfo
  if (!user || !userContext.isAuthenticated) {
    return null;
  }

  const userEmail = user.email || '';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
  const enhancedRole = (user as any).enhancedRole;

  const handleSignOut = async () => {
    try {
      browserLogger.userAction('signout', 'AdminTopBar');
      // Navigate to signout confirmation page instead of immediate signout
      window.location.href = '/auth/signout';
    } catch (error) {
      browserLogger.error('Error navigating to signout page', { error });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 rounded-md px-3 hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.image || ''} alt={displayName} />
              <AvatarFallback className="text-xs bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-300">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium leading-none">{displayName}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {enhancedRole?.roleName?.replace('_', ' ') || userContext.role?.replace('_', ' ') || 'Admin'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            {enhancedRole?.roleName && (
              <Badge variant="outline" className="w-fit text-xs capitalize mt-1">
                {enhancedRole.roleName.replace('_', ' ')}
              </Badge>
            )}
            {userContext.tenantId && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Tenant:</span> {userContext.tenantId}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/admin/preferences" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Account Preferences</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/admin/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Admin Settings</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/users': 'User Management',
    '/admin/applications': 'Model Applications',
    '/admin/media-review': 'Media Review',
    '/admin/analytics': 'Analytics',
    '/admin/preferences': 'Account Preferences',
    '/admin/settings': 'Admin Settings',
  };
  return routes[pathname] || 'Admin Dashboard';
}

export function AdminTopBar() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left side - dynamic page title */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            {pageTitle}
          </h1>
        </div>
        
        {/* Right side - notifications, theme toggle, and user menu */}
        <div className="flex items-center gap-3">
          <NotificationButton />
          {/* Only render theme toggle when user is authenticated */}
          {status === 'authenticated' ? (
            <ThemeToggle />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-accent"
              disabled
            >
              <Monitor className="h-4 w-4 opacity-50" />
              <span className="sr-only">Loading theme</span>
            </Button>
          )}
          <div className="h-6 w-px bg-border" />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
} 
