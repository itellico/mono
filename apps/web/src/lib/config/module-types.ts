/**
 * Module Types Configuration
 * Defines the available module types for the JSON-driven page builder
 */

export interface ModuleTypeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultLayout: string;
  supportedLayouts: string[];
  category: string;
  requiresModelSchema: boolean;
  defaultConfiguration: Record<string, any>;
}

export const MODULE_TYPES = {
  PROFILE_FORM: {
    id: 'profile_form',
    name: 'Profile Form',
    description: 'User profile creation and editing forms',
    icon: 'User',
    defaultLayout: 'form',
    supportedLayouts: ['form', 'wizard', 'tabs', 'accordion'],
    category: 'Forms',
    requiresModelSchema: true,
    defaultConfiguration: {
      layout: {
        type: 'form',
        columns: 1,
        spacing: 'md'
      },
      fields: [],
      actions: [
        {
          type: 'submit',
          label: 'Save Profile',
          variant: 'default'
        }
      ],
      validation: {
        showErrors: true,
        validateOnBlur: true
      }
    }
  },

  SEARCH_INTERFACE: {
    id: 'search_interface',
    name: 'Search Interface',
    description: 'Search and filter interfaces with results display',
    icon: 'Search',
    defaultLayout: 'grid',
    supportedLayouts: ['grid', 'list', 'cards', 'table'],
    category: 'Search',
    requiresModelSchema: true,
    defaultConfiguration: {
      layout: {
        type: 'grid',
        columns: 3,
        spacing: 'md'
      },
      filters: [],
      searchFields: [],
      resultFields: [],
      pagination: {
        enabled: true,
        pageSize: 12
      },
      sorting: {
        enabled: true,
        defaultSort: 'created_at',
        defaultOrder: 'desc'
      }
    }
  },

  DETAIL_PAGE: {
    id: 'detail_page',
    name: 'Detail Page',
    description: 'Individual item detail views and profiles',
    icon: 'FileText',
    defaultLayout: 'detail',
    supportedLayouts: ['detail', 'sidebar', 'tabs', 'sections'],
    category: 'Display',
    requiresModelSchema: true,
    defaultConfiguration: {
      layout: {
        type: 'detail',
        sections: ['header', 'content', 'sidebar'],
        spacing: 'lg'
      },
      fields: [],
      actions: [],
      navigation: {
        showBreadcrumbs: true,
        showBackButton: true
      }
    }
  },

  LISTING_PAGE: {
    id: 'listing_page',
    name: 'Listing Page',
    description: 'Grid or list views of multiple items',
    icon: 'Grid',
    defaultLayout: 'grid',
    supportedLayouts: ['grid', 'list', 'masonry', 'table'],
    category: 'Display',
    requiresModelSchema: true,
    defaultConfiguration: {
      layout: {
        type: 'grid',
        columns: 4,
        spacing: 'md'
      },
      fields: [],
      pagination: {
        enabled: true,
        pageSize: 20
      },
      filtering: {
        enabled: true,
        position: 'sidebar'
      },
      sorting: {
        enabled: true,
        options: []
      }
    }
  },

  APPLICATION_FORM: {
    id: 'application_form',
    name: 'Application Form',
    description: 'Job and casting application forms with workflow',
    icon: 'FileCheck',
    defaultLayout: 'form',
    supportedLayouts: ['form', 'wizard', 'steps'],
    category: 'Forms',
    requiresModelSchema: true,
    defaultConfiguration: {
      layout: {
        type: 'form',
        columns: 1,
        spacing: 'lg'
      },
      fields: [],
      workflow: {
        enabled: true,
        steps: ['application', 'review', 'decision']
      },
      notifications: {
        enabled: true,
        events: ['submit', 'approve', 'reject']
      },
      actions: [
        {
          type: 'submit',
          label: 'Submit Application',
          variant: 'default'
        }
      ]
    }
  },

  CARD_COMPONENT: {
    id: 'card_component',
    name: 'Card Component',
    description: 'Reusable card components for listings',
    icon: 'Square',
    defaultLayout: 'card',
    supportedLayouts: ['card', 'compact', 'detailed', 'minimal'],
    category: 'Components',
    requiresModelSchema: true,
    defaultConfiguration: {
      layout: {
        type: 'card',
        size: 'md',
        spacing: 'md'
      },
      fields: [],
      actions: [],
      display: {
        showImage: true,
        showTitle: true,
        showDescription: true,
        maxLines: 3
      }
    }
  }
} as const satisfies Record<string, ModuleTypeConfig>;

// Type helpers
export type ModuleTypeId = keyof typeof MODULE_TYPES;
export type ModuleType = typeof MODULE_TYPES[ModuleTypeId];

// Helper functions
export function getModuleType(id: string): ModuleTypeConfig | undefined {
  return Object.values(MODULE_TYPES).find(type => type.id === id);
}

export function getModuleTypesByCategory(category: string): ModuleTypeConfig[] {
  return Object.values(MODULE_TYPES).filter(type => type.category === category);
}

export function getAllModuleTypes(): ModuleTypeConfig[] {
  return Object.values(MODULE_TYPES);
}

export function getModuleCategories(): string[] {
  const categories = new Set(Object.values(MODULE_TYPES).map(type => type.category));
  return Array.from(categories).sort();
} 