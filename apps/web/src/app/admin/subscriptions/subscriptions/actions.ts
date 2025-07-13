'use server';

import { revalidatePath } from 'next/cache';
import { PlatformAdminService } from '@/lib/services/platform-admin.service';

export async function createSubscription(data: {
  tenantId: string;
  planId: string;
  startDate: string;
  endDate?: string;
  status: string;
}) {
  try {
    const result = await PlatformAdminService.createSubscription({
      tenantId: data.tenantId,
      planId: data.planId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status
    });

    if (result) {
      revalidatePath('/admin/subscriptions');
      return { success: true, data: result };
    }

    return { success: false, error: 'Failed to create subscription' };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { success: false, error: 'Failed to create subscription' };
  }
}

export async function updateSubscription(
  id: string,
  data: {
    tenantId?: string;
    planId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }
) {
  try {
    const result = await PlatformAdminService.updateSubscription(id, data);

    if (result) {
      revalidatePath('/admin/subscriptions');
      return { success: true, data: result };
    }

    return { success: false, error: 'Failed to update subscription' };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: 'Failed to update subscription' };
  }
}

export async function deleteSubscription(id: string) {
  try {
    const result = await PlatformAdminService.deleteSubscription(id);

    if (result) {
      revalidatePath('/admin/subscriptions');
      return { success: true };
    }

    return { success: false, error: 'Failed to delete subscription' };
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return { success: false, error: 'Failed to delete subscription' };
  }
}
