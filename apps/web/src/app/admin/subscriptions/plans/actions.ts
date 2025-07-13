'use server';

import { revalidatePath } from 'next/cache';
import { PlatformAdminService } from '@/lib/services/platform-admin.service';

export async function createPlan(data: {
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: { featureId: string; limit: number }[];
}) {
  try {
    const result = await PlatformAdminService.createPlan({
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency,
      billingCycle: data.billingCycle,
      features: data.features
    });

    if (result) {
      revalidatePath('/admin/subscriptions/plans');
      return { success: true, data: result };
    }

    return { success: false, error: 'Failed to create plan' };
  } catch (error) {
    console.error('Error creating plan:', error);
    return { success: false, error: 'Failed to create plan' };
  }
}

export async function updatePlan(
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    billingCycle?: string;
    features?: { featureId: string; limit: number }[];
  }
) {
  try {
    const result = await PlatformAdminService.updatePlan(id, data);

    if (result) {
      revalidatePath('/admin/subscriptions/plans');
      return { success: true, data: result };
    }

    return { success: false, error: 'Failed to update plan' };
  } catch (error) {
    console.error('Error updating plan:', error);
    return { success: false, error: 'Failed to update plan' };
  }
}

export async function deletePlan(id: string) {
  try {
    const result = await PlatformAdminService.deletePlan(id);

    if (result) {
      revalidatePath('/admin/subscriptions/plans');
      return { success: true };
    }

    return { success: false, error: 'Failed to delete plan' };
  } catch (error) {
    console.error('Error deleting plan:', error);
    return { success: false, error: 'Failed to delete plan' };
  }
}
