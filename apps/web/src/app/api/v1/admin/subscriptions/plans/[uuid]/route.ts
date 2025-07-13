
import { NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updatedPlan = await subscriptionService.updateSubscriptionPlan(params.id, body);
    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json({ message: 'Failed to update subscription plan' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const deletedPlan = await subscriptionService.deleteSubscriptionPlan(params.id);
    return NextResponse.json(deletedPlan);
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json({ message: 'Failed to delete subscription plan' }, { status: 500 });
  }
}
