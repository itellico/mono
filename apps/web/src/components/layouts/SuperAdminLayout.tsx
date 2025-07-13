import React from 'react';
import { SuperAdminSidebar } from '@/components/admin/SuperAdminSidebar/SuperAdminSidebar';
import { TopBar } from '@/components/ui/top-bar';

/**
 * SuperAdmin Base Layout Component
 * 
 * @component SuperAdminLayout
 * @description Standard layout for all SuperAdmin pages with consistent Sidebar, TopBar and page structure
 * @example
 * <SuperAdminLayout activeTab="tenants" pageTitle="Tenant Management">
 *   <YourPageContent />
 * </SuperAdminLayout>
 */

export interface SuperAdminLayoutProps {
  /** Content to be rendered in the main area */
  children: React.ReactNode;
  /** Currently active navigation tab */
  activeTab: string;
  /** Navigation callback function */
  onNavigate?: (tab: string) => void;
  /** Optional custom class name */
  className?: string;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  className = '',
}) => {
  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <SuperAdminSidebar
        activeTab={activeTab}
        onNavigate={onNavigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        <TopBar
          title="Super Administrator"
          showSearch={true}
          showNotifications={true}
          user={{
            name: "Super Admin",
            initials: "SA",
            role: "Super Administrator"
          }}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}; 