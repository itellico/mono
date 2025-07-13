'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch notifications with pagination and filtering
export function useNotifications(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
  priority?: string;
}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await apiClient.getNotifications(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch notifications');
      }
      return response.data;
    },
  });
}

// Mark notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.markNotificationAsRead(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to mark notification as read');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark notification as read');
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.markAllNotificationsAsRead();
      if (!response.success) {
        throw new Error(response.error || 'Failed to mark all notifications as read');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`Marked ${data.updated} notifications as read`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark all notifications as read');
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.deleteNotification(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete notification');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete notification');
    },
  });
}

// Get notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.getNotificationPreferences();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch notification preferences');
      }
      return response.data;
    },
  });
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      smsEnabled?: boolean;
      categories?: any;
    }) => {
      const response = await apiClient.updateNotificationPreferences(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update notification preferences');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update notification preferences');
    },
  });
}

// Send notification (admin only)
export function useSendNotification() {
  return useMutation({
    mutationFn: async (data: {
      userId?: number;
      tenantId?: number;
      type: string;
      priority?: string;
      title: string;
      message: string;
      data?: any;
      channels?: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
      };
      scheduledFor?: string;
    }) => {
      const response = await apiClient.sendNotification(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send notification');
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Notification sent to ${data.sent} recipient(s)`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send notification');
    },
  });
}

// Get notification templates (admin only)
export function useNotificationTemplates(params?: {
  category?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ['notification-templates', params],
    queryFn: async () => {
      const response = await apiClient.getNotificationTemplates(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch notification templates');
      }
      return response.data;
    },
  });
}

// Create notification template (admin only)
export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category: string;
      type: string;
      titleTemplate: string;
      messageTemplate: string;
      variables?: string[];
      defaultChannels?: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
    }) => {
      const response = await apiClient.createNotificationTemplate(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create notification template');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Notification template created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create notification template');
    },
  });
}

// Hook to get unread notification count
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', { isRead: false, limit: 1 }],
    queryFn: async () => {
      const response = await apiClient.getNotifications({ isRead: false, limit: 1 });
      if (!response.success) {
        return 0;
      }
      return response.data.unreadCount;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}