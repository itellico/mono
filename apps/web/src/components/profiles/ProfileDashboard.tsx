'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Eye, 
  Heart, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Star,
  MapPin,
  Camera,
  Edit3,
  Settings,
  BarChart3,
  Users,
  Award,
  Clock,
  DollarSign,
  Target
} from 'lucide-react';
import { useSubscriptionFeatures } from '@/lib/hooks/useSubscriptionFeatures';
import { FeatureAccessGate } from '@/components/subscriptions/FeatureAccessGate';
import { browserLogger } from '@/lib/browser-logger';
import { cn } from '@/lib/utils';

interface ProfileStats {
  profileViews: number;
  profileViewsChange: number;
  likes: number;
  likesChange: number;
  messages: number;
  messagesChange: number;
  applications: number;
  applicationsChange: number;
  bookings: number;
  bookingsChange: number;
  earnings: number;
  earningsChange: number;
}

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  profileType: string;
  profileImage?: string;
  status: 'active' | 'inactive' | 'pending';
  completionPercentage: number;
  marketplaceSide: 'supply' | 'demand';
  location: string;
  joinDate: string;
  lastActive: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  rating: number;
  reviewCount: number;
}

interface RecentActivity {
  id: string;
  type: 'view' | 'like' | 'message' | 'application' | 'booking';
  title: string;
  description: string;
  timestamp: string;
  avatar?: string;
  profileType?: string;
}

interface ProfileDashboardProps {
  profileId: number;
  tenantId: number;
  userId: number;
}

/**
 * ProfileDashboard component for displaying profile analytics and management
 * @component
 * @param {ProfileDashboardProps} props - Component props
 * @example
 * <ProfileDashboard
 *   profileId={123}
 *   tenantId={1}
 *   userId={456}
 * />
 */
export function ProfileDashboard({
  profileId,
  tenantId,
  userId
}: ProfileDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { hasFeature, currentPlan, usage } = useSubscriptionFeatures(tenantId, userId);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProfile({
          id: profileId,
          firstName: 'Sarah',
          lastName: 'Johnson',
          profileType: 'Human Model',
          profileImage: '/api/placeholder/400/400',
          status: 'active',
          completionPercentage: 92,
          marketplaceSide: 'supply',
          location: 'New York, NY',
          joinDate: '2024-01-15',
          lastActive: '2024-01-19',
          verificationStatus: 'verified',
          rating: 4.8,
          reviewCount: 24
        });

        setStats({
          profileViews: 1247,
          profileViewsChange: 12.5,
          likes: 89,
          likesChange: 8.2,
          messages: 34,
          messagesChange: -2.1,
          applications: 12,
          applicationsChange: 15.7,
          bookings: 8,
          bookingsChange: 33.3,
          earnings: 2450,
          earningsChange: 28.4
        });

        setRecentActivity([
          {
            id: '1',
            type: 'view',
            title: 'Profile Viewed',
            description: 'Fashion photographer viewed your profile',
            timestamp: '2 hours ago',
            avatar: '/api/placeholder/32/32',
            profileType: 'Photographer'
          },
          {
            id: '2',
            type: 'like',
            title: 'Profile Liked',
            description: 'Casting director liked your portfolio',
            timestamp: '4 hours ago',
            avatar: '/api/placeholder/32/32',
            profileType: 'Casting Director'
          },
          {
            id: '3',
            type: 'message',
            title: 'New Message',
            description: 'Modeling agency sent you a message',
            timestamp: '1 day ago',
            avatar: '/api/placeholder/32/32',
            profileType: 'Agency'
          },
          {
            id: '4',
            type: 'application',
            title: 'Job Application',
            description: 'Applied to Fashion Week Runway Show',
            timestamp: '2 days ago'
          },
          {
            id: '5',
            type: 'booking',
            title: 'Booking Confirmed',
            description: 'Commercial shoot booking confirmed',
            timestamp: '3 days ago'
          }
        ]);

        browserLogger.userAction('profile_dashboard_viewed', {
          profileId,
          tenantId,
          timeRange
        });

      } catch (error) {
        browserLogger.error('Failed to load profile dashboard', { error, profileId });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [profileId, tenantId, timeRange]);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'view': return Eye;
      case 'like': return Heart;
      case 'message': return MessageSquare;
      case 'application': return Target;
      case 'booking': return Calendar;
      default: return User;
    }
  };

  const getStatCard = (
    title: string,
    value: number,
    change: number,
    icon: React.ComponentType<any>,
    format: 'number' | 'currency' = 'number'
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format === 'currency' ? `$${value.toLocaleString()}` : value.toLocaleString()}
        </div>
        <p className={cn(
          "text-xs",
          change >= 0 ? "text-green-600" : "text-red-600"
        )}>
          {change >= 0 ? '+' : ''}{change}% from last period
        </p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Profile not found</h3>
            <p className="text-muted-foreground">The requested profile could not be loaded.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.profileImage} />
                <AvatarFallback>
                  {profile.firstName[0]}{profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={profile.marketplaceSide === 'supply' ? 'default' : 'secondary'}>
                    {profile.profileType}
                  </Badge>
                  <Badge variant={profile.verificationStatus === 'verified' ? 'default' : 'secondary'}>
                    {profile.verificationStatus === 'verified' ? '✓ Verified' : 'Unverified'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{profile.rating}</span>
                    <span className="text-sm text-muted-foreground">({profile.reviewCount})</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Active {profile.lastActive}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-2">Profile Completion</div>
              <div className="flex items-center gap-2">
                <Progress value={profile.completionPercentage} className="w-24" />
                <span className="text-sm font-medium">{profile.completionPercentage}%</span>
              </div>
              <Button className="mt-3" size="sm">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard Analytics</h2>
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 days' },
            { value: '30d', label: '30 days' },
            { value: '90d', label: '90 days' }
          ].map(option => (
            <Button
              key={option.value}
              variant={timeRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(option.value as any)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <FeatureAccessGate
        requirement={{
          feature: 'analytics_basic',
          requiredPlan: 'pro'
        }}
        userSubscription={{
          plan: currentPlan?.tier || 'free',
          features: currentPlan?.features || [],
          permissions: [],
          usage: {}
        }}
        fallback={
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 space-y-4">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Analytics Premium Feature</h3>
                  <p className="text-muted-foreground">
                    Upgrade to Pro to access detailed analytics and insights
                  </p>
                </div>
                <Button variant="outline">
                  Upgrade to Pro
                </Button>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats && (
            <>
              {getStatCard('Profile Views', stats.profileViews, stats.profileViewsChange, Eye)}
              {getStatCard('Likes', stats.likes, stats.likesChange, Heart)}
              {getStatCard('Messages', stats.messages, stats.messagesChange, MessageSquare)}
              {getStatCard('Applications', stats.applications, stats.applicationsChange, Target)}
              {getStatCard('Bookings', stats.bookings, stats.bookingsChange, Calendar)}
              {getStatCard('Earnings', stats.earnings, stats.earningsChange, DollarSign, 'currency')}
            </>
          )}
        </div>
      </FeatureAccessGate>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Status */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Status</CardTitle>
                <CardDescription>Current profile performance and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Profile Completion</span>
                  <span className="text-sm font-medium">{profile.completionPercentage}%</span>
                </div>
                <Progress value={profile.completionPercentage} />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">Active</Badge>
                    <span className="text-sm">Profile is visible to employers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">Verified</Badge>
                    <span className="text-sm">Identity verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your profile and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile Information
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="h-4 w-4 mr-2" />
                  Update Portfolio Images
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Privacy & Visibility Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  Verification & Badges
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest profile interactions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map(activity => {
                  const IconComponent = getActivityIcon(activity.type);
                  
                  return (
                    <div key={activity.id} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {activity.avatar ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activity.avatar} />
                            <AvatarFallback>
                              <IconComponent className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <IconComponent className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.timestamp}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <FeatureAccessGate
            requirement={{
              feature: 'advanced_analytics',
              requiredPlan: 'pro'
            }}
            userSubscription={{
              plan: currentPlan?.tier || 'free',
              features: currentPlan?.features || [],
              permissions: [],
              usage: {}
            }}
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 space-y-4">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">Advanced Performance Analytics</h3>
                      <p className="text-muted-foreground">
                        Upgrade to Pro for detailed performance metrics and trends
                      </p>
                    </div>
                    <Button variant="outline">
                      Upgrade to Pro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed analytics coming soon...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Advanced performance charts and metrics will be displayed here
                </div>
              </CardContent>
            </Card>
          </FeatureAccessGate>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Insights</CardTitle>
              <CardDescription>Recommendations to improve your profile performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Profile views increased 12% this month
                    </p>
                    <p className="text-sm text-blue-700">
                      Your recent portfolio updates are attracting more attention
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <Users className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Add more portfolio diversity
                    </p>
                    <p className="text-sm text-green-700">
                      Profiles with 8+ images get 40% more engagement
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      Update availability status
                    </p>
                    <p className="text-sm text-yellow-700">
                      Keep your availability current to receive more opportunities
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
 
 