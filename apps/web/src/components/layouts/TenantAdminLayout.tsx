import React from 'react';
import { TenantAdminSidebar } from '@/components/admin/TenantAdminSidebar/TenantAdminSidebar';
import { TopBar } from '@/components/ui/top-bar';

/**
 * TenantAdmin Base Layout Component
 * 
 * @component TenantAdminLayout
 * @description Standard layout for all TenantAdmin pages with consistent Sidebar and page structure
 */

export interface TenantAdminLayoutProps {
  /** Content to be rendered in the main area */
  children: React.ReactNode;
  /** Currently active navigation tab */
  activeTab: string;
  /** Navigation callback function */
  onNavigate?: (tab: string) => void;
  /** Optional custom class name */
  className?: string;
}

export const TenantAdminLayout: React.FC<TenantAdminLayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  className = '',
}) => {
  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <TenantAdminSidebar
        activeTab={activeTab}
        onNavigate={onNavigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Tenant Administrator"
          user={{
            name: "Tenant Admin",
            initials: "TA",
            role: "Administrator"
          }}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}; 