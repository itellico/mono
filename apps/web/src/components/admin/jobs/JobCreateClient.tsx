'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, DollarSign, MapPin, Users, Clock, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { PermissionGate } from '@/components/auth/PermissionGate';

// Validation schema based on API requirements
const jobCreateSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  category: z.string().min(1, 'Category is required'),
  type: z.string().min(1, 'Job type is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  companyName: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  
  // Requirements
  requirements: z.object({
    skills: z.array(z.string()).min(1, 'At least one skill is required'),
    experience: z.string().min(1, 'Experience level is required'),
    education: z.string().optional(),
    certifications: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    physicalRequirements: z.string().optional()
  }),

  // Target profiles
  targetProfiles: z.object({
    ageRange: z.object({
      min: z.number().min(16, 'Minimum age must be at least 16'),
      max: z.number().max(80, 'Maximum age cannot exceed 80')
    }).optional(),
    gender: z.enum(['any', 'male', 'female', 'non-binary']).default('any'),
    heightRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      unit: z.enum(['cm', 'ft']).default('cm')
    }).optional(),
    ethnicities: z.array(z.string()).optional(),
    bodyTypes: z.array(z.string()).optional()
  }),

  // Job details
  applicationDeadline: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Application deadline must be in the future'
  ),
  maxApplications: z.number().min(1).max(1000).optional(),
  autoCloseOnMax: z.boolean().default(false),

  // Compensation
  compensation: z.object({
    type: z.enum(['fixed', 'hourly', 'daily', 'project', 'negotiable']),
    currency: z.string().default('USD'),
    amount: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional(),
    benefits: z.array(z.string()).optional(),
    paymentTerms: z.string().optional()
  }),

  // Job dates and schedule
  jobDates: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isFlexible: z.boolean().default(false),
    timeCommitment: z.enum(['full-time', 'part-time', 'flexible', 'one-time']),
    schedule: z.string().optional()
  }),

  // Application questions
  applicationQuestions: z.array(z.object({
    question: z.string().min(1),
    type: z.enum(['text', 'textarea', 'select', 'multiselect', 'file']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional()
  })).optional(),

  // Visibility and promotion
  visibility: z.enum(['public', 'private', 'premium']).default('public'),
  featured: z.boolean().default(false),
  
  // Publication
  publishImmediately: z.boolean().default(false)
});

type JobCreateData = z.infer<typeof jobCreateSchema>;

interface JobCreateClientProps {
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

export function JobCreateClient({ userContext }: JobCreateClientProps) {
  const router = useRouter();
  const { trackFormSubmit, trackFormError } = useAuditTracking();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [skillInput, setSkillInput] = React.useState('');

  const form = useForm<JobCreateData>({
    resolver: zodResolver(jobCreateSchema),
    defaultValues: {
      category: '',
      type: '',
      requirements: {
        skills: [],
        experience: '',
        certifications: [],
        languages: []
      },
      targetProfiles: {
        gender: 'any',
        heightRange: {
          unit: 'cm'
        }
      },
      autoCloseOnMax: false,
      compensation: {
        type: 'negotiable',
        currency: 'USD'
      },
      jobDates: {
        isFlexible: false,
        timeCommitment: 'full-time'
      },
      visibility: 'public',
      featured: false,
      publishImmediately: false
    }
  });

  const { watch, setValue, getValues } = form;
  const watchedFields = watch();

  // Add skill handler
  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkills = [...skills, skillInput.trim()];
      setSkills(newSkills);
      setValue('requirements.skills', newSkills);
      setSkillInput('');
    }
  };

  // Remove skill handler
  const removeSkill = (skillToRemove: string) => {
    const newSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(newSkills);
    setValue('requirements.skills', newSkills);
  };

  // Form submission
  const onSubmit = async (data: JobCreateData) => {
    setIsSubmitting(true);
    
    try {
      browserLogger.userAction('job_create_attempt', 'User attempting to create job', {
        title: data.title,
        category: data.category,
        type: data.type,
        publishImmediately: data.publishImmediately
      });

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate API response
      const newJobId = 'job-' + Date.now();
      
      trackFormSubmit('job_create', {
        jobId: newJobId,
        category: data.category,
        type: data.type,
        compensation: data.compensation.type,
        visibility: data.visibility
      });

      toast.success(
        data.publishImmediately 
          ? 'Job posted successfully and is now live!'
          : 'Job saved as draft successfully!'
      );

      browserLogger.userAction('job_create_success', 'Job created successfully', {
        jobId: newJobId,
        title: data.title,
        status: data.publishImmediately ? 'published' : 'draft'
      });

      // Redirect to job list or edit page
      router.push('/admin/jobs');
      
    } catch (error: any) {
      trackFormError('job_create', error.message);
      
      browserLogger.error('job_create_failed', 'Failed to create job', {
        error: error.message,
        formData: data
      });

      toast.error('Failed to create job: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Create Job Posting</h1>
        <p className="text-muted-foreground">
          Create a comprehensive job posting to attract the right talent
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Job Information</span>
                </CardTitle>
                <CardDescription>
                  Provide basic details about the job posting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Senior Fashion Model"
                      {...form.register('title')}
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g. Elite Fashion Co."
                      {...form.register('companyName')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select onValueChange={(value) => setValue('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modeling">Modeling</SelectItem>
                        <SelectItem value="photography">Photography</SelectItem>
                        <SelectItem value="creative-direction">Creative Direction</SelectItem>
                        <SelectItem value="styling">Styling</SelectItem>
                        <SelectItem value="makeup-hair">Makeup & Hair</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.category && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Job Type *</Label>
                    <Select onValueChange={(value) => setValue('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.type && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.type.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g. New York, NY"
                      {...form.register('location')}
                    />
                    {form.formState.errors.location && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.location.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of the job, responsibilities, and what you're looking for..."
                    className="min-h-32"
                    {...form.register('description')}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Requirements & Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Requirements & Skills</span>
                </CardTitle>
                <CardDescription>
                  Define the skills and requirements for this position
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Required Skills *</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a skill and press Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button type="button" onClick={addSkill} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="cursor-pointer">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {form.formState.errors.requirements?.skills && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.requirements.skills.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience Level *</Label>
                    <Select onValueChange={(value) => setValue('requirements.experience', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level (0-1 years)</SelectItem>
                        <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                        <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                        <SelectItem value="senior">Senior (5+ years)</SelectItem>
                        <SelectItem value="expert">Expert (10+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.requirements?.experience && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.requirements.experience.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Select onValueChange={(value) => setValue('requirements.education', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific requirement</SelectItem>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="associate">Associate Degree</SelectItem>
                        <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="master">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Compensation</span>
                </CardTitle>
                <CardDescription>
                  Define the compensation structure for this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="compensationType">Compensation Type</Label>
                    <Select onValueChange={(value) => setValue('compensation.type', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                        <SelectItem value="daily">Daily Rate</SelectItem>
                        <SelectItem value="project">Project Based</SelectItem>
                        <SelectItem value="negotiable">Negotiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select onValueChange={(value) => setValue('compensation.currency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeCommitment">Time Commitment</Label>
                    <Select onValueChange={(value) => setValue('jobDates.timeCommitment', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select commitment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {watchedFields.compensation?.type !== 'negotiable' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minAmount">Minimum Amount</Label>
                      <Input
                        type="number"
                        id="minAmount"
                        placeholder="0"
                        onChange={(e) => setValue('compensation.amount.min', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxAmount">Maximum Amount</Label>
                      <Input
                        type="number"
                        id="maxAmount"
                        placeholder="0"
                        onChange={(e) => setValue('compensation.amount.max', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Application Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Application Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Application Deadline *</Label>
                  <Input
                    type="datetime-local"
                    id="deadline"
                    {...form.register('applicationDeadline')}
                  />
                  {form.formState.errors.applicationDeadline && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.applicationDeadline.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxApplications">Max Applications</Label>
                  <Input
                    type="number"
                    id="maxApplications"
                    placeholder="e.g. 50"
                    {...form.register('maxApplications', { valueAsNumber: true })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoClose"
                    onCheckedChange={(checked) => setValue('autoCloseOnMax', checked)}
                  />
                  <Label htmlFor="autoClose" className="text-sm">
                    Auto-close when max reached
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Visibility & Promotion */}
            <Card>
              <CardHeader>
                <CardTitle>Visibility & Promotion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select onValueChange={(value) => setValue('visibility', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <PermissionGate permissions={['jobs:feature']}>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      onCheckedChange={(checked) => setValue('featured', checked)}
                    />
                    <Label htmlFor="featured" className="text-sm">
                      Featured job posting
                    </Label>
                  </div>
                </PermissionGate>
              </CardContent>
            </Card>

            {/* Publication */}
            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="publishImmediately"
                    onCheckedChange={(checked) => setValue('publishImmediately', checked)}
                  />
                  <Label htmlFor="publishImmediately" className="text-sm">
                    Publish immediately
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  If disabled, job will be saved as draft
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <Separator />
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                setValue('publishImmediately', false);
                form.handleSubmit(onSubmit)();
              }}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setValue('publishImmediately', true)}
            >
              {isSubmitting ? 'Creating...' : 'Publish Job'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}