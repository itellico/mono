'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  BarChart3, 
  Building2, 
  Database, 
  TrendingUp, 
  Eye, 
  Settings 
} from 'lucide-react';

/**
 * SuperAdminSidebar Component
 * 
 * @component SuperAdminSidebar
 * @description Navigation sidebar for Super Admin platform management
 * @param {SuperAdminSidebarProps} props - Component properties
 * @param {string} props.activeTab - Currently active navigation tab
 * @param {function} props.onNavigate - Navigation callback function
 * @example
 * <SuperAdminSidebar 
 *   activeTab="dashboard" 
 *   onNavigate={(tab) => console.log(tab)} 
 * />
 */

export interface SuperAdminSidebarProps {
  /** Currently active navigation tab */
  activeTab?: string;
  /** Navigation callback function */
  onNavigate?: (tab: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  activeTab = 'dashboard',
  onNavigate = () => {},
  className = ''
}) => {
  const handleNavigation = (tab: string) => {
    onNavigate(tab);
  };

  return (
    <div className={`w-64 h-screen bg-white border-r border-gray-200 ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6 pt-4">
          <Shield className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="font-semibold">Super Admin</h3>
            <p className="text-xs text-muted-foreground">Platform Control</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-2">
          {/* Platform Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">PLATFORM</div>
          
          <Button 
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'} 
            className="w-full justify-start" 
            onClick={() => handleNavigation('dashboard')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          
          <Button 
            variant={activeTab === 'tenants' ? 'default' : 'ghost'} 
            className="w-full justify-start" 
            onClick={() => handleNavigation('tenants')}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Tenants
          </Button>
          
          <Button 
            variant={activeTab === 'templates' ? 'default' : 'ghost'} 
            className="w-full justify-start" 
            onClick={() => handleNavigation('templates')}
          >
            <Database className="h-4 w-4 mr-2" />
            Industry Templates
          </Button>
          
          <Separator className="my-3" />
          
          {/* System Section */}
          <div className="text-xs font-medium text-muted-foreground mb-2">SYSTEM</div>
          
          <Button 
            variant={activeTab === 'analytics' ? 'default' : 'ghost'} 
            className="w-full justify-start" 
            onClick={() => handleNavigation('analytics')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Platform Analytics
          </Button>
          
          <Button 
            variant={activeTab === 'monitoring' ? 'default' : 'ghost'} 
            className="w-full justify-start" 
            onClick={() => handleNavigation('monitoring')}
          >
            <Eye className="h-4 w-4 mr-2" />
            System Monitoring
          </Button>
          
          <Button 
            variant={activeTab === 'settings' ? 'default' : 'ghost'} 
            className="w-full justify-start" 
            onClick={() => handleNavigation('settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Platform Settings
          </Button>
        </nav>
        
        {/* Status Section */}
        <div className="mt-6 p-3 bg-purple-50 rounded-lg">
          <div className="text-xs font-medium mb-1">Platform Status</div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            All Systems Operational
          </Badge>
        </div>
      </div>
    </div>
  );
}; 