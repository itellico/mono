import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  children?: CategoryData[];
}

interface TagData {
  name: string;
  slug: string;
  description: string;
  categorySlug?: string;
}

// Platform generic categories with subcategories
const platformCategories: CategoryData[] = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Technology and software development related content',
    children: [
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Frontend, backend, and full-stack web development'
      },
      {
        name: 'Mobile Development',
        slug: 'mobile-development',
        description: 'iOS, Android, and cross-platform mobile development'
      },
      {
        name: 'DevOps',
        slug: 'devops',
        description: 'Development operations, CI/CD, and infrastructure'
      },
      {
        name: 'AI & Machine Learning',
        slug: 'ai-ml',
        description: 'Artificial intelligence and machine learning topics'
      }
    ]
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Business strategy, operations, and management',
    children: [
      {
        name: 'Marketing',
        slug: 'marketing',
        description: 'Digital marketing, SEO, and growth strategies'
      },
      {
        name: 'Sales',
        slug: 'sales',
        description: 'Sales techniques, CRM, and customer relations'
      },
      {
        name: 'Finance',
        slug: 'finance',
        description: 'Financial planning, accounting, and investments'
      },
      {
        name: 'Human Resources',
        slug: 'human-resources',
        description: 'HR management, recruiting, and employee relations'
      }
    ]
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Educational resources and learning materials',
    children: [
      {
        name: 'Online Courses',
        slug: 'online-courses',
        description: 'E-learning and digital education platforms'
      },
      {
        name: 'Tutorials',
        slug: 'tutorials',
        description: 'Step-by-step guides and how-to content'
      },
      {
        name: 'Certifications',
        slug: 'certifications',
        description: 'Professional certifications and credentials'
      }
    ]
  }
];

// Industry-specific categories
const industryCategories: CategoryData[] = [
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Healthcare industry specific content',
    children: [
      {
        name: 'Medical Technology',
        slug: 'medical-technology',
        description: 'Medical devices, telemedicine, and health tech'
      },
      {
        name: 'Healthcare Management',
        slug: 'healthcare-management',
        description: 'Hospital administration and healthcare operations'
      },
      {
        name: 'Patient Care',
        slug: 'patient-care',
        description: 'Patient experience and care delivery'
      }
    ]
  },
  {
    name: 'E-commerce',
    slug: 'e-commerce',
    description: 'Online retail and e-commerce specific content',
    children: [
      {
        name: 'Online Marketplaces',
        slug: 'online-marketplaces',
        description: 'Marketplace platforms and multi-vendor systems'
      },
      {
        name: 'Payment Systems',
        slug: 'payment-systems',
        description: 'Payment gateways and transaction processing'
      },
      {
        name: 'Inventory Management',
        slug: 'inventory-management',
        description: 'Stock control and warehouse management'
      }
    ]
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Real estate industry specific content',
    children: [
      {
        name: 'Property Management',
        slug: 'property-management',
        description: 'Rental properties and property maintenance'
      },
      {
        name: 'Real Estate Tech',
        slug: 'real-estate-tech',
        description: 'PropTech and real estate technology solutions'
      },
      {
        name: 'Market Analysis',
        slug: 'market-analysis',
        description: 'Real estate market trends and analytics'
      }
    ]
  }
];

// Tags that can be associated with categories
const tags: TagData[] = [
  // Technology tags
  { name: 'JavaScript', slug: 'javascript', description: 'JavaScript programming language', categorySlug: 'web-development' },
  { name: 'TypeScript', slug: 'typescript', description: 'TypeScript programming language', categorySlug: 'web-development' },
  { name: 'React', slug: 'react', description: 'React framework', categorySlug: 'web-development' },
  { name: 'Next.js', slug: 'nextjs', description: 'Next.js framework', categorySlug: 'web-development' },
  { name: 'Node.js', slug: 'nodejs', description: 'Node.js runtime', categorySlug: 'web-development' },
  { name: 'Python', slug: 'python', description: 'Python programming language', categorySlug: 'ai-ml' },
  { name: 'Docker', slug: 'docker', description: 'Docker containerization', categorySlug: 'devops' },
  { name: 'Kubernetes', slug: 'kubernetes', description: 'Kubernetes orchestration', categorySlug: 'devops' },
  { name: 'AWS', slug: 'aws', description: 'Amazon Web Services', categorySlug: 'devops' },
  { name: 'Swift', slug: 'swift', description: 'Swift programming language', categorySlug: 'mobile-development' },
  { name: 'Kotlin', slug: 'kotlin', description: 'Kotlin programming language', categorySlug: 'mobile-development' },
  
  // Business tags
  { name: 'SEO', slug: 'seo', description: 'Search Engine Optimization', categorySlug: 'marketing' },
  { name: 'Social Media', slug: 'social-media', description: 'Social media marketing', categorySlug: 'marketing' },
  { name: 'Content Marketing', slug: 'content-marketing', description: 'Content marketing strategies', categorySlug: 'marketing' },
  { name: 'B2B', slug: 'b2b', description: 'Business to business', categorySlug: 'sales' },
  { name: 'B2C', slug: 'b2c', description: 'Business to consumer', categorySlug: 'sales' },
  { name: 'CRM', slug: 'crm', description: 'Customer Relationship Management', categorySlug: 'sales' },
  
  // General tags
  { name: 'Beginner', slug: 'beginner', description: 'Suitable for beginners' },
  { name: 'Advanced', slug: 'advanced', description: 'Advanced level content' },
  { name: 'Free', slug: 'free', description: 'Free resources' },
  { name: 'Premium', slug: 'premium', description: 'Premium content' },
  { name: 'Tutorial', slug: 'tutorial', description: 'Tutorial content' },
  { name: 'Guide', slug: 'guide', description: 'Comprehensive guides' },
  { name: 'Best Practices', slug: 'best-practices', description: 'Industry best practices' },
  { name: 'Case Study', slug: 'case-study', description: 'Real-world case studies' }
];

async function seedCategories() {
  logger.info('Starting category and tag seeding...');

  try {
    // Clear existing data
    logger.info('Clearing existing categories and tags...');
    await prisma.categoryTag.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.category.deleteMany({});

    // Seed platform categories
    logger.info('Seeding platform categories...');
    const categoryMap = new Map<string, number>();

    for (const category of [...platformCategories, ...industryCategories]) {
      const parent = await prisma.category.create({
        data: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          isActive: true
        }
      });
      
      categoryMap.set(category.slug, parent.id);
      logger.info(`Created parent category: ${category.name}`);

      // Create children
      if (category.children) {
        for (const child of category.children) {
          const childCategory = await prisma.category.create({
            data: {
              name: child.name,
              slug: child.slug,
              description: child.description,
              parentId: parent.id,
              isActive: true
            }
          });
          
          categoryMap.set(child.slug, childCategory.id);
          logger.info(`  Created child category: ${child.name}`);
        }
      }
    }

    // Seed tags
    logger.info('Seeding tags...');
    const tagMap = new Map<string, number>();

    for (const tag of tags) {
      const createdTag = await prisma.tag.create({
        data: {
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          isActive: true
        }
      });
      
      tagMap.set(tag.slug, createdTag.id);
      logger.info(`Created tag: ${tag.name}`);

      // Associate with category if specified
      if (tag.categorySlug && categoryMap.has(tag.categorySlug)) {
        await prisma.categoryTag.create({
          data: {
            categoryId: categoryMap.get(tag.categorySlug)!,
            tagId: createdTag.id
          }
        });
        logger.info(`  Linked to category: ${tag.categorySlug}`);
      }
    }

    // Create some additional category-tag associations
    logger.info('Creating additional category-tag associations...');
    
    // Associate general tags with multiple categories
    const generalTags = ['beginner', 'advanced', 'free', 'premium', 'tutorial', 'guide'];
    const techCategories = ['web-development', 'mobile-development', 'devops', 'ai-ml'];
    
    for (const tagSlug of generalTags) {
      const tagId = tagMap.get(tagSlug);
      if (tagId) {
        for (const catSlug of techCategories) {
          const catId = categoryMap.get(catSlug);
          if (catId) {
            // Check if association already exists
            const existing = await prisma.categoryTag.findUnique({
              where: {
                categoryId_tagId: {
                  categoryId: catId,
                  tagId: tagId
                }
              }
            });
            
            if (!existing) {
              await prisma.categoryTag.create({
                data: {
                  categoryId: catId,
                  tagId: tagId
                }
              });
              logger.info(`  Associated ${tagSlug} with ${catSlug}`);
            }
          }
        }
      }
    }

    // Get final counts
    const categoryCount = await prisma.category.count();
    const tagCount = await prisma.tag.count();
    const associationCount = await prisma.categoryTag.count();

    logger.info(`\nSeeding completed successfully!`);
    logger.info(`- Categories created: ${categoryCount}`);
    logger.info(`- Tags created: ${tagCount}`);
    logger.info(`- Category-Tag associations: ${associationCount}`);

  } catch (error) {
    logger.error('Error seeding categories and tags:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedCategories()
  .then(() => {
    logger.info('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });