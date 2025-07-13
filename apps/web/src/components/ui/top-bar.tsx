import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TopBarProps {
  /** Platform name or title */
  title?: string;
  /** Logo URL or component */
  logo?: string | React.ReactNode;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Show search input */
  showSearch?: boolean;
  /** Show notifications bell */
  showNotifications?: boolean;
  /** User information */
  user?: {
    name: string;
    avatar?: string;
    initials: string;
    role?: string;
  };
  /** Additional CSS classes */
  className?: string;
  /** Callback for search */
  onSearch?: (query: string) => void;
  /** Callback for notifications */
  onNotifications?: () => void;
  /** Callback for user menu actions */
  onUserAction?: (action: 'profile' | 'settings' | 'logout') => void;
}

/**
 * A reusable top bar component for application headers
 */
export const TopBar: React.FC<TopBarProps> = ({
  title = 'itellico Mono',
  logo,
  searchPlaceholder = 'Search...',
  showSearch = true,
  showNotifications = true,
  user = {
    name: 'User',
    initials: 'U',
    role: 'User',
  },
  className,
  onSearch,
  onNotifications,
  onUserAction,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  const handleUserAction = (action: 'profile' | 'settings' | 'logout') => {
    onUserAction?.(action);
  };

  const renderLogo = () => {
    if (typeof logo === 'string') {
      return <img src={logo} alt={title} className="w-8 h-8" />;
    }
    if (logo) {
      return logo;
    }
    return (
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">K</span>
      </div>
    );
  };

  return (
    <header className={cn('h-16 border-b bg-background flex items-center px-6', className)}>
      <div className="flex items-center space-x-2">
        {renderLogo()}
        <span className="font-semibold text-lg">{title}</span>
      </div>

      {showSearch && (
        <div className="flex-1 max-w-md mx-auto px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder={searchPlaceholder}
              className="pl-10"
              onChange={handleSearchChange}
            />
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        {showNotifications && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onNotifications}
          >
            <Bell className="h-5 w-5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 px-2">
              <Avatar className="h-8 w-8">
                {user.avatar && <AvatarImage src={user.avatar} />}
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{user.name}</span>
                {user.role && (
                  <span className="text-xs text-muted-foreground">{user.role}</span>
                )}
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleUserAction('profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUserAction('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleUserAction('logout')}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
