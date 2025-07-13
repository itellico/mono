'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Briefcase,
  Calendar as CalendarIcon,
  DollarSign,
  MapPin,
  Users,
  FileText,
  Image,
  Target,
  Send,
  Save,
  Eye,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  Upload,
  Building,
  Globe,
  Clock,
  Shield,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Info,
  Star,
  Zap,
  TrendingUp,
  Camera,
  Video,
  Music,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface JobPostingBuilderProps {
  /**
   * Initial job data for editing
   */
  initialData?: Partial<JobPosting>;
  /**
   * Whether in edit mode
   * @default false
   */
  editMode?: boolean;
  /**
   * Available job categories
   */
  categories?: JobCategory[];
  /**
   * Current user's company info
   */
  companyInfo?: CompanyInfo;
  /**
   * Whether to show pricing calculator
   * @default true
   */
  showPricingCalculator?: boolean;
  /**
   * Whether to enable auto-save
   * @default true
   */
  enableAutoSave?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when job is published
   */
  onPublish?: (job: JobPosting) => Promise<void>;
  /**
   * Callback when job is saved as draft
   */
  onSaveDraft?: (job: Partial<JobPosting>) => Promise<void>;
  /**
   * Callback for preview
   */
  onPreview?: (job: Partial<JobPosting>) => void;
}

interface JobPosting {
  id?: string;
  title: string;
  category: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  targetProfiles: {
    categories: string[];
    gender: string[];
    ageRange: { min: number; max: number };
    location: {
      city: string;
      radius: number;
      remote: boolean;
    };
    experience: string;
    specificRequirements: Record<string, any>;
  };
  compensation: {
    type: 'hourly' | 'fixed' | 'negotiable' | 'tfp';
    amount?: number;
    currency?: string;
    details?: string;
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    duration?: string;
    flexibility: 'strict' | 'flexible' | 'negotiable';
  };
  location: {
    type: 'onsite' | 'remote' | 'hybrid';
    address?: string;
    city: string;
    country: string;
    details?: string;
  };
  applicationDeadline: Date;
  questions: CustomQuestion[];
  visibility: 'public' | 'private' | 'invited';
  boosting?: {
    featured: boolean;
    highlighted: boolean;
    priority: boolean;
  };
  status: 'draft' | 'published' | 'closed' | 'filled';
}

interface JobCategory {
  id: string;
  name: string;
  icon?: React.ReactNode;
  subcategories?: string[];
}

interface CompanyInfo {
  id: string;
  name: string;
  logo?: string;
  verified: boolean;
  industry: string;
}

interface CustomQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'file';
  required: boolean;
  options?: string[];
}

const jobCategories: JobCategory[] = [
  { id: 'modeling', name: 'Modeling', icon: <Camera className="h-4 w-4" />, subcategories: ['Fashion', 'Commercial', 'Editorial', 'Runway'] },
  { id: 'photography', name: 'Photography', icon: <Camera className="h-4 w-4" />, subcategories: ['Fashion', 'Product', 'Portrait', 'Event'] },
  { id: 'videography', name: 'Videography', icon: <Video className="h-4 w-4" />, subcategories: ['Commercial', 'Music Video', 'Documentary', 'Social Media'] },
  { id: 'music', name: 'Music & Audio', icon: <Music className="h-4 w-4" />, subcategories: ['Recording', 'Live Performance', 'Production', 'Mixing'] },
  { id: 'creative', name: 'Creative Services', icon: <Palette className="h-4 w-4" />, subcategories: ['Graphic Design', 'Styling', 'Makeup', 'Hair'] }
];

const steps = [
  { id: 'basics', label: 'Basic Info', icon: <FileText className="h-4 w-4" /> },
  { id: 'details', label: 'Job Details', icon: <Briefcase className="h-4 w-4" /> },
  { id: 'requirements', label: 'Requirements', icon: <Target className="h-4 w-4" /> },
  { id: 'compensation', label: 'Compensation', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'application', label: 'Application', icon: <Users className="h-4 w-4" /> },
  { id: 'review', label: 'Review', icon: <Eye className="h-4 w-4" /> }
];

export function JobPostingBuilder({
  initialData,
  editMode = false,
  categories = jobCategories,
  companyInfo,
  showPricingCalculator = true,
  enableAutoSave = true,
  className,
  onPublish,
  onSaveDraft,
  onPreview
}: JobPostingBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [jobData, setJobData] = useState<Partial<JobPosting>>(initialData || {
    targetProfiles: {
      categories: [],
      gender: [],
      ageRange: { min: 18, max: 65 },
      location: { city: '', radius: 50, remote: false },
      experience: 'entry',
      specificRequirements: {}
    },
    requirements: [],
    responsibilities: [],
    questions: [],
    compensation: { type: 'negotiable' },
    schedule: { flexibility: 'flexible' },
    location: { type: 'onsite' },
    visibility: 'public'
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  const handleAutoSave = useCallback(() => {
    if (enableAutoSave && onSaveDraft) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      const timer = setTimeout(() => {
        onSaveDraft(jobData);
        toast.success('Draft saved automatically');
      }, 2000);
      setAutoSaveTimer(timer);
    }
  }, [jobData, enableAutoSave, onSaveDraft, autoSaveTimer]);

  // Update job data and trigger auto-save
  const updateJobData = (updates: Partial<JobPosting>) => {
    setJobData(prev => ({ ...prev, ...updates }));
    handleAutoSave();
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!jobData.title) errors.title = 'Title is required';
        if (!jobData.category) errors.category = 'Category is required';
        if (!jobData.type) errors.type = 'Job type is required';
        break;
      case 1: // Job Details
        if (!jobData.description) errors.description = 'Description is required';
        if (jobData.requirements?.length === 0) errors.requirements = 'At least one requirement is needed';
        break;
      case 2: // Requirements
        if (jobData.targetProfiles?.categories.length === 0) errors.targetCategories = 'Select target profiles';
        if (!jobData.targetProfiles?.location.city) errors.location = 'Location is required';
        break;
      case 3: // Compensation
        if (jobData.compensation?.type === 'fixed' || jobData.compensation?.type === 'hourly') {
          if (!jobData.compensation.amount) errors.amount = 'Amount is required';
        }
        break;
      case 4: // Application
        if (!jobData.applicationDeadline) errors.deadline = 'Application deadline is required';
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle step navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error('Please complete all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Handle publish
  const handlePublish = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish?.(jobData as JobPosting);
      toast.success('Job posted successfully!');
    } catch (error) {
      toast.error('Failed to publish job');
    } finally {
      setIsPublishing(false);
    }
  };

  // Add requirement
  const addRequirement = () => {
    const newReq = (document.getElementById('new-requirement') as HTMLInputElement)?.value;
    if (newReq) {
      updateJobData({
        requirements: [...(jobData.requirements || []), newReq]
      });
      (document.getElementById('new-requirement') as HTMLInputElement).value = '';
    }
  };

  // Add custom question
  const addQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: Date.now().toString(),
      question: '',
      type: 'text',
      required: false
    };
    updateJobData({
      questions: [...(jobData.questions || []), newQuestion]
    });
  };

  // Step content components
  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Job Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Fashion Model for Summer Campaign"
          value={jobData.title || ''}
          onChange={(e) => updateJobData({ title: e.target.value })}
          className={validationErrors.title ? 'border-destructive' : ''}
        />
        {validationErrors.title && (
          <p className="text-sm text-destructive mt-1">{validationErrors.title}</p>
        )}
      </div>

      <div>
        <Label>Category *</Label>
        <RadioGroup
          value={jobData.category || ''}
          onValueChange={(value) => updateJobData({ category: value })}
        >
          <div className="grid grid-cols-2 gap-4 mt-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className={cn(
                  "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent",
                  jobData.category === cat.id && "border-primary bg-accent"
                )}
              >
                <RadioGroupItem value={cat.id} />
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <span>{cat.name}</span>
                </div>
              </label>
            ))}
          </div>
        </RadioGroup>
        {validationErrors.category && (
          <p className="text-sm text-destructive mt-1">{validationErrors.category}</p>
        )}
      </div>

      {jobData.category && (
        <div>
          <Label htmlFor="type">Job Type *</Label>
          <Select
            value={jobData.type || ''}
            onValueChange={(value) => updateJobData({ type: value })}
          >
            <SelectTrigger className={validationErrors.type ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              {categories.find(c => c.id === jobData.category)?.subcategories?.map((sub) => (
                <SelectItem key={sub} value={sub.toLowerCase().replace(' ', '_')}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.type && (
            <p className="text-sm text-destructive mt-1">{validationErrors.type}</p>
          )}
        </div>
      )}
    </div>
  );

  const renderJobDetails = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="description">Job Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the job, project details, and what you're looking for..."
          rows={8}
          value={jobData.description || ''}
          onChange={(e) => updateJobData({ description: e.target.value })}
          className={validationErrors.description ? 'border-destructive' : ''}
        />
        {validationErrors.description && (
          <p className="text-sm text-destructive mt-1">{validationErrors.description}</p>
        )}
      </div>

      <div>
        <Label>Requirements *</Label>
        <div className="space-y-2 mt-2">
          {jobData.requirements?.map((req, index) => (
            <div key={index} className="flex items-center gap-2">
              <Badge variant="secondary" className="flex-1 justify-between">
                {req}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateJobData({
                      requirements: jobData.requirements?.filter((_, i) => i !== index)
                    });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              id="new-requirement"
              placeholder="Add a requirement..."
              onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
            />
            <Button onClick={addRequirement} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {validationErrors.requirements && (
          <p className="text-sm text-destructive mt-1">{validationErrors.requirements}</p>
        )}
      </div>

      <div>
        <Label>Schedule</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="start-date" className="text-sm">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {jobData.schedule?.startDate ? format(jobData.schedule.startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={jobData.schedule?.startDate}
                  onSelect={(date) => updateJobData({
                    schedule: { ...jobData.schedule, startDate: date || new Date() }
                  })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="duration" className="text-sm">Duration</Label>
            <Input
              id="duration"
              placeholder="e.g., 3 days, 1 week"
              value={jobData.schedule?.duration || ''}
              onChange={(e) => updateJobData({
                schedule: { ...jobData.schedule, duration: e.target.value }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRequirements = () => (
    <div className="space-y-6">
      <div>
        <Label>Target Profiles *</Label>
        <div className="space-y-2 mt-2">
          {['Model', 'Photographer', 'Videographer', 'Stylist', 'Makeup Artist'].map((profile) => (
            <label key={profile} className="flex items-center space-x-2">
              <Checkbox
                checked={jobData.targetProfiles?.categories.includes(profile)}
                onCheckedChange={(checked) => {
                  const categories = jobData.targetProfiles?.categories || [];
                  updateJobData({
                    targetProfiles: {
                      ...jobData.targetProfiles,
                      categories: checked
                        ? [...categories, profile]
                        : categories.filter(c => c !== profile)
                    }
                  });
                }}
              />
              <span>{profile}</span>
            </label>
          ))}
        </div>
        {validationErrors.targetCategories && (
          <p className="text-sm text-destructive mt-1">{validationErrors.targetCategories}</p>
        )}
      </div>

      <div>
        <Label>Gender Preference</Label>
        <div className="space-y-2 mt-2">
          {['Male', 'Female', 'Non-binary', 'No preference'].map((gender) => (
            <label key={gender} className="flex items-center space-x-2">
              <Checkbox
                checked={jobData.targetProfiles?.gender.includes(gender)}
                onCheckedChange={(checked) => {
                  const genders = jobData.targetProfiles?.gender || [];
                  updateJobData({
                    targetProfiles: {
                      ...jobData.targetProfiles,
                      gender: checked
                        ? [...genders, gender]
                        : genders.filter(g => g !== gender)
                    }
                  });
                }}
              />
              <span>{gender}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Age Range</Label>
        <div className="flex items-center gap-4 mt-2">
          <Input
            type="number"
            placeholder="Min"
            value={jobData.targetProfiles?.ageRange.min || 18}
            onChange={(e) => updateJobData({
              targetProfiles: {
                ...jobData.targetProfiles,
                ageRange: {
                  ...jobData.targetProfiles?.ageRange,
                  min: parseInt(e.target.value)
                }
              }
            })}
            className="w-24"
          />
          <span>to</span>
          <Input
            type="number"
            placeholder="Max"
            value={jobData.targetProfiles?.ageRange.max || 65}
            onChange={(e) => updateJobData({
              targetProfiles: {
                ...jobData.targetProfiles,
                ageRange: {
                  ...jobData.targetProfiles?.ageRange,
                  max: parseInt(e.target.value)
                }
              }
            })}
            className="w-24"
          />
        </div>
      </div>

      <div>
        <Label>Location *</Label>
        <div className="space-y-4 mt-2">
          <Input
            placeholder="City"
            value={jobData.targetProfiles?.location.city || ''}
            onChange={(e) => updateJobData({
              targetProfiles: {
                ...jobData.targetProfiles,
                location: {
                  ...jobData.targetProfiles?.location,
                  city: e.target.value
                }
              }
            })}
            className={validationErrors.location ? 'border-destructive' : ''}
          />
          <div className="flex items-center justify-between">
            <Label htmlFor="remote-allowed" className="text-sm">Allow remote applications</Label>
            <Switch
              id="remote-allowed"
              checked={jobData.targetProfiles?.location.remote || false}
              onCheckedChange={(checked) => updateJobData({
                targetProfiles: {
                  ...jobData.targetProfiles,
                  location: {
                    ...jobData.targetProfiles?.location,
                    remote: checked
                  }
                }
              })}
            />
          </div>
        </div>
        {validationErrors.location && (
          <p className="text-sm text-destructive mt-1">{validationErrors.location}</p>
        )}
      </div>
    </div>
  );

  const renderCompensation = () => (
    <div className="space-y-6">
      <div>
        <Label>Compensation Type *</Label>
        <RadioGroup
          value={jobData.compensation?.type || 'negotiable'}
          onValueChange={(value) => updateJobData({
            compensation: { ...jobData.compensation, type: value as any }
          })}
        >
          <div className="space-y-2 mt-2">
            <label className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="hourly" />
              <div className="flex-1">
                <div className="font-medium">Hourly Rate</div>
                <div className="text-sm text-muted-foreground">Pay by the hour</div>
              </div>
            </label>
            <label className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="fixed" />
              <div className="flex-1">
                <div className="font-medium">Fixed Price</div>
                <div className="text-sm text-muted-foreground">One-time payment for the project</div>
              </div>
            </label>
            <label className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="negotiable" />
              <div className="flex-1">
                <div className="font-medium">Negotiable</div>
                <div className="text-sm text-muted-foreground">Discuss with candidates</div>
              </div>
            </label>
            <label className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="tfp" />
              <div className="flex-1">
                <div className="font-medium">TFP (Time for Print)</div>
                <div className="text-sm text-muted-foreground">Exchange time for photos/content</div>
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>

      {(jobData.compensation?.type === 'hourly' || jobData.compensation?.type === 'fixed') && (
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <div className="flex gap-2 mt-2">
            <Select
              value={jobData.compensation?.currency || 'USD'}
              onValueChange={(value) => updateJobData({
                compensation: { ...jobData.compensation, currency: value }
              })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="amount"
              type="number"
              placeholder={jobData.compensation?.type === 'hourly' ? 'Per hour' : 'Total amount'}
              value={jobData.compensation?.amount || ''}
              onChange={(e) => updateJobData({
                compensation: { ...jobData.compensation, amount: parseFloat(e.target.value) }
              })}
              className={validationErrors.amount ? 'border-destructive flex-1' : 'flex-1'}
            />
          </div>
          {validationErrors.amount && (
            <p className="text-sm text-destructive mt-1">{validationErrors.amount}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="compensation-details">Additional Details</Label>
        <Textarea
          id="compensation-details"
          placeholder="Any additional compensation details, expenses covered, etc."
          rows={4}
          value={jobData.compensation?.details || ''}
          onChange={(e) => updateJobData({
            compensation: { ...jobData.compensation, details: e.target.value }
          })}
        />
      </div>

      {showPricingCalculator && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pricing Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market average for {jobData.category}:</span>
                <span className="font-medium">$50-150/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your budget range:</span>
                <span className="font-medium text-primary">Competitive</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderApplication = () => (
    <div className="space-y-6">
      <div>
        <Label>Application Deadline *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                validationErrors.deadline && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {jobData.applicationDeadline ? format(jobData.applicationDeadline, 'PPP') : 'Select deadline'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={jobData.applicationDeadline}
              onSelect={(date) => updateJobData({ applicationDeadline: date || new Date() })}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
        {validationErrors.deadline && (
          <p className="text-sm text-destructive mt-1">{validationErrors.deadline}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Custom Questions</Label>
          <Button onClick={addQuestion} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>
        <div className="space-y-3">
          {jobData.questions?.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Enter your question..."
                    value={question.question}
                    onChange={(e) => {
                      const questions = [...(jobData.questions || [])];
                      questions[index] = { ...question, question: e.target.value };
                      updateJobData({ questions });
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <Select
                      value={question.type}
                      onValueChange={(value) => {
                        const questions = [...(jobData.questions || [])];
                        questions[index] = { ...question, type: value as any };
                        updateJobData({ questions });
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Answer</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="file">File Upload</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={question.required}
                          onCheckedChange={(checked) => {
                            const questions = [...(jobData.questions || [])];
                            questions[index] = { ...question, required: !!checked };
                            updateJobData({ questions });
                          }}
                        />
                        Required
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateJobData({
                            questions: jobData.questions?.filter((_, i) => i !== index)
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Label>Job Visibility</Label>
        <RadioGroup
          value={jobData.visibility || 'public'}
          onValueChange={(value) => updateJobData({ visibility: value as any })}
        >
          <div className="space-y-2 mt-2">
            <label className="flex items-center space-x-3">
              <RadioGroupItem value="public" />
              <div>
                <div className="font-medium">Public</div>
                <div className="text-sm text-muted-foreground">Visible to all talents</div>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <RadioGroupItem value="private" />
              <div>
                <div className="font-medium">Private</div>
                <div className="text-sm text-muted-foreground">Only visible via direct link</div>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <RadioGroupItem value="invited" />
              <div>
                <div className="font-medium">Invite Only</div>
                <div className="text-sm text-muted-foreground">Only invited talents can apply</div>
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{jobData.title || 'Untitled Job'}</CardTitle>
          <CardDescription>
            {jobData.category} • {jobData.type} • {jobData.location?.city}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {jobData.description || 'No description provided'}
            </p>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Requirements</h4>
            <div className="flex flex-wrap gap-2">
              {jobData.requirements?.map((req, index) => (
                <Badge key={index} variant="secondary">{req}</Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">Compensation</h4>
              <p className="text-sm text-muted-foreground">
                {jobData.compensation?.type === 'hourly' && `${jobData.compensation.currency} ${jobData.compensation.amount}/hour`}
                {jobData.compensation?.type === 'fixed' && `${jobData.compensation.currency} ${jobData.compensation.amount}`}
                {jobData.compensation?.type === 'negotiable' && 'Negotiable'}
                {jobData.compensation?.type === 'tfp' && 'Time for Print (TFP)'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Application Deadline</h4>
              <p className="text-sm text-muted-foreground">
                {jobData.applicationDeadline ? format(jobData.applicationDeadline, 'PPP') : 'Not set'}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Job Boost Options</h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">Featured Job</div>
                    <div className="text-sm text-muted-foreground">Appear at the top of search results</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">$49</div>
                  <Checkbox
                    checked={jobData.boosting?.featured}
                    onCheckedChange={(checked) => updateJobData({
                      boosting: { ...jobData.boosting, featured: !!checked }
                    })}
                  />
                </div>
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Highlighted</div>
                    <div className="text-sm text-muted-foreground">Stand out with a colored border</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">$29</div>
                  <Checkbox
                    checked={jobData.boosting?.highlighted}
                    onCheckedChange={(checked) => updateJobData({
                      boosting: { ...jobData.boosting, highlighted: !!checked }
                    })}
                  />
                </div>
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Priority Matching</div>
                    <div className="text-sm text-muted-foreground">Get matched with top talents first</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">$39</div>
                  <Checkbox
                    checked={jobData.boosting?.priority}
                    onCheckedChange={(checked) => updateJobData({
                      boosting: { ...jobData.boosting, priority: !!checked }
                    })}
                  />
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your job will be reviewed by our team within 24 hours after publishing.
          {companyInfo?.verified && ' As a verified company, your job will be prioritized.'}
        </AlertDescription>
      </Alert>
    </div>
  );

  const stepContent = [
    renderBasicInfo(),
    renderJobDetails(),
    renderRequirements(),
    renderCompensation(),
    renderApplication(),
    renderReview()
  ];

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            {editMode ? 'Edit Job Posting' : 'Create New Job Posting'}
          </h1>
          {companyInfo && (
            <div className="flex items-center gap-2">
              {companyInfo.logo ? (
                <img src={companyInfo.logo} alt={companyInfo.name} className="h-8 w-8 rounded" />
              ) : (
                <Building className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{companyInfo.name}</p>
                {companyInfo.verified && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Shield className="h-3 w-3" />
                    Verified
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <Progress value={(currentStep + 1) / steps.length * 100} />
      </div>

      {/* Steps navigation */}
      <div className="mb-8">
        <nav className="flex space-x-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => {
                if (index <= currentStep) setCurrentStep(index);
              }}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors",
                index === currentStep && "text-primary",
                index < currentStep && "text-foreground cursor-pointer",
                index > currentStep && "text-muted-foreground cursor-not-allowed"
              )}
              disabled={index > currentStep}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                index === currentStep && "bg-primary text-primary-foreground",
                index < currentStep && "bg-primary/20 text-primary",
                index > currentStep && "bg-muted text-muted-foreground"
              )}>
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].label}</CardTitle>
          <CardDescription>
            {currentStep === 0 && "Let's start with the basic information about your job posting"}
            {currentStep === 1 && "Provide detailed information about the job and requirements"}
            {currentStep === 2 && "Specify who you're looking for"}
            {currentStep === 3 && "Set compensation and payment details"}
            {currentStep === 4 && "Configure how talents can apply"}
            {currentStep === 5 && "Review your job posting before publishing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stepContent[currentStep]}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-2">
            {onSaveDraft && (
              <Button
                variant="outline"
                onClick={() => onSaveDraft(jobData)}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
            )}

            {currentStep === steps.length - 1 ? (
              <>
                {onPreview && (
                  <Button
                    variant="outline"
                    onClick={() => onPreview(jobData)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                )}
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  <Send className="h-4 w-4 mr-1" />
                  Publish Job
                </Button>
              </>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default JobPostingBuilder;