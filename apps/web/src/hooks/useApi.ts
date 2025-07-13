'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import apiClient, { ApiError } from '@/lib/api-client';
import type { ApiResponse } from '@mono/shared';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  immediate?: boolean;
}

interface UseApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const isMountedRef = useRef(true);
  const { onSuccess, onError, immediate = false } = options;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState({ data: null, error: null, loading: true });

      try {
        const response = await apiCall(...args);

        if (!isMountedRef.current) return null;

        if (response.success && response.data) {
          setState({ data: response.data, error: null, loading: false });
          onSuccess?.(response.data);
          return response.data;
        } else {
          const error = new ApiError(
            response.error || 'Request failed',
            0,
            response
          );
          setState({ data: null, error, loading: false });
          onError?.(error);
          return null;
        }
      } catch (error) {
        if (!isMountedRef.current) return null;

        const apiError = error instanceof ApiError
          ? error
          : new ApiError(
              error instanceof Error ? error.message : 'Unknown error',
              0
            );

        setState({ data: null, error: apiError, loading: false });
        onError?.(apiError);
        return null;
      }
    },
    [apiCall, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]);

  return {
    ...state,
    execute,
    reset,
  };
}

// Convenience hooks for common API calls
export function useLogin() {
  return useApi(
    (email: string, password: string) => apiClient.login(email, password)
  );
}

export function useRegister() {
  return useApi(
    (data: { email: string; password: string; firstName: string; lastName: string }) =>
      apiClient.register(data)
  );
}

export function useCurrentUser() {
  return useApi(
    () => apiClient.getCurrentUser(),
    { immediate: true }
  );
}

export function useUserProfile() {
  return useApi(
    () => apiClient.getUserProfile(),
    { immediate: true }
  );
}

export function useUpdateProfile() {
  return useApi(
    (data: any) => apiClient.updateUserProfile(data)
  );
}

export function useFileUpload() {
  return useApi(
    (file: File) => apiClient.uploadFile(file)
  );
}

export function useSubscriptionPlans() {
  return useApi(
    () => apiClient.getSubscriptionPlans(),
    { immediate: true }
  );
}

export function useCurrentSubscription() {
  return useApi(
    () => apiClient.getCurrentSubscription(),
    { immediate: true }
  );
}