import React from 'react';
import { UserSidebar } from '@/components/admin/UserSidebar/UserSidebar';
import { TopBar } from '@/components/ui/top-bar';

/**
 * User Base Layout Component
 * 
 * @component UserLayout
 * @description Standard layout for all User pages with consistent Sidebar and page structure
 */

export interface UserLayoutProps {
  /** Content to be rendered in the main area */
  children: React.ReactNode;
  /** Currently active navigation tab */
  activeTab: string;
  /** Navigation callback function */
  onNavigate?: (tab: string) => void;
  /** Optional custom class name */
  className?: string;
}

export const UserLayout: React.FC<UserLayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  className = '',
}) => {
  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <UserSidebar
        activeTab={activeTab}
        onNavigate={onNavigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="User Dashboard"
          user={{
            name: "Jane Doe",
            initials: "JD",
            role: "User"
          }}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}; 