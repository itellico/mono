import React from 'react';
import { ProfileSidebar } from '@/components/admin/ProfileSidebar/ProfileSidebar';

/**
 * Profile Base Layout Component
 * 
 * @component ProfileLayout
 * @description Standard layout for all Profile pages with consistent Sidebar and page structure
 */

export interface ProfileLayoutProps {
  /** Content to be rendered in the main area */
  children: React.ReactNode;
  /** Currently active navigation tab */
  activeTab: string;
  /** Navigation callback function */
  onNavigate?: (tab: string) => void;
  /** Optional page title */
  pageTitle?: string;
  /** Optional page description */
  pageDescription?: string;
  /** Optional header actions (buttons, etc.) */
  headerActions?: React.ReactNode;
  /** Optional custom class name */
  className?: string;
}

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  pageTitle,
  pageDescription,
  headerActions,
  className = '',
}) => {
  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <ProfileSidebar
        activeTab={activeTab}
        onTabChange={onNavigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Page Header */}
          {(pageTitle || headerActions) && (
            <div className="flex items-center justify-between mb-6">
              <div>
                {pageTitle && (
                  <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                )}
                {pageDescription && (
                  <p className="text-gray-600 mt-1">{pageDescription}</p>
                )}
              </div>
              {headerActions && (
                <div className="flex items-center gap-2">
                  {headerActions}
                </div>
              )}
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}; 