/**
 * Zone Component Error Boundary
 * 
 * Provides graceful error handling for zone component rendering
 * with user-friendly fallbacks and proper error reporting.
 */

'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { browserLogger } from '@/lib/browser-logger';

interface ZoneComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ZoneComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ZoneComponentErrorBoundary extends React.Component<
  ZoneComponentErrorBoundaryProps,
  ZoneComponentErrorBoundaryState
> {
  constructor(props: ZoneComponentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ZoneComponentErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for monitoring
    browserLogger.error('Zone component error caught by boundary', {
      componentName: this.props.componentName || 'unknown',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    browserLogger.userAction('zone_component_error_reset', {
      componentName: this.props.componentName || 'unknown',
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            resetError={this.resetError}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="w-full p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div>
                <strong>Component Error</strong>
                {this.props.componentName && (
                  <span className="ml-2 text-sm opacity-80">
                    ({this.props.componentName})
                  </span>
                )}
              </div>
              <p className="text-sm">
                This component encountered an error and could not be displayed properly.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.resetError}
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withZoneComponentErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => (
    <ZoneComponentErrorBoundary componentName={componentName}>
      <Component {...props} />
    </ZoneComponentErrorBoundary>
  );

  WrappedComponent.displayName = `withZoneComponentErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Zone Component Error Fallback - Lightweight fallback for zone components
 */
export function ZoneComponentErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void;
}) {
  return (
    <div className="w-full min-h-[100px] flex items-center justify-center p-4 border-2 border-dashed border-destructive/30 rounded-lg bg-destructive/5">
      <div className="text-center space-y-2">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm font-medium text-destructive">Component Error</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          This zone component failed to load. This might be a temporary issue.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={resetError}
          className="mt-2 h-7 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );
}

/**
 * Zone Editor Canvas Error Fallback - For use in the zone editor interface
 */
export function ZoneEditorErrorFallback({ 
  error, 
  resetError,
  componentType 
}: { 
  error: Error; 
  resetError: () => void;
  componentType?: string;
}) {
  return (
    <div className="w-full min-h-[120px] flex items-center justify-center p-6 border-2 border-dashed border-destructive/40 rounded-lg bg-destructive/10">
      <div className="text-center space-y-3">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <div>
          <p className="text-sm font-medium text-destructive">Component Render Error</p>
          {componentType && (
            <p className="text-xs text-muted-foreground mt-1">
              Type: {componentType}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground max-w-md">
          This component could not be rendered in the preview. Check the configuration 
          and try again, or remove this component from the layout.
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetError}
            className="h-8 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Retry Render
          </Button>
        </div>
      </div>
    </div>
  );
} 