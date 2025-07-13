'use client';

/**
 * Job Details Page Component
 * 
 * Public page for viewing job posting details and applying
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BriefcaseIcon, 
  CalendarIcon, 
  DollarSignIcon, 
  MapPinIcon, 
  ClockIcon,
  UsersIcon,
  StarIcon,
  ShareIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  BuildingIcon,
  BadgeCheckIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import JobApplicationForm from './JobApplicationForm';

interface JobPosting {
  id: number;
  uuid: string;
  title: string;
  description: string;
  category: string;
  type: string;
  companyName?: string;
  verified: boolean;
  postedBy: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  requirements: {
    skills?: string[];
    experience?: string;
    languages?: string[];
    certifications?: string[];
  };
  targetProfiles: {
    categories: string[];
    gender?: string[];
    ageRange?: {
      min?: number;
      max?: number;
    };
    location?: {
      city?: string;
      radius?: number;
      remote?: boolean;
    };
    experience?: string;
    specificRequirements?: Record<string, any>;
  };
  applicationDeadline: string;
  maxApplications?: number;
  autoCloseOnMax: boolean;
  applicationQuestions?: Array<{
    question: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect';
    required: boolean;
    options?: string[];
  }>;
  jobDates: {
    startDate: string;
    endDate?: string;
    duration?: string;
    flexible?: boolean;
  };
  compensation: {
    type: 'fixed' | 'hourly' | 'daily' | 'negotiable';
    amount?: number;
    currency?: string;
    description?: string;
  };
  visibility: 'public' | 'private' | 'unlisted';
  featured: boolean;
  status: 'draft' | 'published' | 'closed' | 'filled';
  publishedAt?: string;
  applicationsCount?: number;
  viewsCount?: number;
}

interface JobDetailsPageProps {
  jobPosting: JobPosting;
  onApply: (applicationData: any) => Promise<void>;
  onBookmark?: () => void;
  onShare?: () => void;
  onBack?: () => void;
  isApplying?: boolean;
  hasApplied?: boolean;
  className?: string;
}

export function JobDetailsPage({
  jobPosting,
  onApply,
  onBookmark,
  onShare,
  onBack,
  isApplying = false,
  hasApplied = false,
  className
}: JobDetailsPageProps) {
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);

  const handleApply = async (applicationData: any) => {
    await onApply(applicationData);
    setIsApplicationDialogOpen(false);
  };

  const formatCompensation = () => {
    const { type, amount, currency, description } = jobPosting.compensation;
    
    if (description) return description;
    if (amount) {
      return `${currency || '$'}${amount.toLocaleString()} ${type}`;
    }
    return 'Negotiable';
  };

  const isExpired = new Date(jobPosting.applicationDeadline) < new Date();
  const daysUntilDeadline = Math.ceil(
    (new Date(jobPosting.applicationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {onBookmark && (
            <Button variant="outline" size="sm" onClick={onBookmark}>
              <BookmarkIcon className="h-4 w-4" />
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <ShareIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={jobPosting.featured ? "default" : "secondary"}>
                      {jobPosting.category}
                    </Badge>
                    <Badge variant="outline">{jobPosting.type}</Badge>
                    {jobPosting.featured && (
                      <Badge variant="default" className="bg-yellow-500">
                        <StarIcon className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{jobPosting.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BuildingIcon className="h-4 w-4" />
                      {jobPosting.companyName || 'Company'}
                      {jobPosting.verified && (
                        <BadgeCheckIcon className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    {jobPosting.publishedAt && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        Posted {new Date(jobPosting.publishedAt).toLocaleDateString()}
                      </div>
                    )}
                    {jobPosting.viewsCount && (
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" />
                        {jobPosting.viewsCount} views
                      </div>
                    )}
                  </div>
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={jobPosting.postedBy.avatar} />
                  <AvatarFallback>
                    {jobPosting.postedBy.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardHeader>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {jobPosting.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {(jobPosting.requirements.skills?.length || 
            jobPosting.requirements.experience ||
            jobPosting.requirements.languages?.length) && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobPosting.requirements.experience && (
                  <div>
                    <h4 className="font-medium mb-2">Experience</h4>
                    <p className="text-sm text-muted-foreground">
                      {jobPosting.requirements.experience}
                    </p>
                  </div>
                )}
                
                {jobPosting.requirements.skills && jobPosting.requirements.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {jobPosting.requirements.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {jobPosting.requirements.languages && jobPosting.requirements.languages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {jobPosting.requirements.languages.map((language, index) => (
                        <Badge key={index} variant="outline">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {jobPosting.requirements.certifications && jobPosting.requirements.certifications.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {jobPosting.requirements.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Target Profiles */}
          <Card>
            <CardHeader>
              <CardTitle>Who We're Looking For</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Profile Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {jobPosting.targetProfiles.categories.map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {jobPosting.targetProfiles.ageRange && (
                <div>
                  <h4 className="font-medium mb-2">Age Range</h4>
                  <p className="text-sm text-muted-foreground">
                    {jobPosting.targetProfiles.ageRange.min && jobPosting.targetProfiles.ageRange.max
                      ? `${jobPosting.targetProfiles.ageRange.min} - ${jobPosting.targetProfiles.ageRange.max} years`
                      : jobPosting.targetProfiles.ageRange.min
                      ? `${jobPosting.targetProfiles.ageRange.min}+ years`
                      : `Up to ${jobPosting.targetProfiles.ageRange.max} years`
                    }
                  </p>
                </div>
              )}

              {jobPosting.targetProfiles.gender && jobPosting.targetProfiles.gender.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Gender</h4>
                  <div className="flex flex-wrap gap-2">
                    {jobPosting.targetProfiles.gender.map((gender, index) => (
                      <Badge key={index} variant="outline">
                        {gender}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {jobPosting.targetProfiles.location && (
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPinIcon className="h-4 w-4" />
                    {jobPosting.targetProfiles.location.remote 
                      ? 'Remote work available'
                      : jobPosting.targetProfiles.location.city
                    }
                    {jobPosting.targetProfiles.location.radius && 
                      ` (${jobPosting.targetProfiles.location.radius}km radius)`
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Card */}
          <Card>
            <CardHeader>
              <CardTitle>Apply for this Position</CardTitle>
              <CardDescription>
                {hasApplied 
                  ? 'You have already applied for this position'
                  : isExpired
                  ? 'Application deadline has passed'
                  : `${daysUntilDeadline} days left to apply`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasApplied ? (
                <Alert>
                  <AlertDescription>
                    Your application has been submitted. You'll be notified if the employer is interested.
                  </AlertDescription>
                </Alert>
              ) : isExpired ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    The application deadline for this position has passed.
                  </AlertDescription>
                </Alert>
              ) : (
                <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Apply for {jobPosting.title}</DialogTitle>
                    </DialogHeader>
                    <JobApplicationForm
                      jobPosting={jobPosting}
                      onSubmit={handleApply}
                      isLoading={isApplying}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Compensation</span>
                </div>
                <span className="text-sm">{formatCompensation()}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Start Date</span>
                </div>
                <span className="text-sm">
                  {new Date(jobPosting.jobDates.startDate).toLocaleDateString()}
                </span>
              </div>

              {jobPosting.jobDates.duration && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Duration</span>
                    </div>
                    <span className="text-sm">{jobPosting.jobDates.duration}</span>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Application Deadline</span>
                </div>
                <span className="text-sm">
                  {new Date(jobPosting.applicationDeadline).toLocaleDateString()}
                </span>
              </div>

              {jobPosting.maxApplications && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Applications</span>
                    </div>
                    <span className="text-sm">
                      {jobPosting.applicationsCount || 0} / {jobPosting.maxApplications}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>About the Employer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarImage src={jobPosting.postedBy.avatar} />
                  <AvatarFallback>
                    {jobPosting.postedBy.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{jobPosting.postedBy.name}</span>
                    {jobPosting.postedBy.verified && (
                      <BadgeCheckIcon className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  {jobPosting.companyName && (
                    <p className="text-sm text-muted-foreground">{jobPosting.companyName}</p>
                  )}
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default JobDetailsPage;