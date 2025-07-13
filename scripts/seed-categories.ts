#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const db = new PrismaClient();

/**
 * Comprehensive Categories Seeder
 * 
 * Creates a complete category hierarchy for the itellico Mono
 * marketplace, including creative industry categories, business types,
 * and content organization categories.
 */

const CATEGORIES_DATA = [
  // CREATIVE INDUSTRY CATEGORIES
  {
    name: 'Fashion & Modeling',
    slug: 'fashion-modeling',
    description: 'Fashion modeling, runway, commercial, and editorial work',
    children: [
      { name: 'Runway Modeling', slug: 'runway-modeling', description: 'High fashion runway shows and presentations' },
      { name: 'Commercial Modeling', slug: 'commercial-modeling', description: 'Product advertising and commercial photography' },
      { name: 'Editorial Modeling', slug: 'editorial-modeling', description: 'Magazine editorials and artistic fashion photography' },
      { name: 'Plus Size Modeling', slug: 'plus-size-modeling', description: 'Plus size and curve modeling opportunities' },
      { name: 'Petite Modeling', slug: 'petite-modeling', description: 'Petite and shorter model opportunities' },
      { name: 'Parts Modeling', slug: 'parts-modeling', description: 'Hand, foot, hair, and body parts modeling' }
    ]
  },
  {
    name: 'Acting & Performance',
    slug: 'acting-performance',
    description: 'Acting opportunities in film, TV, theater, and digital media',
    children: [
      { name: 'Film Acting', slug: 'film-acting', description: 'Movie roles and film productions' },
      { name: 'Television Acting', slug: 'television-acting', description: 'TV shows, series, and broadcast content' },
      { name: 'Theater Acting', slug: 'theater-acting', description: 'Stage performances and theatrical productions' },
      { name: 'Voice Acting', slug: 'voice-acting', description: 'Voice-over work and audio performances' },
      { name: 'Commercial Acting', slug: 'commercial-acting', description: 'TV commercials and advertising campaigns' },
      { name: 'Background Acting', slug: 'background-acting', description: 'Extra work and background performances' }
    ]
  },
  {
    name: 'Photography & Visual Arts',
    slug: 'photography-visual-arts',
    description: 'Photography services and visual creative work',
    children: [
      { name: 'Portrait Photography', slug: 'portrait-photography', description: 'Professional headshots and portrait sessions' },
      { name: 'Fashion Photography', slug: 'fashion-photography', description: 'Fashion shoots and style photography' },
      { name: 'Event Photography', slug: 'event-photography', description: 'Events, weddings, and special occasions' },
      { name: 'Commercial Photography', slug: 'commercial-photography', description: 'Product and commercial photography' },
      { name: 'Art Direction', slug: 'art-direction', description: 'Creative direction for photo and video shoots' },
      { name: 'Photo Editing', slug: 'photo-editing', description: 'Digital retouching and photo post-production' }
    ]
  },
  {
    name: 'Music & Audio',
    slug: 'music-audio',
    description: 'Music performance, production, and audio services',
    children: [
      { name: 'Vocal Performance', slug: 'vocal-performance', description: 'Singing and vocal performances' },
      { name: 'Instrumental Music', slug: 'instrumental-music', description: 'Instrument playing and musical performances' },
      { name: 'Music Production', slug: 'music-production', description: 'Music recording and production services' },
      { name: 'Sound Engineering', slug: 'sound-engineering', description: 'Audio engineering and sound design' },
      { name: 'Jingle Creation', slug: 'jingle-creation', description: 'Commercial jingles and audio branding' },
      { name: 'Podcast Production', slug: 'podcast-production', description: 'Podcast recording and production' }
    ]
  },
  {
    name: 'Dance & Movement',
    slug: 'dance-movement',
    description: 'Dance performances, choreography, and movement arts',
    children: [
      { name: 'Contemporary Dance', slug: 'contemporary-dance', description: 'Modern and contemporary dance performances' },
      { name: 'Ballet', slug: 'ballet', description: 'Classical ballet performances and training' },
      { name: 'Hip Hop Dance', slug: 'hip-hop-dance', description: 'Hip hop and street dance styles' },
      { name: 'Ballroom Dance', slug: 'ballroom-dance', description: 'Ballroom and social dance performances' },
      { name: 'Choreography', slug: 'choreography', description: 'Dance choreography and movement direction' },
      { name: 'Dance Instruction', slug: 'dance-instruction', description: 'Dance teaching and instruction services' }
    ]
  },
  {
    name: 'Beauty & Wellness',
    slug: 'beauty-wellness',
    description: 'Beauty services, wellness, and personal care',
    children: [
      { name: 'Makeup Artistry', slug: 'makeup-artistry', description: 'Professional makeup application and artistry' },
      { name: 'Hair Styling', slug: 'hair-styling', description: 'Hair styling and salon services' },
      { name: 'Skincare Services', slug: 'skincare-services', description: 'Esthetics and skincare treatments' },
      { name: 'Nail Artistry', slug: 'nail-artistry', description: 'Nail art and manicure services' },
      { name: 'Fitness Coaching', slug: 'fitness-coaching', description: 'Personal training and fitness instruction' },
      { name: 'Wellness Coaching', slug: 'wellness-coaching', description: 'Holistic wellness and lifestyle coaching' }
    ]
  },

  // TALENT DEMOGRAPHICS
  {
    name: 'Age Demographics',
    slug: 'age-demographics',
    description: 'Age-based talent categories and specializations',
    children: [
      { name: 'Baby & Toddler (0-2)', slug: 'baby-toddler', description: 'Infant and toddler talent with guardian support' },
      { name: 'Child (3-12)', slug: 'child', description: 'Child performers with educational coordination' },
      { name: 'Teen (13-17)', slug: 'teen', description: 'Teenage talent with transitional independence' },
      { name: 'Young Adult (18-25)', slug: 'young-adult', description: 'Young professional talent' },
      { name: 'Adult (26-45)', slug: 'adult', description: 'Experienced adult performers' },
      { name: 'Mature (45+)', slug: 'mature', description: 'Mature and senior talent' }
    ]
  },
  {
    name: 'Specialty Markets',
    slug: 'specialty-markets',
    description: 'Specialized market segments and unique opportunities',
    children: [
      { name: 'Plus Size', slug: 'plus-size', description: 'Plus size and curve talent representation' },
      { name: 'Petite', slug: 'petite', description: 'Petite and shorter stature opportunities' },
      { name: 'Disability Representation', slug: 'disability-representation', description: 'Inclusive opportunities for disabled talent' },
      { name: 'Cultural Authenticity', slug: 'cultural-authenticity', description: 'Culturally specific roles and representations' },
      { name: 'LGBTQ+ Representation', slug: 'lgbtq-representation', description: 'LGBTQ+ inclusive casting and opportunities' },
      { name: 'Alternative Looks', slug: 'alternative-looks', description: 'Tattoos, piercings, and alternative aesthetic' }
    ]
  },

  // BUSINESS & SERVICE CATEGORIES
  {
    name: 'Creative Services',
    slug: 'creative-services',
    description: 'Professional creative and production services',
    children: [
      { name: 'Casting Services', slug: 'casting-services', description: 'Casting directors and talent selection' },
      { name: 'Talent Management', slug: 'talent-management', description: 'Talent representation and career management' },
      { name: 'Production Services', slug: 'production-services', description: 'Video and photo production support' },
      { name: 'Location Services', slug: 'location-services', description: 'Venue and location management' },
      { name: 'Wardrobe Styling', slug: 'wardrobe-styling', description: 'Fashion styling and wardrobe services' },
      { name: 'Event Planning', slug: 'event-planning', description: 'Creative event planning and coordination' }
    ]
  },
  {
    name: 'Technical Services',
    slug: 'technical-services',
    description: 'Technical and production support services',
    children: [
      { name: 'Video Production', slug: 'video-production', description: 'Video filming and production services' },
      { name: 'Audio Engineering', slug: 'audio-engineering', description: 'Sound recording and audio production' },
      { name: 'Lighting Design', slug: 'lighting-design', description: 'Professional lighting for shoots and events' },
      { name: 'Set Design', slug: 'set-design', description: 'Set construction and design services' },
      { name: 'Equipment Rental', slug: 'equipment-rental', description: 'Camera, lighting, and production equipment' },
      { name: 'Post Production', slug: 'post-production', description: 'Video editing and post-production services' }
    ]
  },

  // CONTENT & MEDIA CATEGORIES
  {
    name: 'Digital Content',
    slug: 'digital-content',
    description: 'Digital media and online content creation',
    children: [
      { name: 'Social Media Content', slug: 'social-media-content', description: 'Content creation for social platforms' },
      { name: 'Influencer Marketing', slug: 'influencer-marketing', description: 'Brand partnerships and influencer campaigns' },
      { name: 'YouTube Creation', slug: 'youtube-creation', description: 'YouTube video content and channel management' },
      { name: 'TikTok Content', slug: 'tiktok-content', description: 'Short-form video content for TikTok' },
      { name: 'Live Streaming', slug: 'live-streaming', description: 'Live streaming and real-time content' },
      { name: 'Digital Marketing', slug: 'digital-marketing', description: 'Online marketing and promotional content' }
    ]
  },
  {
    name: 'Traditional Media',
    slug: 'traditional-media',
    description: 'Traditional media and broadcast opportunities',
    children: [
      { name: 'Television', slug: 'television', description: 'TV shows, news, and broadcast content' },
      { name: 'Radio', slug: 'radio', description: 'Radio shows, commercials, and audio broadcasting' },
      { name: 'Print Media', slug: 'print-media', description: 'Magazines, newspapers, and print advertising' },
      { name: 'Outdoor Advertising', slug: 'outdoor-advertising', description: 'Billboards and outdoor promotional content' },
      { name: 'Direct Mail', slug: 'direct-mail', description: 'Direct mail campaigns and promotional materials' },
      { name: 'Packaging', slug: 'packaging', description: 'Product packaging and commercial photography' }
    ]
  }
];

async function seedCategories() {
  try {
    logger.info('🏷️ Starting Categories Seeder...');
    logger.info('Creating comprehensive category hierarchy for itellico Mono marketplace\n');

    let categoriesCreated = 0;
    let categoriesSkipped = 0;
    let subcategoriesCreated = 0;

    for (const categoryData of CATEGORIES_DATA) {
      // Check if parent category exists
      let parentCategory = await db.category.findFirst({
        where: { slug: categoryData.slug }
      });

      if (!parentCategory) {
        parentCategory = await db.category.create({
          data: {
            name: categoryData.name,
            slug: categoryData.slug,
            description: categoryData.description,
            isActive: true
          }
        });
        logger.info(`✅ Created parent category: ${categoryData.name}`);
        categoriesCreated++;
      } else {
        logger.info(`⏭️ Parent category exists: ${categoryData.name}`);
        categoriesSkipped++;
      }

      // Create child categories
      if (categoryData.children && categoryData.children.length > 0) {
        for (let i = 0; i < categoryData.children.length; i++) {
          const childData = categoryData.children[i];
          
          const existingChild = await db.category.findFirst({
            where: { slug: childData.slug }
          });

          if (!existingChild) {
            await db.category.create({
              data: {
                name: childData.name,
                slug: childData.slug,
                description: childData.description,
                parentId: parentCategory.id,
                isActive: true
              }
            });
            logger.info(`  ├─ Created subcategory: ${childData.name}`);
            subcategoriesCreated++;
          }
        }
      }
    }

    // Final verification
    const totalCategories = await db.category.count();
    const parentCategories = await db.category.count({ where: { parentId: null } });
    const childCategories = await db.category.count({ where: { parentId: { not: null } } });

    logger.info('\n📊 SEEDING COMPLETE!');
    logger.info('=====================================');
    logger.info(`✨ Parent Categories Created: ${categoriesCreated}`);
    logger.info(`📂 Subcategories Created: ${subcategoriesCreated}`);
    logger.info(`⏭️ Categories Skipped: ${categoriesSkipped}`);
    logger.info(`📋 Total Categories: ${totalCategories}`);
    logger.info(`🌳 Parent Categories: ${parentCategories}`);
    logger.info(`🍃 Child Categories: ${childCategories}`);

    logger.info('\n🎉 Category hierarchy successfully created!');
    logger.info('Categories available for:');
    logger.info('  📸 Fashion & Modeling opportunities');
    logger.info('  🎭 Acting & Performance roles');
    logger.info('  📷 Photography & Visual Arts');
    logger.info('  🎵 Music & Audio services');
    logger.info('  💃 Dance & Movement arts');
    logger.info('  💄 Beauty & Wellness services');
    logger.info('  👶 Age-specific demographics');
    logger.info('  ⭐ Specialty market segments');
    logger.info('  🛠️ Creative & Technical services');
    logger.info('  📱 Digital & Traditional media');

    return {
      totalCategories,
      parentCategories,
      childCategories,
      categoriesCreated,
      subcategoriesCreated,
      categoriesSkipped
    };

  } catch (error) {
    logger.error('❌ Categories seeder failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seedCategories()
    .then(() => {
      logger.info('✅ Categories seeder completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Categories seeder failed:', error);
      process.exit(1);
    });
}

export default seedCategories;