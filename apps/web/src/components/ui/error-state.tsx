'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  message?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({ 
  message = "Something went wrong", 
  retry,
  className 
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <AlertCircle className="h-12 w-12 text-destructive/50" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      {retry && (
        <Button
          variant="outline"
          size="sm"
          onClick={retry}
          className="mt-4"
        >
          Try again
        </Button>
      )}
    </div>
  );
}