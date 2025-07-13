import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Users, 
  Settings, 
  BarChart3, 
  CreditCard, 
  Shield, 
  FileText, 
  MessageSquare,
  Calendar,
  Camera,
  Eye,
  Target
} from 'lucide-react';

/**
 * AccountSidebar Component
 * 
 * Navigation sidebar for Account level - Account Holder Management
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active navigation tab
 * @param {function} props.onTabChange - Callback when tab changes
 * @param {string} props.className - Additional CSS classes
 * @example
 * <AccountSidebar 
 *   activeTab="overview" 
 *   onTabChange={(tab) => setActiveTab(tab)}
 * />
 */

interface AccountSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export const AccountSidebar: React.FC<AccountSidebarProps> = ({
  activeTab = 'overview',
  onTabChange = () => {},
  className = '',
}) => {
  return (
    <aside className={`w-64 border-r bg-card overflow-y-auto ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            Account
          </h2>
          <p className="text-sm text-muted-foreground">Account Management</p>
        </div>
        
        <nav className="space-y-2">
          {/* ACCOUNT OVERVIEW Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">ACCOUNT OVERVIEW</div>
          
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('overview')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('profile')}
          >
            <User className="mr-2 h-4 w-4" />
            My Profile
          </Button>
          
          <Button
            variant={activeTab === 'team' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('team')}
          >
            <Users className="mr-2 h-4 w-4" />
            Team Management
          </Button>
          
          <Separator className="my-3" />
          
          {/* BUSINESS OPERATIONS Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">BUSINESS OPERATIONS</div>
          
          <Button
            variant={activeTab === 'portfolio' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('portfolio')}
          >
            <Camera className="mr-2 h-4 w-4" />
            Portfolio
          </Button>
          
          <Button
            variant={activeTab === 'bookings' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('bookings')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            My Bookings
          </Button>
          
          <Button
            variant={activeTab === 'applications' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('applications')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Job Applications
          </Button>
          
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('analytics')}
          >
            <Target className="mr-2 h-4 w-4" />
            Performance Analytics
          </Button>
          
          <Separator className="my-3" />
          
          {/* ACCOUNT SETTINGS Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">ACCOUNT SETTINGS</div>
          
          <Button
            variant={activeTab === 'visibility' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('visibility')}
          >
            <Eye className="mr-2 h-4 w-4" />
            Profile Visibility
          </Button>
          
          <Button
            variant={activeTab === 'billing' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('billing')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Billing & Payments
          </Button>
          
          <Button
            variant={activeTab === 'communications' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('communications')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </Button>
          
          <Button
            variant={activeTab === 'privacy' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('privacy')}
          >
            <Shield className="mr-2 h-4 w-4" />
            Privacy & Security
          </Button>
          
          <Button
            variant={activeTab === 'preferences' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('preferences')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </Button>
        </nav>
      </div>
    </aside>
  );
}; 