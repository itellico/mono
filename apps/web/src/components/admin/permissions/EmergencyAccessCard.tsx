/**
 * @fileoverview Emergency Access Control Card
 * 
 * Provides emergency access controls for super admins with:
 * - Emergency activation/deactivation
 * - Justification requirements
 * - Time-limited access
 * - Full audit logging
 * 
 * @author itellico Mono Team
 * @version 1.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { AlertTriangle, Shield, Clock, User, Activity } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface EmergencyStatus {
  isActive: boolean;
  expiresAt?: string;
  timeRemaining?: number;
  user: {
    id: number;
    name: string;
  };
  recentActivity: Array<{
    type: string;
    justification?: string;
    createdAt: string;
    ipAddress?: string;
  }>;
}

interface EmergencyAccessCardProps {
  userId: number;
  userEmail: string;
  isSuperAdmin: boolean;
}

// ============================================================================
// API SERVICES
// ============================================================================

const fetchEmergencyStatus = async (): Promise<EmergencyStatus> => {
  const response = await fetch('/api/v1/admin/emergency/status', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch emergency status');
  }
  const data = await response.json();
  return data.data;
};

const activateEmergency = async (payload: { justification: string; duration: number }) => {
  const response = await fetch('/api/v1/admin/emergency/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to activate emergency access');
  }
  return response.json();
};

const deactivateEmergency = async () => {
  const response = await fetch('/api/v1/admin/emergency/deactivate', {
    method: 'POST',
    credentials: 'include'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to deactivate emergency access');
  }
  return response.json();
};

// ============================================================================
// TIMER HOOK
// ============================================================================

function useCountdown(targetDate?: string) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(0);
      return;
    }

    const target = new Date(targetDate).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;
      setTimeLeft(Math.max(0, difference));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// ============================================================================
// EMERGENCY ACCESS CARD COMPONENT
// ============================================================================

export function EmergencyAccessCard({ userId, userEmail, isSuperAdmin }: EmergencyAccessCardProps) {
  const [justification, setJustification] = useState('');
  const [duration, setDuration] = useState<number>(4);
  const [showActivationForm, setShowActivationForm] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Query emergency status
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['emergency-status'],
    queryFn: fetchEmergencyStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: isSuperAdmin
  });

  // ✅ Countdown timer
  const timeLeft = useCountdown(status?.expiresAt);

  // ✅ Activation mutation
  const activateMutation = useMutation({
    mutationFn: activateEmergency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-status'] });
      setJustification('');
      setShowActivationForm(false);
      toast({
        title: '🚨 Emergency Access Activated',
        description: 'Emergency access is now active. All actions are being logged.',
        variant: 'destructive'
      });
      
      browserLogger.userAction('Emergency access activated', 'EmergencyAccessCard', {
        userId,
        userEmail,
        duration,
        timestamp: new Date().toISOString()
      });
    },
    onError: (error) => {
      toast({
        title: 'Activation Failed',
        description: error instanceof Error ? error.message : 'Failed to activate emergency access',
        variant: 'destructive'
      });
    }
  });

  // ✅ Deactivation mutation
  const deactivateMutation = useMutation({
    mutationFn: deactivateEmergency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-status'] });
      toast({
        title: 'Emergency Access Deactivated',
        description: 'Emergency access has been safely deactivated.',
      });
      
      browserLogger.userAction('Emergency access deactivated', 'EmergencyAccessCard', {
        userId,
        userEmail,
        timestamp: new Date().toISOString()
      });
    },
    onError: (error) => {
      toast({
        title: 'Deactivation Failed',
        description: error instanceof Error ? error.message : 'Failed to deactivate emergency access',
        variant: 'destructive'
      });
    }
  });

  // Format time remaining
  const formatTimeRemaining = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleActivate = () => {
    if (justification.trim().length < 10) {
      toast({
        title: 'Justification Required',
        description: 'Please provide at least 10 characters explaining why emergency access is needed.',
        variant: 'destructive'
      });
      return;
    }

    activateMutation.mutate({
      justification: justification.trim(),
      duration
    });
  };

  if (!isSuperAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            <span className="text-orange-800">Loading emergency access status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Failed to load emergency access status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={status?.isActive ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${status?.isActive ? 'text-red-800' : 'text-orange-800'}`}>
          <AlertTriangle className="h-5 w-5" />
          🚨 Emergency Access Controls
        </CardTitle>
        <CardDescription>
          Break-glass access for critical system operations. All actions are logged and audited.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status?.isActive ? (
          // EMERGENCY ACTIVE STATE
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-100">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>Emergency access is currently ACTIVE</strong>
                <br />
                All actions are being logged and audited. Deactivate immediately when done.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">Time Remaining</div>
                  <div className="text-2xl font-mono text-red-600">
                    {formatTimeRemaining(timeLeft)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">Active User</div>
                  <div className="text-sm text-red-600">{status.user.name}</div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => deactivateMutation.mutate()}
              disabled={deactivateMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate Emergency Access'}
            </Button>
          </div>
        ) : (
          // EMERGENCY INACTIVE STATE
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Inactive
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Emergency access is not currently active
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowActivationForm(!showActivationForm)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Enable Emergency Mode
              </Button>
            </div>

            {showActivationForm && (
              <div className="space-y-4 p-4 bg-white rounded-lg border border-orange-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Justification (Required)
                  </label>
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Describe the emergency situation requiring elevated access..."
                    rows={3}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {justification.length}/500 characters (minimum 10 required)
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="4">4 hours (recommended)</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleActivate}
                    disabled={activateMutation.isPending || justification.trim().length < 10}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {activateMutation.isPending ? 'Activating...' : 'Activate Emergency Access'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowActivationForm(false)}
                    disabled={activateMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {status?.recentActivity && status.recentActivity.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Activity className="h-4 w-4" />
              Recent Activity
            </div>
            <div className="space-y-1">
              {status.recentActivity.slice(0, 3).map((activity, index) => (
                <div key={index} className="text-xs text-muted-foreground p-2 bg-white rounded border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {activity.type.replace('emergency_', '').replace('_', ' ')}
                    </span>
                    <span>{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                  {activity.justification && (
                    <div className="mt-1 text-xs">{activity.justification}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}