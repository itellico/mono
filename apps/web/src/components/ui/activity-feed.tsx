import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  /** Unique identifier for the activity */
  id: string;
  /** Name or title of the activity */
  name: string;
  /** Description of the activity */
  description: string;
  /** Avatar image URL */
  avatar?: string;
  /** Fallback text for avatar */
  avatarFallback: string;
  /** Time indicator (e.g., "2h ago") */
  time: string;
  /** Badge configuration */
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  /** Activity type for styling */
  type?: 'default' | 'success' | 'warning' | 'error';
}

export interface ActivityFeedProps {
  /** Title of the activity feed */
  title: string;
  /** Optional description */
  description?: string;
  /** Array of activity items */
  activities: ActivityItem[];
  /** Additional CSS classes */
  className?: string;
  /** Maximum number of activities to show */
  maxItems?: number;
}

/**
 * A reusable activity feed component for displaying recent activities
 * 
 * @component
 * @example
 * ```tsx
 * <ActivityFeed
 *   title="Recent Activity"
 *   description="Latest updates and changes"
 *   activities={[
 *     {
 *       id: '1',
 *       name: 'John Doe',
 *       description: 'Updated profile information',
 *       avatarFallback: 'JD',
 *       time: '2h ago',
 *       badge: { text: 'Updated', variant: 'secondary' }
 *     }
 *   ]}
 * />
 * ```
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title,
  description,
  activities,
  className,
  maxItems,
}) => {
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const getActivityTypeColor = (type?: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'error':
        return 'border-l-red-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedActivities.map((activity) => (
          <div 
            key={activity.id}
            className={cn(
              "flex items-center space-x-4 p-3 rounded-lg border-l-4 bg-muted/30",
              getActivityTypeColor(activity.type)
            )}
          >
            <Avatar>
              {activity.avatar && <AvatarImage src={activity.avatar} />}
              <AvatarFallback>{activity.avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.name}</p>
              <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              {activity.badge && (
                <Badge variant={activity.badge.variant || 'secondary'}>
                  {activity.badge.text}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 