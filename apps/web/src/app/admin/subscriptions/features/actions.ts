'use server';

import { revalidatePath } from 'next/cache';
import { PlatformAdminService } from '@/lib/services/platform-admin.service';

export async function createFeature(data: {
  key: string;
  name: string;
  description?: string;
}) {
  try {
    const result = await PlatformAdminService.createFeature({
      key: data.key,
      name: data.name,
      description: data.description
    });

    if (result) {
      revalidatePath('/admin/subscriptions/features');
      return { success: true, data: result };
    }

    return { success: false, error: 'Failed to create feature' };
  } catch (error) {
    console.error('Error creating feature:', error);
    return { success: false, error: 'Failed to create feature' };
  }
}

export async function updateFeature(
  id: string,
  data: { key?: string; name?: string; description?: string; isActive?: boolean }
) {
  try {
    const result = await PlatformAdminService.updateFeature(id, data);

    if (result) {
      revalidatePath('/admin/subscriptions/features');
      return { success: true, data: result };
    }

    return { success: false, error: 'Failed to update feature' };
  } catch (error) {
    console.error('Error updating feature:', error);
    return { success: false, error: 'Failed to update feature' };
  }
}

export async function deleteFeature(id: string) {
  try {
    const result = await PlatformAdminService.deleteFeature(id);

    if (result) {
      revalidatePath('/admin/subscriptions/features');
      return { success: true };
    }

    return { success: false, error: 'Failed to delete feature' };
  } catch (error) {
    console.error('Error deleting feature:', error);
    return { success: false, error: 'Failed to delete feature' };
  }
}
