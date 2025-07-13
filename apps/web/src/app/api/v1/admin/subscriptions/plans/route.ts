import { NextResponse, NextRequest } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/api-middleware';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { auth } from '@/lib/auth';

async function _GET(request: NextRequest) {
  try {
    const session = await auth();
    const userContext = extractUserContext(session);

    // Subscription plans are global, so no tenantId filtering needed here
    const plans = await subscriptionService.getSubscriptionPlans();
    logger.info('Subscription plans fetched successfully', { userId: userContext.userId });
    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    logger.error('Error fetching subscription plans:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, message: 'Failed to fetch subscription plans' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const session = await auth();
    const userContext = extractUserContext(session);

    const body = await request.json();
    const newPlan = await subscriptionService.createSubscriptionPlan(body);

    logger.info('Subscription plan created successfully', { planId: newPlan.id, userId: userContext.userId });
    return NextResponse.json({ success: true, data: newPlan }, { status: 201 });
  } catch (error) {
    logger.error('Error creating subscription plan:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, message: 'Failed to create subscription plan' }, { status: 500 });
  }
}

export const { GET, POST } = withMiddleware({
  GET: _GET,
  POST: _POST,
}, {
  requireAuth: true,
  permissions: {
    GET: { action: 'subscription_plans.read.global', resource: 'admin' },
    POST: { action: 'subscription_plans.create.global', resource: 'admin' },
  },
  audit: {
    logRequests: true,
    logResponses: true,
  },
});
