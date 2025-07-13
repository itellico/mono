import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  User, 
  Settings, 
  BarChart3, 
  CreditCard, 
  Shield, 
  FileText, 
  MessageSquare,
  Calendar,
  Camera,
  Upload,
  Star,
  Briefcase
} from 'lucide-react';

/**
 * UserSidebar Component
 * 
 * Navigation sidebar for User level - Individual User Management
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active navigation tab
 * @param {function} props.onTabChange - Callback when tab changes
 * @param {string} props.className - Additional CSS classes
 * @example
 * <UserSidebar 
 *   activeTab="dashboard" 
 *   onTabChange={(tab) => setActiveTab(tab)}
 * />
 */

interface UserSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  activeTab = 'dashboard',
  onTabChange = () => {},
  className = '',
}) => {
  return (
    <aside className={`w-64 border-r bg-card overflow-y-auto ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            User
          </h2>
          <p className="text-sm text-muted-foreground">Individual User</p>
        </div>
        
        <nav className="space-y-2">
          {/* PERSONAL DASHBOARD Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">PERSONAL DASHBOARD</div>
          
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('dashboard')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            My Dashboard
          </Button>
          
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('profile')}
          >
            <User className="mr-2 h-4 w-4" />
            Profile Editor
          </Button>
          
          <Button
            variant={activeTab === 'portfolio' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('portfolio')}
          >
            <Camera className="mr-2 h-4 w-4" />
            Portfolio Manager
          </Button>
          
          <Button
            variant={activeTab === 'uploads' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('uploads')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Media Uploads
          </Button>
          
          <Separator className="my-3" />
          
          {/* PROFESSIONAL ACTIVITIES Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">PROFESSIONAL ACTIVITIES</div>
          
          <Button
            variant={activeTab === 'applications' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('applications')}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Job Applications
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
            variant={activeTab === 'reviews' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('reviews')}
          >
            <Star className="mr-2 h-4 w-4" />
            Reviews & Ratings
          </Button>
          
          <Button
            variant={activeTab === 'documents' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('documents')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </Button>
          
          <Button
            variant={activeTab === 'earnings' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('earnings')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Earnings & Payments
          </Button>
          
          <Separator className="my-3" />
          
          {/* USER SETTINGS Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">USER SETTINGS</div>
          
          <Button
            variant={activeTab === 'messages' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('messages')}
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
            Privacy Settings
          </Button>
          
          <Button
            variant={activeTab === 'preferences' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('preferences')}
          >
            <Settings className="mr-2 h-4 w-4" />
            User Preferences
          </Button>
        </nav>
      </div>
    </aside>
  );
}; 