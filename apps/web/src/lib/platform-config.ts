// Platform configuration wrapper for server-side use only
// This prevents process.env errors in client components

export function getPlatformConfig() {
  if (typeof window !== 'undefined') {
    // Return a safe client-side version without process.env references
    return {
      platform: {
        name: "itellico Mono",
        version: "1.0.0",
        environment: "production",
        apiVersion: "v1"
      },
      i18n: {
        defaultLocale: "en-US",
        locales: [
          "en-US", "en-GB", "en-CA", "en-AU",
          "de-DE", "de-AT", "de-CH", 
          "fr-FR", "fr-CA", "fr-CH",
          "es-ES", "es-MX", "es-AR",
          "it-IT", "pt-BR", "pt-PT",
          "nl-NL", "sv-SE", "da-DK", "no-NO", "fi-FI", "pl-PL"
        ],
        translationScopes: {
          categories: {
            adminGrouping: "Product & Content Management",
            description: "Product categories, content classifications, and organizational taxonomies",
            scope: "category",
            fields: ["name", "description", "slug", "metaTitle", "metaDescription"]
          },
          tags: {
            adminGrouping: "Content Management",
            description: "Content tags, labels, and classification markers",
            scope: "content",
            fields: ["name", "description", "color"]
          },
          models: {
            adminGrouping: "System Configuration",
            description: "Database entity names, field labels, and system messages",
            scope: "system",
            fields: ["displayName", "description", "pluralName", "fieldLabels", "validationMessages"]
          },
          ui: {
            adminGrouping: "User Interface",
            description: "User interface elements, buttons, forms, and interactive components",
            scope: "interface",
            fields: ["label", "placeholder", "tooltip", "error", "success", "loading"]
          },
          workflows: {
            adminGrouping: "Business Processes",
            description: "Business process steps, workflow instructions, and process guidance",
            scope: "business",
            fields: ["stepName", "description", "instruction", "completion"]
          },
          emails: {
            adminGrouping: "Communications",
            description: "Email templates, notifications, and automated communications",
            scope: "communication",
            fields: ["subject", "preheader", "content", "footer", "cta"]
          },
          legal: {
            adminGrouping: "Legal & Compliance",
            description: "Legal documents, privacy policies, terms of service, and compliance content",
            scope: "compliance",
            fields: ["title", "content", "summary", "lastUpdated"]
          },
          help: {
            adminGrouping: "Help & Documentation",
            description: "Help articles, FAQs, user guides, and documentation content",
            scope: "documentation",
            fields: ["title", "content", "excerpt", "keywords"]
          }
        }
      },
      tenancy: {
        isolationLevel: "schema"
      },
      features: {
        enableAutoTranslation: false,
        enableTranslationSuggestions: true,
        enableBulkTranslation: true,
        enableTranslationExport: true,
        enableTranslationImport: true,
        enableRealTimeCollaboration: false,
        enableAdvancedFiltering: true,
        enableVersionControl: true,
        enableAPIAccess: true,
        enableWebhooks: false
      },
      integrations: {
        translationServices: {
          enabled: false,
          providers: {
            google: {
              enabled: false,
              apiKey: null // Safe default for client
            },
            aws: {
              enabled: false,
              region: null // Safe default for client
            }
          }
        }
      }
    };
  }

  // Server-side: use the actual config
  try {
    const platformConfig = require('../../platform.config.js');
    return platformConfig;
  } catch (error) {
    console.warn('Failed to load platform config, using defaults:', error);
    // Return the same safe defaults if config loading fails
    return {
      platform: {
        name: "itellico Mono",
        version: "1.0.0",
        environment: "production",
        apiVersion: "v1"
      },
      i18n: {
        defaultLocale: "en-US",
        locales: [
          "en-US", "en-GB", "en-CA", "en-AU",
          "de-DE", "de-AT", "de-CH", 
          "fr-FR", "fr-CA", "fr-CH",
          "es-ES", "es-MX", "es-AR",
          "it-IT", "pt-BR", "pt-PT",
          "nl-NL", "sv-SE", "da-DK", "no-NO", "fi-FI", "pl-PL"
        ]
      },
      tenancy: {
        isolationLevel: "schema"
      },
      features: {
        enableAutoTranslation: false,
        enableTranslationSuggestions: true,
        enableBulkTranslation: true,
        enableTranslationExport: true,
        enableTranslationImport: true,
        enableRealTimeCollaboration: false,
        enableAdvancedFiltering: true,
        enableVersionControl: true,
        enableAPIAccess: true,
        enableWebhooks: false
      }
    };
  }
}

export type PlatformConfig = ReturnType<typeof getPlatformConfig>;