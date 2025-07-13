'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Heart, 
  Building2, 
  Wrench, 
  Crown,
  Lock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useSubscriptionFeatures } from '@/lib/hooks/useSubscriptionFeatures';
import { FeatureAccessGate } from '@/components/subscriptions/FeatureAccessGate';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfileType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'talent' | 'professional' | 'service' | 'agency';
  requiredFeature: string;
  requiredPlan: 'free' | 'pro' | 'enterprise';
  schemaId?: number;
  isPopular?: boolean;
  marketplaceSide: 'supply' | 'demand';
}

interface ProfileTypeSelectorProps {
  onProfileTypeSelect: (profileType: ProfileType) => void;
  selectedType?: string;
  tenantId: number;
  currentUserId: number;
}

/**
 * ProfileTypeSelector component for choosing profile types based on subscription features
 * @component
 * @param {ProfileTypeSelectorProps} props - Component props
 * @example
 * <ProfileTypeSelector
 *   onProfileTypeSelect={(type) => console.log('Selected:', type)}
 *   tenantId={1}
 *   currentUserId={123}
 * />
 */
export function ProfileTypeSelector({
  onProfileTypeSelect,
  selectedType,
  tenantId,
  currentUserId
}: ProfileTypeSelectorProps) {
  const { hasFeature, usage, currentPlan, isLoading } = useSubscriptionFeatures(tenantId, currentUserId);
  const [selectedCategory, setSelectedCategory] = useState<string>('talent');

  // Profile types with subscription feature requirements
  const profileTypes: ProfileType[] = [
    // Talent/Supply Side Profiles
    {
      id: 'human_model',
      name: 'Human Model',
      description: 'Professional modeling profiles for fashion, commercial, and editorial work',
      icon: User,
      category: 'talent',
      requiredFeature: 'basic_profiles',
      requiredPlan: 'free',
      schemaId: 1,
      isPopular: true,
      marketplaceSide: 'supply'
    },
    {
      id: 'animal_model',
      name: 'Animal Model',
      description: 'Pet and animal modeling profiles for commercial and advertising projects',
      icon: Heart,
      category: 'talent',
      requiredFeature: 'animal_profiles',
      requiredPlan: 'pro',
      schemaId: 2,
      marketplaceSide: 'supply'
    },
    {
      id: 'fitness_model',
      name: 'Fitness Model',
      description: 'Specialized fitness and athletic modeling profiles',
      icon: Crown,
      category: 'talent',
      requiredFeature: 'specialized_profiles',
      requiredPlan: 'pro',
      schemaId: 3,
      marketplaceSide: 'supply'
    },
    
    // Professional/Demand Side Profiles
    {
      id: 'photographer',
      name: 'Photographer',
      description: 'Professional photography services and portfolio showcase',
      icon: Building2,
      category: 'professional',
      requiredFeature: 'professional_profiles',
      requiredPlan: 'pro',
      schemaId: 4,
      marketplaceSide: 'demand'
    },
    {
      id: 'casting_director',
      name: 'Casting Director',
      description: 'Casting and talent acquisition professional profiles',
      icon: User,
      category: 'professional',
      requiredFeature: 'professional_profiles',
      requiredPlan: 'pro',
      schemaId: 5,
      marketplaceSide: 'demand'
    },
    
    // Agency Profiles
    {
      id: 'modeling_agency',
      name: 'Modeling Agency',
      description: 'Full-service modeling agency with talent management',
      icon: Building2,
      category: 'agency',
      requiredFeature: 'agency_profiles',
      requiredPlan: 'enterprise',
      schemaId: 6,
      marketplaceSide: 'demand'
    },
    
    // Service Profiles
    {
      id: 'makeup_artist',
      name: 'Makeup Artist',
      description: 'Professional makeup and styling services',
      icon: Wrench,
      category: 'service',
      requiredFeature: 'service_profiles',
      requiredPlan: 'pro',
      schemaId: 7,
      marketplaceSide: 'demand'
    }
  ];

  const categories = [
    { id: 'talent', name: 'Talent/Models', description: 'Individual talent and modeling profiles', side: 'supply' },
    { id: 'professional', name: 'Professionals', description: 'Industry professionals and service providers', side: 'demand' },
    { id: 'agency', name: 'Agencies', description: 'Modeling agencies and talent management', side: 'demand' },
    { id: 'service', name: 'Services', description: 'Specialized industry services', side: 'demand' }
  ];

  const filteredProfileTypes = profileTypes.filter(type => type.category === selectedCategory);

  const canCreateProfile = (profileType: ProfileType): boolean => {
    if (!hasFeature(profileType.requiredFeature)) {
      return false;
    }

    if (usage?.profiles && usage.profiles.current >= usage.profiles.limit) {
      return false;
    }

    return true;
  };

  const getProfileTypeStatus = (profileType: ProfileType): 'available' | 'locked' | 'limit_reached' => {
    if (!hasFeature(profileType.requiredFeature)) {
      return 'locked';
    }
    
    if (usage?.profiles && usage.profiles.current >= usage.profiles.limit) {
      return 'limit_reached';
    }

    return 'available';
  };

  const getUserSubscriptionData = () => ({
    plan: currentPlan?.tier || 'free' as 'free' | 'pro' | 'enterprise',
    features: currentPlan?.features || [],
    permissions: [], // Would come from user permissions in real implementation
    usage: usage ? {
      profiles: { current: usage.profiles.current, limit: usage.profiles.limit },
      accounts: { current: usage.accounts.current, limit: usage.accounts.limit },
      photos: { current: usage.photos.current, limit: usage.photos.limit },
      storage: { current: usage.storage.current, limit: usage.storage.limit },
      apiCalls: { current: usage.apiCalls.current, limit: usage.apiCalls.limit }
    } : {
      profiles: { current: 0, limit: 0 },
      accounts: { current: 0, limit: 0 },
      photos: { current: 0, limit: 0 },
      storage: { current: 0, limit: 0 },
      apiCalls: { current: 0, limit: 0 }
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Status Alert */}
      {usage?.profiles && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Profile Usage: {usage.profiles.current} / {usage.profiles.limit} profiles created
            {usage.profiles.current >= usage.profiles.limit && (
              <span className="text-destructive ml-2">
                • Limit reached - upgrade to create more profiles
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              {category.name}
              <Badge variant="outline" className="ml-1 text-xs">
                {category.side}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{category.name}</h3>
              <p className="text-muted-foreground text-sm">{category.description}</p>
              <Badge variant={category.side === 'supply' ? 'default' : 'secondary'}>
                {category.side === 'supply' ? 'Supply Side' : 'Demand Side'} Marketplace
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {filteredProfileTypes.map(profileType => {
                const status = getProfileTypeStatus(profileType);
                const isSelected = selectedType === profileType.id;

                return (
                  <FeatureAccessGate
                    key={profileType.id}
                    requirement={{
                      feature: profileType.requiredFeature,
                      requiredPlan: profileType.requiredPlan
                    }}
                    userSubscription={getUserSubscriptionData()}
                    fallback={
                      <Card className="relative opacity-50">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
                            <p className="text-sm font-medium">Upgrade Required</p>
                            <Button size="sm" variant="outline">
                              View Plans
                            </Button>
                          </div>
                        </div>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <profileType.icon className="h-6 w-6" />
                            <div>
                              <CardTitle className="text-base">{profileType.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {profileType.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    }
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      } ${status === 'limit_reached' ? 'opacity-50' : ''}`}
                      onClick={() => status === 'available' && onProfileTypeSelect(profileType)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <profileType.icon className="h-6 w-6" />
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {profileType.name}
                                {profileType.isPopular && (
                                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {profileType.description}
                              </CardDescription>
                            </div>
                          </div>
                          
                          {status === 'available' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {status === 'limit_reached' && (
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={profileType.marketplaceSide === 'supply' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {profileType.marketplaceSide === 'supply' ? 'Supply Side' : 'Demand Side'}
                          </Badge>
                          
                          {status === 'limit_reached' ? (
                            <Button size="sm" variant="outline" disabled>
                              Limit Reached
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant={isSelected ? 'default' : 'outline'}
                              disabled={status !== 'available'}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </FeatureAccessGate>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 
 
 