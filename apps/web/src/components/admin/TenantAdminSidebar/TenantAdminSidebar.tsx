import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  CreditCard, 
  Shield, 
  FileText, 
  MessageSquare,
  Package,
  Workflow,
  Database,
  Globe
} from 'lucide-react';

/**
 * TenantAdminSidebar Component
 * 
 * Navigation sidebar for Tenant Admin level - Agency/Organization Management
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active navigation tab
 * @param {function} props.onTabChange - Callback when tab changes
 * @param {string} props.className - Additional CSS classes
 * @example
 * <TenantAdminSidebar 
 *   activeTab="dashboard" 
 *   onTabChange={(tab) => setActiveTab(tab)}
 * />
 */

interface TenantAdminSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export const TenantAdminSidebar: React.FC<TenantAdminSidebarProps> = ({
  activeTab = 'dashboard',
  onTabChange = () => {},
  className = '',
}) => {
  const coreItems = [
    {
      id: 'dashboard',
      label: 'Agency Dashboard',
      icon: BarChart3,
      description: 'Overview and analytics'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      description: 'Manage agency users'
    },
    {
      id: 'profiles',
      label: 'Profile Management',
      icon: FileText,
      description: 'Model/talent profiles'
    },
    {
      id: 'bookings',
      label: 'Booking System',
      icon: Package,
      description: 'Manage bookings and jobs'
    }
  ];

  const businessItems = [
    {
      id: 'billing',
      label: 'Billing & Payments',
      icon: CreditCard,
      description: 'Financial management'
    },
    {
      id: 'branding',
      label: 'Agency Branding',
      icon: Globe,
      description: 'Customize appearance'
    },
    {
      id: 'workflows',
      label: 'Workflow Automation',
      icon: Workflow,
      description: 'Automated processes'
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: Database,
      description: 'Third-party connections'
    }
  ];

  const systemItems = [
    {
      id: 'communications',
      label: 'Communications',
      icon: MessageSquare,
      description: 'Messaging and notifications'
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: Shield,
      description: 'Access control'
    },
    {
      id: 'settings',
      label: 'Agency Settings',
      icon: Settings,
      description: 'Configuration'
    }
  ];

  return (
    <aside className={`w-64 border-r bg-card overflow-y-auto ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Tenant Admin
          </h2>
          <p className="text-sm text-muted-foreground">Agency Management</p>
        </div>
        
        <nav className="space-y-2">
          {/* Core Operations */}
          <div className="text-xs font-medium text-muted-foreground mb-2">CORE OPERATIONS</div>
          {coreItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => onTabChange(item.id)}
                title={item.description}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}

          <Separator className="my-3" />

          {/* Business Management */}
          <div className="text-xs font-medium text-muted-foreground mb-2">BUSINESS</div>
          {businessItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => onTabChange(item.id)}
                title={item.description}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}

          <Separator className="my-3" />

          {/* System & Settings */}
          <div className="text-xs font-medium text-muted-foreground mb-2">SYSTEM</div>
          {systemItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => onTabChange(item.id)}
                title={item.description}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}; 