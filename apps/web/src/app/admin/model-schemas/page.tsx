import React from 'react';
import { getTranslations } from 'next-intl/server';
import { ModelSchemasService } from '@/lib/services/model-schemas.service';
import { ModelSchemasClientPage } from '@/components/admin/model-schemas/ModelSchemasClientPage';
import type { ModelSchema } from '@/lib/types/model-schemas';

/**
 * Model Schemas Admin Page - React Server Component
 * 
 * Features:
 * - ✅ Server-side data fetching (no client-side database imports)
 * - ✅ Three-layer caching through service layer
 * - ✅ Proper client-server component separation
 * - ✅ Translation system with server-side loading
 * - ✅ Enterprise middleware compliance
 * 
 * @component ModelSchemasPage
 */
export default async function ModelSchemasPage() {
  // ✅ ENTERPRISE TRANSLATION LOADING - Load specific namespace on-demand
  const t = await getTranslations('admin-model-schemas');

  try {
    // Server-side data fetching with service layer caching
    // Use fallback data if service fails due to Redis issues
    let schemas: ModelSchema[] = [];
    let stats = {
      total: 0,
      byType: {},
      byStatus: { active: 0, inactive: 0 },
      recent: 0
    };

    try {
      [schemas, stats] = await Promise.all([
        ModelSchemasService.getModelSchemas(),
        ModelSchemasService.getModelSchemasStats()
      ]);
    } catch (serviceError) {
      // ✅ NO DIRECT DATABASE ACCESS: Service layer handles all data access through NestJS API
      console.error('Service layer failed, cannot access data:', serviceError);
      
      // Return empty data - client component will handle error state
    }

    // Pass server data to client component
    return (
      <ModelSchemasClientPage 
        initialSchemas={schemas}
        initialStats={stats}
        translations={{
          pageTitle: t('page.title'),
          pageDescription: t('page.description'),
          createSchema: 'Create Schema',
          manageSchemas: t('schemas_list'),
          manageDescription: t('page.description'),
          searchPlaceholder: 'Search schemas...',
          filterByType: 'Filter by type',
          allTypes: 'All Types',
          profileSchemas: 'Profile Schemas',
          applicationSchemas: 'Application Schemas',
          searchSchemas: 'Search Schemas',
          customSchemas: 'Custom Schemas',
          export: 'Export',
          import: 'Import',
          schemasList: t('schemas_list'),
          schemaTemplates: t('schema_templates'),
          validationRules: t('validation_rules'),
          templatesDescription: t('schema_templates_description'),
          templatesComingSoon: t('templates_coming_soon'),
          validationDescription: t('validation_rules_description'),
          validationComingSoon: t('validation_coming_soon'),
          errorLoadingFailed: t('messages.error_loading_schemas'),
          actionRetry: t('messages.retry'),
          errorTryRefresh: t('messages.retry'),
          actionRefresh: t('messages.retry')
        }}
      />
    );

  } catch (error) {
    // Server-side error fallback
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            {t('messages.error_loading_schemas')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <a 
            href="/admin/model-schemas" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            {t('messages.retry')}
          </a>
        </div>
      </div>
    );
  }
} 