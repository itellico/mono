/**
 * Professional Profiles Schema Definitions
 * 
 * Type-safe schemas for all professional profile types:
 * - Model profiles with measurements and physical attributes
 * - Photographer profiles with equipment and specialties
 * - Agency profiles with roster and services
 * - Client profiles with booking preferences
 */

import { z } from 'zod';
import { ProfileType, ProfileStatus, VerificationStatus, VerificationLevel, AvailabilityType } from '@prisma/client';

// Base Professional Profile Schema
export const BaseProfessionalProfileSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  tenantId: z.number(),
  profileType: z.nativeEnum(ProfileType),
  status: z.nativeEnum(ProfileStatus).default('DRAFT'),
  
  // Core Professional Data
  professionalName: z.string().min(2, 'Professional name must be at least 2 characters').max(255).optional(),
  tagline: z.string().max(500, 'Tagline must be under 500 characters').optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
  specialties: z.array(z.string()).max(10, 'Maximum 10 specialties allowed').default([]),
  
  // Contact & Availability
  professionalEmail: z.string().email('Invalid email format').optional(),
  professionalPhone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
  websiteUrl: z.string().url('Invalid website URL').optional(),
  socialMedia: z.record(z.string().url()).default({}),
  
  // Location & Travel
  baseLocation: z.string().max(255).optional(),
  travelRadius: z.number().min(0).max(10000).optional(), // miles
  travelInternationally: z.boolean().default(false),
  availableLocations: z.array(z.string()).max(20).default([]),
  
  // Rates & Pricing
  rateStructure: z.record(z.number().positive()).default({}),
  currency: z.string().length(3).default('USD'),
  rateNegotiable: z.boolean().default(true),
  
  // Availability
  availabilityType: z.nativeEnum(AvailabilityType).default('FLEXIBLE'),
  availabilityCalendar: z.record(z.any()).default({}),
  
  // Verification & Trust
  verificationStatus: z.nativeEnum(VerificationStatus).default('UNVERIFIED'),
  verificationLevel: z.nativeEnum(VerificationLevel).default('BASIC'),
  
  // Profile Completeness
  completionPercentage: z.number().min(0).max(100).default(0),
  lastUpdatedSection: z.string().optional(),
  
  // SEO & Discovery
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  keywords: z.array(z.string()).max(20).default([]),
  featured: z.boolean().default(false),
  profileViews: z.number().default(0),
});

// Model Profile Industry Data Schema
export const ModelIndustryDataSchema = z.object({
  measurements: z.object({
    height: z.object({
      value: z.number().min(100).max(250), // cm
      unit: z.enum(['cm', 'ft']).default('cm'),
    }).optional(),
    weight: z.object({
      value: z.number().min(30).max(200), // kg
      unit: z.enum(['kg', 'lbs']).default('kg'),
    }).optional(),
    bust: z.object({
      value: z.number().min(60).max(150), // cm
      unit: z.enum(['cm', 'in']).default('cm'),
    }).optional(),
    waist: z.object({
      value: z.number().min(50).max(120), // cm
      unit: z.enum(['cm', 'in']).default('cm'),
    }).optional(),
    hips: z.object({
      value: z.number().min(60).max(150), // cm
      unit: z.enum(['cm', 'in']).default('cm'),
    }).optional(),
    dressSize: z.object({
      value: z.string().max(10),
      region: z.enum(['US', 'UK', 'EU', 'AU']).default('US'),
    }).optional(),
    shoeSize: z.object({
      value: z.string().max(10),
      region: z.enum(['US', 'UK', 'EU']).default('US'),
    }).optional(),
  }).default({}),
  
  physicalAttributes: z.object({
    hairColor: z.enum([
      'Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Gray', 'White', 
      'Platinum', 'Strawberry Blonde', 'Other'
    ]).optional(),
    eyeColor: z.enum([
      'Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'
    ]).optional(),
    skinTone: z.enum([
      'Very Fair', 'Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Dark', 'Deep'
    ]).optional(),
    build: z.enum([
      'Petite', 'Slim', 'Athletic', 'Curvy', 'Plus Size', 'Muscular'
    ]).optional(),
    tattoos: z.boolean().default(false),
    piercings: z.boolean().default(false),
    scars: z.boolean().default(false),
    uniqueFeatures: z.string().max(500).optional(),
  }).default({}),
  
  experience: z.object({
    modelingSince: z.string().regex(/^\d{4}$/, 'Year must be 4 digits').optional(),
    notableClients: z.array(z.string().max(100)).max(20).default([]),
    campaignTypes: z.array(z.enum([
      'fashion', 'commercial', 'lifestyle', 'beauty', 'fitness', 
      'lingerie', 'swimwear', 'artistic', 'editorial', 'beauty'
    ])).default([]),
    runwayExperience: z.boolean().default(false),
    printExperience: z.boolean().default(false),
    commercialExperience: z.boolean().default(false),
    editorialExperience: z.boolean().default(false),
    fitnessExperience: z.boolean().default(false),
    publications: z.array(z.string().max(100)).max(20).default([]),
    awards: z.array(z.string().max(200)).max(10).default([]),
  }).default({}),
  
  preferences: z.object({
    workTypes: z.array(z.enum([
      'fashion', 'commercial', 'lifestyle', 'beauty', 'fitness',
      'lingerie', 'swimwear', 'artistic', 'editorial', 'runway'
    ])).default([]),
    unwillingToDo: z.array(z.enum([
      'nudity', 'partial_nudity', 'lingerie', 'swimwear', 'fitness',
      'beauty', 'hair', 'hands', 'feet', 'jewelry'
    ])).default([]),
    travelAvailable: z.boolean().default(true),
    overnightShoots: z.boolean().default(true),
    weekendAvailable: z.boolean().default(true),
    eveningAvailable: z.boolean().default(true),
    shortNotice: z.boolean().default(false), // < 24 hours
  }).default({}),
  
  representation: z.object({
    hasAgent: z.boolean().default(false),
    agencyName: z.string().max(200).optional(),
    agencyContact: z.string().email().optional(),
    exclusiveRepresentation: z.boolean().default(false),
    motherAgency: z.string().max(200).optional(),
    bookingContact: z.string().email().optional(),
  }).default({}),
  
  portfolio: z.object({
    portfolioTypes: z.array(z.enum([
      'headshots', 'full_body', 'fashion', 'commercial', 'beauty',
      'lifestyle', 'fitness', 'editorial', 'artistic'
    ])).default([]),
    totalImages: z.number().min(0).max(500).default(0),
    lastUpdated: z.string().datetime().optional(),
    profilePicture: z.string().url().optional(),
    featuredImages: z.array(z.string().url()).max(10).default([]),
  }).default({}),
});

// Complete Model Profile Schema
export const ModelProfileSchema = BaseProfessionalProfileSchema.extend({
  profileType: z.literal(ProfileType.MODEL),
  industryData: ModelIndustryDataSchema,
});

// Model Profile Creation Schema (for forms)
export const CreateModelProfileSchema = ModelProfileSchema.omit({
  id: true,
  completionPercentage: true,
  profileViews: true,
  verificationStatus: true,
  verificationLevel: true,
}).partial({
  industryData: true,
  slug: true,
});

// Model Profile Update Schema
export const UpdateModelProfileSchema = ModelProfileSchema.partial().omit({
  userId: true,
  tenantId: true,
  profileType: true,
});

// Photographer Profile Industry Data Schema
export const PhotographerIndustryDataSchema = z.object({
  equipment: z.object({
    cameraBrands: z.array(z.enum([
      'Canon', 'Sony', 'Nikon', 'Fujifilm', 'Olympus', 'Panasonic', 'Leica', 'Other'
    ])).default([]),
    lensCollection: z.array(z.string().max(50)).max(30).default([]),
    lightingEquipment: z.array(z.enum([
      'Profoto', 'Godox', 'Elinchrom', 'Broncolor', 'Alien Bees', 'Natural Light', 'Other'
    ])).default([]),
    studioAccess: z.boolean().default(false),
    mobileSetup: z.boolean().default(true),
    droneEquipment: z.boolean().default(false),
    videoCapabilities: z.boolean().default(false),
  }).default({}),
  
  specialties: z.object({
    photographyTypes: z.array(z.enum([
      'portrait', 'fashion', 'commercial', 'wedding', 'event', 'product',
      'landscape', 'street', 'documentary', 'fine_art', 'sports', 'wildlife'
    ])).default([]),
    editingSoftware: z.array(z.enum([
      'Lightroom', 'Photoshop', 'Capture One', 'GIMP', 'Luminar', 'Other'
    ])).default([]),
    shootingStyles: z.array(z.enum([
      'natural_light', 'studio_lighting', 'environmental', 'lifestyle',
      'editorial', 'commercial', 'artistic', 'documentary'
    ])).default([]),
    postProcessingIncluded: z.boolean().default(true),
    rawFileDelivery: z.boolean().default(false),
  }).default({}),
  
  services: z.object({
    sessionTypes: z.array(z.enum([
      'headshots', 'portfolio', 'commercial', 'events', 'products',
      'fashion', 'lifestyle', 'corporate', 'personal_branding'
    ])).default([]),
    deliverables: z.array(z.enum([
      'high_res_digital', 'print_ready', 'web_optimized', 'social_media',
      'raw_files', 'contact_sheets'
    ])).default([]),
    turnaroundTime: z.enum(['1-3 days', '3-7 days', '1-2 weeks', '2-4 weeks', 'custom']).default('1-2 weeks'),
    revisionRounds: z.number().min(0).max(10).default(2),
    usageRights: z.enum([
      'personal_use', 'commercial_limited', 'commercial_unlimited', 'editorial', 'custom'
    ]).default('personal_use'),
  }).default({}),
  
  portfolioHighlights: z.object({
    featuredWork: z.array(z.string().max(200)).max(20).default([]),
    publishedIn: z.array(z.string().max(100)).max(20).default([]),
    awards: z.array(z.string().max(200)).max(10).default([]),
    exhibitionHistory: z.array(z.string().max(200)).max(15).default([]),
    clientTestimonials: z.array(z.object({
      client: z.string().max(100),
      testimonial: z.string().max(500),
      rating: z.number().min(1).max(5),
    })).max(10).default([]),
  }).default({}),
  
  businessInfo: z.object({
    businessLicense: z.boolean().default(false),
    insuranceCoverage: z.boolean().default(false),
    contractsProvided: z.boolean().default(true),
    depositRequired: z.number().min(0).max(100).default(50), // percentage
    cancellationPolicy: z.enum(['24_hours', '48_hours', '1_week', '2_weeks', 'custom']).default('48_hours'),
    paymentMethods: z.array(z.enum([
      'cash', 'check', 'paypal', 'venmo', 'zelle', 'bank_transfer', 'credit_card'
    ])).default([]),
  }).default({}),
});

// Complete Photographer Profile Schema
export const PhotographerProfileSchema = BaseProfessionalProfileSchema.extend({
  profileType: z.literal(ProfileType.PHOTOGRAPHER),
  industryData: PhotographerIndustryDataSchema,
});

// Profile Completion Calculation Schema
export const ProfileCompletionSchema = z.object({
  basicInfo: z.number().min(0).max(100), // Name, email, location, etc.
  industrySpecific: z.number().min(0).max(100), // Measurements, equipment, etc.
  portfolio: z.number().min(0).max(100), // Images, work samples
  verification: z.number().min(0).max(100), // Verification status
  preferences: z.number().min(0).max(100), // Availability, rates, etc.
});

// Search Filter Schemas
export const ModelSearchFiltersSchema = z.object({
  location: z.string().optional(),
  radius: z.number().min(0).max(500).optional(),
  heightMin: z.number().min(100).max(250).optional(),
  heightMax: z.number().min(100).max(250).optional(),
  hairColor: z.array(z.string()).optional(),
  eyeColor: z.array(z.string()).optional(),
  skinTone: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const PhotographerSearchFiltersSchema = z.object({
  location: z.string().optional(),
  radius: z.number().min(0).max(500).optional(),
  photographyTypes: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  availability: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
  studioAccess: z.boolean().optional(),
});

// Validation Helper Functions
export const validateProfileCompletion = (profile: any, profileType: ProfileType): number => {
  let completion = 0;
  const weights = {
    basicInfo: 30,
    industrySpecific: 25,
    portfolio: 25,
    verification: 10,
    preferences: 10,
  };
  
  // Basic Info (30%)
  let basicScore = 0;
  if (profile.professionalName) basicScore += 20;
  if (profile.tagline) basicScore += 15;
  if (profile.baseLocation) basicScore += 20;
  if (profile.professionalEmail) basicScore += 15;
  if (profile.yearsExperience !== null) basicScore += 15;
  if (profile.specialties?.length > 0) basicScore += 15;
  completion += (basicScore * weights.basicInfo) / 100;
  
  // Industry Specific (25%)
  let industryScore = 0;
  if (profileType === ProfileType.MODEL) {
    const data = profile.industryData;
    if (data?.measurements?.height) industryScore += 25;
    if (data?.physicalAttributes?.hairColor) industryScore += 20;
    if (data?.physicalAttributes?.eyeColor) industryScore += 20;
    if (data?.experience?.campaignTypes?.length > 0) industryScore += 35;
  } else if (profileType === ProfileType.PHOTOGRAPHER) {
    const data = profile.industryData;
    if (data?.equipment?.cameraBrands?.length > 0) industryScore += 25;
    if (data?.specialties?.photographyTypes?.length > 0) industryScore += 35;
    if (data?.services?.sessionTypes?.length > 0) industryScore += 40;
  }
  completion += (industryScore * weights.industrySpecific) / 100;
  
  // Portfolio (25%)
  let portfolioScore = 0;
  // TODO: Calculate based on uploaded media
  completion += (portfolioScore * weights.portfolio) / 100;
  
  // Verification (10%)
  let verificationScore = 0;
  if (profile.verificationStatus === 'VERIFIED') verificationScore = 100;
  else if (profile.verificationStatus === 'PENDING') verificationScore = 50;
  completion += (verificationScore * weights.verification) / 100;
  
  // Preferences (10%)
  let preferencesScore = 0;
  if (profile.rateStructure && Object.keys(profile.rateStructure).length > 0) preferencesScore += 50;
  if (profile.availabilityType) preferencesScore += 50;
  completion += (preferencesScore * weights.preferences) / 100;
  
  return Math.round(completion);
};

// Type exports
export type ModelProfile = z.infer<typeof ModelProfileSchema>;
export type PhotographerProfile = z.infer<typeof PhotographerProfileSchema>;
export type CreateModelProfile = z.infer<typeof CreateModelProfileSchema>;
export type UpdateModelProfile = z.infer<typeof UpdateModelProfileSchema>;
export type ModelIndustryData = z.infer<typeof ModelIndustryDataSchema>;
export type PhotographerIndustryData = z.infer<typeof PhotographerIndustryDataSchema>;
export type ModelSearchFilters = z.infer<typeof ModelSearchFiltersSchema>;
export type PhotographerSearchFilters = z.infer<typeof PhotographerSearchFiltersSchema>;