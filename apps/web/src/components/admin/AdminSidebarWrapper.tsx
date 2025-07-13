'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { AdminSidebarNew } from './AdminSidebarNew';

export const AdminSidebarWrapper = function AdminSidebarWrapper() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Show loading state during initial hydration
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100); // Brief loading state for better UX

    return () => clearTimeout(timer);
  }, []);

  return (
    <AdminSidebarNew 
      isLoading={!isHydrated}
    />
  );
} 