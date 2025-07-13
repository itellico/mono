'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Camera, 
  MapPin, 
  Star, 
  Shield,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  Eye,
  Edit3
} from 'lucide-react';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { useGenerateFormFromSchema, useValidateFormSubmission } from '@/lib/hooks/useFormGeneration';
import { useSubscriptionFeatures } from '@/lib/hooks/useSubscriptionFeatures';
import { FeatureAccessGate } from '@/components/subscriptions/FeatureAccessGate';
import { browserLogger } from '@/lib/browser-logger';

interface ProfileFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  
  // Profile Details
  profileType: string;
  bio: string;
  specializations: string[];
  experience: string;
  
  // Location & Availability
  location: {
    city: string;
    state: string;
    country: string;
    willingToTravel: boolean;
    travelRadius: number;
  };
  
  // Industry-Specific Fields (dynamically generated)
  industryFields: Record<string, any>;
  
  // Media & Portfolio
  profileImage?: File;
  portfolioImages: File[];
  
  // Professional Information
  rates: {
    hourly?: number;
    daily?: number;
    project?: number;
    currency: string;
  };
  
  // Availability
  availability: {
    status: 'available' | 'busy' | 'unavailable';
    schedule: string[];
    notes: string;
  };
}

interface DynamicProfileFormProps {
  profileType: {
    id: string;
    name: string;
    schemaId: number;
    marketplaceSide: 'supply' | 'demand';
    requiredFeature: string;
  };
  initialData?: Partial<ProfileFormData>;
  onSubmit: (data: ProfileFormData) => void;
  onSaveDraft: (data: Partial<ProfileFormData>) => void;
  onPreview: (data: ProfileFormData) => void;
  tenantId: number;
  userId: number;
  isEditing?: boolean;
}

/**
 * DynamicProfileForm component for creating/editing profiles with schema-driven forms
 * @component
 * @param {DynamicProfileFormProps} props - Component props
 * @example
 * <DynamicProfileForm
 *   profileType={{
 *     id: 'human_model',
 *     name: 'Human Model',
 *     schemaId: 1,
 *     marketplaceSide: 'supply',
 *     requiredFeature: 'basic_profiles'
 *   }}
 *   onSubmit={(data) => console.log('Profile submitted:', data)}
 *   tenantId={1}
 *   userId={123}
 * />
 */
export function DynamicProfileForm({
  profileType,
  initialData = {},
  onSubmit,
  onSaveDraft,
  onPreview,
  tenantId,
  userId,
  isEditing = false
}: DynamicProfileFormProps) {
  const [formData, setFormData] = useState<Partial<ProfileFormData>>(initialData);
  const [currentTab, setCurrentTab] = useState('basic');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Hooks
  const { hasFeature, usage, currentPlan, isLoading: subscriptionLoading } = useSubscriptionFeatures(tenantId, userId);
  const { 
    data: formDefinition, 
    isLoading: formLoading,
    error: formError 
  } = useGenerateFormFromSchema(profileType.schemaId.toString(), tenantId, 'create');
  
  const { mutateAsync: validateFormData } = useValidateFormSubmission();

  // Form sections configuration
  const formSections = [
    {
      id: 'basic',
      name: 'Basic Information',
      icon: User,
      description: 'Personal details and contact information',
      required: true,
      fields: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth']
    },
    {
      id: 'profile',
      name: 'Profile Details',
      icon: Star,
      description: 'Professional information and specializations',
      required: true,
      fields: ['bio', 'specializations', 'experience']
    },
    {
      id: 'location',
      name: 'Location & Travel',
      icon: MapPin,
      description: 'Location preferences and travel availability',
      required: true,
      fields: ['location']
    },
    {
      id: 'industry',
      name: 'Industry Specific',
      icon: Shield,
      description: `${profileType.name} specific requirements`,
      required: true,
      fields: ['industryFields']
    },
    {
      id: 'media',
      name: 'Photos & Portfolio',
      icon: Camera,
      description: 'Profile image and portfolio showcase',
      required: false,
      requiredFeature: 'photo_uploads',
      fields: ['profileImage', 'portfolioImages']
    },
    {
      id: 'professional',
      name: 'Rates & Availability',
      icon: Edit3,
      description: 'Professional rates and availability status',
      required: false,
      requiredFeature: 'professional_rates',
      fields: ['rates', 'availability']
    }
  ];

  // Calculate completion percentage
  const getCompletionPercentage = (): number => {
    const requiredFields = formSections
      .filter(section => section.required || (section.requiredFeature && hasFeature(section.requiredFeature)))
      .flatMap(section => section.fields);
    
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof ProfileFormData];
      return value !== undefined && value !== null && value !== '';
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  // Handle form data change
  const handleFormDataChange = (sectionId: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId as keyof ProfileFormData], ...data }
    }));
    
    // Clear validation errors for changed fields
    const newErrors = { ...validationErrors };
    Object.keys(data).forEach(key => {
      delete newErrors[`${sectionId}.${key}`];
    });
    setValidationErrors(newErrors);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate form data
      const validation = await validateFormData({
        formId: profileType.schemaId.toString(),
        data: formData,
        tenantId
      });
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setCurrentTab(Object.keys(validation.errors)[0]?.split('.')[0] || 'basic');
        return;
      }

      // Log user action
      browserLogger.userAction('profile_submitted', {
        profileType: profileType.id,
        marketplaceSide: profileType.marketplaceSide,
        tenantId,
        isEditing
      });

      // Submit form
      await onSubmit(formData as ProfileFormData);
      
    } catch (error) {
      browserLogger.error('Profile submission failed', { error: error });
      setValidationErrors({ general: 'Failed to submit profile. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle draft save
  const handleSaveDraft = async () => {
    setIsDraft(true);
    
    try {
      browserLogger.userAction('profile_draft_saved', {
        profileType: profileType.id,
        completionPercentage: getCompletionPercentage(),
        tenantId
      });

      await onSaveDraft(formData);
    } catch (error) {
      browserLogger.error('Draft save failed', { error: error });
    } finally {
      setIsDraft(false);
    }
  };

  // Handle preview
  const handlePreview = () => {
    browserLogger.userAction('profile_previewed', {
      profileType: profileType.id,
      tenantId
    });
    
    onPreview(formData as ProfileFormData);
  };

  // Check if section is available based on subscription
  const isSectionAvailable = (section: typeof formSections[0]): boolean => {
    if (!section.requiredFeature) return true;
    return hasFeature(section.requiredFeature);
  };

  if (subscriptionLoading || formLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="space-y-6">
      {/* Profile Type Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isEditing ? 'Edit' : 'Create'} {profileType.name} Profile
                <Badge variant={profileType.marketplaceSide === 'supply' ? 'default' : 'secondary'}>
                  {profileType.marketplaceSide === 'supply' ? 'Supply Side' : 'Demand Side'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Complete your {profileType.name.toLowerCase()} profile to start connecting with opportunities
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={completionPercentage} className="w-full" />
        </CardHeader>
      </Card>

      {/* Usage Alert */}
      {usage?.profiles && usage.profiles.current >= usage.profiles.limit && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You&apos;ve reached your profile limit ({usage.profiles.limit} profiles). 
            Upgrade your plan to create additional profiles.
          </AlertDescription>
        </Alert>
      )}

      {/* General Errors */}
      {validationErrors.general && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validationErrors.general}</AlertDescription>
        </Alert>
      )}

      {/* Form Sections */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-6">
          {formSections.map(section => (
            <TabsTrigger 
              key={section.id} 
              value={section.id}
              className="text-xs"
              disabled={!isSectionAvailable(section)}
            >
              <section.icon className="h-4 w-4 mr-1" />
              {section.name}
              {section.required && <span className="text-red-500 ml-1">*</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        {formSections.map(section => (
          <TabsContent key={section.id} value={section.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="h-5 w-5" />
                  {section.name}
                  {section.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                {isSectionAvailable(section) ? (
                  <FormRenderer
                    schemaId={profileType.schemaId.toString()}
                    context="create"
                    initialData={formData[section.id as keyof ProfileFormData] as Record<string, any>}
                    onDataChange={(data: any) => handleFormDataChange(section.id, data)}
                    validationErrors={Object.fromEntries(
                      Object.entries(validationErrors)
                        .filter(([key]) => key.startsWith(`${section.id}.`))
                        .map(([key, value]) => [key.replace(`${section.id}.`, ''), value])
                    )}
                    tenantId={tenantId}
                    userId={userId}
                  />
                ) : (
                  <FeatureAccessGate
                    requirement={{
                      feature: section.requiredFeature!,
                      requiredPlan: 'pro'
                    }}
                    userSubscription={{
                      plan: currentPlan?.tier || 'free',
                      features: currentPlan?.features || [],
                      permissions: [],
                      usage: {}
                    }}
                    fallback={
                      <div className="text-center py-8 space-y-4">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <h3 className="text-lg font-semibold">Premium Feature</h3>
                          <p className="text-muted-foreground">
                            {section.name} is available with Pro and Enterprise plans
                          </p>
                        </div>
                        <Button variant="outline">
                          Upgrade Plan
                        </Button>
                      </div>
                    }
                  >
                    <FormRenderer
                      schemaId={profileType.schemaId.toString()}
                      context="create"
                      initialData={formData[section.id as keyof ProfileFormData] as Record<string, any>}
                      onDataChange={(data: any) => handleFormDataChange(section.id, data)}
                      tenantId={tenantId}
                      userId={userId}
                    />
                  </FeatureAccessGate>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isDraft}
              >
                {isDraft ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePreview}
                disabled={completionPercentage < 50}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            
            <div className="space-x-2">
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || completionPercentage < 80}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Profile' : 'Create Profile'}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {completionPercentage < 80 && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Complete at least 80% of the required fields to publish your profile.
                Current completion: {completionPercentage}%
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 