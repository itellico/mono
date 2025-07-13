/**
 * Template Bundling Service
 * Bundles standard itellico Mono components + industry-specific components into complete templates
 */

import { db } from '@/lib/db';
import { 
  industryTemplates, 
  industryTemplateComponents,
  type IndustryTemplate,
  type IndustryTemplateComponent,
  type IndustryType
} from '@/lib/schemas/industry-templates';
import { modelSchemas } from '@/lib/schemas/model-schemas';
import { optionSets } from '@/lib/schemas/options';
import { modules } from '@/lib/schemas/modules';
import { pages } from '@/lib/schemas/industry-templates';
import { formTemplates } from '@/lib/schemas/forms';
import { eq, and, inArray, or } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface ComponentBundle {
  // Standard itellico Mono Components (ALWAYS INCLUDED)
  standard: {
    authentication: string[];    // Login, register, password reset
    userManagement: string[];    // User profiles, preferences, settings
    accountManagement: string[]; // Account settings, billing, subscriptions
    navigation: string[];        // Sidebar, header, footer, breadcrumbs
    notifications: string[];     // Email templates, push notifications
    audit: string[];            // Activity tracking, audit logs
    media: string[];            // File uploads, image management
    search: string[];           // Global search functionality
    dashboard: string[];        // Admin dashboard, analytics
  };
  
  // Industry-Specific Components (VARIES BY INDUSTRY)
  industry: {
    schemas: string[];          // Industry-specific model schemas
    optionSets: number[];       // Industry-specific dropdowns (option set IDs are numbers)
    modules: string[];          // Industry-specific UI modules
    pages: string[];            // Industry-specific pages
    forms: string[];            // Industry-specific forms
    workflows: string[];        // Industry-specific business processes
  };
}

interface TemplateDefinition {
  name: string;
  displayName: Record<string, string>;
  description: Record<string, string>;
  industryType: IndustryType;
  configuration: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily?: string;
      customCss?: string;
    };
    features: Record<string, boolean>;
    layout: {
      navigation: 'top' | 'sidebar' | 'both';
      footer: boolean;
      breadcrumbs: boolean;
      adminSidebar: boolean;
    };
    integrations: {
      authentication: 'nextauth' | 'auth0' | 'custom';
      payments: 'stripe' | 'paypal' | 'both' | 'none';
      email: 'sendgrid' | 'mailgun' | 'ses';
      storage: 's3' | 'cloudinary' | 'local';
    };
  };
  subscriptionTiers: string[];
  estimatedSetupTime: number;
}

export class TemplateBundlingService {

  /**
   * Get standard itellico Mono components that ALL templates need
   */
  async getStandardComponents(): Promise<ComponentBundle['standard']> {
    const [schemas, options, moduleList, pageList, formList] = await Promise.all([
      // Standard schemas (authentication, user management, etc.)
      db.select({
        id: modelSchemas.id,
        type: modelSchemas.type,
        subType: modelSchemas.subType
      }).from(modelSchemas).where(
        or(
          eq(modelSchemas.type, 'user'),
          eq(modelSchemas.type, 'account'),
          eq(modelSchemas.type, 'authentication'),
          eq(modelSchemas.type, 'notification'),
          eq(modelSchemas.type, 'audit'),
          eq(modelSchemas.type, 'system')
        )
      ),

      // Standard option sets
      db.select({
        id: optionSets.id,
        slug: optionSets.slug
      }).from(optionSets).where(
        or(
          eq(optionSets.slug, 'user-roles'),
          eq(optionSets.slug, 'account-types'),
          eq(optionSets.slug, 'notification-types'),
          eq(optionSets.slug, 'subscription-tiers'),
          eq(optionSets.slug, 'languages'),
          eq(optionSets.slug, 'timezones'),
          eq(optionSets.slug, 'currencies')
        )
      ),

      // Standard modules - using actual enum values
      db.select({
        id: modules.id,
        moduleType: modules.moduleType
      }).from(modules).where(
        or(
          eq(modules.moduleType, 'profile_form'),
          eq(modules.moduleType, 'search_interface'),
          eq(modules.moduleType, 'detail_page'),
          eq(modules.moduleType, 'listing_page')
        )
      ),

      // Standard pages
      db.select({
        id: pages.id,
        routePath: pages.routePath
      }).from(pages).where(
        or(
          eq(pages.routePath, '/login'),
          eq(pages.routePath, '/register'),
          eq(pages.routePath, '/dashboard'),
          eq(pages.routePath, '/profile'),
          eq(pages.routePath, '/settings'),
          eq(pages.routePath, '/admin'),
          eq(pages.routePath, '/notifications')
        )
      ),

      // Standard form templates - using correct field name
      db.select({
        id: formTemplates.id,
        templateType: formTemplates.templateType
      }).from(formTemplates).where(
        or(
          eq(formTemplates.templateType, 'profile_builder'),
          eq(formTemplates.templateType, 'registration'),
          eq(formTemplates.templateType, 'onboarding_flow')
        )
      )
    ]);

    return {
      authentication: schemas.filter(s => s.type === 'authentication').map(s => s.id),
      userManagement: schemas.filter(s => s.type === 'user').map(s => s.id),
      accountManagement: schemas.filter(s => s.type === 'account').map(s => s.id),
      navigation: moduleList.filter(m => 
        m.moduleType === 'listing_page' || m.moduleType === 'detail_page'
      ).map(m => m.id),
      notifications: schemas.filter(s => s.type === 'notification').map(s => s.id),
      audit: schemas.filter(s => s.type === 'audit').map(s => s.id),
      media: moduleList.filter(m => m.moduleType === 'detail_page').map(m => m.id),
      search: moduleList.filter(m => m.moduleType === 'search_interface').map(m => m.id),
      dashboard: pageList.filter(p => 
        p.routePath?.includes('dashboard') || p.routePath?.includes('admin')
      ).map(p => p.id)
    };
  }

  /**
   * Get industry-specific components
   */
  async getIndustryComponents(industryType: IndustryType): Promise<ComponentBundle['industry']> {
    const industryFilters = this.getIndustryFilters(industryType);

    const [schemas, options, moduleList, pageList, formList] = await Promise.all([
      db.select({
        id: modelSchemas.id,
        type: modelSchemas.type,
        subType: modelSchemas.subType
      }).from(modelSchemas).where(
        industryFilters.schemas.length > 0 
          ? or(...industryFilters.schemas.map((filter: string) => eq(modelSchemas.type, filter)))
          : eq(modelSchemas.id, 'none') // Empty condition that returns no results
      ),

      db.select({
        id: optionSets.id,
        slug: optionSets.slug
      }).from(optionSets).where(
        industryFilters.optionSets.length > 0
          ? or(...industryFilters.optionSets.map((filter: string) => eq(optionSets.slug, filter)))
          : eq(optionSets.id, 0) // Empty condition that returns no results
      ),

      db.select({
        id: modules.id,
        moduleType: modules.moduleType
      }).from(modules).where(
        industryFilters.modules.length > 0
          ? or(...industryFilters.modules.map((filter: string) => eq(modules.moduleType, filter as any)))
          : eq(modules.id, 'none') // Empty condition that returns no results
      ),

      db.select({
        id: pages.id,
        routePath: pages.routePath
      }).from(pages).where(
        industryFilters.pages.length > 0
          ? or(...industryFilters.pages.map((filter: string) => eq(pages.routePath, filter)))
          : eq(pages.id, 'none') // Empty condition that returns no results
      ),

      db.select({
        id: formTemplates.id,
        templateType: formTemplates.templateType
      }).from(formTemplates).where(
        industryFilters.forms.length > 0
          ? or(...industryFilters.forms.map((filter: string) => eq(formTemplates.templateType, filter)))
          : eq(formTemplates.id, 'none') // Empty condition that returns no results
      )
    ]);

    return {
      schemas: schemas.map(s => s.id),
      optionSets: options.map(o => o.id),
      modules: moduleList.map(m => m.id),
      pages: pageList.map(p => p.id),
      forms: formList.map(f => f.id),
      workflows: [] // TODO: Add workflow filtering when implemented
    };
  }

  /**
   * Get industry-specific filters for components
   */
  private getIndustryFilters(industryType: IndustryType) {
    const filters: Record<string, {
      schemas: string[];
      optionSets: string[];
      modules: string[];
      pages: string[];
      forms: string[];
    }> = {
      modeling: {
        schemas: ['model', 'portfolio', 'casting', 'booking', 'agency'],
        optionSets: ['body-types', 'hair-colors', 'eye-colors', 'skills', 'experience-levels'],
        modules: ['profile_form', 'search_interface', 'listing_page', 'card_component'],
        pages: ['/portfolio', '/castings', '/bookings', '/models'],
        forms: ['profile_builder', 'application_form', 'portfolio_upload']
      },
      fitness: {
        schemas: ['trainer', 'workout', 'nutrition', 'client', 'exercise'],
        optionSets: ['fitness-goals', 'exercise-types', 'difficulty-levels', 'equipment'],
        modules: ['profile_form', 'search_interface', 'listing_page', 'application_form'],
        pages: ['/workouts', '/nutrition', '/progress', '/trainers'],
        forms: ['profile_builder', 'application_form', 'onboarding_flow']
      },
      photography: {
        schemas: ['photographer', 'session', 'gallery', 'package', 'client'],
        optionSets: ['photography-styles', 'session-types', 'package-tiers', 'equipment'],
        modules: ['profile_form', 'search_interface', 'detail_page', 'card_component'],
        pages: ['/galleries', '/sessions', '/packages', '/photographers'],
        forms: ['profile_builder', 'portfolio_upload', 'application_form']
      },
      entertainment: {
        schemas: ['performer', 'event', 'venue', 'booking', 'talent'],
        optionSets: ['performance-types', 'venue-types', 'event-categories', 'talent-skills'],
        modules: ['profile_form', 'search_interface', 'listing_page', 'application_form'],
        pages: ['/talents', '/events', '/venues', '/bookings'],
        forms: ['profile_builder', 'application_form', 'registration']
      },
      // Add missing industry types with default empty values
      music: {
        schemas: [],
        optionSets: [],
        modules: [],
        pages: [],
        forms: []
      },
      sports: {
        schemas: [],
        optionSets: [],
        modules: [],
        pages: [],
        forms: []
      },
      corporate: {
        schemas: [],
        optionSets: [],
        modules: [],
        pages: [],
        forms: []
      },
      healthcare: {
        schemas: [],
        optionSets: [],
        modules: [],
        pages: [],
        forms: []
      },
      education: {
        schemas: [],
        optionSets: [],
        modules: [],
        pages: [],
        forms: []
      },
      real_estate: {
        schemas: [],
        optionSets: [],
        modules: [],
        pages: [],
        forms: []
      }
    };

    return filters[industryType] || {
      schemas: [],
      optionSets: [],
      modules: [],
      pages: [],
      forms: []
    };
  }

  /**
   * Bundle complete template with standard + industry components
   */
  async bundleCompleteTemplate(definition: TemplateDefinition): Promise<IndustryTemplate> {
    try {
      logger.info('Starting complete template bundling', { templateName: definition.name });

      // Get standard components (required for ALL templates)
      const standardComponents = await this.getStandardComponents();
      
      // Get industry-specific components
      const industryComponents = await this.getIndustryComponents(definition.industryType);

      // Create the industry template
      const [template] = await db.insert(industryTemplates).values({
        name: definition.name,
        displayName: definition.displayName,
        description: definition.description,
        industryType: definition.industryType,
        configuration: definition.configuration,
        features: definition.configuration.features,
        subscriptionTiers: definition.subscriptionTiers,
        estimatedSetupTime: definition.estimatedSetupTime,
        isActive: true,
        isPublished: false,
        version: '1.0.0',
        popularity: 0,
        usageCount: 0,
        rating: 0
      }).returning();

      // Bundle all components (standard + industry)
      await this.bundleAllComponents(template.id, standardComponents, industryComponents);

      logger.info('Complete template bundled successfully', { 
        templateId: template.id,
        templateName: definition.name,
        industryType: definition.industryType
      });

      return template;

    } catch (error) {
      logger.error('Failed to bundle complete template', { error, templateName: definition.name });
      throw error;
    }
  }

  /**
   * Bundle both standard and industry components
   */
  private async bundleAllComponents(
    templateId: string, 
    standard: ComponentBundle['standard'],
    industry: ComponentBundle['industry']
  ) {
    const componentInserts: Omit<IndustryTemplateComponent, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    let order = 0;

    // Add standard components first (foundation)
    const standardCategories = [
      { type: 'schema', items: [...standard.authentication, ...standard.userManagement, ...standard.accountManagement], category: 'Authentication & Users' },
      { type: 'schema', items: [...standard.notifications, ...standard.audit], category: 'System Features' },
      { type: 'module', items: [...standard.navigation, ...standard.dashboard], category: 'Navigation & Dashboard' },
      { type: 'module', items: [...standard.media, ...standard.search], category: 'Core Features' }
    ];

    for (const category of standardCategories) {
      for (const itemId of category.items) {
        componentInserts.push({
          templateId,
          componentType: category.type as any,
          componentId: itemId,
          componentName: `${category.category} - ${itemId}`,
          componentOrder: order++,
          isRequired: true,
          isEnabled: true,
          configuration: { category: category.category, isStandard: true },
          dependencies: [],
          conditions: {}
        });
      }
    }

    // Add industry-specific components
    const industryCategories = [
      { type: 'schema', items: industry.schemas, category: 'Industry Schemas' },
      { type: 'option_set', items: industry.optionSets.map(id => String(id)), category: 'Industry Options' },
      { type: 'module', items: industry.modules, category: 'Industry Modules' },
      { type: 'page', items: industry.pages, category: 'Industry Pages' }
    ];

    for (const category of industryCategories) {
      for (const itemId of category.items) {
        componentInserts.push({
          templateId,
          componentType: category.type as any,
          componentId: itemId,
          componentName: `${category.category} - ${itemId}`,
          componentOrder: order++,
          isRequired: false, // Industry components can be optional
          isEnabled: true,
          configuration: { category: category.category, isStandard: false },
          dependencies: [],
          conditions: {}
        });
      }
    }

    // Insert all components
    if (componentInserts.length > 0) {
      await db.insert(industryTemplateComponents).values(componentInserts);
    }

    logger.info('All components bundled', { 
      templateId,
      standardCount: standardCategories.reduce((sum, cat) => sum + cat.items.length, 0),
      industryCount: industryCategories.reduce((sum, cat) => sum + cat.items.length, 0),
      totalCount: componentInserts.length
    });
  }

  /**
   * Create complete predefined templates
   */
  async createCompleteTemplates() {
    logger.info('Creating complete industry templates with standard + industry components');

    const templates: TemplateDefinition[] = [
      {
        name: 'complete-modeling-platform',
        displayName: { 
          en: 'Complete Modeling Platform',
          es: 'Plataforma Completa de Modelaje'
        },
        description: { 
          en: 'Full-featured modeling platform with authentication, user management, portfolios, castings, and booking system',
          es: 'Plataforma completa de modelaje con autenticación, gestión de usuarios, portafolios, castings y sistema de reservas'
        },
        industryType: 'modeling' as IndustryType,
        configuration: {
          theme: {
            primaryColor: '#000000',
            secondaryColor: '#ffffff',
            fontFamily: 'Playfair Display'
          },
          features: {
            authentication: true,
            userManagement: true,
            portfolioShowcase: true,
            castingManagement: true,
            bookingSystem: true,
            imageGalleries: true,
            paymentIntegration: true,
            mobileResponsive: true,
            seoOptimized: true
          },
          layout: {
            navigation: 'top' as const,
            footer: true,
            breadcrumbs: false,
            adminSidebar: true
          },
          integrations: {
            authentication: 'nextauth' as const,
            payments: 'stripe' as const,
            email: 'sendgrid' as const,
            storage: 'cloudinary' as const
          }
        },
        subscriptionTiers: ['professional', 'enterprise'],
        estimatedSetupTime: 45
      },
      {
        name: 'complete-fitness-platform',
        displayName: { 
          en: 'Complete Fitness Platform',
          es: 'Plataforma Completa de Fitness'
        },
        description: { 
          en: 'Full-featured fitness platform with authentication, trainer management, workout tracking, and client portal',
          es: 'Plataforma completa de fitness con autenticación, gestión de entrenadores, seguimiento de entrenamientos y portal de clientes'
        },
        industryType: 'fitness' as IndustryType,
        configuration: {
          theme: {
            primaryColor: '#ff6b35',
            secondaryColor: '#004e89',
            fontFamily: 'Inter'
          },
          features: {
            authentication: true,
            userManagement: true,
            workoutTracking: true,
            nutritionPlans: true,
            progressAnalytics: true,
            clientManagement: true,
            paymentIntegration: true,
            mobileApp: true,
            wearableIntegration: true
          },
          layout: {
            navigation: 'sidebar' as const,
            footer: true,
            breadcrumbs: true,
            adminSidebar: true
          },
          integrations: {
            authentication: 'nextauth' as const,
            payments: 'stripe' as const,
            email: 'mailgun' as const,
            storage: 's3' as const
          }
        },
        subscriptionTiers: ['basic', 'professional', 'enterprise'],
        estimatedSetupTime: 35
      }
    ];

    const results = [];
    for (const templateDef of templates) {
      const template = await this.bundleCompleteTemplate(templateDef);
      results.push(template);
    }

    logger.info('Complete templates created successfully', {
      count: results.length,
      templateIds: results.map(t => t.id)
    });

    return results;
  }

  /**
   * Get template component summary
   */
  async getTemplateSummary(templateId: string) {
    const components = await db.select({
      componentType: industryTemplateComponents.componentType,
      componentName: industryTemplateComponents.componentName,
      isRequired: industryTemplateComponents.isRequired,
      configuration: industryTemplateComponents.configuration
    }).from(industryTemplateComponents)
      .where(eq(industryTemplateComponents.templateId, templateId))
      .orderBy(industryTemplateComponents.componentOrder);

    const summary = {
      standard: components.filter(c => (c.configuration as any)?.isStandard === true),
      industry: components.filter(c => (c.configuration as any)?.isStandard === false),
      total: components.length,
      required: components.filter(c => c.isRequired).length,
      optional: components.filter(c => !c.isRequired).length
    };

    return {
      components,
      summary
    };
  }
} 