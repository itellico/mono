'use client';

/**
 * Job Application Form Component
 * 
 * Allows users to apply for job postings with cover letter,
 * portfolio links, availability, and custom question responses.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, BriefcaseIcon, DollarSignIcon, LinkIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Application form schema based on API service
const applicationFormSchema = z.object({
  coverLetter: z.string().optional(),
  answers: z.record(z.any()).optional(),
  portfolio: z.array(z.object({
    url: z.string().url('Please enter a valid URL'),
    title: z.string().min(1, 'Title is required'),
    type: z.string().min(1, 'Type is required'),
  })).optional(),
  availability: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    flexible: z.boolean(),
    notes: z.string().optional(),
  }).optional(),
  proposedRate: z.object({
    amount: z.number().min(0, 'Amount must be positive'),
    currency: z.string().min(1, 'Currency is required'),
    type: z.enum(['fixed', 'hourly', 'daily']),
  }).optional(),
});

type ApplicationFormData = z.infer<typeof applicationFormSchema>;

interface JobApplicationQuestion {
  question: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
}

interface JobPosting {
  id: number;
  title: string;
  companyName?: string;
  description: string;
  compensation: {
    type: 'fixed' | 'hourly' | 'daily' | 'negotiable';
    amount?: number;
    currency?: string;
    description?: string;
  };
  applicationQuestions?: JobApplicationQuestion[];
  applicationDeadline: string;
  jobDates: {
    startDate: string;
    endDate?: string;
    duration?: string;
    flexible?: boolean;
  };
}

interface JobApplicationFormProps {
  jobPosting: JobPosting;
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function JobApplicationForm({
  jobPosting,
  onSubmit,
  isLoading = false,
  className
}: JobApplicationFormProps) {
  const { toast } = useToast();
  const [portfolioItems, setPortfolioItems] = useState<Array<{ url: string; title: string; type: string }>>([]);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      coverLetter: '',
      answers: {},
      portfolio: [],
      availability: {
        startDate: '',
        flexible: false,
        notes: '',
      },
      proposedRate: {
        amount: 0,
        currency: jobPosting.compensation.currency || 'USD',
        type: 'hourly',
      },
    },
  });

  const handleSubmit = async (data: ApplicationFormData) => {
    try {
      const submissionData = {
        ...data,
        portfolio: portfolioItems,
      };
      await onSubmit(submissionData);
      toast({
        title: 'Application submitted!',
        description: 'Your application has been sent successfully.',
      });
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addPortfolioItem = () => {
    setPortfolioItems([...portfolioItems, { url: '', title: '', type: '' }]);
  };

  const removePortfolioItem = (index: number) => {
    setPortfolioItems(portfolioItems.filter((_, i) => i !== index));
  };

  const updatePortfolioItem = (index: number, field: string, value: string) => {
    const updated = portfolioItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setPortfolioItems(updated);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Job Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BriefcaseIcon className="h-5 w-5" />
            Apply for: {jobPosting.title}
          </CardTitle>
          {jobPosting.companyName && (
            <CardDescription>{jobPosting.companyName}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Start Date</h4>
              <p className="text-sm">{new Date(jobPosting.jobDates.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Compensation</h4>
              <p className="text-sm">
                {jobPosting.compensation.amount 
                  ? `${jobPosting.compensation.currency || '$'}${jobPosting.compensation.amount} ${jobPosting.compensation.type}`
                  : jobPosting.compensation.description || 'Negotiable'
                }
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Application Deadline</h4>
              <p className="text-sm">{new Date(jobPosting.applicationDeadline).toLocaleDateString()}</p>
            </div>
            {jobPosting.jobDates.duration && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Duration</h4>
                <p className="text-sm">{jobPosting.jobDates.duration}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter</CardTitle>
              <CardDescription>
                Tell them why you're the perfect fit for this role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Share your experience, motivation, and why you're interested in this opportunity..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Custom Application Questions */}
          {jobPosting.applicationQuestions && jobPosting.applicationQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Application Questions</CardTitle>
                <CardDescription>
                  Please answer the following questions from the employer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobPosting.applicationQuestions.map((question, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`answers.question_${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {question.question}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </FormLabel>
                        <FormControl>
                          {question.type === 'text' && (
                            <Input placeholder="Your answer..." {...field} />
                          )}
                          {question.type === 'textarea' && (
                            <Textarea 
                              placeholder="Your answer..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          )}
                          {question.type === 'select' && question.options && (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option..." />
                              </SelectTrigger>
                              <SelectContent>
                                {question.options.map((option, optIndex) => (
                                  <SelectItem key={optIndex} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {question.type === 'multiselect' && question.options && (
                            <div className="grid grid-cols-2 gap-2">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center space-x-2">
                                  <Checkbox id={`q${index}_opt${optIndex}`} />
                                  <label 
                                    htmlFor={`q${index}_opt${optIndex}`} 
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Portfolio/Work Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Portfolio & Work Samples
              </CardTitle>
              <CardDescription>
                Share links to your relevant work (optional but recommended)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {portfolioItems.map((item, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-4 p-4 border rounded-lg">
                  <Input
                    placeholder="https://..."
                    value={item.url}
                    onChange={(e) => updatePortfolioItem(index, 'url', e.target.value)}
                  />
                  <Input
                    placeholder="Title/Description"
                    value={item.title}
                    onChange={(e) => updatePortfolioItem(index, 'title', e.target.value)}
                  />
                  <Select value={item.type} onValueChange={(value) => updatePortfolioItem(index, 'type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePortfolioItem(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addPortfolioItem}
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Portfolio Item
              </Button>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Availability
              </CardTitle>
              <CardDescription>
                When can you start this project?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="availability.startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availability.flexible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Flexible start date</FormLabel>
                        <FormDescription>
                          I can adjust my start date if needed
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="availability.notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional details about your availability..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Proposed Rate */}
          {jobPosting.compensation.type === 'negotiable' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSignIcon className="h-5 w-5" />
                  Proposed Rate
                </CardTitle>
                <CardDescription>
                  What's your rate for this type of work?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="proposedRate.amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proposedRate.currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proposedRate.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hourly">Per Hour</SelectItem>
                            <SelectItem value="daily">Per Day</SelectItem>
                            <SelectItem value="fixed">Fixed Price</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <Card>
            <CardContent className="pt-6">
              <Alert className="mb-4">
                <AlertDescription>
                  By submitting this application, you agree to share your profile information 
                  with the employer and allow them to contact you regarding this opportunity.
                </AlertDescription>
              </Alert>
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default JobApplicationForm;