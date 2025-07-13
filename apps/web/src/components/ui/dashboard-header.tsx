'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, User, LogOut } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';
import { useSignout } from '@/hooks/useSignout';

interface DashboardHeaderProps {
  title?: string;
  badge?: string;
}

export function DashboardHeader({ title = "GoModels", badge = "Dashboard" }: DashboardHeaderProps) {
  const { user, refreshUser } = useAuth();
  const { quickSignOut } = useSignout();
  const [imageKey, setImageKey] = useState(Date.now());

  // Get the profile picture URL with proper fallback
  const baseProfilePictureUrl = (user as any)?.profilePhotoUrl || (user as any)?.image || '';

  // Update image key when profile picture URL changes to force cache bust
  useEffect(() => {
    if (baseProfilePictureUrl) {
      setImageKey(Date.now());
    }
  }, [baseProfilePictureUrl]);

  // Listen for custom profile picture update events
  useEffect(() => {
    const handleProfilePictureUpdate = (event: CustomEvent) => {
      browserLogger.info('Header: Profile picture update event received', event.detail);
      setImageKey(Date.now());
      // Force user refresh
      refreshUser();
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    };
  }, [refreshUser]);

  // Smart cache busting - only add cache parameter if we have a URL
  const profilePictureUrl = baseProfilePictureUrl ? `${baseProfilePictureUrl}?v=${imageKey}` : '';

  // Debug logging for profile picture
  browserLogger.debug('Header profile picture state', {
    userProfilePhotoUrl: (user as any)?.profilePhotoUrl,
    userImage: (user as any)?.image,
    userName: user?.email,
    baseProfilePictureUrl,
    profilePictureUrl,
    imageKey
  });

  const handleSignOut = async () => {
    try {
      browserLogger.info('Dashboard header logout initiated');
      await quickSignOut();
    } catch (error) {
      browserLogger.error('Error during dashboard signout', { error });
      // Signout hook handles fallbacks internally
    }
  };

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex items-center justify-center py-4">
      {/* Centered Profile Dropdown - No background */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent">
            <Avatar className="h-10 w-10" key={profilePictureUrl}>
              <AvatarImage 
                src={profilePictureUrl}
                alt={user?.email || 'User'} 
                key={`avatar-${imageKey}`} // Double cache busting
              />
              <AvatarFallback>
                {getUserInitials(user?.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="center" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {user?.email && (
                <p className="font-medium">{user.email}</p>
              )}
              {user?.email && (
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 