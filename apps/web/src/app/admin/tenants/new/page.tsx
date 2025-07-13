import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { NewTenantClient } from './NewTenantClient';

export default async function NewTenantPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userContext = extractUserContext(session);
  if (!userContext) {
    redirect('/auth/signin');
  }

  const hasAccess = canAccessAPI(userContext, '/api/v1/admin/tenants', 'POST');
  if (!hasAccess.allowed) {
    redirect('/unauthorized');
  }

  return <NewTenantClient userContext={userContext} />;
}