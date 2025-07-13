import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * Supplementary Option Sets Seeder
 * 
 * Creates additional option sets referenced by model schemas but not included 
 * in the main creative industry seeder.
 */

// Regional mapping helper
const createRegionalMappings = (baseValue: string, conversions: Record<string, string> = {}) => ({
  US: conversions.US || baseValue,
  UK: conversions.UK || baseValue,
  EU: conversions.EU || baseValue,
  Asia: conversions.Asia || baseValue,
  ...conversions
});

export const SUPPLEMENTARY_OPTION_SETS = {
  
  // ===========================================
  // BASIC DEMOGRAPHIC OPTIONS
  // ===========================================
  
  genders: {
    slug: 'genders',
    label: 'Gender Options',
    description: 'Gender identity options for profiles',
    values: [
      { value: 'male', label: 'Male', order: 1, regionalMappings: createRegionalMappings('Male', { EU: 'Masculin', Asia: 'Male' })},
      { value: 'female', label: 'Female', order: 2, regionalMappings: createRegionalMappings('Female', { EU: 'Féminin', Asia: 'Female' })},
      { value: 'non_binary', label: 'Non-Binary', order: 3, regionalMappings: createRegionalMappings('Non-Binary', { EU: 'Non-binaire', Asia: 'Non-Binary' })},
      { value: 'prefer_not_to_say', label: 'Prefer Not to Say', order: 4, regionalMappings: createRegionalMappings('Prefer Not to Say', { EU: 'Préfère ne pas dire', Asia: 'Prefer Not to Say' })}
    ]
  },

  pet_genders: {
    slug: 'pet_genders',
    label: 'Pet Gender Options',
    description: 'Gender options for pet models',
    values: [
      { value: 'male', label: 'Male', order: 1 },
      { value: 'female', label: 'Female', order: 2 },
      { value: 'unknown', label: 'Unknown', order: 3 }
    ]
  },

  nationalities: {
    slug: 'nationalities',
    label: 'Nationalities',
    description: 'Country/nationality options',
    values: [
      { value: 'american', label: 'American', order: 1 },
      { value: 'canadian', label: 'Canadian', order: 2 },
      { value: 'british', label: 'British', order: 3 },
      { value: 'french', label: 'French', order: 4 },
      { value: 'german', label: 'German', order: 5 },
      { value: 'italian', label: 'Italian', order: 6 },
      { value: 'spanish', label: 'Spanish', order: 7 },
      { value: 'australian', label: 'Australian', order: 8 },
      { value: 'japanese', label: 'Japanese', order: 9 },
      { value: 'chinese', label: 'Chinese', order: 10 },
      { value: 'indian', label: 'Indian', order: 11 },
      { value: 'brazilian', label: 'Brazilian', order: 12 },
      { value: 'mexican', label: 'Mexican', order: 13 },
      { value: 'south_african', label: 'South African', order: 14 },
      { value: 'other', label: 'Other', order: 15 }
    ]
  },

  // ===========================================
  // GUARDIAN & CHILD-SPECIFIC OPTIONS
  // ===========================================
  
  guardian_relationships: {
    slug: 'guardian_relationships',
    label: 'Guardian Relationships',
    description: 'Relationship types for guardians of child models',
    values: [
      { value: 'mother', label: 'Mother', order: 1 },
      { value: 'father', label: 'Father', order: 2 },
      { value: 'grandmother', label: 'Grandmother', order: 3 },
      { value: 'grandfather', label: 'Grandfather', order: 4 },
      { value: 'aunt', label: 'Aunt', order: 5 },
      { value: 'uncle', label: 'Uncle', order: 6 },
      { value: 'legal_guardian', label: 'Legal Guardian', order: 7 },
      { value: 'adoptive_parent', label: 'Adoptive Parent', order: 8 },
      { value: 'foster_parent', label: 'Foster Parent', order: 9 },
      { value: 'other', label: 'Other', order: 10 }
    ]
  },

  baby_shoot_times: {
    slug: 'baby_shoot_times',
    label: 'Baby Shoot Preferred Times',
    description: 'Optimal shooting times for baby models',
    values: [
      { value: 'early_morning', label: 'Early Morning (6-9 AM)', order: 1 },
      { value: 'mid_morning', label: 'Mid Morning (9-11 AM)', order: 2 },
      { value: 'late_morning', label: 'Late Morning (11 AM-12 PM)', order: 3 },
      { value: 'early_afternoon', label: 'Early Afternoon (12-2 PM)', order: 4 },
      { value: 'late_afternoon', label: 'Late Afternoon (2-4 PM)', order: 5 },
      { value: 'evening', label: 'Early Evening (4-6 PM)', order: 6 }
    ]
  },

  baby_shoot_durations: {
    slug: 'baby_shoot_durations',
    label: 'Baby Shoot Maximum Duration',
    description: 'Maximum shooting duration for baby models',
    values: [
      { value: '15_minutes', label: '15 Minutes', order: 1 },
      { value: '30_minutes', label: '30 Minutes', order: 2 },
      { value: '45_minutes', label: '45 Minutes', order: 3 },
      { value: '1_hour', label: '1 Hour', order: 4 },
      { value: '1_5_hours', label: '1.5 Hours', order: 5 },
      { value: '2_hours', label: '2 Hours', order: 6 }
    ]
  },

  grade_levels: {
    slug: 'grade_levels',
    label: 'School Grade Levels',
    description: 'Academic grade levels for child models',
    values: [
      { value: 'pre_k', label: 'Pre-Kindergarten', order: 1 },
      { value: 'kindergarten', label: 'Kindergarten', order: 2 },
      { value: 'grade_1', label: '1st Grade', order: 3 },
      { value: 'grade_2', label: '2nd Grade', order: 4 },
      { value: 'grade_3', label: '3rd Grade', order: 5 },
      { value: 'grade_4', label: '4th Grade', order: 6 },
      { value: 'grade_5', label: '5th Grade', order: 7 },
      { value: 'grade_6', label: '6th Grade', order: 8 },
      { value: 'grade_7', label: '7th Grade', order: 9 },
      { value: 'grade_8', label: '8th Grade', order: 10 },
      { value: 'grade_9', label: '9th Grade (Freshman)', order: 11 },
      { value: 'grade_10', label: '10th Grade (Sophomore)', order: 12 },
      { value: 'grade_11', label: '11th Grade (Junior)', order: 13 },
      { value: 'grade_12', label: '12th Grade (Senior)', order: 14 },
      { value: 'homeschooled', label: 'Homeschooled', order: 15 },
      { value: 'graduated', label: 'Graduated', order: 16 }
    ]
  },

  school_schedules: {
    slug: 'school_schedules',
    label: 'School Schedule Types',
    description: 'Types of school schedules',
    values: [
      { value: 'traditional', label: 'Traditional (Mon-Fri)', order: 1 },
      { value: 'year_round', label: 'Year-Round', order: 2 },
      { value: 'block_schedule', label: 'Block Schedule', order: 3 },
      { value: 'half_day', label: 'Half Day', order: 4 },
      { value: 'homeschool', label: 'Homeschool (Flexible)', order: 5 },
      { value: 'online_school', label: 'Online School', order: 6 },
      { value: 'charter_school', label: 'Charter School', order: 7 }
    ]
  },

  content_restrictions: {
    slug: 'content_restrictions',
    label: 'Content Restrictions',
    description: 'Content type restrictions for models',
    values: [
      { value: 'no_swimwear', label: 'No Swimwear', order: 1 },
      { value: 'no_underwear', label: 'No Underwear/Lingerie', order: 2 },
      { value: 'no_mature_themes', label: 'No Mature Themes', order: 3 },
      { value: 'no_violence', label: 'No Violence/Weapons', order: 4 },
      { value: 'no_alcohol', label: 'No Alcohol/Substances', order: 5 },
      { value: 'no_religious', label: 'No Religious Content', order: 6 },
      { value: 'family_friendly_only', label: 'Family-Friendly Only', order: 7 },
      { value: 'no_nudity', label: 'No Nudity/Artistic Nude', order: 8 },
      { value: 'no_smoking', label: 'No Smoking/Tobacco', order: 9 },
      { value: 'no_political', label: 'No Political Content', order: 10 }
    ]
  },

  // ===========================================
  // PROFESSIONAL & LEGAL OPTIONS
  // ===========================================
  
  work_authorization_status: {
    slug: 'work_authorization_status',
    label: 'Work Authorization Status',
    description: 'Legal work authorization status',
    values: [
      { value: 'citizen', label: 'Citizen', order: 1 },
      { value: 'permanent_resident', label: 'Permanent Resident', order: 2 },
      { value: 'work_visa', label: 'Work Visa', order: 3 },
      { value: 'student_visa', label: 'Student Visa (Limited Work)', order: 4 },
      { value: 'pending_authorization', label: 'Pending Authorization', order: 5 },
      { value: 'requires_sponsorship', label: 'Requires Sponsorship', order: 6 },
      { value: 'not_authorized', label: 'Not Authorized to Work', order: 7 }
    ]
  },

  comfort_levels: {
    slug: 'comfort_levels',
    label: 'Comfort Levels',
    description: 'General comfort level assessments',
    values: [
      { value: 'very_comfortable', label: 'Very Comfortable', order: 1 },
      { value: 'comfortable', label: 'Comfortable', order: 2 },
      { value: 'somewhat_comfortable', label: 'Somewhat Comfortable', order: 3 },
      { value: 'neutral', label: 'Neutral', order: 4 },
      { value: 'somewhat_uncomfortable', label: 'Somewhat Uncomfortable', order: 5 },
      { value: 'uncomfortable', label: 'Uncomfortable', order: 6 },
      { value: 'very_uncomfortable', label: 'Very Uncomfortable', order: 7 }
    ]
  },

  content_comfort_levels: {
    slug: 'content_comfort_levels',
    label: 'Content Comfort Levels',
    description: 'Comfort levels with different content types',
    values: [
      { value: 'all_content', label: 'Comfortable with All Content', order: 1 },
      { value: 'family_friendly', label: 'Family-Friendly Content Only', order: 2 },
      { value: 'teen_appropriate', label: 'Teen-Appropriate Content', order: 3 },
      { value: 'no_suggestive', label: 'No Suggestive Content', order: 4 },
      { value: 'conservative', label: 'Conservative Content Only', order: 5 },
      { value: 'case_by_case', label: 'Evaluate Case-by-Case', order: 6 }
    ]
  },

  // ===========================================
  // TECHNICAL & EQUIPMENT OPTIONS
  // ===========================================
  
  time_zones: {
    slug: 'time_zones',
    label: 'Time Zones',
    description: 'Global time zone options',
    values: [
      { value: 'pst', label: 'PST (Pacific Standard Time)', order: 1 },
      { value: 'mst', label: 'MST (Mountain Standard Time)', order: 2 },
      { value: 'cst', label: 'CST (Central Standard Time)', order: 3 },
      { value: 'est', label: 'EST (Eastern Standard Time)', order: 4 },
      { value: 'gmt', label: 'GMT (Greenwich Mean Time)', order: 5 },
      { value: 'cet', label: 'CET (Central European Time)', order: 6 },
      { value: 'jst', label: 'JST (Japan Standard Time)', order: 7 },
      { value: 'aest', label: 'AEST (Australian Eastern Standard Time)', order: 8 },
      { value: 'ist', label: 'IST (India Standard Time)', order: 9 },
      { value: 'cst_china', label: 'CST (China Standard Time)', order: 10 }
    ]
  },

  recording_hours: {
    slug: 'recording_hours',
    label: 'Recording Hours Availability',
    description: 'Available hours for voice recording sessions',
    values: [
      { value: 'business_hours', label: 'Business Hours (9 AM - 5 PM)', order: 1 },
      { value: 'extended_hours', label: 'Extended Hours (7 AM - 7 PM)', order: 2 },
      { value: 'evenings', label: 'Evenings Available', order: 3 },
      { value: 'weekends', label: 'Weekends Available', order: 4 },
      { value: 'flexible', label: 'Flexible Hours', order: 5 },
      { value: '24_7', label: '24/7 Availability', order: 6 }
    ]
  },

  audio_equipment: {
    slug: 'audio_equipment',
    label: 'Audio Equipment',
    description: 'Professional audio recording equipment',
    values: [
      { value: 'professional_microphone', label: 'Professional Microphone', order: 1 },
      { value: 'audio_interface', label: 'Audio Interface', order: 2 },
      { value: 'acoustic_treatment', label: 'Acoustic Treatment/Booth', order: 3 },
      { value: 'pop_filter', label: 'Pop Filter/Windscreen', order: 4 },
      { value: 'headphones', label: 'Professional Headphones', order: 5 },
      { value: 'preamp', label: 'Microphone Preamp', order: 6 },
      { value: 'compressor', label: 'Hardware Compressor', order: 7 },
      { value: 'backup_equipment', label: 'Backup Equipment', order: 8 }
    ]
  },

  audio_software: {
    slug: 'audio_software',
    label: 'Audio Recording Software',
    description: 'Audio recording and editing software proficiency',
    values: [
      { value: 'pro_tools', label: 'Pro Tools', order: 1 },
      { value: 'logic_pro', label: 'Logic Pro', order: 2 },
      { value: 'audacity', label: 'Audacity', order: 3 },
      { value: 'adobe_audition', label: 'Adobe Audition', order: 4 },
      { value: 'reaper', label: 'REAPER', order: 5 },
      { value: 'cubase', label: 'Cubase', order: 6 },
      { value: 'garage_band', label: 'GarageBand', order: 7 },
      { value: 'hindenburg', label: 'Hindenburg Pro', order: 8 }
    ]
  },

  audio_formats: {
    slug: 'audio_formats',
    label: 'Audio Delivery Formats',
    description: 'Available audio file delivery formats',
    values: [
      { value: 'wav', label: 'WAV (Uncompressed)', order: 1 },
      { value: 'mp3', label: 'MP3', order: 2 },
      { value: 'aiff', label: 'AIFF', order: 3 },
      { value: 'flac', label: 'FLAC', order: 4 },
      { value: 'broadcast_wav', label: 'Broadcast WAV', order: 5 },
      { value: 'mp4', label: 'MP4/M4A', order: 6 }
    ]
  },

  turnaround_times: {
    slug: 'turnaround_times',
    label: 'Turnaround Times',
    description: 'Standard delivery turnaround times',
    values: [
      { value: 'same_day', label: 'Same Day', order: 1 },
      { value: '24_hours', label: '24 Hours', order: 2 },
      { value: '48_hours', label: '48 Hours', order: 3 },
      { value: '72_hours', label: '72 Hours', order: 4 },
      { value: '1_week', label: '1 Week', order: 5 },
      { value: '2_weeks', label: '2 Weeks', order: 6 },
      { value: 'custom', label: 'Custom/Project Dependent', order: 7 }
    ]
  },

  // ===========================================
  // FITNESS & HEALTH OPTIONS
  // ===========================================
  
  body_fat_percentages: {
    slug: 'body_fat_percentages',
    label: 'Body Fat Percentage Ranges',
    description: 'Body fat percentage ranges for fitness models',
    values: [
      { value: '5-9', label: '5-9% (Competition Ready)', order: 1 },
      { value: '10-14', label: '10-14% (Athletic)', order: 2 },
      { value: '15-19', label: '15-19% (Fitness)', order: 3 },
      { value: '20-24', label: '20-24% (Average)', order: 4 },
      { value: '25-29', label: '25-29% (Above Average)', order: 5 },
      { value: '30+', label: '30%+ (Higher)', order: 6 },
      { value: 'prefer_not_to_say', label: 'Prefer Not to Say', order: 7 }
    ]
  },

  muscle_mass_percentages: {
    slug: 'muscle_mass_percentages',
    label: 'Muscle Mass Percentage Ranges',
    description: 'Muscle mass percentage ranges',
    values: [
      { value: '25-29', label: '25-29% (Low)', order: 1 },
      { value: '30-34', label: '30-34% (Below Average)', order: 2 },
      { value: '35-39', label: '35-39% (Average)', order: 3 },
      { value: '40-44', label: '40-44% (Above Average)', order: 4 },
      { value: '45-49', label: '45-49% (Athletic)', order: 5 },
      { value: '50+', label: '50%+ (Very Athletic)', order: 6 },
      { value: 'unknown', label: 'Unknown', order: 7 }
    ]
  },

  flexibility_levels: {
    slug: 'flexibility_levels',
    label: 'Flexibility Levels',
    description: 'Physical flexibility assessment levels',
    values: [
      { value: 'very_flexible', label: 'Very Flexible (Advanced)', order: 1 },
      { value: 'flexible', label: 'Flexible (Intermediate)', order: 2 },
      { value: 'average', label: 'Average Flexibility', order: 3 },
      { value: 'limited', label: 'Limited Flexibility', order: 4 },
      { value: 'working_on_it', label: 'Working on Improvement', order: 5 }
    ]
  },

  diet_types: {
    slug: 'diet_types',
    label: 'Diet Types',
    description: 'Dietary preferences and restrictions',
    values: [
      { value: 'no_restrictions', label: 'No Restrictions', order: 1 },
      { value: 'vegetarian', label: 'Vegetarian', order: 2 },
      { value: 'vegan', label: 'Vegan', order: 3 },
      { value: 'pescatarian', label: 'Pescatarian', order: 4 },
      { value: 'keto', label: 'Ketogenic', order: 5 },
      { value: 'paleo', label: 'Paleo', order: 6 },
      { value: 'mediterranean', label: 'Mediterranean', order: 7 },
      { value: 'gluten_free', label: 'Gluten-Free', order: 8 },
      { value: 'dairy_free', label: 'Dairy-Free', order: 9 },
      { value: 'intermittent_fasting', label: 'Intermittent Fasting', order: 10 },
      { value: 'bodybuilding', label: 'Bodybuilding Diet', order: 11 },
      { value: 'other', label: 'Other/Custom', order: 12 }
    ]
  },

  vascularity_levels: {
    slug: 'vascularity_levels',
    label: 'Vascularity Levels',
    description: 'Visible vascularity levels for fitness models',
    values: [
      { value: 'none', label: 'No Visible Vascularity', order: 1 },
      { value: 'minimal', label: 'Minimal Vascularity', order: 2 },
      { value: 'moderate', label: 'Moderate Vascularity', order: 3 },
      { value: 'high', label: 'High Vascularity', order: 4 },
      { value: 'extreme', label: 'Extreme Vascularity', order: 5 }
    ]
  },

  // ===========================================
  // PET-SPECIFIC OPTIONS
  // ===========================================
  
  pet_breeds: {
    slug: 'pet_breeds',
    label: 'Pet Breeds',
    description: 'Common pet breeds (species-specific)',
    values: [
      // Dogs
      { value: 'golden_retriever', label: 'Golden Retriever', order: 1 },
      { value: 'labrador_retriever', label: 'Labrador Retriever', order: 2 },
      { value: 'german_shepherd', label: 'German Shepherd', order: 3 },
      { value: 'bulldog', label: 'Bulldog', order: 4 },
      { value: 'poodle', label: 'Poodle', order: 5 },
      { value: 'beagle', label: 'Beagle', order: 6 },
      { value: 'rottweiler', label: 'Rottweiler', order: 7 },
      { value: 'yorkshire_terrier', label: 'Yorkshire Terrier', order: 8 },
      { value: 'dachshund', label: 'Dachshund', order: 9 },
      { value: 'siberian_husky', label: 'Siberian Husky', order: 10 },
      { value: 'mixed_breed', label: 'Mixed Breed', order: 11 },
      
      // Cats
      { value: 'domestic_shorthair', label: 'Domestic Shorthair', order: 12 },
      { value: 'domestic_longhair', label: 'Domestic Longhair', order: 13 },
      { value: 'siamese', label: 'Siamese', order: 14 },
      { value: 'maine_coon', label: 'Maine Coon', order: 15 },
      { value: 'persian', label: 'Persian', order: 16 },
      { value: 'british_shorthair', label: 'British Shorthair', order: 17 },
      { value: 'ragdoll', label: 'Ragdoll', order: 18 },
      { value: 'bengal', label: 'Bengal', order: 19 },
      
      // Other species
      { value: 'quarter_horse', label: 'Quarter Horse', order: 20 },
      { value: 'thoroughbred', label: 'Thoroughbred', order: 21 },
      { value: 'cockatiel', label: 'Cockatiel', order: 22 },
      { value: 'african_grey', label: 'African Grey Parrot', order: 23 },
      { value: 'holland_lop', label: 'Holland Lop Rabbit', order: 24 },
      { value: 'other', label: 'Other/Unlisted', order: 25 }
    ]
  },

  pet_colors: {
    slug: 'pet_colors',
    label: 'Pet Colors',
    description: 'Common pet coat/fur colors',
    values: [
      { value: 'black', label: 'Black', order: 1 },
      { value: 'white', label: 'White', order: 2 },
      { value: 'brown', label: 'Brown', order: 3 },
      { value: 'tan', label: 'Tan', order: 4 },
      { value: 'golden', label: 'Golden', order: 5 },
      { value: 'cream', label: 'Cream', order: 6 },
      { value: 'gray', label: 'Gray', order: 7 },
      { value: 'silver', label: 'Silver', order: 8 },
      { value: 'red', label: 'Red', order: 9 },
      { value: 'orange', label: 'Orange', order: 10 },
      { value: 'brindle', label: 'Brindle', order: 11 },
      { value: 'merle', label: 'Merle', order: 12 },
      { value: 'spotted', label: 'Spotted', order: 13 },
      { value: 'tricolor', label: 'Tricolor', order: 14 },
      { value: 'calico', label: 'Calico', order: 15 },
      { value: 'tabby', label: 'Tabby', order: 16 }
    ]
  },

  coat_patterns: {
    slug: 'coat_patterns',
    label: 'Coat Patterns',
    description: 'Pet coat patterns and markings',
    values: [
      { value: 'solid', label: 'Solid Color', order: 1 },
      { value: 'spotted', label: 'Spotted', order: 2 },
      { value: 'striped', label: 'Striped', order: 3 },
      { value: 'brindle', label: 'Brindle', order: 4 },
      { value: 'merle', label: 'Merle', order: 5 },
      { value: 'piebald', label: 'Piebald', order: 6 },
      { value: 'tuxedo', label: 'Tuxedo', order: 7 },
      { value: 'calico', label: 'Calico', order: 8 },
      { value: 'tortoiseshell', label: 'Tortoiseshell', order: 9 },
      { value: 'tabby', label: 'Tabby', order: 10 },
      { value: 'point_coloration', label: 'Point Coloration', order: 11 }
    ]
  },

  coat_lengths: {
    slug: 'coat_lengths',
    label: 'Coat Lengths',
    description: 'Pet coat/fur length categories',
    values: [
      { value: 'hairless', label: 'Hairless', order: 1 },
      { value: 'very_short', label: 'Very Short', order: 2 },
      { value: 'short', label: 'Short', order: 3 },
      { value: 'medium', label: 'Medium', order: 4 },
      { value: 'long', label: 'Long', order: 5 },
      { value: 'very_long', label: 'Very Long', order: 6 }
    ]
  },

  pet_eye_colors: {
    slug: 'pet_eye_colors',
    label: 'Pet Eye Colors',
    description: 'Common eye colors for pets',
    values: [
      { value: 'brown', label: 'Brown', order: 1 },
      { value: 'amber', label: 'Amber', order: 2 },
      { value: 'blue', label: 'Blue', order: 3 },
      { value: 'green', label: 'Green', order: 4 },
      { value: 'hazel', label: 'Hazel', order: 5 },
      { value: 'odd_eyes', label: 'Odd Eyes (Different Colors)', order: 6 },
      { value: 'black', label: 'Black', order: 7 }
    ]
  },

  energy_levels: {
    slug: 'energy_levels',
    label: 'Energy Levels',
    description: 'Pet energy level classifications',
    values: [
      { value: 'very_low', label: 'Very Low Energy', order: 1 },
      { value: 'low', label: 'Low Energy', order: 2 },
      { value: 'moderate', label: 'Moderate Energy', order: 3 },
      { value: 'high', label: 'High Energy', order: 4 },
      { value: 'very_high', label: 'Very High Energy', order: 5 },
      { value: 'variable', label: 'Variable (Depends on Situation)', order: 6 }
    ]
  },

  socialization_levels: {
    slug: 'socialization_levels',
    label: 'Socialization Levels',
    description: 'Pet socialization comfort levels',
    values: [
      { value: 'excellent_with_people', label: 'Excellent with People', order: 1 },
      { value: 'good_with_familiar_people', label: 'Good with Familiar People', order: 2 },
      { value: 'cautious_with_strangers', label: 'Cautious with Strangers', order: 3 },
      { value: 'excellent_with_children', label: 'Excellent with Children', order: 4 },
      { value: 'good_with_other_animals', label: 'Good with Other Animals', order: 5 },
      { value: 'prefers_individual_attention', label: 'Prefers Individual Attention', order: 6 },
      { value: 'needs_slow_introduction', label: 'Needs Slow Introduction', order: 7 }
    ]
  }
};

/**
 * Creates an option set in the database
 */
async function createOptionSet(data: {
  slug: string;
  label: string;
  description?: string;
  values: Array<{
    value: string;
    label: string;
    order: number;
    canonicalRegion?: string;
    regionalMappings?: Record<string, string>;
    metadata?: Record<string, any>;
  }>;
}) {
  try {
    logger.info(`Creating supplementary option set: ${data.slug}`);
    
    // Create the option set
    const optionSet = await prisma.optionSet.create({
      data: {
        slug: data.slug,
        label: data.label,
        description: data.description,
        tenantId: null, // Global option sets
        isActive: true
      }
    });

    // Create the option values
    const optionValues = await Promise.all(
      data.values.map(value => 
        prisma.optionValue.create({
          data: {
            optionSetId: optionSet.id,
            value: value.value,
            label: value.label,
            order: value.order,
            canonicalRegion: value.canonicalRegion || 'GLOBAL',
            regionalMappings: value.regionalMappings || {},
            metadata: value.metadata || {},
            isActive: true
          }
        })
      )
    );

    logger.info(`Created supplementary option set ${data.slug} with ${optionValues.length} values`);
    return { optionSet, optionValues };
  } catch (error) {
    logger.error(`Error creating supplementary option set ${data.slug}:`, error);
    throw error;
  }
}

/**
 * Main seeder function
 */
export async function seedSupplementaryOptionSets() {
  try {
    logger.info('Starting supplementary option sets seeding...');

    const results = [];
    
    for (const [key, optionSetData] of Object.entries(SUPPLEMENTARY_OPTION_SETS)) {
      try {
        const result = await createOptionSet(optionSetData);
        results.push(result);
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Failed to create supplementary option set ${key}:`, error);
        // Continue with other option sets even if one fails
      }
    }

    logger.info(`Supplementary option sets seeding completed. Created ${results.length} option sets.`);
    
    const summary = {
      totalOptionSets: results.length,
      totalValues: results.reduce((sum, result) => sum + result.optionValues.length, 0),
      categories: {
        demographic: Object.keys(SUPPLEMENTARY_OPTION_SETS).filter(k => k.includes('gender') || k.includes('nationality')).length,
        childSpecific: Object.keys(SUPPLEMENTARY_OPTION_SETS).filter(k => k.includes('baby') || k.includes('grade') || k.includes('school') || k.includes('guardian')).length,
        professional: Object.keys(SUPPLEMENTARY_OPTION_SETS).filter(k => k.includes('work') || k.includes('comfort') || k.includes('time')).length,
        technical: Object.keys(SUPPLEMENTARY_OPTION_SETS).filter(k => k.includes('audio') || k.includes('recording') || k.includes('turnaround')).length,
        fitness: Object.keys(SUPPLEMENTARY_OPTION_SETS).filter(k => k.includes('body') || k.includes('muscle') || k.includes('diet') || k.includes('flexibility')).length,
        petSpecific: Object.keys(SUPPLEMENTARY_OPTION_SETS).filter(k => k.includes('pet') || k.includes('coat') || k.includes('energy') || k.includes('social')).length
      }
    };

    logger.info('Supplementary option sets summary:', summary);
    return summary;

  } catch (error) {
    logger.error('Error during supplementary option sets seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in main seeder
export default seedSupplementaryOptionSets;