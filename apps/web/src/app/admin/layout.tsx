import React from 'react';
import { AdminLayoutContent } from '@/components/admin/AdminLayoutContent';
import { IntlProvider } from '@/components/providers/intl-provider';
import { DatabaseThemeProvider } from '@/components/providers/database-theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AdminGuard } from '@/components/auth/PermissionGuard';
// import { getMessages } from 'next-intl/server';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/i18n/config';
import { Toaster } from '@/components/ui/toaster';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';

/**
 * Load translations from JSON files for admin interface
 * This ensures proper translation loading for admin components
 */
async function loadAdminTranslations(locale: string = DEFAULT_LOCALE) {
  try {
    // Import all translation namespaces needed for admin interface
    const [
      authTranslations,
      common,
      adminCommon,
      adminUsers,
      adminTenants,
      adminTags,
      admin,
      dashboard
    ] = await Promise.all([
      import(`@/locales/${locale}/auth.json`).catch(() => ({})),
      import(`@/locales/${locale}/common.json`).catch(() => ({})),
      import(`@/locales/${locale}/admin-common.json`).catch(() => ({})),
      import(`@/locales/${locale}/admin-users.json`).catch(() => ({})),
      import(`@/locales/${locale}/admin-tenants.json`).catch(() => ({})),
      import(`@/locales/${locale}/admin-tags.json`).catch(() => ({})),
      import(`@/locales/${locale}/admin.json`).catch(() => ({})),
      import(`@/locales/${locale}/dashboard.json`).catch(() => ({}))
    ]);

    const translations = {
      auth: authTranslations.default || authTranslations,
      common: common.default || common,
      'admin-common': adminCommon.default || adminCommon,
      'admin-users': adminUsers.default || adminUsers,
      'admin-tenants': adminTenants.default || adminTenants,
      'admin-tags': adminTags.default || adminTags,
      admin: admin.default || admin,
      dashboard: dashboard.default || dashboard
    };

    logger.info(`✅ Loaded admin translations from JSON files for locale ${locale}`);
    return translations;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to load admin translations for locale ${locale}`, { error: errorMessage });
    
    // Return minimal fallback translations for admin interface
    return {
      auth: {
        signIn: "Sign In",
        signOut: "Sign Out",
        authentication_required: "Authentication Required",
        sign_in_required_admin: "Please sign in to access the admin panel."
      },
      'admin-common': {
        navigation: {
          dashboard: "Dashboard",
          users: "Users",
          tenants: "Tenants",
          workflows: "Workflows",
          integrations: "Integrations",
          llmIntegrations: "LLM Integrations",
          subscriptions: "Subscriptions",
          categories: "Categories",
          tags: "Tags",
          schemas: "Schemas",
          modelSchemas: "Model Schemas",
          optionSets: "Option Sets",
          entityMetadata: "Entity Metadata",
          formBuilder: "Form Builder",
          zoneEditor: "Zone Editor",
          savedZones: "Saved Zones",
          industryTemplates: "Industry Templates",
          buildSystem: "Build System",
          searchManagement: "Search Management",
          templateTester: "Template Tester",
          translations: "Translations",
          emailSystem: "Email System",
          modules: "Modules",
          backupManagement: "Backup Management",
          importExport: "Import/Export",
          auditSystem: "Audit System",
          permissions: "Permissions",
          devTools: "Dev Tools",
          preferences: "Preferences",
          settings: "Settings"
        }
      },
      common: {
        loading: "Loading...",
        error: "Error",
        success: "Success"
      }
    };
  }
}

async function AdminLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ PROPER AUTHENTICATION - P0 Security Requirement
  const session = await auth();
  
  // ✅ Server-side authentication check (backup to middleware)
  if (!session?.user) {
    logger.warn('🔒 Unauthenticated access attempt to admin panel');
    redirect('/auth/signin?callbackUrl=/admin');
  }

  // ✅ Server-side admin role check (backup to middleware)
  const userRoles = session.user.roles || [];
  const hasAdminRole = userRoles.some(role => 
    ['super_admin', 'platform_admin', 'tenant_admin', 'tenant_manager'].includes(role)
  );

  if (!hasAdminRole) {
    logger.warn('🚫 Unauthorized admin access attempt', { 
      email: session.user.email,
      roles: userRoles 
    });
    redirect('/auth/unauthorized');
  }

  logger.info('✅ Authenticated admin access', { 
    email: session.user.email,
    roles: userRoles 
  });
  
  // ✅ LOAD TRANSLATIONS - Load proper translations from JSON files
  const messages = await loadAdminTranslations(DEFAULT_LOCALE);

  return (
    <IntlProvider
      locale={DEFAULT_LOCALE}
      timeZone={DEFAULT_TIMEZONE}
      messages={messages}
    >
      <DatabaseThemeProvider>
        <QueryProvider>
          <SidebarProvider>
            <AdminGuard
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Verifying permissions...</p>
                  </div>
                </div>
              }
            >
              <AdminLayoutContent>
                {children}
              </AdminLayoutContent>
            </AdminGuard>
            <Toaster />
          </SidebarProvider>
        </QueryProvider>
      </DatabaseThemeProvider>
    </IntlProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutServer>{children}</AdminLayoutServer>;
} 