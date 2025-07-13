import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

async function seedCategories() {
  logger.info('Seeding categories...');

  const categoriesData = [
    { name: 'Fashion Models', slug: 'fashion-models', description: 'Models for fashion, runway, and editorial.' },
    { name: 'Commercial Models', slug: 'commercial-models', description: 'Models for advertising, print, and TV commercials.' },
    { name: 'Fitness Models', slug: 'fitness-models', description: 'Models specializing in sports and fitness.' },
    { name: 'Parts Models', slug: 'parts-models', description: 'Models specializing in specific body parts (hands, feet, etc.).' },
    { name: 'Baby & Kids Models', slug: 'baby-kids-models', description: 'Models for baby and children\'s products.' },
    { name: 'Plus-Size Models', slug: 'plus-size-models', description: 'Models representing plus-size fashion.' },
    { name: 'Glamour Models', slug: 'glamour-models', description: 'Models for beauty and lifestyle campaigns.' },
    { name: 'Promotional Models', slug: 'promotional-models', description: 'Models for events, trade shows, and brand promotion.' },
    { name: 'Runway Models', slug: 'runway-models', description: 'Models for fashion shows and catwalks.' },
    { name: 'Editorial Models', slug: 'editorial-models', description: 'Models for magazine spreads and artistic concepts.' },
    { name: 'Print Models', slug: 'print-models', description: 'Models for magazines, brochures, and advertisements.' },
    { name: 'TV Commercial Models', slug: 'tv-commercial-models', description: 'Models for television advertisements.' },
    { name: 'E-commerce Models', slug: 'e-commerce-models', description: 'Models for online retail product display.' },
    { name: 'Beauty Models', slug: 'beauty-models', description: 'Models for makeup, skincare, and hair products.' },
    { name: 'Lifestyle Models', slug: 'lifestyle-models', description: 'Models portraying everyday life scenarios.' },
    { name: 'Swimwear Models', slug: 'swimwear-models', description: 'Models specializing in swimwear and beachwear.' },
    { name: 'Lingerie Models', slug: 'lingerie-models', description: 'Models specializing in lingerie.' },
    { name: 'Mature Models', slug: 'mature-models', description: 'Models representing older age groups.' },
    { name: 'Petite Models', slug: 'petite-models', description: 'Models with smaller stature.' },
    { name: 'Alternative Models', slug: 'alternative-models', description: 'Models with unique or unconventional looks.' },
  ];

  const createdCategories: any[] = [];

  for (const data of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });
    createdCategories.push(category);
    logger.info(`Seeded category: ${category.name}`);
  }

  // Create subcategories (example: 2 levels deep)
  const subcategoriesData = [
    { name: 'High Fashion', slug: 'high-fashion', parentSlug: 'fashion-models' },
    { name: 'Streetwear', slug: 'streetwear', parentSlug: 'fashion-models' },
    { name: 'Fitness Apparel', slug: 'fitness-apparel', parentSlug: 'fitness-models' },
    { name: 'Hand Models', slug: 'hand-models', parentSlug: 'parts-models' },
    { name: 'Foot Models', slug: 'foot-models', parentSlug: 'parts-models' },
    { name: 'Toddler Models', slug: 'toddler-models', parentSlug: 'baby-kids-models' },
    { name: 'Infant Models', slug: 'infant-models', parentSlug: 'baby-kids-models' },
  ];

  for (const data of subcategoriesData) {
    const parentCategory = createdCategories.find(cat => cat.slug === data.parentSlug);
    if (parentCategory) {
      const subcategory = await prisma.category.upsert({
        where: { slug: data.slug },
        update: { ...data, parentId: parentCategory.id },
        create: { ...data, parentId: parentCategory.id },
      });
      createdCategories.push(subcategory);
      logger.info(`Seeded subcategory: ${subcategory.name} under ${parentCategory.name}`);
    }
  }

  logger.info(`Finished seeding ${createdCategories.length} categories.`);
}

export default seedCategories;
