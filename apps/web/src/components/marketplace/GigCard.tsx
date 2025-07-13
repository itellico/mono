'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  Heart, 
  Clock, 
  ShoppingCart,
  Award,
  Verified,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface GigCardProps {
  gig: GigData;
  variant?: 'grid' | 'list';
  showCategory?: boolean;
  onBookmark?: (gigUuid: string) => void;
  onClick?: () => void;
  className?: string;
}

export function GigCard({
  gig,
  variant = 'grid',
  showCategory = true,
  onBookmark,
  onClick,
  className,
}: GigCardProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderRating = () => {
    if (!gig.avgRating || gig.totalReviews === 0) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Star className="h-4 w-4" />
          <span className="text-sm">No reviews</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{gig.avgRating.toFixed(1)}</span>
        <span className="text-muted-foreground text-sm">
          ({gig.totalReviews})
        </span>
      </div>
    );
  };

  const renderTalentInfo = () => (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={gig.talent.avatarUrl} />
        <AvatarFallback className="text-xs">
          {gig.talent.firstName[0]}{gig.talent.lastName[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {gig.talent.firstName} {gig.talent.lastName}
        </p>
        {gig.totalOrders > 0 && (
          <p className="text-xs text-muted-foreground">
            {gig.totalOrders} orders completed
          </p>
        )}
      </div>
      {gig.totalOrders >= 50 && (
        <Badge variant="secondary" className="text-xs">
          <Award className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      )}
    </div>
  );

  if (variant === 'list') {
    return (
      <Card 
        className={cn(
          'cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Gig Image Placeholder */}
            <div className="w-48 h-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="text-4xl">🎨</div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="space-y-2">
                {showCategory && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {gig.category}
                    </Badge>
                    {gig.featured && (
                      <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500">
                        <Award className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                )}
                
                <h3 className="text-lg font-semibold line-clamp-2 hover:text-primary transition-colors">
                  {gig.title}
                </h3>
                
                {renderTalentInfo()}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {renderRating()}
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" />
                  <span>{gig._count.bookings} sales</span>
                </div>
                {gig.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Listed {new Date(gig.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col justify-between items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark?.(gig.uuid);
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>

              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Starting at</p>
                <p className="text-2xl font-bold">
                  {formatPrice(gig.startingPrice, gig.currency)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid variant (default)
  return (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border overflow-hidden',
        className
      )}
      onClick={onClick}
    >
      {/* Gig Image */}
      <div className="relative h-48 bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl">🎨</div>
        </div>
        
        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {gig.featured && (
            <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500">
              <Award className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {showCategory && (
            <Badge variant="secondary" className="text-xs">
              {gig.category}
            </Badge>
          )}
        </div>

        {/* Bookmark Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 bg-background/80 backdrop-blur hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            onBookmark?.(gig.uuid);
          }}
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Talent Info */}
        {renderTalentInfo()}

        {/* Gig Title */}
        <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
          {gig.title}
        </h3>

        {/* Rating and Stats */}
        <div className="flex items-center justify-between">
          {renderRating()}
          <div className="flex items-center gap-1 text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm">{gig._count.bookings}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Starting at</span>
          <span className="text-xl font-bold">
            {formatPrice(gig.startingPrice, gig.currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}