'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { GigData, MarketplaceFilters, Category, GigBooking } from './types';

// Hook to search/fetch gigs
export function useGigs(filters: MarketplaceFilters, initialData?: any) {
  return useQuery({
    queryKey: ['marketplace-gigs', filters],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/gigs', {
        params: filters
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch gigs');
      }
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    initialData,
  });
}

// Hook to fetch featured gigs
export function useFeaturedGigs(limit: number = 8) {
  return useQuery({
    queryKey: ['featured-gigs', limit],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/gigs/featured', {
        params: { limit }
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch featured gigs');
      }
      return response.data.data.gigs as GigData[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch popular gigs by category
export function usePopularGigsByCategory(category: string, limit: number = 10) {
  return useQuery({
    queryKey: ['popular-gigs', category, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/gigs/popular/${category}`, {
        params: { limit }
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch popular gigs');
      }
      return response.data.data.gigs as GigData[];
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch gig categories
export function useCategories() {
  return useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      // TODO: Implement when categories endpoint is available
      // const response = await apiClient.get('/api/v1/categories', {
      //   params: { type: 'gig' }
      // });
      // return response.data.data.categories as Category[];
      
      // Mock data for now
      return [
        { name: 'Design & Creative', count: 1250, icon: '🎨' },
        { name: 'Development & Tech', count: 890, icon: '💻' },
        { name: 'Writing & Translation', count: 654, icon: '✍️' },
        { name: 'Digital Marketing', count: 432, icon: '📈' },
        { name: 'Video & Animation', count: 321, icon: '🎬' },
        { name: 'Music & Audio', count: 198, icon: '🎵' },
        { name: 'Photography', count: 156, icon: '📸' },
        { name: 'Business', count: 234, icon: '💼' },
      ] as Category[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to fetch a single gig by UUID
export function useGig(uuid: string, incrementViews: boolean = false) {
  return useQuery({
    queryKey: ['gig', uuid],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/gigs/${uuid}`, {
        params: { incrementViews }
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch gig');
      }
      return response.data.data.gig as GigData;
    },
    enabled: !!uuid,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to fetch gig statistics
export function useGigStats(uuid: string) {
  return useQuery({
    queryKey: ['gig-stats', uuid],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/gigs/${uuid}/stats`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch gig stats');
      }
      return response.data.data;
    },
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to create a gig booking
export function useCreateGigBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ gigUuid, bookingData }: {
      gigUuid: string;
      bookingData: {
        packageIndex: number;
        selectedExtras?: number[];
        customRequirements?: string;
        urgentDelivery?: boolean;
        attachments?: any[];
        deadline?: string;
        budget: {
          amount: number;
          currency: string;
        };
      };
    }) => {
      const response = await apiClient.post(`/api/v1/gigs/${gigUuid}/book`, bookingData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create booking');
      }
      
      return response.data.data.booking as GigBooking;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      toast({
        title: 'Booking created!',
        description: 'Your gig booking has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to create a gig review
export function useCreateGigReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookingUuid, reviewData }: {
      bookingUuid: string;
      reviewData: {
        rating: number;
        title: string;
        comment: string;
        categories: {
          communication: number;
          quality: number;
          delivery: number;
          value: number;
        };
        wouldRecommend: boolean;
      };
    }) => {
      const response = await apiClient.post(`/api/v1/gigs/bookings/${bookingUuid}/review`, reviewData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create review');
      }
      
      return response.data.data.review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-gigs'] });
      toast({
        title: 'Review submitted!',
        description: 'Thank you for your feedback.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Review failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to bookmark/unbookmark a gig
export function useBookmarkGig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ gigUuid, bookmark }: {
      gigUuid: string;
      bookmark: boolean;
    }) => {
      // TODO: Implement bookmark API endpoint
      const endpoint = bookmark ? 'bookmark' : 'unbookmark';
      const response = await apiClient.post(`/api/v1/gigs/${gigUuid}/${endpoint}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || `Failed to ${endpoint} gig`);
      }
      
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
      toast({
        title: variables.bookmark ? 'Bookmarked!' : 'Removed from bookmarks',
        description: variables.bookmark 
          ? 'Gig added to your bookmarks' 
          : 'Gig removed from your bookmarks',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Action failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}