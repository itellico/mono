import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Predefined feature sets for different marketplace functionality
const featureSets = [
  {
    name: 'Core Marketplace',
    slug: 'core-marketplace',
    description: 'Essential features for any marketplace platform',
    category: 'core',
    complexity: 'simple',
    resourceUsage: 'low',
    availableInTiers: ['free', 'pro', 'enterprise'],
    minimumTier: 'free',
    setupRequired: false,
    features: {
      userRegistration: { enabled: true, maxUsers: null },
      basicProfiles: { enabled: true, customFields: 5 },
      basicSearch: { enabled: true, filters: ['category', 'location', 'price'] },
      messaging: { enabled: true, attachments: false },
      basicListings: { enabled: true, maxListings: null },
    },
    permissions: [
      'users:read', 'users:update-own', 'listings:read', 'listings:create',
      'messages:read', 'messages:send', 'profiles:read', 'profiles:update-own'
    ],
    uiComponents: {
      userDashboard: true,
      basicSearch: true,
      listingCards: true,
      messageCenter: true,
      profileEditor: true,
    },
    navigationItems: {
      dashboard: { label: 'Dashboard', icon: 'home', route: '/dashboard' },
      browse: { label: 'Browse', icon: 'search', route: '/browse' },
      messages: { label: 'Messages', icon: 'chat', route: '/messages' },
      profile: { label: 'Profile', icon: 'user', route: '/profile' },
    },
    dependencies: [],
    conflicts: [],
  },

  {
    name: 'Advanced Search & Filtering',
    slug: 'advanced-search',
    description: 'Enhanced search capabilities with filters, sorting, and faceted search',
    category: 'search',
    complexity: 'medium',
    resourceUsage: 'medium',
    availableInTiers: ['pro', 'enterprise'],
    minimumTier: 'pro',
    setupRequired: true,
    features: {
      elasticSearch: { enabled: true, indexing: 'real-time' },
      advancedFilters: { enabled: true, customFilters: 20 },
      savedSearches: { enabled: true, maxSaved: 10 },
      searchAlerts: { enabled: true, emailNotifications: true },
      geoSearch: { enabled: true, radiusSearch: true },
      autoComplete: { enabled: true, suggestions: true },
    },
    permissions: [
      'search:advanced', 'search:save', 'search:alerts', 'search:geo',
      'filters:create', 'filters:manage'
    ],
    uiComponents: {
      advancedSearchForm: true,
      filterSidebar: true,
      mapView: true,
      savedSearches: true,
      searchAlerts: true,
    },
    navigationItems: {
      advancedSearch: { label: 'Advanced Search', icon: 'filter', route: '/search/advanced' },
      savedSearches: { label: 'Saved Searches', icon: 'bookmark', route: '/search/saved' },
    },
    dependencies: ['core-marketplace'],
    conflicts: [],
  },

  {
    name: 'Portfolio & Showcase',
    slug: 'portfolios',
    description: 'Allow users to create portfolios and showcase their work',
    category: 'profiles',
    complexity: 'medium',
    resourceUsage: 'medium',
    availableInTiers: ['free', 'pro', 'enterprise'],
    minimumTier: 'free',
    setupRequired: false,
    features: {
      portfolioCreation: { enabled: true, maxProjects: 10 },
      mediaGallery: { enabled: true, maxFiles: 50, fileSize: '10MB' },
      portfolioTemplates: { enabled: true, templates: 5 },
      customBranding: { enabled: false, logoUpload: false },
      portfolioAnalytics: { enabled: false, viewTracking: false },
    },
    permissions: [
      'portfolios:create', 'portfolios:update', 'portfolios:delete',
      'portfolios:view', 'media:upload', 'media:manage'
    ],
    uiComponents: {
      portfolioBuilder: true,
      portfolioViewer: true,
      mediaUploader: true,
      templateSelector: true,
      portfolioStats: false,
    },
    navigationItems: {
      portfolio: { label: 'Portfolio', icon: 'folder', route: '/portfolio' },
      projects: { label: 'Projects', icon: 'grid', route: '/portfolio/projects' },
    },
    dependencies: ['core-marketplace'],
    conflicts: [],
  },

  {
    name: 'Payment Processing',
    slug: 'payments',
    description: 'Secure payment processing with escrow and multiple payment methods',
    category: 'financial',
    complexity: 'advanced',
    resourceUsage: 'medium',
    availableInTiers: ['pro', 'enterprise'],
    minimumTier: 'pro',
    setupRequired: true,
    features: {
      stripeIntegration: { enabled: true, fees: '2.9% + 30¢' },
      paypalIntegration: { enabled: true, fees: '2.9% + 30¢' },
      escrowService: { enabled: true, releaseDelayDays: 7 },
      subscriptionBilling: { enabled: true, recurringPayments: true },
      refundProcessing: { enabled: true, autoRefunds: false },
      invoiceGeneration: { enabled: true, customTemplates: true },
    },
    permissions: [
      'payments:process', 'payments:refund', 'escrow:manage',
      'invoices:create', 'invoices:send', 'billing:manage'
    ],
    uiComponents: {
      paymentForm: true,
      escrowDashboard: true,
      invoiceBuilder: true,
      paymentHistory: true,
      refundInterface: true,
    },
    navigationItems: {
      payments: { label: 'Payments', icon: 'credit-card', route: '/payments' },
      invoices: { label: 'Invoices', icon: 'file-text', route: '/invoices' },
    },
    dependencies: ['core-marketplace'],
    conflicts: [],
  },

  {
    name: 'Project Management',
    slug: 'project-management',
    description: 'Collaborative project management tools with milestones and deliverables',
    category: 'productivity',
    complexity: 'advanced',
    resourceUsage: 'high',
    availableInTiers: ['pro', 'enterprise'],
    minimumTier: 'pro',
    setupRequired: false,
    features: {
      projectCreation: { enabled: true, maxProjects: null },
      milestoneTracking: { enabled: true, maxMilestones: 20 },
      fileSharing: { enabled: true, maxFileSize: '100MB' },
      timeTracking: { enabled: true, automaticTracking: false },
      kanbanBoards: { enabled: true, customColumns: true },
      ganttCharts: { enabled: false, dependencies: false },
    },
    permissions: [
      'projects:create', 'projects:manage', 'milestones:create',
      'files:share', 'time:track', 'boards:manage'
    ],
    uiComponents: {
      projectDashboard: true,
      milestoneTracker: true,
      fileManager: true,
      timeTracker: true,
      kanbanBoard: true,
    },
    navigationItems: {
      projects: { label: 'Projects', icon: 'briefcase', route: '/projects' },
      timesheet: { label: 'Time Tracking', icon: 'clock', route: '/time-tracking' },
    },
    dependencies: ['core-marketplace'],
    conflicts: [],
  },

  {
    name: 'Team Collaboration',
    slug: 'team-collaboration',
    description: 'Tools for team management and collaboration',
    category: 'collaboration',
    complexity: 'medium',
    resourceUsage: 'medium',
    availableInTiers: ['pro', 'enterprise'],
    minimumTier: 'pro',
    setupRequired: false,
    features: {
      teamCreation: { enabled: true, maxTeamSize: 10 },
      roleManagement: { enabled: true, customRoles: 5 },
      teamMessaging: { enabled: true, groupChats: true },
      sharedWorkspaces: { enabled: true, maxWorkspaces: 5 },
      collaborativeEditing: { enabled: false, realTimeEditing: false },
    },
    permissions: [
      'teams:create', 'teams:manage', 'roles:assign',
      'workspaces:create', 'workspaces:share', 'collaboration:edit'
    ],
    uiComponents: {
      teamBuilder: true,
      roleManager: true,
      teamChat: true,
      workspaceViewer: true,
      collaborationTools: false,
    },
    navigationItems: {
      teams: { label: 'Teams', icon: 'users', route: '/teams' },
      workspaces: { label: 'Workspaces', icon: 'folder-open', route: '/workspaces' },
    },
    dependencies: ['core-marketplace'],
    conflicts: [],
  },

  {
    name: 'Video Conferencing',
    slug: 'video-conferencing',
    description: 'Integrated video calls and screen sharing capabilities',
    category: 'communication',
    complexity: 'advanced',
    resourceUsage: 'high',
    availableInTiers: ['enterprise'],
    minimumTier: 'enterprise',
    setupRequired: true,
    features: {
      videoCallsIntegration: { enabled: true, provider: 'agora' },
      screenSharing: { enabled: true, fullScreen: true },
      recording: { enabled: true, maxDuration: '2 hours' },
      whiteboard: { enabled: true, collaborative: true },
      breakoutRooms: { enabled: false, maxRooms: 0 },
    },
    permissions: [
      'video:call', 'video:record', 'screen:share',
      'whiteboard:use', 'meetings:schedule'
    ],
    uiComponents: {
      videoCallInterface: true,
      screenShareControls: true,
      recordingControls: true,
      whiteboard: true,
      meetingScheduler: true,
    },
    navigationItems: {
      meetings: { label: 'Meetings', icon: 'video', route: '/meetings' },
    },
    dependencies: ['core-marketplace'],
    conflicts: [],
  },

  {
    name: 'Advanced Analytics',
    slug: 'advanced-analytics',
    description: 'Comprehensive analytics and reporting dashboard',
    category: 'analytics',
    complexity: 'advanced',
    resourceUsage: 'medium',
    availableInTiers: ['enterprise'],
    minimumTier: 'enterprise',
    setupRequired: true,
    features: {
      userAnalytics: { enabled: true, behavior: true, demographics: true },
      salesAnalytics: { enabled: true, revenue: true, conversion: true },
      performanceMetrics: { enabled: true, realTime: true },
      customReports: { enabled: true, scheduled: true },
      dataExport: { enabled: true, formats: ['csv', 'excel', 'pdf'] },
    },
    permissions: [
      'analytics:view', 'analytics:export', 'reports:create',
      'reports:schedule', 'metrics:advanced'
    ],
    uiComponents: {
      analyticsDashboard: true,
      chartBuilder: true,
      reportBuilder: true,
      dataExporter: true,
      realTimeMetrics: true,
    },
    navigationItems: {
      analytics: { label: 'Analytics', icon: 'bar-chart', route: '/analytics' },
      reports: { label: 'Reports', icon: 'file-text', route: '/reports' },
    },
    dependencies: ['core-marketplace'],
    conflicts: [],
  },

  {
    name: 'Multi-language Support',
    slug: 'multi-language',
    description: 'Internationalization and localization features',
    category: 'localization',
    complexity: 'medium',
    resourceUsage: 'low',
    availableInTiers: ['pro', 'enterprise'],
    minimumTier: 'pro',
    setupRequired: true,
    features: {
      languageSupport: { enabled: true, maxLanguages: 10 },
      autoTranslation: { enabled: false, provider: null },
      rtlSupport: { enabled: true, languages: ['ar', 'he', 'fa'] },
      currencySupport: { enabled: true, maxCurrencies: 5 },
      timezoneSupport: { enabled: true, automatic: true },
    },
    permissions: [
      'languages:manage', 'translations:edit', 'currencies:set',
      'localization:manage'
    ],
    uiComponents: {
      languageSwitcher: true,
      translationEditor: true,
      currencySelector: true,
      localizationManager: true,
    },
    navigationItems: {
      localization: { label: 'Localization', icon: 'globe', route: '/admin/localization' },
    },
    dependencies: ['core-marketplace'],
    conflicts: [],
  },

  {
    name: 'API & Integrations',
    slug: 'api-integrations',
    description: 'REST API access and third-party integrations',
    category: 'integrations',
    complexity: 'advanced',
    resourceUsage: 'medium',
    availableInTiers: ['enterprise'],
    minimumTier: 'enterprise',
    setupRequired: true,
    features: {
      restApiAccess: { enabled: true, rateLimit: '1000/hour' },
      webhookSupport: { enabled: true, maxWebhooks: 10 },
      zapierIntegration: { enabled: true, triggers: 20 },
      customIntegrations: { enabled: true, maxIntegrations: 5 },
      apiDocumentation: { enabled: true, interactive: true },
    },
    permissions: [
      'api:access', 'api:manage', 'webhooks:create',
      'integrations:setup', 'integrations:manage'
    ],
    uiComponents: {
      apiKeyManager: true,
      webhookManager: true,
      integrationSetup: true,
      apiDocumentation: true,
    },
    navigationItems: {
      integrations: { label: 'Integrations', icon: 'plug', route: '/integrations' },
      api: { label: 'API Access', icon: 'code', route: '/api' },
    },
    dependencies: ['core-marketplace'],
    conflicts: [],
  },
];

async function seedFeatureSets() {
  try {
    console.log('🌱 Seeding feature sets...');

    // Clear existing feature sets
    await prisma.tenantFeatureSet.deleteMany();
    await prisma.featureSet.deleteMany();

    // Create feature sets
    for (const featureSet of featureSets) {
      const created = await prisma.featureSet.create({
        data: {
          ...featureSet,
          features: featureSet.features as any,
          apiEndpoints: {},
          serviceConfig: {},
          databaseSchema: {},
          uiComponents: featureSet.uiComponents as any,
          navigationItems: featureSet.navigationItems as any,
          isActive: true,
        },
      });

      console.log(`✅ Created feature set: ${created.name} (${created.slug})`);
    }

    // Set up feature dependencies (update UUIDs after creation)
    const allFeatureSets = await prisma.featureSet.findMany();
    const featureMap = new Map(allFeatureSets.map(fs => [fs.slug, fs.uuid]));

    for (const featureSet of featureSets) {
      if (featureSet.dependencies.length > 0) {
        const dependencyUuids = featureSet.dependencies.map(dep => featureMap.get(dep)).filter(Boolean);
        
        await prisma.featureSet.update({
          where: { slug: featureSet.slug },
          data: {
            dependencies: dependencyUuids,
          },
        });
      }
    }

    console.log('🎉 Feature sets seeded successfully!');
    console.log(`📊 Total feature sets created: ${featureSets.length}`);

    // Display feature hierarchy
    console.log('\n📋 Feature Set Hierarchy:');
    console.log('Core Features:');
    console.log('  - Core Marketplace (required for all)');
    console.log('\nBuild-on Features:');
    console.log('  - Advanced Search & Filtering');
    console.log('  - Portfolio & Showcase');
    console.log('  - Payment Processing');
    console.log('  - Project Management');
    console.log('  - Team Collaboration');
    console.log('  - Video Conferencing (Enterprise only)');
    console.log('  - Advanced Analytics (Enterprise only)');
    console.log('  - Multi-language Support');
    console.log('  - API & Integrations (Enterprise only)');

  } catch (error) {
    console.error('❌ Error seeding feature sets:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFeatureSets().catch(console.error);
}

export { seedFeatureSets };