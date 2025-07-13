import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
// JWT User type

type AdminRole = 'super_admin' | 'tenant_admin' | 'content_moderator' | 'analytics_viewer' | 'gocare_reviewer' | 'model_approver';

interface AdminSession {
  id: string;
  email: string;
  roles: string[];
  adminRole?: AdminRole;
}

type AdminApiHandler = (
  request: NextRequest,
  context: { params: any },
) => Promise<NextResponse>;

export function withAdminAuth(
  handler: AdminApiHandler,
  requiredRoles: AdminRole[],
) {
  return async (request: NextRequest, context: { params: any }) => {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as AdminSession;
    const userRole = user.adminRole;

    if (
      !userRole ||
      (requiredRoles.length > 0 && !requiredRoles.includes(userRole))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(request, context);
  };
} 