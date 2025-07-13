#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const db = new PrismaClient();

/**
 * Comprehensive Tags Seeder
 * 
 * Creates tags that complement our creative industry categories.
 * Tags are cross-cutting labels that can apply to multiple categories.
 */

const CREATIVE_INDUSTRY_TAGS = [
  // SKILL LEVEL TAGS
  { name: 'Beginner', slug: 'beginner', description: 'Suitable for those new to the field' },
  { name: 'Intermediate', slug: 'intermediate', description: 'For those with some experience' },
  { name: 'Advanced', slug: 'advanced', description: 'For experienced professionals' },
  { name: 'Professional', slug: 'professional', description: 'Industry professional level' },
  { name: 'Expert', slug: 'expert', description: 'Master level expertise' },

  // AVAILABILITY TAGS
  { name: 'Full-Time', slug: 'full-time', description: 'Available for full-time work' },
  { name: 'Part-Time', slug: 'part-time', description: 'Available for part-time work' },
  { name: 'Freelance', slug: 'freelance', description: 'Available for freelance projects' },
  { name: 'Contract', slug: 'contract', description: 'Available for contract work' },
  { name: 'Remote', slug: 'remote', description: 'Available for remote work' },
  { name: 'On-Location', slug: 'on-location', description: 'Available for on-location work' },
  { name: 'Travel Available', slug: 'travel-available', description: 'Willing to travel for work' },
  { name: 'Local Only', slug: 'local-only', description: 'Only available for local work' },

  // BUDGET TAGS
  { name: 'Budget-Friendly', slug: 'budget-friendly', description: 'Affordable rates' },
  { name: 'Mid-Range', slug: 'mid-range', description: 'Moderate pricing' },
  { name: 'Premium', slug: 'premium', description: 'Premium pricing tier' },
  { name: 'Luxury', slug: 'luxury', description: 'High-end luxury services' },
  { name: 'Negotiable', slug: 'negotiable', description: 'Rates negotiable' },

  // PROJECT TYPE TAGS
  { name: 'Commercial', slug: 'commercial', description: 'Commercial projects' },
  { name: 'Editorial', slug: 'editorial', description: 'Editorial work' },
  { name: 'Fashion', slug: 'fashion', description: 'Fashion-related projects' },
  { name: 'Beauty', slug: 'beauty', description: 'Beauty and cosmetics' },
  { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle content' },
  { name: 'Product', slug: 'product', description: 'Product photography/modeling' },
  { name: 'Brand', slug: 'brand', description: 'Brand campaigns' },
  { name: 'Campaign', slug: 'campaign', description: 'Marketing campaigns' },
  { name: 'Lookbook', slug: 'lookbook', description: 'Fashion lookbooks' },
  { name: 'Catalog', slug: 'catalog', description: 'Catalog photography' },

  // STYLE TAGS
  { name: 'Classic', slug: 'classic', description: 'Classic and timeless style' },
  { name: 'Modern', slug: 'modern', description: 'Contemporary and modern' },
  { name: 'Edgy', slug: 'edgy', description: 'Bold and edgy aesthetic' },
  { name: 'Minimalist', slug: 'minimalist', description: 'Clean and minimal style' },
  { name: 'Dramatic', slug: 'dramatic', description: 'High-impact dramatic style' },
  { name: 'Natural', slug: 'natural', description: 'Natural and authentic look' },
  { name: 'Glamorous', slug: 'glamorous', description: 'High-glamour aesthetic' },
  { name: 'Artistic', slug: 'artistic', description: 'Creative and artistic approach' },

  // TECHNICAL TAGS
  { name: 'Studio', slug: 'studio', description: 'Studio environment work' },
  { name: 'Outdoor', slug: 'outdoor', description: 'Outdoor location work' },
  { name: 'Natural Light', slug: 'natural-light', description: 'Natural lighting preferred' },
  { name: 'Artificial Light', slug: 'artificial-light', description: 'Studio lighting setup' },
  { name: 'High-End Retouching', slug: 'high-end-retouching', description: 'Professional retouching services' },
  { name: 'RAW Files', slug: 'raw-files', description: 'RAW file delivery available' },
  { name: 'Same-Day Delivery', slug: 'same-day-delivery', description: 'Quick turnaround available' },
  { name: '4K Video', slug: '4k-video', description: '4K video capabilities' },
  { name: 'Drone', slug: 'drone', description: 'Drone photography/videography' },

  // INDUSTRY SPECIALIZATION TAGS
  { name: 'Automotive', slug: 'automotive', description: 'Automotive industry specialization' },
  { name: 'Technology', slug: 'technology', description: 'Tech industry focus' },
  { name: 'Healthcare', slug: 'healthcare', description: 'Healthcare industry work' },
  { name: 'Real Estate', slug: 'real-estate', description: 'Real estate photography' },
  { name: 'Food & Beverage', slug: 'food-beverage', description: 'Food and beverage industry' },
  { name: 'Sports', slug: 'sports', description: 'Sports and athletics' },
  { name: 'Music', slug: 'music', description: 'Music industry work' },
  { name: 'Entertainment', slug: 'entertainment', description: 'Entertainment industry' },

  // DEMOGRAPHIC TAGS
  { name: 'Kids Friendly', slug: 'kids-friendly', description: 'Experience working with children' },
  { name: 'Senior Friendly', slug: 'senior-friendly', description: 'Experience with senior clients' },
  { name: 'Pet Friendly', slug: 'pet-friendly', description: 'Experience with animals/pets' },
  { name: 'Plus Size', slug: 'plus-size-specialist', description: 'Plus size specialization' },
  { name: 'Diversity Champion', slug: 'diversity-champion', description: 'Promotes diverse representation' },

  // EVENT TAGS
  { name: 'Wedding', slug: 'wedding', description: 'Wedding photography/services' },
  { name: 'Corporate Events', slug: 'corporate-events', description: 'Corporate event coverage' },
  { name: 'Fashion Shows', slug: 'fashion-shows', description: 'Fashion show documentation' },
  { name: 'Conferences', slug: 'conferences', description: 'Conference and trade show coverage' },
  { name: 'Parties', slug: 'parties', description: 'Party and celebration events' },

  // CREATIVE APPROACH TAGS
  { name: 'Collaborative', slug: 'collaborative', description: 'Collaborative creative process' },
  { name: 'Direction', slug: 'direction', description: 'Provides creative direction' },
  { name: 'Concept Development', slug: 'concept-development', description: 'Develops creative concepts' },
  { name: 'Mood Board', slug: 'mood-board', description: 'Creates detailed mood boards' },
  { name: 'Story-Driven', slug: 'story-driven', description: 'Narrative-focused approach' },

  // EQUIPMENT TAGS
  { name: 'Professional Equipment', slug: 'professional-equipment', description: 'High-end professional gear' },
  { name: 'Mobile Setup', slug: 'mobile-setup', description: 'Portable equipment setup' },
  { name: 'Lighting Equipment', slug: 'lighting-equipment', description: 'Professional lighting gear' },
  { name: 'Backup Equipment', slug: 'backup-equipment', description: 'Redundant equipment available' },

  // SOCIAL MEDIA TAGS
  { name: 'Instagram Ready', slug: 'instagram-ready', description: 'Optimized for Instagram' },
  { name: 'TikTok Content', slug: 'tiktok-content', description: 'TikTok-optimized content' },
  { name: 'Social Media', slug: 'social-media-content', description: 'Social media content creation' },
  { name: 'Viral Content', slug: 'viral-content', description: 'Viral-ready content creation' },

  // CERTIFICATION TAGS
  { name: 'Certified', slug: 'certified', description: 'Industry certified professional' },
  { name: 'Award Winner', slug: 'award-winner', description: 'Industry award recipient' },
  { name: 'Published', slug: 'published', description: 'Published work in major publications' },
  { name: 'Featured Artist', slug: 'featured-artist', description: 'Featured in major outlets' },

  // SUSTAINABILITY TAGS
  { name: 'Eco-Friendly', slug: 'eco-friendly', description: 'Environmentally conscious practices' },
  { name: 'Sustainable', slug: 'sustainable', description: 'Sustainable business practices' },
  { name: 'Ethical', slug: 'ethical', description: 'Ethical working practices' },

  // URGENCY TAGS
  { name: 'Rush Jobs', slug: 'rush-jobs', description: 'Available for urgent projects' },
  { name: 'Last Minute', slug: 'last-minute', description: 'Last-minute availability' },
  { name: 'Flexible Schedule', slug: 'flexible-schedule', description: 'Flexible scheduling available' },
  { name: 'Weekend Available', slug: 'weekend-available', description: 'Weekend work available' },

  // COLLABORATION TAGS
  { name: 'Team Player', slug: 'team-player', description: 'Excellent team collaboration' },
  { name: 'Client-Focused', slug: 'client-focused', description: 'Client satisfaction priority' },
  { name: 'Creative Partner', slug: 'creative-partner', description: 'True creative partnership approach' },
  { name: 'Mentorship', slug: 'mentorship', description: 'Provides mentorship and guidance' }
];

async function seedTags() {
  try {
    logger.info('🏷️ Starting Creative Industry Tags Seeder...');
    logger.info('Creating comprehensive tag system for itellico Mono marketplace\n');

    let tagsCreated = 0;
    let tagsSkipped = 0;

    for (const tagData of CREATIVE_INDUSTRY_TAGS) {
      // Check if tag exists
      const existingTag = await db.tag.findFirst({
        where: { slug: tagData.slug }
      });

      if (!existingTag) {
        await db.tag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug,
            description: tagData.description,
            isActive: true
          }
        });
        logger.info(`✅ Created tag: ${tagData.name}`);
        tagsCreated++;
      } else {
        logger.info(`⏭️ Tag exists: ${tagData.name}`);
        tagsSkipped++;
      }
    }

    // Final verification
    const totalTags = await db.tag.count();

    logger.info('\n📊 TAGS SEEDING COMPLETE!');
    logger.info('=====================================');
    logger.info(`✨ Tags Created: ${tagsCreated}`);
    logger.info(`⏭️ Tags Skipped: ${tagsSkipped}`);
    logger.info(`📋 Total Tags in DB: ${totalTags}`);

    logger.info('\n🎉 Creative industry tag system successfully created!');
    logger.info('Tags available for:');
    logger.info('  🎯 Skill levels (Beginner → Expert)');
    logger.info('  📅 Availability (Full-time, Freelance, Remote)');
    logger.info('  💰 Budget tiers (Budget-friendly → Luxury)');
    logger.info('  🎨 Project types (Commercial, Editorial, Fashion)');
    logger.info('  ✨ Style aesthetics (Classic, Modern, Edgy)');
    logger.info('  🔧 Technical capabilities (4K, Drone, Lighting)');
    logger.info('  🏢 Industry specializations (Automotive, Tech, Healthcare)');
    logger.info('  👥 Demographics (Kids, Seniors, Plus Size)');
    logger.info('  🎪 Event types (Weddings, Corporate, Fashion Shows)');
    logger.info('  🤝 Collaboration styles (Team Player, Client-Focused)');
    logger.info('  🌱 Values (Eco-Friendly, Ethical, Sustainable)');

    return {
      totalTags,
      tagsCreated,
      tagsSkipped
    };

  } catch (error) {
    logger.error('❌ Tags seeder failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seedTags()
    .then(() => {
      logger.info('✅ Tags seeder completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Tags seeder failed:', error);
      process.exit(1);
    });
}

export default seedTags;