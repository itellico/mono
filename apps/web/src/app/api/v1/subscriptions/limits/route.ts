
import { NextResponse } from 'next/server';
import { getSubscriptionLimits } from '@/lib/services/limits.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const planId = searchParams.get('planId');

  if (!planId) {
    return NextResponse.json({ error: 'planId is required' }, { status: 400 });
  }

  const limits = await getSubscriptionLimits(planId);

  if (!limits) {
    return NextResponse.json({ error: 'Limits not found' }, { status: 404 });
  }

  return NextResponse.json(limits);
}
