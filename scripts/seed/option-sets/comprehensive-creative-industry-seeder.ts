import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * Comprehensive Creative Industry Option Sets Seeder
 * 
 * Covers modeling, casting, voiceovers, photography, production, and all creative industry needs
 * with proper regional mappings and industry-specific requirements.
 */

// Regional mapping helper
const createRegionalMappings = (baseValue: string, conversions: Record<string, string> = {}) => ({
  US: conversions.US || baseValue,
  UK: conversions.UK || baseValue,
  EU: conversions.EU || baseValue,
  Asia: conversions.Asia || baseValue,
  ...conversions
});

// Generate height ranges for different age groups
const generateHeightRange = (minCm: number, maxCm: number, step: number = 5) => {
  const heights = [];
  for (let cm = minCm; cm <= maxCm; cm += step) {
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    const feetInches = `${feet}'${inches}"`;
    
    heights.push({
      value: cm.toString(),
      label: `${cm} cm`,
      order: cm - minCm,
      canonicalRegion: 'GLOBAL',
      regionalMappings: createRegionalMappings(`${cm} cm`, {
        US: feetInches,
        UK: feetInches
      })
    });
  }
  return heights;
};

// Generate weight ranges
const generateWeightRange = (minKg: number, maxKg: number, step: number = 5) => {
  const weights = [];
  for (let kg = minKg; kg <= maxKg; kg += step) {
    const lbs = Math.round(kg * 2.20462);
    
    weights.push({
      value: kg.toString(),
      label: `${kg} kg`,
      order: kg - minKg,
      canonicalRegion: 'GLOBAL',
      regionalMappings: createRegionalMappings(`${kg} kg`, {
        US: `${lbs} lbs`
      })
    });
  }
  return weights;
};

export const COMPREHENSIVE_OPTION_SETS = {
  // ===========================================
  // PHYSICAL MEASUREMENTS
  // ===========================================
  
  // Height ranges by age category
  height_baby: {
    slug: 'height_baby',
    label: 'Height - Baby (0-2 years)',
    description: 'Height measurements for baby models in centimeters',
    values: generateHeightRange(30, 95, 5)
  },
  
  height_child: {
    slug: 'height_child',
    label: 'Height - Child (3-12 years)',
    description: 'Height measurements for child models in centimeters',
    values: generateHeightRange(60, 160, 5)
  },
  
  height_teen: {
    slug: 'height_teen',
    label: 'Height - Teen (13-17 years)',
    description: 'Height measurements for teen models in centimeters',
    values: generateHeightRange(130, 200, 2)
  },
  
  height_adult: {
    slug: 'height_adult',
    label: 'Height - Adult (18+ years)',
    description: 'Height measurements for adult models in centimeters',
    values: generateHeightRange(140, 220, 1)
  },
  
  // Weight ranges by category
  weight_baby: {
    slug: 'weight_baby',
    label: 'Weight - Baby (0-2 years)',
    description: 'Weight measurements for baby models in kilograms',
    values: generateWeightRange(3, 20, 1)
  },
  
  weight_child: {
    slug: 'weight_child',
    label: 'Weight - Child (3-12 years)', 
    description: 'Weight measurements for child models in kilograms',
    values: generateWeightRange(10, 60, 2)
  },
  
  weight_adult: {
    slug: 'weight_adult',
    label: 'Weight - Adult (18+ years)',
    description: 'Weight measurements for adult models in kilograms',
    values: generateWeightRange(35, 150, 1)
  },

  // Body measurements
  chest_bust: {
    slug: 'chest_bust',
    label: 'Chest/Bust Measurement',
    description: 'Chest or bust measurements in centimeters',
    values: Array.from({length: 81}, (_, i) => {
      const cm = 60 + i;
      const inches = Math.round(cm / 2.54);
      return {
        value: cm.toString(),
        label: `${cm} cm`,
        order: i,
        canonicalRegion: 'GLOBAL',
        regionalMappings: createRegionalMappings(`${cm} cm`, {
          US: `${inches}"`,
          UK: `${inches}"`
        })
      };
    })
  },

  waist: {
    slug: 'waist',
    label: 'Waist Measurement',
    description: 'Waist measurements in centimeters',
    values: Array.from({length: 71}, (_, i) => {
      const cm = 50 + i;
      const inches = Math.round(cm / 2.54);
      return {
        value: cm.toString(),
        label: `${cm} cm`,
        order: i,
        canonicalRegion: 'GLOBAL',
        regionalMappings: createRegionalMappings(`${cm} cm`, {
          US: `${inches}"`,
          UK: `${inches}"`
        })
      };
    })
  },

  hips: {
    slug: 'hips',
    label: 'Hip Measurement',
    description: 'Hip measurements in centimeters',
    values: Array.from({length: 81}, (_, i) => {
      const cm = 70 + i;
      const inches = Math.round(cm / 2.54);
      return {
        value: cm.toString(),
        label: `${cm} cm`,
        order: i,
        canonicalRegion: 'GLOBAL',
        regionalMappings: createRegionalMappings(`${cm} cm`, {
          US: `${inches}"`,
          UK: `${inches}"`
        })
      };
    })
  },

  // ===========================================
  // PHYSICAL ATTRIBUTES
  // ===========================================
  
  eye_colors: {
    slug: 'eye_colors',
    label: 'Eye Colors',
    description: 'Eye color options with regional translations',
    values: [
      { value: 'brown', label: 'Brown', order: 1, regionalMappings: createRegionalMappings('Brown', { EU: 'Marron', Asia: 'Brown' })},
      { value: 'blue', label: 'Blue', order: 2, regionalMappings: createRegionalMappings('Blue', { EU: 'Bleu' })},
      { value: 'green', label: 'Green', order: 3, regionalMappings: createRegionalMappings('Green', { EU: 'Vert' })},
      { value: 'hazel', label: 'Hazel', order: 4, regionalMappings: createRegionalMappings('Hazel', { EU: 'Noisette' })},
      { value: 'amber', label: 'Amber', order: 5, regionalMappings: createRegionalMappings('Amber', { EU: 'Ambre' })},
      { value: 'gray', label: 'Gray', order: 6, regionalMappings: createRegionalMappings('Gray', { EU: 'Gris' })},
      { value: 'violet', label: 'Violet', order: 7, regionalMappings: createRegionalMappings('Violet')},
      { value: 'heterochromia', label: 'Heterochromia (Different Colors)', order: 8, regionalMappings: createRegionalMappings('Heterochromia')}
    ]
  },

  hair_colors: {
    slug: 'hair_colors',
    label: 'Hair Colors',
    description: 'Natural and dyed hair color options',
    values: [
      { value: 'black', label: 'Black', order: 1, regionalMappings: createRegionalMappings('Black', { EU: 'Noir' })},
      { value: 'dark_brown', label: 'Dark Brown', order: 2, regionalMappings: createRegionalMappings('Dark Brown', { EU: 'Brun Foncé' })},
      { value: 'brown', label: 'Brown', order: 3, regionalMappings: createRegionalMappings('Brown', { EU: 'Brun' })},
      { value: 'light_brown', label: 'Light Brown', order: 4, regionalMappings: createRegionalMappings('Light Brown', { EU: 'Brun Clair' })},
      { value: 'dark_blonde', label: 'Dark Blonde', order: 5, regionalMappings: createRegionalMappings('Dark Blonde', { EU: 'Blond Foncé' })},
      { value: 'blonde', label: 'Blonde', order: 6, regionalMappings: createRegionalMappings('Blonde', { EU: 'Blond' })},
      { value: 'light_blonde', label: 'Light Blonde', order: 7, regionalMappings: createRegionalMappings('Light Blonde', { EU: 'Blond Clair' })},
      { value: 'platinum', label: 'Platinum Blonde', order: 8, regionalMappings: createRegionalMappings('Platinum Blonde', { EU: 'Blond Platine' })},
      { value: 'red', label: 'Red', order: 9, regionalMappings: createRegionalMappings('Red', { EU: 'Roux' })},
      { value: 'auburn', label: 'Auburn', order: 10, regionalMappings: createRegionalMappings('Auburn')},
      { value: 'strawberry_blonde', label: 'Strawberry Blonde', order: 11, regionalMappings: createRegionalMappings('Strawberry Blonde')},
      { value: 'gray', label: 'Gray', order: 12, regionalMappings: createRegionalMappings('Gray', { EU: 'Gris' })},
      { value: 'white', label: 'White', order: 13, regionalMappings: createRegionalMappings('White', { EU: 'Blanc' })},
      { value: 'silver', label: 'Silver', order: 14, regionalMappings: createRegionalMappings('Silver', { EU: 'Argent' })},
      { value: 'other', label: 'Other/Dyed', order: 15, regionalMappings: createRegionalMappings('Other/Dyed', { EU: 'Autre/Teint' })}
    ]
  },

  hair_types: {
    slug: 'hair_types',
    label: 'Hair Types & Textures',
    description: 'Hair texture and styling characteristics',
    values: [
      { value: 'straight', label: 'Straight (Type 1)', order: 1 },
      { value: 'wavy_loose', label: 'Loose Waves (Type 2A)', order: 2 },
      { value: 'wavy_moderate', label: 'Moderate Waves (Type 2B)', order: 3 },
      { value: 'wavy_strong', label: 'Strong Waves (Type 2C)', order: 4 },
      { value: 'curly_loose', label: 'Loose Curls (Type 3A)', order: 5 },
      { value: 'curly_springy', label: 'Springy Curls (Type 3B)', order: 6 },
      { value: 'curly_tight', label: 'Tight Curls (Type 3C)', order: 7 },
      { value: 'coily_soft', label: 'Soft Coils (Type 4A)', order: 8 },
      { value: 'coily_wiry', label: 'Wiry Coils (Type 4B)', order: 9 },
      { value: 'coily_tight', label: 'Tight Coils (Type 4C)', order: 10 }
    ]
  },

  hair_lengths: {
    slug: 'hair_lengths',
    label: 'Hair Lengths',
    description: 'Hair length categories for modeling',
    values: [
      { value: 'bald', label: 'Bald/Shaved', order: 1 },
      { value: 'buzz', label: 'Buzz Cut', order: 2 },
      { value: 'very_short', label: 'Very Short (Pixie)', order: 3 },
      { value: 'short', label: 'Short (Bob)', order: 4 },
      { value: 'shoulder', label: 'Shoulder Length', order: 5 },
      { value: 'medium', label: 'Medium (Mid-Back)', order: 6 },
      { value: 'long', label: 'Long (Lower Back)', order: 7 },
      { value: 'very_long', label: 'Very Long (Waist+)', order: 8 }
    ]
  },

  skin_tones: {
    slug: 'skin_tones',
    label: 'Skin Tones',
    description: 'Inclusive skin tone representation for diverse casting',
    values: [
      { value: 'very_fair', label: 'Very Fair', order: 1 },
      { value: 'fair', label: 'Fair', order: 2 },
      { value: 'light', label: 'Light', order: 3 },
      { value: 'light_medium', label: 'Light Medium', order: 4 },
      { value: 'medium', label: 'Medium', order: 5 },
      { value: 'medium_dark', label: 'Medium Dark', order: 6 },
      { value: 'dark', label: 'Dark', order: 7 },
      { value: 'very_dark', label: 'Very Dark', order: 8 },
      { value: 'deep', label: 'Deep', order: 9 }
    ]
  },

  // ===========================================
  // CLOTHING SIZES WITH REGIONAL MAPPINGS
  // ===========================================
  
  clothing_women: {
    slug: 'clothing_women',
    label: 'Women\'s Clothing Sizes',
    description: 'Women\'s clothing sizes with international conversions',
    values: [
      { value: 'XXS', label: 'XXS', order: 1, regionalMappings: createRegionalMappings('XXS', { US: 'XXS (00)', UK: 'UK 2', EU: 'EU 30', Asia: 'XS' })},
      { value: 'XS', label: 'XS', order: 2, regionalMappings: createRegionalMappings('XS', { US: 'XS (0-2)', UK: 'UK 4-6', EU: 'EU 32-34', Asia: 'S' })},
      { value: 'S', label: 'S', order: 3, regionalMappings: createRegionalMappings('S', { US: 'S (4-6)', UK: 'UK 8-10', EU: 'EU 36-38', Asia: 'M' })},
      { value: 'M', label: 'M', order: 4, regionalMappings: createRegionalMappings('M', { US: 'M (8-10)', UK: 'UK 12-14', EU: 'EU 40-42', Asia: 'L' })},
      { value: 'L', label: 'L', order: 5, regionalMappings: createRegionalMappings('L', { US: 'L (12-14)', UK: 'UK 16-18', EU: 'EU 44-46', Asia: 'XL' })},
      { value: 'XL', label: 'XL', order: 6, regionalMappings: createRegionalMappings('XL', { US: 'XL (16-18)', UK: 'UK 20-22', EU: 'EU 48-50', Asia: 'XXL' })},
      { value: 'XXL', label: 'XXL', order: 7, regionalMappings: createRegionalMappings('XXL', { US: 'XXL (20-22)', UK: 'UK 24-26', EU: 'EU 52-54', Asia: 'XXXL' })},
      { value: '3XL', label: '3XL', order: 8, regionalMappings: createRegionalMappings('3XL', { US: '3XL (24-26)', UK: 'UK 28-30', EU: 'EU 56-58', Asia: '4XL' })},
      { value: '4XL', label: '4XL', order: 9, regionalMappings: createRegionalMappings('4XL', { US: '4XL (28-30)', UK: 'UK 32-34', EU: 'EU 60-62', Asia: '5XL' })}
    ]
  },

  clothing_men: {
    slug: 'clothing_men',
    label: 'Men\'s Clothing Sizes',
    description: 'Men\'s clothing sizes with international conversions',
    values: [
      { value: 'XS', label: 'XS', order: 1, regionalMappings: createRegionalMappings('XS', { US: 'XS (32-34)', UK: 'XS (32-34)', EU: 'EU 42-44', Asia: 'S' })},
      { value: 'S', label: 'S', order: 2, regionalMappings: createRegionalMappings('S', { US: 'S (36-38)', UK: 'S (36-38)', EU: 'EU 46-48', Asia: 'M' })},
      { value: 'M', label: 'M', order: 3, regionalMappings: createRegionalMappings('M', { US: 'M (40-42)', UK: 'M (40-42)', EU: 'EU 50-52', Asia: 'L' })},
      { value: 'L', label: 'L', order: 4, regionalMappings: createRegionalMappings('L', { US: 'L (44-46)', UK: 'L (44-46)', EU: 'EU 54-56', Asia: 'XL' })},
      { value: 'XL', label: 'XL', order: 5, regionalMappings: createRegionalMappings('XL', { US: 'XL (48-50)', UK: 'XL (48-50)', EU: 'EU 58-60', Asia: 'XXL' })},
      { value: 'XXL', label: 'XXL', order: 6, regionalMappings: createRegionalMappings('XXL', { US: 'XXL (52-54)', UK: 'XXL (52-54)', EU: 'EU 62-64', Asia: 'XXXL' })},
      { value: '3XL', label: '3XL', order: 7, regionalMappings: createRegionalMappings('3XL', { US: '3XL (56-58)', UK: '3XL (56-58)', EU: 'EU 66-68', Asia: '4XL' })},
      { value: '4XL', label: '4XL', order: 8, regionalMappings: createRegionalMappings('4XL', { US: '4XL (60-62)', UK: '4XL (60-62)', EU: 'EU 70-72', Asia: '5XL' })}
    ]
  },

  // ===========================================
  // MODELING CATEGORIES & SPECIALIZATIONS
  // ===========================================
  
  modeling_categories: {
    slug: 'modeling_categories',
    label: 'Modeling Categories',
    description: 'Primary modeling specializations and categories',
    values: [
      { value: 'fashion', label: 'Fashion/Editorial', order: 1 },
      { value: 'commercial', label: 'Commercial/Lifestyle', order: 2 },
      { value: 'fitness', label: 'Fitness/Sports', order: 3 },
      { value: 'glamour', label: 'Glamour/Beauty', order: 4 },
      { value: 'lingerie', label: 'Lingerie/Swimwear', order: 5 },
      { value: 'plus_size', label: 'Plus Size', order: 6 },
      { value: 'petite', label: 'Petite', order: 7 },
      { value: 'mature', label: 'Mature/Silver', order: 8 },
      { value: 'alternative', label: 'Alternative/Tattooed', order: 9 },
      { value: 'parts', label: 'Parts (Hand/Foot/Hair)', order: 10 },
      { value: 'promotional', label: 'Promotional/Trade Show', order: 11 },
      { value: 'artistic', label: 'Artistic/Fine Art', order: 12 }
    ]
  },

  fitness_specialties: {
    slug: 'fitness_specialties',
    label: 'Fitness & Sports Specialties',
    description: 'Fitness modeling and athletic specializations',
    values: [
      { value: 'bodybuilding', label: 'Bodybuilding', order: 1 },
      { value: 'physique', label: 'Men\'s/Women\'s Physique', order: 2 },
      { value: 'bikini', label: 'Bikini Competition', order: 3 },
      { value: 'figure', label: 'Figure Competition', order: 4 },
      { value: 'crossfit', label: 'CrossFit', order: 5 },
      { value: 'powerlifting', label: 'Powerlifting', order: 6 },
      { value: 'yoga', label: 'Yoga/Pilates', order: 7 },
      { value: 'running', label: 'Running/Marathon', order: 8 },
      { value: 'cycling', label: 'Cycling', order: 9 },
      { value: 'swimming', label: 'Swimming/Aquatic', order: 10 },
      { value: 'martial_arts', label: 'Martial Arts/MMA', order: 11 },
      { value: 'dance', label: 'Dance/Movement', order: 12 },
      { value: 'climbing', label: 'Rock Climbing/Outdoor', order: 13 },
      { value: 'team_sports', label: 'Team Sports', order: 14 },
      { value: 'wellness', label: 'Wellness/Lifestyle', order: 15 }
    ]
  },

  // ===========================================
  // VOICE & AUDIO CAPABILITIES
  // ===========================================
  
  voice_types: {
    slug: 'voice_types',
    label: 'Voice Types & Classifications',
    description: 'Vocal range and type classifications',
    values: [
      { value: 'soprano', label: 'Soprano (High Female)', order: 1 },
      { value: 'mezzo_soprano', label: 'Mezzo-Soprano (Mid Female)', order: 2 },
      { value: 'alto', label: 'Alto (Low Female)', order: 3 },
      { value: 'countertenor', label: 'Countertenor (High Male)', order: 4 },
      { value: 'tenor', label: 'Tenor (High Male)', order: 5 },
      { value: 'baritone', label: 'Baritone (Mid Male)', order: 6 },
      { value: 'bass', label: 'Bass (Low Male)', order: 7 },
      { value: 'child', label: 'Child Voice', order: 8 },
      { value: 'elderly', label: 'Elderly/Mature Voice', order: 9 }
    ]
  },

  voice_ages: {
    slug: 'voice_ages',
    label: 'Voice Age Ranges',
    description: 'Age representations for voice acting',
    values: [
      { value: 'baby', label: 'Baby (0-2)', order: 1 },
      { value: 'toddler', label: 'Toddler (3-5)', order: 2 },
      { value: 'child', label: 'Child (6-12)', order: 3 },
      { value: 'teen', label: 'Teen (13-17)', order: 4 },
      { value: 'young_adult', label: 'Young Adult (18-25)', order: 5 },
      { value: 'adult', label: 'Adult (26-40)', order: 6 },
      { value: 'middle_aged', label: 'Middle Aged (41-55)', order: 7 },
      { value: 'mature', label: 'Mature (56-70)', order: 8 },
      { value: 'elderly', label: 'Elderly (70+)', order: 9 }
    ]
  },

  accents_languages: {
    slug: 'accents_languages',
    label: 'Accents & Languages',
    description: 'Language capabilities and accent specializations',
    values: [
      // English Accents
      { value: 'american_general', label: 'General American English', order: 1 },
      { value: 'american_southern', label: 'Southern American', order: 2 },
      { value: 'american_new_york', label: 'New York Accent', order: 3 },
      { value: 'american_california', label: 'California/Valley', order: 4 },
      { value: 'british_rp', label: 'British RP (Received Pronunciation)', order: 5 },
      { value: 'british_cockney', label: 'Cockney', order: 6 },
      { value: 'british_scottish', label: 'Scottish', order: 7 },
      { value: 'british_irish', label: 'Irish', order: 8 },
      { value: 'british_welsh', label: 'Welsh', order: 9 },
      { value: 'australian', label: 'Australian', order: 10 },
      { value: 'canadian', label: 'Canadian', order: 11 },
      { value: 'south_african', label: 'South African', order: 12 },
      
      // Other Languages
      { value: 'spanish_spain', label: 'Spanish (Spain)', order: 13 },
      { value: 'spanish_latin', label: 'Spanish (Latin American)', order: 14 },
      { value: 'french', label: 'French', order: 15 },
      { value: 'german', label: 'German', order: 16 },
      { value: 'italian', label: 'Italian', order: 17 },
      { value: 'portuguese', label: 'Portuguese', order: 18 },
      { value: 'russian', label: 'Russian', order: 19 },
      { value: 'mandarin', label: 'Mandarin Chinese', order: 20 },
      { value: 'japanese', label: 'Japanese', order: 21 },
      { value: 'korean', label: 'Korean', order: 22 },
      { value: 'hindi', label: 'Hindi', order: 23 },
      { value: 'arabic', label: 'Arabic', order: 24 },
      { value: 'dutch', label: 'Dutch', order: 25 },
      { value: 'norwegian', label: 'Norwegian', order: 26 },
      { value: 'swedish', label: 'Swedish', order: 27 },
      { value: 'danish', label: 'Danish', order: 28 }
    ]
  },

  voice_styles: {
    slug: 'voice_styles',
    label: 'Voice Acting Styles',
    description: 'Voice acting and delivery style specializations',
    values: [
      { value: 'conversational', label: 'Conversational/Natural', order: 1 },
      { value: 'authoritative', label: 'Authoritative/Professional', order: 2 },
      { value: 'warm_friendly', label: 'Warm & Friendly', order: 3 },
      { value: 'energetic', label: 'Energetic/Upbeat', order: 4 },
      { value: 'calm_soothing', label: 'Calm & Soothing', order: 5 },
      { value: 'dramatic', label: 'Dramatic/Theatrical', order: 6 },
      { value: 'character', label: 'Character Voices', order: 7 },
      { value: 'narrator', label: 'Narrator/Documentary', order: 8 },
      { value: 'commercial', label: 'Commercial/Advertising', order: 9 },
      { value: 'educational', label: 'Educational/E-Learning', order: 10 },
      { value: 'animation', label: 'Animation/Cartoon', order: 11 },
      { value: 'video_game', label: 'Video Game', order: 12 },
      { value: 'audiobook', label: 'Audiobook/Literary', order: 13 },
      { value: 'ivr', label: 'IVR/Phone Systems', order: 14 },
      { value: 'singing', label: 'Singing/Musical', order: 15 }
    ]
  },

  // ===========================================
  // PET MODEL SPECIALIZATIONS
  // ===========================================
  
  pet_species: {
    slug: 'pet_species',
    label: 'Pet Species',
    description: 'Animal species for pet modeling',
    values: [
      { value: 'dog', label: 'Dog', order: 1 },
      { value: 'cat', label: 'Cat', order: 2 },
      { value: 'horse', label: 'Horse', order: 3 },
      { value: 'bird', label: 'Bird', order: 4 },
      { value: 'rabbit', label: 'Rabbit', order: 5 },
      { value: 'reptile', label: 'Reptile', order: 6 },
      { value: 'farm_animal', label: 'Farm Animal', order: 7 },
      { value: 'exotic', label: 'Exotic Pet', order: 8 },
      { value: 'aquatic', label: 'Aquatic Animal', order: 9 }
    ]
  },

  pet_sizes: {
    slug: 'pet_sizes',
    label: 'Pet Size Categories',
    description: 'Size classifications for pets',
    values: [
      { value: 'tiny', label: 'Tiny (Under 5 lbs)', order: 1 },
      { value: 'small', label: 'Small (5-25 lbs)', order: 2 },
      { value: 'medium', label: 'Medium (25-60 lbs)', order: 3 },
      { value: 'large', label: 'Large (60-100 lbs)', order: 4 },
      { value: 'giant', label: 'Giant (Over 100 lbs)', order: 5 }
    ]
  },

  pet_temperaments: {
    slug: 'pet_temperaments',
    label: 'Pet Temperaments',
    description: 'Behavioral characteristics and temperaments',
    values: [
      { value: 'calm', label: 'Calm & Relaxed', order: 1 },
      { value: 'friendly', label: 'Friendly & Social', order: 2 },
      { value: 'energetic', label: 'Energetic & Playful', order: 3 },
      { value: 'trained', label: 'Well-Trained', order: 4 },
      { value: 'gentle', label: 'Gentle & Patient', order: 5 },
      { value: 'photogenic', label: 'Camera-Friendly', order: 6 },
      { value: 'good_with_kids', label: 'Good with Children', order: 7 },
      { value: 'good_with_pets', label: 'Good with Other Pets', order: 8 },
      { value: 'travel_ready', label: 'Travel-Friendly', order: 9 },
      { value: 'quiet', label: 'Quiet/Non-Vocal', order: 10 }
    ]
  },

  pet_skills: {
    slug: 'pet_skills',
    label: 'Pet Skills & Tricks',
    description: 'Trained skills and tricks for performance',
    values: [
      { value: 'basic_obedience', label: 'Basic Obedience (Sit, Stay, Come)', order: 1 },
      { value: 'advanced_commands', label: 'Advanced Commands', order: 2 },
      { value: 'tricks', label: 'Tricks (Roll Over, Play Dead)', order: 3 },
      { value: 'agility', label: 'Agility Training', order: 4 },
      { value: 'fetch', label: 'Fetch/Retrieve', order: 5 },
      { value: 'dancing', label: 'Dancing/Choreography', order: 6 },
      { value: 'speaking', label: 'Speaking on Command', order: 7 },
      { value: 'modeling_poses', label: 'Modeling Poses', order: 8 },
      { value: 'product_interaction', label: 'Product Interaction', order: 9 },
      { value: 'emotional_expression', label: 'Emotional Expression', order: 10 }
    ]
  },

  // ===========================================
  // CREATIVE INDUSTRY ROLES
  // ===========================================
  
  photography_styles: {
    slug: 'photography_styles',
    label: 'Photography Styles',
    description: 'Photography specializations and styles',
    values: [
      { value: 'portrait', label: 'Portrait Photography', order: 1 },
      { value: 'fashion', label: 'Fashion Photography', order: 2 },
      { value: 'commercial', label: 'Commercial Photography', order: 3 },
      { value: 'editorial', label: 'Editorial Photography', order: 4 },
      { value: 'beauty', label: 'Beauty Photography', order: 5 },
      { value: 'lifestyle', label: 'Lifestyle Photography', order: 6 },
      { value: 'product', label: 'Product Photography', order: 7 },
      { value: 'architectural', label: 'Architectural Photography', order: 8 },
      { value: 'event', label: 'Event Photography', order: 9 },
      { value: 'documentary', label: 'Documentary Photography', order: 10 },
      { value: 'artistic', label: 'Fine Art Photography', order: 11 },
      { value: 'street', label: 'Street Photography', order: 12 }
    ]
  },

  makeup_specialties: {
    slug: 'makeup_specialties', 
    label: 'Makeup & Beauty Specialties',
    description: 'Makeup artistry and beauty specializations',
    values: [
      { value: 'beauty', label: 'Beauty Makeup', order: 1 },
      { value: 'fashion', label: 'Fashion/Editorial Makeup', order: 2 },
      { value: 'bridal', label: 'Bridal Makeup', order: 3 },
      { value: 'theatrical', label: 'Theatrical Makeup', order: 4 },
      { value: 'special_effects', label: 'Special Effects (SFX)', order: 5 },
      { value: 'film_tv', label: 'Film & TV Makeup', order: 6 },
      { value: 'commercial', label: 'Commercial Makeup', order: 7 },
      { value: 'avant_garde', label: 'Avant-Garde/Creative', order: 8 },
      { value: 'airbrush', label: 'Airbrush Makeup', order: 9 },
      { value: 'prosthetics', label: 'Prosthetics & Character', order: 10 },
      { value: 'hair_styling', label: 'Hair Styling', order: 11 },
      { value: 'body_painting', label: 'Body Painting', order: 12 }
    ]
  },

  // ===========================================
  // AVAILABILITY & LOGISTICS
  // ===========================================
  
  availability_types: {
    slug: 'availability_types',
    label: 'Availability Types',
    description: 'Work availability and scheduling preferences',
    values: [
      { value: 'full_time', label: 'Full-Time Available', order: 1 },
      { value: 'part_time', label: 'Part-Time Available', order: 2 },
      { value: 'weekends_only', label: 'Weekends Only', order: 3 },
      { value: 'evenings', label: 'Evenings Available', order: 4 },
      { value: 'flexible', label: 'Flexible Schedule', order: 5 },
      { value: 'seasonal', label: 'Seasonal Work', order: 6 },
      { value: 'project_based', label: 'Project-Based Only', order: 7 },
      { value: 'emergency', label: 'Emergency/Last Minute', order: 8 }
    ]
  },

  travel_willingness: {
    slug: 'travel_willingness',
    label: 'Travel Willingness',
    description: 'Geographic availability and travel preferences',
    values: [
      { value: 'local_only', label: 'Local Only (Same City)', order: 1 },
      { value: 'regional', label: 'Regional (Within State/Province)', order: 2 },
      { value: 'national', label: 'National Travel', order: 3 },
      { value: 'international', label: 'International Travel', order: 4 },
      { value: 'worldwide', label: 'Worldwide Available', order: 5 },
      { value: 'no_overnight', label: 'Day Trips Only (No Overnight)', order: 6 },
      { value: 'extended_travel', label: 'Extended Travel (Weeks/Months)', order: 7 }
    ]
  },

  notice_requirements: {
    slug: 'notice_requirements',
    label: 'Booking Notice Requirements',
    description: 'Advance notice needed for bookings',
    values: [
      { value: 'same_day', label: 'Same Day Available', order: 1 },
      { value: '24_hours', label: '24 Hours Notice', order: 2 },
      { value: '48_hours', label: '48 Hours Notice', order: 3 },
      { value: '1_week', label: '1 Week Notice', order: 4 },
      { value: '2_weeks', label: '2 Weeks Notice', order: 5 },
      { value: '1_month', label: '1 Month Notice', order: 6 },
      { value: '2_months', label: '2+ Months Notice', order: 7 }
    ]
  },

  // ===========================================
  // EXPERIENCE LEVELS & RATINGS
  // ===========================================
  
  experience_levels: {
    slug: 'experience_levels',
    label: 'Experience Levels',
    description: 'Professional experience classifications',
    values: [
      { value: 'beginner', label: 'Beginner (0-1 years)', order: 1 },
      { value: 'amateur', label: 'Amateur (1-2 years)', order: 2 },
      { value: 'semi_professional', label: 'Semi-Professional (2-5 years)', order: 3 },
      { value: 'professional', label: 'Professional (5-10 years)', order: 4 },
      { value: 'expert', label: 'Expert (10+ years)', order: 5 },
      { value: 'master', label: 'Master/Industry Leader (15+ years)', order: 6 }
    ]
  },

  union_status: {
    slug: 'union_status',
    label: 'Union Memberships',
    description: 'Professional union and organization memberships',
    values: [
      { value: 'non_union', label: 'Non-Union', order: 1 },
      { value: 'sag_aftra', label: 'SAG-AFTRA', order: 2 },
      { value: 'equity', label: 'Actors Equity', order: 3 },
      { value: 'iatse', label: 'IATSE', order: 4 },
      { value: 'model_guild', label: 'Model Guild', order: 5 },
      { value: 'international', label: 'International Union', order: 6 },
      { value: 'eligible', label: 'Union Eligible', order: 7 }
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
    logger.info(`Creating option set: ${data.slug}`);
    
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

    logger.info(`Created option set ${data.slug} with ${optionValues.length} values`);
    return { optionSet, optionValues };
  } catch (error) {
    logger.error(`Error creating option set ${data.slug}:`, error);
    throw error;
  }
}

/**
 * Main seeder function
 */
export async function seedComprehensiveCreativeIndustryOptionSets() {
  try {
    logger.info('Starting comprehensive creative industry option sets seeding...');

    const results = [];
    
    for (const [key, optionSetData] of Object.entries(COMPREHENSIVE_OPTION_SETS)) {
      try {
        const result = await createOptionSet(optionSetData);
        results.push(result);
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Failed to create option set ${key}:`, error);
        // Continue with other option sets even if one fails
      }
    }

    logger.info(`Comprehensive creative industry seeding completed. Created ${results.length} option sets.`);
    
    // Summary of what was created
    const summary = {
      totalOptionSets: results.length,
      totalValues: results.reduce((sum, result) => sum + result.optionValues.length, 0),
      categories: {
        physicalMeasurements: Object.keys(COMPREHENSIVE_OPTION_SETS).filter(k => k.startsWith('height_') || k.startsWith('weight_') || k.includes('chest') || k.includes('waist') || k.includes('hips')).length,
        physicalAttributes: Object.keys(COMPREHENSIVE_OPTION_SETS).filter(k => k.includes('eye_') || k.includes('hair_') || k.includes('skin_')).length,
        clothingSizes: Object.keys(COMPREHENSIVE_OPTION_SETS).filter(k => k.startsWith('clothing_')).length,
        modelingSpecialties: Object.keys(COMPREHENSIVE_OPTION_SETS).filter(k => k.includes('modeling_') || k.includes('fitness_')).length,
        voiceCapabilities: Object.keys(COMPREHENSIVE_OPTION_SETS).filter(k => k.startsWith('voice_') || k.includes('accents_')).length,
        petSpecializations: Object.keys(COMPREHENSIVE_OPTION_SETS).filter(k => k.startsWith('pet_')).length,
        creativeRoles: Object.keys(COMPREHENSIVE_OPTION_SETS).filter(k => k.includes('photography_') || k.includes('makeup_')).length,
        logistics: Object.keys(COMPREHENSIVE_OPTION_SETS).filter(k => k.includes('availability_') || k.includes('travel_') || k.includes('notice_')).length,
        professional: Object.keys(COMPREHENSIVE_OPTION_SETS).filter(k => k.includes('experience_') || k.includes('union_')).length
      }
    };

    logger.info('Seeding summary:', summary);
    return summary;

  } catch (error) {
    logger.error('Error during comprehensive creative industry seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in main seeder
export default seedComprehensiveCreativeIndustryOptionSets;