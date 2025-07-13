import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const adminRole = (session.user as any).adminRole;
    if (adminRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    // TODO: Implement actual database queries
    // For now, return mock data
    const stats = {
      totalPlans: 12,
      activePlans: 8,
      totalFeatures: 25,
      activeFeatures: 20,
      totalLimits: 45,
      totalRevenue: 125000,
      monthlyRevenue: 15000,
      tenantSubscriptions: 5,
      agencySubscriptions: 23,
      accountSubscriptions: 156
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 