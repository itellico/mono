'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GigCard } from './GigCard';

interface GigData {
  id: number;
  uuid: string;
  title: string;
  category: string;
  subcategory?: string;
  startingPrice: number;
  currency: string;
  avgRating?: number;
  totalOrders: number;
  totalReviews: number;
  featured: boolean;
  status: string;
  publishedAt?: string;
  talent: {
    id: number;
    uuid: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  _count: {
    bookings: number;
    reviews: number;
  };
}

interface FeaturedGigsProps {
  gigs: GigData[];
  isLoading: boolean;
  onGigClick: (gig: GigData) => void;
  className?: string;
}

export function FeaturedGigs({ 
  gigs, 
  isLoading, 
  onGigClick, 
  className 
}: FeaturedGigsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-6 mb-12', className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        
        <div className="flex gap-6 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!gigs || gigs.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-6 mb-12', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            Featured Services
          </h2>
          <p className="text-muted-foreground">
            Hand-picked services from our top-rated professionals
          </p>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollLeft}
            className="h-10 w-10 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={scrollRight}
            className="h-10 w-10 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Featured Gigs Carousel */}
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {gigs.map((gig) => (
          <div key={gig.uuid} className="flex-shrink-0 w-80">
            <GigCard
              gig={gig}
              onClick={() => onGigClick(gig)}
              showCategory
            />
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center">
        <Button variant="outline" asChild>
          <a href="/marketplace?featured=true">
            View All Featured Services
          </a>
        </Button>
      </div>
    </div>
  );
}