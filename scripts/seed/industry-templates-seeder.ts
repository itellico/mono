import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Predefined industry templates for different marketplace types
const industryTemplates = [
  {
    name: 'Creative Freelance Marketplace',
    slug: 'creative-freelance',
    description: 'Perfect for graphic designers, writers, video editors, and creative professionals',
    category: 'creative',
    industry: 'creative-services',
    complexity: 'medium',
    setupTimeMinutes: 45,
    popularity: 95,
    targetUserTypes: ['freelancers', 'creative-agencies', 'design-studios'],
    primaryColor: '#6366F1',
    secondaryColor: '#8B5CF6',
    accentColor: '#EF4444',
    defaultSettings: {
      enablePortfolios: true,
      requirePortfolioApproval: false,
      enableSkillTesting: true,
      allowDirectHiring: true,
      escrowRequired: true,
      disputeResolution: 'mediation',
      commissionRate: 10,
      minimumProjectValue: 50,
    },
    defaultCategories: [
      { name: 'Graphic Design', slug: 'graphic-design', icon: 'palette' },
      { name: 'Writing & Content', slug: 'writing-content', icon: 'edit' },
      { name: 'Video & Animation', slug: 'video-animation', icon: 'video' },
      { name: 'Web Development', slug: 'web-development', icon: 'code' },
      { name: 'Photography', slug: 'photography', icon: 'camera' },
      { name: 'Marketing', slug: 'marketing', icon: 'megaphone' },
    ],
    defaultTags: [
      'logo-design', 'branding', 'web-design', 'ui-ux', 'copywriting',
      'blog-writing', 'video-editing', 'motion-graphics', 'react', 'node-js',
      'wordpress', 'product-photography', 'social-media', 'seo', 'ppc',
    ],
    defaultRoles: [
      { name: 'Client', permissions: ['projects:create', 'freelancers:hire'] },
      { name: 'Freelancer', permissions: ['projects:apply', 'portfolio:manage'] },
      { name: 'Agency', permissions: ['team:manage', 'projects:subcontract'] },
    ],
    requiredFeatures: ['portfolios', 'messaging', 'payments', 'project-management'],
    recommendedFeatures: ['skill-testing', 'time-tracking', 'team-collaboration'],
    emailTemplates: {
      welcome: 'Welcome to our creative marketplace! Start building your portfolio.',
      projectPosted: 'Your project has been posted and is now visible to talented creatives.',
      applicationReceived: 'You received a new application for your project.',
    },
  },
  
  {
    name: 'Professional Services Marketplace',
    slug: 'professional-services',
    description: 'For consultants, lawyers, accountants, and business professionals',
    category: 'professional',
    industry: 'business-services',
    complexity: 'advanced',
    setupTimeMinutes: 60,
    popularity: 85,
    targetUserTypes: ['consultants', 'professionals', 'service-providers'],
    primaryColor: '#1F2937',
    secondaryColor: '#374151',
    accentColor: '#059669',
    defaultSettings: {
      requireVerification: true,
      enableCertifications: true,
      requireInsurance: true,
      allowHourlyRates: true,
      enableContractTemplates: true,
      disputeResolution: 'arbitration',
      commissionRate: 15,
      minimumProjectValue: 500,
    },
    defaultCategories: [
      { name: 'Business Consulting', slug: 'business-consulting', icon: 'briefcase' },
      { name: 'Legal Services', slug: 'legal-services', icon: 'scale' },
      { name: 'Accounting & Finance', slug: 'accounting-finance', icon: 'calculator' },
      { name: 'Marketing Strategy', slug: 'marketing-strategy', icon: 'trending-up' },
      { name: 'IT Consulting', slug: 'it-consulting', icon: 'server' },
      { name: 'HR Services', slug: 'hr-services', icon: 'users' },
    ],
    defaultTags: [
      'strategy', 'business-plan', 'market-research', 'legal-advice',
      'contracts', 'tax-preparation', 'bookkeeping', 'digital-marketing',
      'it-security', 'recruitment', 'compliance', 'risk-management',
    ],
    defaultRoles: [
      { name: 'Client', permissions: ['consultations:request', 'contracts:create'] },
      { name: 'Professional', permissions: ['services:offer', 'credentials:manage'] },
      { name: 'Firm', permissions: ['team:manage', 'clients:assign'] },
    ],
    requiredFeatures: ['verification', 'contracts', 'scheduling', 'payments'],
    recommendedFeatures: ['video-calls', 'document-sharing', 'compliance-tracking'],
    emailTemplates: {
      welcome: 'Welcome to our professional services platform. Complete your verification.',
      consultationBooked: 'Your consultation has been scheduled successfully.',
      documentShared: 'A new document has been shared with you.',
    },
  },

  {
    name: 'E-learning Marketplace',
    slug: 'elearning-marketplace',
    description: 'For instructors, trainers, and educational content creators',
    category: 'education',
    industry: 'online-education',
    complexity: 'medium',
    setupTimeMinutes: 40,
    popularity: 90,
    targetUserTypes: ['instructors', 'students', 'institutions'],
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    accentColor: '#F59E0B',
    defaultSettings: {
      enableCourseCreation: true,
      requireInstructorApproval: true,
      enableCertificates: true,
      allowSubscriptionModel: true,
      enableLiveStreaming: false,
      commissionRate: 20,
      minimumCoursePrice: 10,
    },
    defaultCategories: [
      { name: 'Programming', slug: 'programming', icon: 'code' },
      { name: 'Design', slug: 'design', icon: 'palette' },
      { name: 'Business', slug: 'business', icon: 'briefcase' },
      { name: 'Languages', slug: 'languages', icon: 'globe' },
      { name: 'Music', slug: 'music', icon: 'music' },
      { name: 'Photography', slug: 'photography', icon: 'camera' },
    ],
    defaultTags: [
      'beginner', 'intermediate', 'advanced', 'certification', 'hands-on',
      'theory', 'practical', 'project-based', 'self-paced', 'instructor-led',
    ],
    defaultRoles: [
      { name: 'Student', permissions: ['courses:enroll', 'progress:track'] },
      { name: 'Instructor', permissions: ['courses:create', 'students:interact'] },
      { name: 'Institution', permissions: ['courses:approve', 'instructors:manage'] },
    ],
    requiredFeatures: ['course-builder', 'video-hosting', 'progress-tracking', 'payments'],
    recommendedFeatures: ['live-streaming', 'assignments', 'discussion-forums'],
    emailTemplates: {
      welcome: 'Welcome to our learning platform! Start exploring courses.',
      courseEnrolled: 'You have successfully enrolled in a new course.',
      certificateEarned: 'Congratulations! You have earned a new certificate.',
    },
  },

  {
    name: 'Local Services Marketplace',
    slug: 'local-services',
    description: 'For home services, repair, maintenance, and local professionals',
    category: 'local',
    industry: 'home-services',
    complexity: 'simple',
    setupTimeMinutes: 30,
    popularity: 80,
    targetUserTypes: ['service-providers', 'homeowners', 'property-managers'],
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentColor: '#F97316',
    defaultSettings: {
      enableLocationServices: true,
      requireBackgroundChecks: true,
      enableInstantBooking: true,
      allowEmergencyServices: true,
      enableRealTimeTracking: true,
      commissionRate: 12,
      minimumServicePrice: 25,
    },
    defaultCategories: [
      { name: 'Cleaning', slug: 'cleaning', icon: 'sparkles' },
      { name: 'Plumbing', slug: 'plumbing', icon: 'wrench' },
      { name: 'Electrical', slug: 'electrical', icon: 'zap' },
      { name: 'Landscaping', slug: 'landscaping', icon: 'tree' },
      { name: 'Handyman', slug: 'handyman', icon: 'hammer' },
      { name: 'Pet Care', slug: 'pet-care', icon: 'heart' },
    ],
    defaultTags: [
      'same-day', 'emergency', 'licensed', 'insured', 'background-checked',
      'eco-friendly', 'residential', 'commercial', 'maintenance', 'repair',
    ],
    defaultRoles: [
      { name: 'Customer', permissions: ['services:book', 'providers:rate'] },
      { name: 'Provider', permissions: ['services:offer', 'bookings:manage'] },
      { name: 'Dispatcher', permissions: ['bookings:assign', 'routes:optimize'] },
    ],
    requiredFeatures: ['location-services', 'instant-booking', 'tracking', 'payments'],
    recommendedFeatures: ['background-checks', 'scheduling', 'route-optimization'],
    emailTemplates: {
      welcome: 'Welcome to our local services platform! Find trusted providers nearby.',
      serviceBooked: 'Your service has been booked successfully.',
      providerEnRoute: 'Your service provider is on the way!',
    },
  },

  {
    name: 'Healthcare Services Platform',
    slug: 'healthcare-services',
    description: 'For healthcare professionals, clinics, and medical services',
    category: 'healthcare',
    industry: 'healthcare',
    complexity: 'advanced',
    setupTimeMinutes: 90,
    popularity: 75,
    targetUserTypes: ['healthcare-providers', 'patients', 'clinics'],
    primaryColor: '#DC2626',
    secondaryColor: '#EF4444',
    accentColor: '#059669',
    defaultSettings: {
      requireMedicalLicense: true,
      enableTelehealth: true,
      requireHIPAACompliance: true,
      enablePrescriptions: false,
      enableInsuranceIntegration: true,
      commissionRate: 8,
      minimumConsultationFee: 50,
    },
    defaultCategories: [
      { name: 'General Practice', slug: 'general-practice', icon: 'user-md' },
      { name: 'Specialists', slug: 'specialists', icon: 'stethoscope' },
      { name: 'Mental Health', slug: 'mental-health', icon: 'brain' },
      { name: 'Telehealth', slug: 'telehealth', icon: 'video' },
      { name: 'Wellness', slug: 'wellness', icon: 'heart' },
      { name: 'Urgent Care', slug: 'urgent-care', icon: 'ambulance' },
    ],
    defaultTags: [
      'licensed', 'board-certified', 'telehealth', 'in-person', 'urgent',
      'preventive', 'chronic-care', 'mental-health', 'pediatric', 'geriatric',
    ],
    defaultRoles: [
      { name: 'Patient', permissions: ['appointments:book', 'records:view'] },
      { name: 'Provider', permissions: ['patients:treat', 'records:update'] },
      { name: 'Clinic Admin', permissions: ['providers:manage', 'scheduling:control'] },
    ],
    requiredFeatures: ['hipaa-compliance', 'telehealth', 'scheduling', 'secure-messaging'],
    recommendedFeatures: ['insurance-integration', 'prescription-management', 'ehr-integration'],
    emailTemplates: {
      welcome: 'Welcome to our healthcare platform. Your health is our priority.',
      appointmentBooked: 'Your appointment has been confirmed.',
      appointmentReminder: 'Reminder: You have an appointment tomorrow.',
    },
  },
];

async function seedIndustryTemplates() {
  try {
    console.log('🌱 Seeding industry templates...');

    // Clear existing templates
    await prisma.tenantIndustryTemplate.deleteMany();
    await prisma.industryTemplate.deleteMany();

    // Create industry templates
    for (const template of industryTemplates) {
      const created = await prisma.industryTemplate.create({
        data: {
          ...template,
          defaultSettings: template.defaultSettings as any,
          defaultCategories: template.defaultCategories as any,
          defaultTags: template.defaultTags as any,
          defaultRoles: template.defaultRoles as any,
          defaultPermissions: [],
          defaultWorkflows: [],
          emailTemplates: template.emailTemplates as any,
          isActive: true,
          isDefault: template.slug === 'creative-freelance', // Make creative freelance the default
        },
      });

      console.log(`✅ Created template: ${created.name} (${created.slug})`);
    }

    console.log('🎉 Industry templates seeded successfully!');
    console.log(`📊 Total templates created: ${industryTemplates.length}`);

  } catch (error) {
    console.error('❌ Error seeding industry templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedIndustryTemplates().catch(console.error);
}

export { seedIndustryTemplates };