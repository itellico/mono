'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Camera, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Ruler,
  Palette,
  Award,
  Upload,
  Save,
  Eye,
  Plus,
  X
} from 'lucide-react';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { useRouter } from 'next/navigation';

/**
 * 🎭 Profile Creation Page
 * 
 * This page demonstrates how to create comprehensive model profiles:
 * - Uses your existing form patterns and validation
 * - Integrates with your schema system for dynamic fields
 * - Follows itellico Mono patterns (audit, permissions, caching)
 * - Creates profiles that can be used for search and sedcards
 */

// Profile schema - in real implementation, this would come from your model schemas
const profileSchema = z.object({
  // Basic Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  
  // Location
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().optional(),
  
  // Physical Attributes
  height: z.string().min(1, 'Height is required'),
  weight: z.string().optional(),
  eyeColor: z.string().min(1, 'Eye color is required'),
  hairColor: z.string().min(1, 'Hair color is required'),
  shoeSize: z.string().optional(),
  
  // Professional Information
  category: z.string().min(1, 'Category is required'),
  experience: z.string().min(1, 'Experience level is required'),
  availability: z.string().min(1, 'Availability is required'),
  hourlyRate: z.string().optional(),
  
  // Profile Details
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  specialties: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  
  // Social Media
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  website: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Option sets - in real implementation, these would come from your option sets API
const OPTION_SETS = {
  countries: [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ],
  categories: [
    { value: 'fashion', label: 'Fashion Model' },
    { value: 'commercial', label: 'Commercial Model' },
    { value: 'fitness', label: 'Fitness Model' },
    { value: 'glamour', label: 'Glamour Model' },
    { value: 'runway', label: 'Runway Model' },
    { value: 'editorial', label: 'Editorial Model' },
  ],
  experience: [
    { value: 'beginner', label: 'Beginner (0-2 years)' },
    { value: 'intermediate', label: 'Intermediate (2-5 years)' },
    { value: 'professional', label: 'Professional (5+ years)' },
    { value: 'expert', label: 'Expert (10+ years)' },
  ],
  availability: [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'weekends', label: 'Weekends Only' },
    { value: 'freelance', label: 'Freelance/Project Based' },
  ],
  eyeColors: [
    { value: 'brown', label: 'Brown' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'hazel', label: 'Hazel' },
    { value: 'gray', label: 'Gray' },
    { value: 'amber', label: 'Amber' },
  ],
  hairColors: [
    { value: 'black', label: 'Black' },
    { value: 'brown', label: 'Brown' },
    { value: 'blonde', label: 'Blonde' },
    { value: 'red', label: 'Red' },
    { value: 'gray', label: 'Gray' },
    { value: 'other', label: 'Other' },
  ],
  specialties: [
    'Portrait Photography',
    'Fashion Photography',
    'Commercial Photography',
    'Runway Modeling',
    'Fitness Modeling',
    'Acting',
    'Dancing',
    'Singing',
  ],
  languages: [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Chinese',
    'Japanese',
  ],
};

export default function ProfileCreatePage() {
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { trackPageView, trackFormSubmit } = useAuditTracking();

  // Track page view for audit
  usePageTracking('profile_create');

  React.useEffect(() => {
    trackPageView('profile_create', {
      section: 'profile_creation',
      formType: 'model_profile'
    });
  }, [trackPageView]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      country: '',
      city: '',
      address: '',
      height: '',
      weight: '',
      eyeColor: '',
      hairColor: '',
      shoeSize: '',
      category: '',
      experience: '',
      availability: '',
      hourlyRate: '',
      bio: '',
      specialties: [],
      languages: [],
      instagram: '',
      twitter: '',
      website: '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    
    try {
      // Add selected specialties and languages
      data.specialties = selectedSpecialties;
      data.languages = selectedLanguages;

      // Track form submission
      trackFormSubmit('profile_create', {
        profileType: data.category,
        experience: data.experience,
        specialtyCount: selectedSpecialties.length,
        languageCount: selectedLanguages.length,
      });

      browserLogger.userAction('profile_created', {
        profileType: data.category,
        experience: data.experience,
        location: `${data.city}, ${data.country}`,
      });

      // In real implementation, this would:
      // 1. Validate permissions
      // 2. Apply tenant isolation
      // 3. Save to database with audit logging
      // 4. Upload any media files
      // 5. Generate sedcard/modelbook
      // 6. Send confirmation email
      
      console.log('Profile data:', data);
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to profile view
      router.push('/profiles/1'); // In real implementation, use actual profile ID
      
    } catch (error) {
      browserLogger.error('Profile creation failed', { error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSpecialty = (specialty: string) => {
    if (!selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
  };

  const addLanguage = (language: string) => {
    if (!selectedLanguages.includes(language)) {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const removeLanguage = (language: string) => {
    setSelectedLanguages(selectedLanguages.filter(l => l !== language));
  };

  const renderBasicTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="dateOfBirth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date of Birth</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OPTION_SETS.countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="Enter city" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderPhysicalTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 175 cm" {...field} />
              </FormControl>
              <FormDescription>Enter height in centimeters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 65 kg" {...field} />
              </FormControl>
              <FormDescription>Enter weight in kilograms</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shoeSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shoe Size (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 9 US" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="eyeColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eye Color</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select eye color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OPTION_SETS.eyeColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      {color.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hairColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hair Color</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hair color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OPTION_SETS.hairColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      {color.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderProfessionalTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OPTION_SETS.categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience Level</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OPTION_SETS.experience.map((exp) => (
                    <SelectItem key={exp.value} value={exp.value}>
                      {exp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="availability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Availability</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OPTION_SETS.availability.map((avail) => (
                    <SelectItem key={avail.value} value={avail.value}>
                      {avail.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., $150/hour" {...field} />
              </FormControl>
              <FormDescription>Your standard hourly rate</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Biography</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell us about yourself, your experience, and what makes you unique..."
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Minimum 50 characters. This will appear on your profile and sedcard.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Specialties */}
      <div className="space-y-3">
        <FormLabel>Specialties</FormLabel>
        <div className="flex flex-wrap gap-2">
          {selectedSpecialties.map((specialty) => (
            <Badge key={specialty} variant="secondary" className="gap-1">
              {specialty}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => removeSpecialty(specialty)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <Select onValueChange={addSpecialty}>
          <SelectTrigger>
            <SelectValue placeholder="Add specialty" />
          </SelectTrigger>
          <SelectContent>
            {OPTION_SETS.specialties
              .filter(specialty => !selectedSpecialties.includes(specialty))
              .map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Languages */}
      <div className="space-y-3">
        <FormLabel>Languages</FormLabel>
        <div className="flex flex-wrap gap-2">
          {selectedLanguages.map((language) => (
            <Badge key={language} variant="secondary" className="gap-1">
              {language}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => removeLanguage(language)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <Select onValueChange={addLanguage}>
          <SelectTrigger>
            <SelectValue placeholder="Add language" />
          </SelectTrigger>
          <SelectContent>
            {OPTION_SETS.languages
              .filter(language => !selectedLanguages.includes(language))
              .map((language) => (
                <SelectItem key={language} value={language}>
                  {language}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="instagram"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Instagram (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="@username or full URL" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="twitter"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Twitter (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="@username or full URL" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Website (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="https://your-website.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Build your professional modeling profile to showcase your talents and connect with opportunities
          </p>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Complete all sections to create a comprehensive profile that will be used for your sedcard and modelbook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="physical">Physical</TabsTrigger>
                    <TabsTrigger value="professional">Professional</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    {renderBasicTab()}
                  </TabsContent>

                  <TabsContent value="physical" className="space-y-4">
                    {renderPhysicalTab()}
                  </TabsContent>

                  <TabsContent value="professional" className="space-y-4">
                    {renderProfessionalTab()}
                  </TabsContent>

                  <TabsContent value="social" className="space-y-4">
                    {renderSocialTab()}
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* Form Actions */}
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        console.log('Preview profile:', form.getValues());
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Creating Profile...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Profile
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}