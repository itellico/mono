import React from 'react';
import { AccountSidebar } from '@/components/admin/AccountSidebar/AccountSidebar';
import { TopBar } from '@/components/ui/top-bar';

/**
 * Account Base Layout Component
 * 
 * @component AccountLayout
 * @description Standard layout for all Account pages with consistent Sidebar and page structure
 */

export interface AccountLayoutProps {
  /** Content to be rendered in the main area */
  children: React.ReactNode;
  /** Currently active navigation tab */
  activeTab: string;
  /** Navigation callback function */
  onNavigate?: (tab: string) => void;
  /** Optional custom class name */
  className?: string;
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  className = '',
}) => {
  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <AccountSidebar
        activeTab={activeTab}
        onTabChange={onNavigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Account Management"
          user={{
            name: "John's Account",
            initials: "JA",
            role: "Account Owner"
          }}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}; 