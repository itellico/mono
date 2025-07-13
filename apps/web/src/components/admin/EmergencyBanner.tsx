/**
 * @fileoverview Emergency Access Banner
 * 
 * Global banner that appears when emergency access is active
 * Shows countdown timer and emergency status
 * 
 * @author itellico Mono Team
 * @version 1.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Shield } from 'lucide-react';

interface EmergencyBannerProps {
  className?: string;
}

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

export function EmergencyBanner({ className = '' }: EmergencyBannerProps) {
  const { user } = useAuth();
  
  // Check if emergency access is active from user
  const emergencyUntil = (user as any)?.emergencyUntil;
  const isEmergencyActive = emergencyUntil && new Date(emergencyUntil) > new Date();
  
  const timeLeft = useCountdown(emergencyUntil);

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

  if (!isEmergencyActive) {
    return null;
  }

  return (
    <div className={`sticky top-0 z-50 ${className}`}>
      <Alert className="border-red-500 bg-red-50 border-2 rounded-none">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">
                🚨 EMERGENCY ACCESS ACTIVE
              </span>
            </div>
            <Badge variant="destructive" className="animate-pulse">
              All actions logged
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-600" />
            <span className="font-mono text-red-800 font-medium">
              {formatTimeRemaining(timeLeft)}
            </span>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}