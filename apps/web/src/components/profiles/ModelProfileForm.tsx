'use client';

/**
 * Model Profile Form Component
 * 
 * Comprehensive form for creating and editing Model professional profiles
 * Uses schema-driven validation with Zod and React Hook Form
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileType } from '@prisma/client';
import { 
  CreateModelProfileSchema, 
  UpdateModelProfileSchema,
  type CreateModelProfile,
  type UpdateModelProfile,
  type ModelIndustryData
} from '@/lib/schemas/professional-profiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

interface ModelProfileFormProps {
  initialData?: UpdateModelProfile;
  isEditing?: boolean;
  onSubmit: (data: CreateModelProfile | UpdateModelProfile) => Promise<void>;
  onCancel?: () => void;
  tenantId: number;
  userId: number;
}

const measurementUnits = [
  { value: 'cm', label: 'Centimeters' },
  { value: 'ft', label: 'Feet/Inches' },
  { value: 'in', label: 'Inches' },
];

const hairColors = [
  'Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Gray', 'White', 
  'Platinum', 'Strawberry Blonde', 'Other'
];

const eyeColors = [
  'Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'
];

const skinTones = [
  'Very Fair', 'Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Dark', 'Deep'
];

const buildTypes = [
  'Petite', 'Slim', 'Athletic', 'Curvy', 'Plus Size', 'Muscular'
];

const campaignTypes = [
  'fashion', 'commercial', 'lifestyle', 'beauty', 'fitness', 
  'lingerie', 'swimwear', 'artistic', 'editorial', 'beauty'
];

const workTypes = [
  'fashion', 'commercial', 'lifestyle', 'beauty', 'fitness',
  'lingerie', 'swimwear', 'artistic', 'editorial', 'runway'
];

const unwillingToDoTypes = [
  'nudity', 'partial_nudity', 'lingerie', 'swimwear', 'fitness',
  'beauty', 'hair', 'hands', 'feet', 'jewelry'
];

export default function ModelProfileForm({
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
  tenantId,
  userId,
}: ModelProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(
    initialData?.completionPercentage || 0
  );

  const form = useForm<CreateModelProfile | UpdateModelProfile>({
    resolver: zodResolver(isEditing ? UpdateModelProfileSchema : CreateModelProfileSchema),
    defaultValues: {
      userId,
      tenantId,
      profileType: ProfileType.MODEL,
      professionalName: '',
      tagline: '',
      yearsExperience: 0,
      specialties: [],
      professionalEmail: '',
      professionalPhone: '',
      websiteUrl: '',
      socialMedia: {},
      baseLocation: '',
      travelRadius: 50,
      travelInternationally: false,
      availableLocations: [],
      rateStructure: {},
      currency: 'USD',
      rateNegotiable: true,
      availabilityType: 'FLEXIBLE',
      availabilityCalendar: {},
      keywords: [],
      featured: false,
      industryData: {
        measurements: {},
        physicalAttributes: {},
        experience: {
          campaignTypes: [],
          notableClients: [],
          publications: [],
          awards: [],
        },
        preferences: {
          workTypes: [],
          unwillingToDo: [],
          travelAvailable: true,
          overnightShoots: true,
          weekendAvailable: true,
          eveningAvailable: true,
          shortNotice: false,
        },
        representation: {
          hasAgent: false,
          exclusiveRepresentation: false,
        },
        portfolio: {
          portfolioTypes: [],
          totalImages: 0,
          featuredImages: [],
        },
      },
      ...initialData,
    },
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedData = watch();

  const handleFormSubmit = async (data: CreateModelProfile | UpdateModelProfile) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: `Model profile ${isEditing ? 'updated' : 'created'} successfully!`,
      });
    } catch (error) {
      console.error('Error submitting model profile:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} model profile. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArrayValue = (array: string[], value: string, onChange: (newArray: string[]) => void) => {
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
    onChange(newArray);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Model Profile' : 'Create Model Profile'}
            </h1>
            <p className="text-muted-foreground">
              Complete your professional modeling profile to attract clients
            </p>
          </div>
          {completionPercentage > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium mb-1">Profile Completion</div>
              <Progress value={completionPercentage} className="w-32" />
              <div className="text-xs text-muted-foreground mt-1">
                {completionPercentage}% Complete
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>
                  Your professional identity and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="professionalName">Professional Name *</Label>
                    <Controller
                      name="professionalName"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="professionalName"
                          placeholder="Your professional modeling name"
                          error={errors.professionalName?.message}
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="yearsExperience">Years of Experience</Label>
                    <Controller
                      name="yearsExperience"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          max="50"
                          id="yearsExperience"
                          placeholder="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tagline">Professional Tagline</Label>
                  <Controller
                    name="tagline"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="tagline"
                        placeholder="Brief description of your modeling style or specialty"
                        maxLength={500}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="professionalEmail">Professional Email</Label>
                    <Controller
                      name="professionalEmail"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="email"
                          id="professionalEmail"
                          placeholder="your@email.com"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="professionalPhone">Professional Phone</Label>
                    <Controller
                      name="professionalPhone"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="professionalPhone"
                          placeholder="+1234567890"
                        />
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="baseLocation">Base Location</Label>
                  <Controller
                    name="baseLocation"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="baseLocation"
                        placeholder="City, State/Country"
                      />
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Portfolio Website</Label>
                  <Controller
                    name="websiteUrl"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="url"
                        id="websiteUrl"
                        placeholder="https://your-portfolio.com"
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="measurements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Physical Measurements</CardTitle>
                <CardDescription>
                  Accurate measurements help clients find the right fit for their projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Height</Label>
                    <div className="flex gap-2">
                      <Controller
                        name="industryData.measurements.height.value"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            placeholder="170"
                            min="100"
                            max="250"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        )}
                      />
                      <Controller
                        name="industryData.measurements.height.unit"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cm">cm</SelectItem>
                              <SelectItem value="ft">ft</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Weight (Optional)</Label>
                    <div className="flex gap-2">
                      <Controller
                        name="industryData.measurements.weight.value"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            placeholder="60"
                            min="30"
                            max="200"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        )}
                      />
                      <Controller
                        name="industryData.measurements.weight.unit"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="lbs">lbs</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold">Physical Attributes</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Hair Color</Label>
                      <Controller
                        name="industryData.physicalAttributes.hairColor"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select hair color" />
                            </SelectTrigger>
                            <SelectContent>
                              {hairColors.map((color) => (
                                <SelectItem key={color} value={color}>
                                  {color}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div>
                      <Label>Eye Color</Label>
                      <Controller
                        name="industryData.physicalAttributes.eyeColor"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select eye color" />
                            </SelectTrigger>
                            <SelectContent>
                              {eyeColors.map((color) => (
                                <SelectItem key={color} value={color}>
                                  {color}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div>
                      <Label>Skin Tone</Label>
                      <Controller
                        name="industryData.physicalAttributes.skinTone"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select skin tone" />
                            </SelectTrigger>
                            <SelectContent>
                              {skinTones.map((tone) => (
                                <SelectItem key={tone} value={tone}>
                                  {tone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div>
                      <Label>Build Type</Label>
                      <Controller
                        name="industryData.physicalAttributes.build"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select build type" />
                            </SelectTrigger>
                            <SelectContent>
                              {buildTypes.map((build) => (
                                <SelectItem key={build} value={build}>
                                  {build}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="industryData.physicalAttributes.tattoos"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="tattoos"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="tattoos">Has Tattoos</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="industryData.physicalAttributes.piercings"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="piercings"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="piercings">Has Piercings</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="industryData.physicalAttributes.scars"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="scars"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="scars">Has Scars</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Modeling Experience</CardTitle>
                <CardDescription>
                  Showcase your modeling background and achievements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Campaign Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {campaignTypes.map((type) => (
                      <Badge
                        key={type}
                        variant={watchedData.industryData?.experience?.campaignTypes?.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentTypes = watchedData.industryData?.experience?.campaignTypes || [];
                          const newTypes = currentTypes.includes(type)
                            ? currentTypes.filter(t => t !== type)
                            : [...currentTypes, type];
                          setValue('industryData.experience.campaignTypes', newTypes);
                        }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="industryData.experience.runwayExperience"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="runway"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="runway">Runway Experience</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="industryData.experience.printExperience"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="print"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="print">Print Experience</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="industryData.experience.commercialExperience"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="commercial"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="commercial">Commercial Experience</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="industryData.experience.editorialExperience"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="editorial"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="editorial">Editorial Experience</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="modelingSince">Modeling Since (Year)</Label>
                  <Controller
                    name="industryData.experience.modelingSince"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="modelingSince"
                        placeholder="2020"
                        pattern="[0-9]{4}"
                        maxLength={4}
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Preferences</CardTitle>
                <CardDescription>
                  Specify your availability and work preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Preferred Work Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {workTypes.map((type) => (
                      <Badge
                        key={type}
                        variant={watchedData.industryData?.preferences?.workTypes?.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentTypes = watchedData.industryData?.preferences?.workTypes || [];
                          const newTypes = currentTypes.includes(type)
                            ? currentTypes.filter(t => t !== type)
                            : [...currentTypes, type];
                          setValue('industryData.preferences.workTypes', newTypes);
                        }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Not Willing To Do</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {unwillingToDoTypes.map((type) => (
                      <Badge
                        key={type}
                        variant={watchedData.industryData?.preferences?.unwillingToDo?.includes(type) ? "destructive" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentTypes = watchedData.industryData?.preferences?.unwillingToDo || [];
                          const newTypes = currentTypes.includes(type)
                            ? currentTypes.filter(t => t !== type)
                            : [...currentTypes, type];
                          setValue('industryData.preferences.unwillingToDo', newTypes);
                        }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="industryData.preferences.travelAvailable"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="travel"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="travel">Available for Travel</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="industryData.preferences.overnightShoots"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="overnight"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="overnight">Overnight Shoots</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="industryData.preferences.weekendAvailable"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="weekend"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="weekend">Weekend Available</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="industryData.preferences.shortNotice"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="shortNotice"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="shortNotice">Short Notice Available</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rates & Business</CardTitle>
                <CardDescription>
                  Set your rates and business preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="AUD">AUD</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="rateNegotiable"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="negotiable"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="negotiable">Rates Negotiable</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="travelRadius">Travel Radius (miles)</Label>
                  <Controller
                    name="travelRadius"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        id="travelRadius"
                        min="0"
                        max="10000"
                        placeholder="50"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="travelInternationally"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="international"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="international">Available for International Travel</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-6 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Profile' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}