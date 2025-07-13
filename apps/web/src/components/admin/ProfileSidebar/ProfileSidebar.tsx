import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  User, 
  Settings, 
  BarChart3, 
  CreditCard, 
  Shield, 
  FileText, 
  MessageSquare,
  Calendar,
  Star,
  Upload,
  Eye,
  Heart,
  Share,
  Bookmark,
  Play,
  Target,
  Palette,
  Globe,
  CheckCircle,
  Zap,
  Image,
  Video,
  Music,
  Folder,
  Award,
  Users
} from 'lucide-react';

/**
 * ProfileSidebar Component
 * 
 * Navigation sidebar for Profile level - Modeling/Talent Profile Management
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active navigation tab
 * @param {function} props.onTabChange - Callback when tab changes
 * @param {string} props.className - Additional CSS classes
 * @example
 * <ProfileSidebar 
 *   activeTab="overview" 
 *   onTabChange={(tab) => setActiveTab(tab)}
 * />
 */

interface ProfileSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeTab = 'overview',
  onTabChange = () => {},
  className = '',
}) => {
  return (
    <aside className={`w-64 border-r bg-card overflow-y-auto ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            Profile
          </h2>
          <p className="text-sm text-muted-foreground">Modeling/Talent Profile</p>
        </div>
        
        <nav className="space-y-2">
          {/* PROFILE OVERVIEW Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">PROFILE OVERVIEW</div>
          
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('overview')}
          >
            <User className="mr-2 h-4 w-4" />
            Profile Overview
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
          
          <Separator className="my-3" />
          
          {/* MEDIA MANAGEMENT Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">MEDIA MANAGEMENT</div>
          
          <Button
            variant={activeTab === 'media' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('media')}
          >
            <Folder className="mr-2 h-4 w-4" />
            Media Library
          </Button>
          
          <Button
            variant={activeTab === 'photos' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('photos')}
          >
            <Image className="mr-2 h-4 w-4" />
            Photo Gallery
          </Button>
          
          <Button
            variant={activeTab === 'videos' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('videos')}
          >
            <Video className="mr-2 h-4 w-4" />
            Video Portfolio
          </Button>
          
          <Button
            variant={activeTab === 'audio' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('audio')}
          >
            <Music className="mr-2 h-4 w-4" />
            Audio Samples
          </Button>
          
          <Separator className="my-3" />
          
          {/* PROFESSIONAL PROFILE Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">PROFESSIONAL PROFILE</div>
          
          <Button
            variant={activeTab === 'measurements' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('measurements')}
          >
            <Target className="mr-2 h-4 w-4" />
            Measurements & Stats
          </Button>
          
          <Button
            variant={activeTab === 'experience' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('experience')}
          >
            <Award className="mr-2 h-4 w-4" />
            Experience & Credits
          </Button>
          
          <Button
            variant={activeTab === 'availability' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('availability')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Availability Calendar
          </Button>
          
          <Separator className="my-3" />
          
          {/* BUSINESS ACTIVITIES Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">BUSINESS ACTIVITIES</div>
          
          <Button
            variant={activeTab === 'bookings' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('bookings')}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Booking History
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
            variant={activeTab === 'reviews' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('reviews')}
          >
            <Star className="mr-2 h-4 w-4" />
            Reviews & Ratings
          </Button>
          
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('analytics')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Profile Analytics
          </Button>
          
          <Separator className="my-3" />
          
          {/* NETWORKING & VISIBILITY Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">NETWORKING & VISIBILITY</div>
          
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
            variant={activeTab === 'social' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('social')}
          >
            <Share className="mr-2 h-4 w-4" />
            Social Media Links
          </Button>
          
          <Button
            variant={activeTab === 'networking' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('networking')}
          >
            <Users className="mr-2 h-4 w-4" />
            Professional Network
          </Button>
          
          <Button
            variant={activeTab === 'favorites' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('favorites')}
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Favorites & Saved
          </Button>
          
          <Separator className="my-3" />
          
          {/* BRANDING & CUSTOMIZATION Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">BRANDING & CUSTOMIZATION</div>
          
          <Button
            variant={activeTab === 'branding' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('branding')}
          >
            <Palette className="mr-2 h-4 w-4" />
            Personal Branding
          </Button>
          
          <Button
            variant={activeTab === 'website' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('website')}
          >
            <Globe className="mr-2 h-4 w-4" />
            Personal Website
          </Button>
          
          <Separator className="my-3" />
          
          {/* ACCOUNT MANAGEMENT Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">ACCOUNT MANAGEMENT</div>
          
          <Button
            variant={activeTab === 'earnings' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('earnings')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Earnings & Payments
          </Button>
          
          <Button
            variant={activeTab === 'messages' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('messages')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages & Inquiries
          </Button>
          
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start font-normal"
            onClick={() => onTabChange('notifications')}
          >
            <Zap className="mr-2 h-4 w-4" />
            Notifications
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
            Profile Preferences
          </Button>
        </nav>
      </div>
    </aside>
  );
}; 