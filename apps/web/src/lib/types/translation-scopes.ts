/**
 * Translation Scope Categories for itellico Mono
 * 
 * Organizes translations by their intended use and context within the platform
 */

export interface TranslationScope {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  entityTypes: string[];
}

/**
 * Translation scope definitions
 */
export const TRANSLATION_SCOPES: Record<string, TranslationScope> = {
  ui_interface: {
    id: 'ui_interface',
    label: 'UI Interface',
    description: 'Navigation, buttons, labels, form fields, and general interface elements',
    color: 'blue',
    icon: '🖥️',
    entityTypes: [
      'navigation',
      'button',
      'label',
      'form_field',
      'validation_message',
      'tooltip',
      'modal',
      'menu_item',
      'tab',
      'breadcrumb',
      'header',
      'footer',
      'sidebar'
    ]
  },

  tenant_configuration: {
    id: 'tenant_configuration',
    label: 'Tenant Configuration',
    description: 'Tenant-specific settings, branding, custom fields, and configurations',
    color: 'purple',
    icon: '🏢',
    entityTypes: [
      'tenant_setting',
      'custom_field',
      'branding_text',
      'tenant_welcome',
      'tenant_policy',
      'tenant_term',
      'tenant_guideline',
      'tenant_instruction',
      'tenant_announcement'
    ]
  },

  user_generated: {
    id: 'user_generated',
    label: 'User Generated Content',
    description: 'Profile data, applications, user communications, and dynamic content',
    color: 'green',
    icon: '👤',
    entityTypes: [
      'profile_field',
      'application_field',
      'user_message',
      'comment',
      'bio',
      'portfolio_item',
      'experience',
      'skill',
      'achievement',
      'testimonial',
      'review'
    ]
  },

  system_admin: {
    id: 'system_admin',
    label: 'System & Admin',
    description: 'Error messages, system notifications, admin interface, and technical content',
    color: 'red',
    icon: '⚙️',
    entityTypes: [
      'error_message',
      'system_notification',
      'admin_interface',
      'log_message',
      'status_message',
      'alert',
      'warning',
      'maintenance_notice',
      'system_update',
      'security_notice'
    ]
  },

  email_communications: {
    id: 'email_communications',
    label: 'Email Communications',
    description: 'Welcome emails, notifications, marketing communications, and templates',
    color: 'indigo',
    icon: '📧',
    entityTypes: [
      'email_template',
      'email_subject',
      'email_body',
      'notification_email',
      'welcome_email',
      'invitation_email',
      'reminder_email',
      'marketing_email',
      'transactional_email',
      'newsletter'
    ]
  },

  option_values: {
    id: 'option_values',
    label: 'Option Values',
    description: 'Dropdown options, selections, regional variants, and configurable values',
    color: 'orange',
    icon: '📋',
    entityTypes: [
      'option_value',
      'dropdown_option',
      'select_option',
      'radio_option',
      'checkbox_option',
      'multi_select_option',
      'category',
      'tag',
      'filter_option',
      'sort_option'
    ]
  },

  content_marketing: {
    id: 'content_marketing',
    label: 'Content & Marketing',
    description: 'Marketing copy, landing pages, blog content, and promotional materials',
    color: 'pink',
    icon: '📢',
    entityTypes: [
      'marketing_copy',
      'landing_page',
      'blog_post',
      'article',
      'announcement',
      'promotion',
      'campaign',
      'social_media',
      'press_release',
      'testimonial_quote'
    ]
  },

  help_documentation: {
    id: 'help_documentation',
    label: 'Help & Documentation',
    description: 'Help text, tutorials, guides, FAQs, and user documentation',
    color: 'cyan',
    icon: '📚',
    entityTypes: [
      'help_text',
      'tutorial',
      'guide',
      'faq',
      'documentation',
      'instruction',
      'tip',
      'example',
      'explanation',
      'glossary_term'
    ]
  }
};

/**
 * Get scope for an entity type
 */
export function getScopeForEntityType(entityType: string): TranslationScope | null {
  for (const scope of Object.values(TRANSLATION_SCOPES)) {
    if (scope.entityTypes.includes(entityType)) {
      return scope;
    }
  }
  return null;
}

/**
 * Get all scopes as array
 */
export function getAllScopes(): TranslationScope[] {
  return Object.values(TRANSLATION_SCOPES);
}

/**
 * Get scopes with entity type counts
 */
export function getScopesWithCounts(entityTypes: string[]): Array<TranslationScope & { count: number }> {
  return getAllScopes().map(scope => ({
    ...scope,
    count: scope.entityTypes.filter(entityType => entityTypes.includes(entityType)).length
  }));
}

/**
 * Scope color mappings for UI
 */
export const SCOPE_COLORS = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800'
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800'
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    badge: 'bg-pink-100 text-pink-800'
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    badge: 'bg-cyan-100 text-cyan-800'
  }
} as const;

/**
 * Get Tailwind classes for a scope color
 */
export function getScopeColorClasses(color: string) {
  return SCOPE_COLORS[color as keyof typeof SCOPE_COLORS] || SCOPE_COLORS.blue;
} 