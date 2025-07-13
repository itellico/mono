'use client';

import React from 'react';
import { TenantEditForm } from '@/components/admin/tenants/TenantEditForm';

interface NewTenantClientProps {
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

export function NewTenantClient({ userContext }: NewTenantClientProps) {
  return (
    <TenantEditForm
      tenantData={null} // null for new tenant (will use defaults)
      isLoading={false}
      userContext={userContext}
    />
  );
} 