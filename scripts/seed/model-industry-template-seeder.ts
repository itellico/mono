import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Model industry template specifically for go-models.com and similar platforms
const modelIndustryTemplate = {
  name: 'Model Talent Marketplace',
  slug: 'model-talent-marketplace',
  description: 'Perfect for modeling agencies, talent scouts, photographers, and modeling platforms',
  category: 'creative',
  industry: 'modeling-talent',
  complexity: 'medium',
  setupTimeMinutes: 50,
  popularity: 88,
  targetUserTypes: ['models', 'photographers', 'agencies', 'casting-directors', 'brands'],
  primaryColor: '#E91E63',
  secondaryColor: '#F48FB1',
  accentColor: '#FF5722',
  defaultSettings: {
    enablePortfolios: true,
    requirePortfolioApproval: true,
    enablePhotoVerification: true,
    allowDirectBooking: true,
    escrowRequired: true,
    disputeResolution: 'mediation',
    commissionRate: 15,
    minimumBookingValue: 100,
    enableMeasurements: true,
    enableExperienceLevel: true,
    enableLocationServices: true,
    requireBackgroundChecks: false,
    enableInstantMessaging: true,
    allowVideoPortfolios: true,
    enableCastingCallAlerts: true,
  },
  defaultCategories: [
    { name: 'Fashion Models', slug: 'fashion-models', icon: 'user-circle' },
    { name: 'Commercial Models', slug: 'commercial-models', icon: 'briefcase' },
    { name: 'Fitness Models', slug: 'fitness-models', icon: 'activity' },
    { name: 'Hand & Parts Models', slug: 'hand-parts-models', icon: 'hand' },
    { name: 'Plus Size Models', slug: 'plus-size-models', icon: 'users' },
    { name: 'Child Models', slug: 'child-models', icon: 'baby' },
    { name: 'Senior Models', slug: 'senior-models', icon: 'user-check' },
    { name: 'Photographers', slug: 'photographers', icon: 'camera' },
    { name: 'Makeup Artists', slug: 'makeup-artists', icon: 'palette' },
    { name: 'Stylists', slug: 'stylists', icon: 'scissors' },
  ],
  defaultTags: [
    'runway', 'editorial', 'commercial', 'lifestyle', 'beauty', 'glamour',
    'fashion', 'portrait', 'headshots', 'full-body', 'lingerie', 'swimwear',
    'athletic', 'mature', 'alternative', 'petite', 'tall', 'curvy',
    'published', 'experienced', 'new-face', 'agency-represented', 'freelance',
    'studio-work', 'outdoor', 'travel-ready', 'wardrobe-provided',
  ],
  defaultRoles: [
    { name: 'Model', permissions: ['portfolio:create', 'bookings:accept', 'profile:manage'] },
    { name: 'Photographer', permissions: ['models:search', 'bookings:create', 'gallery:manage'] },
    { name: 'Agency', permissions: ['models:manage', 'bookings:negotiate', 'contracts:create'] },
    { name: 'Casting Director', permissions: ['casting:create', 'models:search', 'callbacks:manage'] },
    { name: 'Brand Manager', permissions: ['campaigns:create', 'models:book', 'content:approve'] },
  ],
  requiredFeatures: ['portfolios', 'photo-verification', 'messaging', 'payments', 'search'],
  recommendedFeatures: ['video-portfolios', 'casting-alerts', 'location-services', 'analytics'],
  emailTemplates: {
    welcome: 'Welcome to our modeling platform! Complete your portfolio to get discovered.',
    profileApproved: 'Congratulations! Your modeling profile has been approved and is now live.',
    bookingRequest: 'You have received a new booking request. Review the details and respond.',
    castingAlert: 'New casting call matches your profile! Apply now to secure your spot.',
    paymentReceived: 'Payment confirmed! Your modeling fee has been processed successfully.',
    portfolioFeedback: 'Your portfolio has been reviewed. Check out the feedback from our team.',
  },
};

async function seedModelIndustryTemplate() {
  try {
    console.log('🌱 Seeding model industry template...');

    // Check if template already exists
    const existingTemplate = await prisma.industryTemplate.findUnique({
      where: { slug: modelIndustryTemplate.slug },
    });

    if (existingTemplate) {
      console.log('ℹ️  Model industry template already exists, updating...');
      
      const updated = await prisma.industryTemplate.update({
        where: { slug: modelIndustryTemplate.slug },
        data: {
          ...modelIndustryTemplate,
          defaultSettings: modelIndustryTemplate.defaultSettings as any,
          defaultCategories: modelIndustryTemplate.defaultCategories as any,
          defaultTags: modelIndustryTemplate.defaultTags as any,
          defaultRoles: modelIndustryTemplate.defaultRoles as any,
          defaultPermissions: [],
          defaultWorkflows: [],
          emailTemplates: modelIndustryTemplate.emailTemplates as any,
          isActive: true,
          isDefault: false,
        },
      });

      console.log(`✅ Updated template: ${updated.name} (${updated.slug})`);
    } else {
      // Create new template
      const created = await prisma.industryTemplate.create({
        data: {
          ...modelIndustryTemplate,
          defaultSettings: modelIndustryTemplate.defaultSettings as any,
          defaultCategories: modelIndustryTemplate.defaultCategories as any,
          defaultTags: modelIndustryTemplate.defaultTags as any,
          defaultRoles: modelIndustryTemplate.defaultRoles as any,
          defaultPermissions: [],
          defaultWorkflows: [],
          emailTemplates: modelIndustryTemplate.emailTemplates as any,
          isActive: true,
          isDefault: false,
        },
      });

      console.log(`✅ Created template: ${created.name} (${created.slug})`);
    }

    console.log('🎉 Model industry template seeded successfully!');
    console.log('📝 Template Features:');
    console.log('   - Portfolio management with photo verification');
    console.log('   - Model measurements and experience tracking');
    console.log('   - Casting call alerts and applications');
    console.log('   - Direct booking system with escrow');
    console.log('   - Multi-role support (models, photographers, agencies, etc.)');
    console.log('   - Location-based services for shoots');
    console.log('   - Comprehensive messaging system');
    console.log('   - Payment processing with model protection');

  } catch (error) {
    console.error('❌ Error seeding model industry template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedModelIndustryTemplate().catch(console.error);
}

export { seedModelIndustryTemplate };