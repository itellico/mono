'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, type AuthUser } from '@/lib/auth/client';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isLoading: boolean; // Alias for compatibility
  error: string | null;
  login: (email: string, password: string, callbackUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    try {
      setError(null);
      const user = await authClient.getMe();
      setUser(user);
    } catch (err) {
      console.error('Failed to load user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string, callbackUrl?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authClient.login(email, password);
      setUser(response); // The authClient.login now returns data.data directly
      
      // Don't redirect here - let the component handle it
      // router.push(callbackUrl || '/admin');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
      setUser(null);
      router.push('/auth/signin');
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear user state even if logout fails
      setUser(null);
      router.push('/auth/signin');
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading, // Alias for compatibility
    error,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}