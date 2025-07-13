'use client';

/**
 * Tenant-Aware Skeleton Loading Components
 * 
 * Provides consistent loading states across the application with tenant context.
 * Integrates with TanStack Query for automatic loading state management.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// ============================================================================
// BASE SKELETON COMPONENTS
// ============================================================================

interface SkeletonWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Smart wrapper that shows skeleton during loading
 */
export function SkeletonWrapper({ 
  isLoading, 
  skeleton, 
  children, 
  className 
}: SkeletonWrapperProps) {
  return (
    <div className={className}>
      {isLoading ? skeleton : children}
    </div>
  );
}

// ============================================================================
// DATA TABLE SKELETONS
// ============================================================================

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
  className?: string;
}

export function DataTableSkeleton({
  rows = 8,
  columns = 4,
  showHeader = true,
  showActions = true,
  className
}: DataTableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Header Skeleton */}
      {showHeader && (
        <div className="flex items-center justify-between p-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      )}

      {/* Filters Skeleton */}
      <div className="flex gap-4 p-4 border-b">
        <Skeleton className="h-9 w-64" /> {/* Search */}
        <Skeleton className="h-9 w-32" /> {/* Filter 1 */}
        <Skeleton className="h-9 w-32" /> {/* Filter 2 */}
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg">
        {/* Table Header */}
        <div className="border-b p-4">
          <div className="flex items-center space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
            {showActions && <Skeleton className="h-4 w-16" />}
          </div>
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b p-4 last:border-b-0">
            <div className="flex items-center space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  {colIndex === 0 ? (
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <Skeleton className="h-4 w-20" />
                  )}
                </div>
              ))}
              {showActions && (
                <Skeleton className="h-8 w-8 rounded" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between p-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FORM SKELETONS
// ============================================================================

interface FormSkeletonProps {
  fields?: number;
  sections?: number;
  showButtons?: boolean;
  className?: string;
}

export function FormSkeleton({
  fields = 6,
  sections = 1,
  showButtons = true,
  className
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: Math.ceil(fields / sections) }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {showButtons && (
        <div className="flex gap-3 justify-end">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CARD GRID SKELETONS
// ============================================================================

interface CardGridSkeletonProps {
  cards?: number;
  columns?: number;
  showImage?: boolean;
  className?: string;
}

export function CardGridSkeleton({
  cards = 8,
  columns = 3,
  showImage = true,
  className
}: CardGridSkeletonProps) {
  return (
    <div className={cn(
      'grid gap-4',
      columns === 2 && 'grid-cols-1 md:grid-cols-2',
      columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={index}>
          {showImage && (
            <div className="p-0">
              <Skeleton className="h-48 w-full rounded-t-lg" />
            </div>
          )}
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// LIST SKELETONS
// ============================================================================

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  showMeta?: boolean;
  className?: string;
}

export function ListSkeleton({
  items = 5,
  showAvatar = true,
  showMeta = true,
  className
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-3/4" />
            {showMeta && (
              <div className="flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            )}
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// STATISTICS SKELETONS
// ============================================================================

interface StatsSkeletonProps {
  cards?: number;
  showChart?: boolean;
  className?: string;
}

export function StatsSkeleton({
  cards = 4,
  showChart = false,
  className
}: StatsSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: cards }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      {showChart && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// TENANT-SPECIFIC SKELETONS
// ============================================================================

export function TenantDashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stats */}
      <StatsSkeleton cards={4} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTableSkeleton rows={6} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <ListSkeleton items={4} showAvatar={false} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function TenantSettingsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <FormSkeleton fields={8} sections={3} />
        </div>
      </div>
    </div>
  );
}

export function TenantUsersSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <DataTableSkeleton 
        rows={10} 
        columns={5} 
        showHeader={false} 
        showActions={true} 
      />
    </div>
  );
}

// ============================================================================
// SMART SKELETON HOOK
// ============================================================================

interface UseSkeletonOptions {
  minDelay?: number;
  enabled?: boolean;
}

export function useSkeleton(isLoading: boolean, options: UseSkeletonOptions = {}) {
  const { minDelay = 200, enabled = true } = options;
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;

    if (isLoading) {
      const timer = setTimeout(() => setShowSkeleton(true), minDelay);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [isLoading, minDelay, enabled]);

  return showSkeleton;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const TenantSkeleton = {
  // Wrappers
  SkeletonWrapper,
  useSkeleton,

  // Generic Components
  DataTableSkeleton,
  FormSkeleton,
  CardGridSkeleton,
  ListSkeleton,
  StatsSkeleton,

  // Tenant-Specific
  TenantDashboardSkeleton,
  TenantSettingsSkeleton,
  TenantUsersSkeleton } as const;

export default TenantSkeleton; 