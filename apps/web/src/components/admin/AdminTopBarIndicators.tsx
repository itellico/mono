"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Crown, 
  Code, 
  Bug, 
  Wrench
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';

interface ActiveModes {
  godMode: boolean;
  developerMode: boolean;
  debugMode: boolean;
  maintenanceMode: boolean;
}

export function AdminTopBarIndicators() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user has admin access
  const hasAdminAccess = (user as any)?.role && 
    ['super_admin', 'admin', 'moderator'].includes((user as any)?.role);

  // Fetch active modes
  const { data: modes, isLoading } = useQuery<ActiveModes>({
    queryKey: ['active-modes'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/settings/active-modes');
      if (!response.ok) throw new Error('Failed to fetch active modes');
      const result = await response.json();
      return result.data;
    },
    enabled: hasAdminAccess,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Toggle developer mode mutation
  const toggleDeveloperModeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/admin/settings/toggle-developer-mode', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle developer mode');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-modes'] });
      toast({
        title: "Developer Mode",
        description: data.message,
      });
    },
    onError: (error) => {
      browserLogger.error('Failed to toggle developer mode', { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: "Error",
        description: "Failed to toggle developer mode",
        variant: "destructive",
      });
    },
  });

  // Don't render if user doesn't have admin access
  if (!hasAdminAccess || isLoading) {
    return null;
  }

  const handleToggleDeveloperMode = () => {
    toggleDeveloperModeMutation.mutate();
  };

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        {/* God Mode Indicator */}
        {modes?.godMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 text-white cursor-help"
              >
                <Crown className="h-3 w-3 mr-1" />
                God Mode
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>God Mode is active - you can edit system-protected entities</p>
              <p className="text-xs text-muted-foreground">Configure in Super Admin Settings</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Developer Mode Toggle */}
        {['super_admin', 'admin'].includes((user as any)?.role) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={modes?.developerMode ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    modes?.developerMode 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'hover:bg-amber-100'
                  }`}
                  onClick={handleToggleDeveloperMode}
                >
                  <Code className="h-3 w-3 mr-1" />
                  Dev Mode
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to toggle Developer Mode</p>
              <p className="text-xs text-muted-foreground">
                {modes?.developerMode ? 'Currently enabled' : 'Currently disabled'}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Debug Mode Indicator */}
        {modes?.debugMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-help"
              >
                <Bug className="h-3 w-3 mr-1" />
                Debug
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Debug Mode is active - detailed error messages enabled</p>
              <p className="text-xs text-muted-foreground">Global setting managed by admins</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Maintenance Mode Indicator */}
        {modes?.maintenanceMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="destructive" 
                className="bg-orange-600 hover:bg-orange-700 text-white cursor-help animate-pulse"
              >
                <Wrench className="h-3 w-3 mr-1" />
                Maintenance
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Maintenance Mode is active</p>
              <p className="text-xs text-muted-foreground">Non-admin users see maintenance page</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
} 