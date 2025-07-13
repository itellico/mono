// platform.config.js
// itellico Mono Configuration
// This file defines platform-wide settings that can only be modified by super administrators

module.exports = {
  // Platform metadata
  platform: {
    name: "itellico Mono",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    apiVersion: "v1"
  },

  // Translation & Localization Configuration
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
    fallbackLocale: "en-US",
    
    // Translation scopes - defines how translations are grouped in admin interface
    translationScopes: {
      // Category translations
      categories: {
        scope: "category",
        groupBy: "domain", // e.g., "ecommerce", "blog", "knowledge_base"
        fields: ["name", "description", "slug", "metaTitle", "metaDescription"],
        translationKey: "categories.{domain}.{key}",
        adminGrouping: "Product & Content Management",
        icon: "folder",
        description: "Product categories, content classifications, and organizational taxonomies"
      },
      
      // Tag translations
      tags: {
        scope: "content",
        groupBy: "type", // e.g., "product", "post", "media", "user"
        fields: ["name", "description", "color"],
        translationKey: "tags.{type}.{key}",
        adminGrouping: "Content Management",
        icon: "tag",
        description: "Content tags, labels, and classification markers"
      },
      
      // Data model translations
      models: {
        scope: "system",
        groupBy: "entity", // e.g., "user", "product", "order", "subscription"
        fields: ["displayName", "description", "pluralName", "fieldLabels", "validationMessages"],
        translationKey: "models.{entity}.{key}",
        adminGrouping: "System Configuration",
        icon: "database",
        description: "Database entity names, field labels, and system messages"
      },
      
      // UI component translations
      ui: {
        scope: "interface",
        groupBy: "component", // e.g., "navigation", "forms", "buttons", "modals"
        fields: ["label", "placeholder", "tooltip", "error", "success", "loading"],
        translationKey: "ui.{component}.{key}",
        adminGrouping: "User Interface",
        icon: "layout",
        description: "User interface elements, buttons, forms, and interactive components"
      },
      
      // Business workflow translations
      workflows: {
        scope: "business",
        groupBy: "process", // e.g., "onboarding", "checkout", "subscription", "support"
        fields: ["stepName", "description", "instruction", "completion"],
        translationKey: "workflows.{process}.{key}",
        adminGrouping: "Business Processes",
        icon: "workflow",
        description: "Business process steps, workflow instructions, and process guidance"
      },
      
      // Email template translations
      emails: {
        scope: "communication",
        groupBy: "template", // e.g., "welcome", "invoice", "notification", "marketing"
        fields: ["subject", "preheader", "content", "footer", "cta"],
        translationKey: "emails.{template}.{key}",
        adminGrouping: "Communications",
        icon: "mail",
        description: "Email templates, notifications, and automated communications"
      },
      
      // Legal and compliance translations
      legal: {
        scope: "compliance",
        groupBy: "document", // e.g., "privacy", "terms", "cookies", "gdpr"
        fields: ["title", "content", "summary", "lastUpdated"],
        translationKey: "legal.{document}.{key}",
        adminGrouping: "Legal & Compliance",
        icon: "shield-check",
        description: "Legal documents, privacy policies, terms of service, and compliance content"
      },
      
      // Help and documentation translations
      help: {
        scope: "documentation",
        groupBy: "section", // e.g., "faq", "guides", "tutorials", "troubleshooting"
        fields: ["title", "content", "excerpt", "keywords"],
        translationKey: "help.{section}.{key}",
        adminGrouping: "Help & Documentation",
        icon: "help-circle",
        description: "Help articles, FAQs, user guides, and documentation content"
      }
    }
  },

  // Data Models Configuration
  models: {
    // Category configuration
    categories: {
      maxDepth: 5,
      allowEmptyParent: true,
      allowCircularReference: false,
      requiredFields: ["name", "slug"],
      translatable: ["name", "description", "metaTitle", "metaDescription"],
      scopes: ["tenant", "global", "industry"], // Multi-tenant and industry support
      indexing: {
        searchable: true,
        faceted: ["level", "parentId", "status", "industry"],
        fullText: ["name", "description"]
      },
      validation: {
        slug: {
          pattern: "^[a-z0-9-]+$",
          maxLength: 100,
          unique: true
        },
        name: {
          minLength: 1,
          maxLength: 255,
          required: true
        }
      },
      ui: {
        displayFormat: "hierarchical",
        iconSupport: true,
        colorSupport: true,
        sortable: true,
        industryFiltering: true,  // Show categories relevant to tenant's industry
        showIndustryBadges: true  // Display industry indicators
      },
      // Industry-specific category behavior
      industryBehavior: {
        autoSeedOnIndustrySelection: true,    // Automatically create default categories when industry is selected
        inheritGlobalCategories: true,        // Always include general categories
        allowCrossIndustryCategories: true,   // Allow categories from other industries if explicitly added
        enableIndustryMigration: true,        // Allow changing industry and migrating categories
        hideIrrelevantCategories: false       // Whether to hide categories from other industries
      }
    },

    // Tag configuration  
    tags: {
      maxLength: 50,
      allowSpaces: true,
      allowSpecialChars: false,
      autoSuggest: true,
      caseSensitive: false,
      translatable: ["name", "description"],
      scopes: ["tenant", "user", "global", "industry"],
      types: {
        // General tag types
        product: {
          color: "#3b82f6",
          icon: "package",
          description: "Product classification tags"
        },
        post: {
          color: "#10b981", 
          icon: "file-text",
          description: "Blog post and article tags"
        },
        media: {
          color: "#f59e0b",
          icon: "image",
          description: "Media and asset tags"
        },
        user: {
          color: "#8b5cf6",
          icon: "user",
          description: "User profile and interest tags"
        },
        system: {
          color: "#6b7280",
          icon: "cog",
          description: "System and administrative tags"
        },
        
        // Industry-specific tag types
        skill: {
          color: "#3b82f6",
          icon: "brain",
          description: "Technical skills and competencies",
          industryRelevant: ["freelancing", "ai"]
        },
        tool: {
          color: "#f59e0b",
          icon: "wrench",
          description: "Software tools and applications",
          industryRelevant: ["freelancing", "ai", "modeling"]
        },
        physical: {
          color: "#ef4444",
          icon: "ruler",
          description: "Physical attributes and measurements",
          industryRelevant: ["modeling", "fitness"]
        },
        experience: {
          color: "#10b981",
          icon: "star",
          description: "Experience level and expertise",
          industryRelevant: ["freelancing", "ai", "modeling", "fitness"]
        },
        specialty: {
          color: "#8b5cf6",
          icon: "award",
          description: "Area of specialization",
          industryRelevant: ["freelancing", "ai", "modeling", "fitness"]
        },
        certification: {
          color: "#06b6d4",
          icon: "shield-check",
          description: "Professional certifications",
          industryRelevant: ["fitness", "ai"]
        },
        equipment: {
          color: "#84cc16",
          icon: "camera",
          description: "Equipment and gear",
          industryRelevant: ["modeling", "fitness"]
        },
        location: {
          color: "#f97316",
          icon: "map-pin",
          description: "Location and setting preferences",
          industryRelevant: ["modeling", "fitness"]
        },
        pricing: {
          color: "#eab308",
          icon: "dollar-sign",
          description: "Pricing and payment models",
          industryRelevant: ["freelancing", "ai"]
        },
        duration: {
          color: "#64748b",
          icon: "clock",
          description: "Project duration and timeline",
          industryRelevant: ["freelancing", "ai"]
        },
        industry: {
          color: "#dc2626",
          icon: "building-2",
          description: "Industry sector and domain",
          industryRelevant: ["freelancing", "ai"]
        },
        framework: {
          color: "#7c3aed",
          icon: "code",
          description: "Software frameworks and libraries",
          industryRelevant: ["ai", "freelancing"]
        },
        platform: {
          color: "#059669",
          icon: "server",
          description: "Technology platforms and services",
          industryRelevant: ["ai", "freelancing"]
        },
        language: {
          color: "#0891b2",
          icon: "code-2",
          description: "Programming languages",
          industryRelevant: ["ai", "freelancing"]
        },
        size: {
          color: "#be123c",
          icon: "resize",
          description: "Size measurements and dimensions",
          industryRelevant: ["modeling"]
        },
        style: {
          color: "#a21caf",
          icon: "palette",
          description: "Style and aesthetic preferences",
          industryRelevant: ["modeling"]
        },
        delivery: {
          color: "#0d9488",
          icon: "truck",
          description: "Service delivery method",
          industryRelevant: ["fitness", "freelancing"]
        }
      },
      validation: {
        name: {
          pattern: "^[a-zA-Z0-9\\s-_]+$",
          minLength: 1,
          maxLength: 50
        }
      },
      ui: {
        displayFormat: "pills",
        colorCoded: true,
        autocomplete: true,
        bulkActions: true,
        industryFiltering: true,  // Enable filtering by industry relevance
        groupByType: true         // Group tags by type in UI
      },
      // Industry-specific tag behavior
      industryBehavior: {
        autoSuggestByIndustry: true,      // Only suggest relevant tags for tenant's industry
        inheritGlobalTags: true,          // Always include general tags
        allowCrossIndustryTags: false,    // Prevent tags from other industries unless explicitly allowed
        enableIndustryMigration: true     // Allow changing industry and migrating tags
      }
    },

    // Language strings configuration
    languageStrings: {
      namespaces: ["common", "auth", "admin", "public", "emails", "errors"],
      interpolation: {
        enabled: true,
        prefix: "{{",
        suffix: "}}",
        escapeValue: false
      },
      pluralization: {
        enabled: true,
        rules: "standard", // "standard" | "custom"
        forms: ["zero", "one", "two", "few", "many", "other"]
      },
      contexts: {
        enabled: true,
        types: ["formal", "informal", "technical", "marketing"]
      },
      scopes: {
        tenant: {
          description: "Tenant-specific overrides",
          priority: 1,
          inheritFromGlobal: true
        },
        global: {
          description: "Platform-wide defaults", 
          priority: 3,
          fallback: true
        },
        user: {
          description: "User preference overrides",
          priority: 0,
          temporary: true
        }
      },
      validation: {
        maxLength: 10000,
        allowHtml: true,
        sanitizeHtml: true,
        requiredVariables: true
      }
    }
  },

  // Multi-tenant Configuration
  tenancy: {
    isolationLevel: "schema", // "database" | "schema" | "row"
    allowCustomTranslations: true,
    inheritGlobalTranslations: true,
    scopePriority: ["user", "tenant", "global"], // Override hierarchy
    tenantSwitching: {
      enabled: true,
      requiresPermission: "admin.tenants.switch",
      auditTrail: true,
      sessionTimeout: 3600000 // 1 hour
    },
    dataIsolation: {
      enforceAtQuery: true,
      enforceAtCache: true,
      enforceAtApi: true,
      crossTenantAccess: false
    }
  },

  // Translation Management
  translationManagement: {
    // How translations are organized in the admin interface
    grouping: {
      byScope: true,
      byEntity: true,
      byLocale: false,
      showHierarchy: true
    },
    
    // What fields are translatable
    translatableFields: {
      autoDetect: true,
      customFields: true,
      richText: true,
      maxLength: 10000,
      validation: true
    },

    // Translation workflow
    workflow: {
      requireApproval: false,
      trackChanges: true,
      versionControl: true,
      fallbackBehavior: "show_key", // "show_key" | "hide" | "show_default"
      missingTranslationBehavior: "warn", // "warn" | "error" | "ignore"
      autoSave: true,
      bulkEdit: true
    },

    // Quality assurance
    qualityAssurance: {
      spellCheck: true,
      grammarCheck: false,
      consistencyCheck: true,
      variableValidation: true,
      lengthValidation: true
    },

    // Import/Export
    importExport: {
      formats: ["json", "csv", "xlsx", "po", "xliff"],
      includeMetadata: true,
      preserveFormatting: true,
      validateOnImport: true
    }
  },

  // Performance Configuration
  performance: {
    caching: {
      translationTTL: 3600, // 1 hour
      modelConfigTTL: 86400, // 24 hours
      userPreferencesTTL: 1800 // 30 minutes
    },
    pagination: {
      defaultPageSize: 50,
      maxPageSize: 1000,
      enableInfiniteScroll: true
    },
    search: {
      enableFullText: true,
      enableFaceting: true,
      maxResults: 1000
    }
  },

  // Security Configuration
  security: {
    permissions: {
      platformConfig: {
        read: ["super_admin"],
        write: ["super_admin"],
        description: "Platform configuration access"
      },
      translations: {
        read: ["admin", "editor", "translator"],
        write: ["admin", "editor", "translator"],
        approve: ["admin"],
        description: "Translation management access"
      }
    },
    auditTrail: {
      enabled: true,
      includeUserAgent: true,
      includeIpAddress: true,
      retentionPeriod: "2 years"
    },
    dataValidation: {
      strictMode: true,
      sanitizeInput: true,
      validateFileUploads: true
    }
  },

  // Industry-Specific Configuration
  industries: {
    // Each industry defines its specific tags, categories, and content structure
    freelancing: {
      name: "Freelancing Marketplace",
      description: "Platform for freelancers offering services across various disciplines",
      defaultCategories: [
        {
          slug: "development",
          name: "Development & IT",
          description: "Software development, web development, mobile apps",
          subcategories: [
            { slug: "web-development", name: "Web Development" },
            { slug: "mobile-development", name: "Mobile Development" },
            { slug: "backend-development", name: "Backend Development" },
            { slug: "frontend-development", name: "Frontend Development" },
            { slug: "fullstack-development", name: "Full Stack Development" },
            { slug: "devops", name: "DevOps & Infrastructure" },
            { slug: "qa-testing", name: "QA & Testing" }
          ]
        },
        {
          slug: "design",
          name: "Design & Creative",
          description: "Graphic design, UI/UX, branding, and creative services",
          subcategories: [
            { slug: "graphic-design", name: "Graphic Design" },
            { slug: "ui-ux-design", name: "UI/UX Design" },
            { slug: "logo-branding", name: "Logo & Branding" },
            { slug: "illustration", name: "Illustration" },
            { slug: "3d-design", name: "3D Design & Modeling" },
            { slug: "video-editing", name: "Video Editing" },
            { slug: "animation", name: "Animation" }
          ]
        },
        {
          slug: "marketing",
          name: "Marketing & Sales",
          description: "Digital marketing, content marketing, SEO, social media",
          subcategories: [
            { slug: "digital-marketing", name: "Digital Marketing" },
            { slug: "content-marketing", name: "Content Marketing" },
            { slug: "seo", name: "SEO" },
            { slug: "social-media", name: "Social Media Marketing" },
            { slug: "ppc-advertising", name: "PPC Advertising" },
            { slug: "email-marketing", name: "Email Marketing" },
            { slug: "marketing-strategy", name: "Marketing Strategy" }
          ]
        },
        {
          slug: "writing",
          name: "Writing & Translation",
          description: "Content writing, copywriting, translation, editing",
          subcategories: [
            { slug: "content-writing", name: "Content Writing" },
            { slug: "copywriting", name: "Copywriting" },
            { slug: "technical-writing", name: "Technical Writing" },
            { slug: "translation", name: "Translation" },
            { slug: "editing-proofreading", name: "Editing & Proofreading" },
            { slug: "creative-writing", name: "Creative Writing" }
          ]
        }
      ],
      defaultTags: [
        // Skill-based tags
        { slug: "react", name: "React", category: "development", type: "skill" },
        { slug: "nodejs", name: "Node.js", category: "development", type: "skill" },
        { slug: "python", name: "Python", category: "development", type: "skill" },
        { slug: "javascript", name: "JavaScript", category: "development", type: "skill" },
        { slug: "typescript", name: "TypeScript", category: "development", type: "skill" },
        { slug: "figma", name: "Figma", category: "design", type: "tool" },
        { slug: "photoshop", name: "Photoshop", category: "design", type: "tool" },
        { slug: "adobe-illustrator", name: "Adobe Illustrator", category: "design", type: "tool" },
        { slug: "wordpress", name: "WordPress", category: "development", type: "platform" },
        { slug: "shopify", name: "Shopify", category: "development", type: "platform" },
        
        // Experience level tags
        { slug: "entry-level", name: "Entry Level", category: "general", type: "experience" },
        { slug: "intermediate", name: "Intermediate", category: "general", type: "experience" },
        { slug: "expert", name: "Expert", category: "general", type: "experience" },
        { slug: "senior", name: "Senior", category: "general", type: "experience" },
        
        // Project type tags
        { slug: "fixed-price", name: "Fixed Price", category: "general", type: "pricing" },
        { slug: "hourly", name: "Hourly", category: "general", type: "pricing" },
        { slug: "long-term", name: "Long Term", category: "general", type: "duration" },
        { slug: "short-term", name: "Short Term", category: "general", type: "duration" },
        
        // Industry-specific tags
        { slug: "e-commerce", name: "E-commerce", category: "general", type: "industry" },
        { slug: "saas", name: "SaaS", category: "general", type: "industry" },
        { slug: "startup", name: "Startup", category: "general", type: "industry" },
        { slug: "enterprise", name: "Enterprise", category: "general", type: "industry" }
      ]
    },

    modeling: {
      name: "Modeling & Talent Marketplace",
      description: "Platform for models, photographers, and creative professionals",
      defaultCategories: [
        {
          slug: "modeling",
          name: "Modeling",
          description: "All types of modeling work",
          subcategories: [
            { slug: "fashion-modeling", name: "Fashion Modeling" },
            { slug: "commercial-modeling", name: "Commercial Modeling" },
            { slug: "fitness-modeling", name: "Fitness Modeling" },
            { slug: "plus-size-modeling", name: "Plus Size Modeling" },
            { slug: "child-modeling", name: "Child Modeling" },
            { slug: "hand-modeling", name: "Hand & Parts Modeling" },
            { slug: "runway-modeling", name: "Runway Modeling" }
          ]
        },
        {
          slug: "photography",
          name: "Photography",
          description: "Photography services and portfolio work",
          subcategories: [
            { slug: "fashion-photography", name: "Fashion Photography" },
            { slug: "portrait-photography", name: "Portrait Photography" },
            { slug: "commercial-photography", name: "Commercial Photography" },
            { slug: "wedding-photography", name: "Wedding Photography" },
            { slug: "event-photography", name: "Event Photography" },
            { slug: "product-photography", name: "Product Photography" },
            { slug: "headshot-photography", name: "Headshot Photography" }
          ]
        },
        {
          slug: "casting",
          name: "Casting & Talent",
          description: "Casting calls and talent representation",
          subcategories: [
            { slug: "film-casting", name: "Film Casting" },
            { slug: "tv-casting", name: "TV Casting" },
            { slug: "commercial-casting", name: "Commercial Casting" },
            { slug: "voice-acting", name: "Voice Acting" },
            { slug: "background-extras", name: "Background & Extras" },
            { slug: "theater-casting", name: "Theater Casting" }
          ]
        }
      ],
      defaultTags: [
        // Physical attributes
        { slug: "height-160-170", name: "160-170cm", category: "modeling", type: "physical" },
        { slug: "height-170-180", name: "170-180cm", category: "modeling", type: "physical" },
        { slug: "height-180-190", name: "180-190cm", category: "modeling", type: "physical" },
        { slug: "blonde", name: "Blonde Hair", category: "modeling", type: "physical" },
        { slug: "brunette", name: "Brunette Hair", category: "modeling", type: "physical" },
        { slug: "blue-eyes", name: "Blue Eyes", category: "modeling", type: "physical" },
        { slug: "brown-eyes", name: "Brown Eyes", category: "modeling", type: "physical" },
        
        // Clothing sizes
        { slug: "size-xs", name: "Size XS", category: "modeling", type: "size" },
        { slug: "size-s", name: "Size S", category: "modeling", type: "size" },
        { slug: "size-m", name: "Size M", category: "modeling", type: "size" },
        { slug: "size-l", name: "Size L", category: "modeling", type: "size" },
        
        // Experience level
        { slug: "new-face", name: "New Face", category: "general", type: "experience" },
        { slug: "experienced", name: "Experienced", category: "general", type: "experience" },
        { slug: "professional", name: "Professional", category: "general", type: "experience" },
        
        // Specializations
        { slug: "high-fashion", name: "High Fashion", category: "modeling", type: "specialty" },
        { slug: "print-work", name: "Print Work", category: "modeling", type: "specialty" },
        { slug: "runway-ready", name: "Runway Ready", category: "modeling", type: "specialty" },
        { slug: "commercial-look", name: "Commercial Look", category: "modeling", type: "specialty" },
        
        // Photography equipment/style
        { slug: "natural-light", name: "Natural Light", category: "photography", type: "style" },
        { slug: "studio-lighting", name: "Studio Lighting", category: "photography", type: "equipment" },
        { slug: "outdoor-shoots", name: "Outdoor Shoots", category: "photography", type: "location" },
        { slug: "indoor-shoots", name: "Indoor Shoots", category: "photography", type: "location" }
      ]
    },

    ai: {
      name: "AI & Technology Marketplace",
      description: "Platform for AI services, machine learning, and tech solutions",
      defaultCategories: [
        {
          slug: "machine-learning",
          name: "Machine Learning",
          description: "ML models, training, and implementation",
          subcategories: [
            { slug: "deep-learning", name: "Deep Learning" },
            { slug: "computer-vision", name: "Computer Vision" },
            { slug: "nlp", name: "Natural Language Processing" },
            { slug: "predictive-analytics", name: "Predictive Analytics" },
            { slug: "recommendation-systems", name: "Recommendation Systems" },
            { slug: "time-series-analysis", name: "Time Series Analysis" }
          ]
        },
        {
          slug: "ai-development",
          name: "AI Development",
          description: "AI application development and integration",
          subcategories: [
            { slug: "chatbot-development", name: "Chatbot Development" },
            { slug: "ai-integration", name: "AI Integration" },
            { slug: "automation", name: "AI Automation" },
            { slug: "ai-consulting", name: "AI Consulting" },
            { slug: "model-deployment", name: "Model Deployment" },
            { slug: "ai-training", name: "AI Training & Education" }
          ]
        },
        {
          slug: "data-science",
          name: "Data Science",
          description: "Data analysis, visualization, and insights",
          subcategories: [
            { slug: "data-analysis", name: "Data Analysis" },
            { slug: "data-visualization", name: "Data Visualization" },
            { slug: "big-data", name: "Big Data Processing" },
            { slug: "statistical-analysis", name: "Statistical Analysis" },
            { slug: "data-engineering", name: "Data Engineering" },
            { slug: "business-intelligence", name: "Business Intelligence" }
          ]
        }
      ],
      defaultTags: [
        // AI/ML Technologies
        { slug: "tensorflow", name: "TensorFlow", category: "machine-learning", type: "framework" },
        { slug: "pytorch", name: "PyTorch", category: "machine-learning", type: "framework" },
        { slug: "scikit-learn", name: "Scikit-learn", category: "machine-learning", type: "library" },
        { slug: "keras", name: "Keras", category: "machine-learning", type: "framework" },
        { slug: "openai-api", name: "OpenAI API", category: "ai-development", type: "service" },
        { slug: "langchain", name: "LangChain", category: "ai-development", type: "framework" },
        
        // Programming languages
        { slug: "python", name: "Python", category: "general", type: "language" },
        { slug: "r", name: "R", category: "data-science", type: "language" },
        { slug: "sql", name: "SQL", category: "data-science", type: "language" },
        { slug: "scala", name: "Scala", category: "data-science", type: "language" },
        
        // Cloud platforms
        { slug: "aws", name: "AWS", category: "general", type: "platform" },
        { slug: "gcp", name: "Google Cloud", category: "general", type: "platform" },
        { slug: "azure", name: "Microsoft Azure", category: "general", type: "platform" },
        
        // Specializations
        { slug: "computer-vision", name: "Computer Vision", category: "machine-learning", type: "specialty" },
        { slug: "nlp", name: "NLP", category: "machine-learning", type: "specialty" },
        { slug: "robotics", name: "Robotics", category: "ai-development", type: "specialty" },
        { slug: "autonomous-systems", name: "Autonomous Systems", category: "ai-development", type: "specialty" },
        
        // Data types
        { slug: "image-data", name: "Image Data", category: "data-science", type: "data-type" },
        { slug: "text-data", name: "Text Data", category: "data-science", type: "data-type" },
        { slug: "sensor-data", name: "Sensor Data", category: "data-science", type: "data-type" },
        { slug: "financial-data", name: "Financial Data", category: "data-science", type: "data-type" }
      ]
    },

    // Add more industries as needed
    fitness: {
      name: "Fitness & Wellness Marketplace",
      description: "Platform for fitness trainers, nutritionists, and wellness professionals",
      defaultCategories: [
        {
          slug: "personal-training",
          name: "Personal Training",
          description: "One-on-one and group fitness training",
          subcategories: [
            { slug: "strength-training", name: "Strength Training" },
            { slug: "cardio-training", name: "Cardio Training" },
            { slug: "yoga", name: "Yoga" },
            { slug: "pilates", name: "Pilates" },
            { slug: "crossfit", name: "CrossFit" },
            { slug: "functional-training", name: "Functional Training" }
          ]
        },
        {
          slug: "nutrition",
          name: "Nutrition & Diet",
          description: "Nutrition planning and dietary guidance",
          subcategories: [
            { slug: "meal-planning", name: "Meal Planning" },
            { slug: "weight-loss", name: "Weight Loss" },
            { slug: "sports-nutrition", name: "Sports Nutrition" },
            { slug: "clinical-nutrition", name: "Clinical Nutrition" },
            { slug: "vegan-nutrition", name: "Vegan Nutrition" }
          ]
        }
      ],
      defaultTags: [
        { slug: "certified-trainer", name: "Certified Trainer", category: "general", type: "certification" },
        { slug: "nutrition-coach", name: "Nutrition Coach", category: "nutrition", type: "specialty" },
        { slug: "online-training", name: "Online Training", category: "general", type: "delivery" },
        { slug: "in-person", name: "In-Person", category: "general", type: "delivery" }
      ]
    }
  },

  // Feature Flags
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
    enableWebhooks: false,
    enableIndustrySpecificContent: true,  // New feature flag
    enableAutoContentSeeding: true       // Auto-seed tags/categories on industry selection
  },

  // Storage Configuration
  storage: {
    // Upload directories (relative to UPLOAD_DIR environment variable)
    uploadPaths: {
      media: "media",           // General media assets
      artwork: "artwork",       // Tenant-specific artwork and branding
      documents: "documents",   // Business documents
      temp: "temp"             // Temporary processing files
    },
    
    // Tenant-specific artwork categories
    artworkCategories: {
      logos: {
        path: "logos",
        maxSize: 5 * 1024 * 1024,  // 5MB
        allowedTypes: ["image/png", "image/jpeg", "image/svg+xml"],
        description: "Brand logos and identity assets"
      },
      banners: {
        path: "banners", 
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ["image/png", "image/jpeg", "image/webp"],
        description: "Marketing banners and promotional images"
      },
      backgrounds: {
        path: "backgrounds",
        maxSize: 15 * 1024 * 1024, // 15MB  
        allowedTypes: ["image/png", "image/jpeg", "image/webp"],
        description: "Site backgrounds and texture assets"
      },
      themes: {
        path: "themes",
        maxSize: 2 * 1024 * 1024,  // 2MB
        allowedTypes: ["image/png", "image/jpeg", "text/css"],
        description: "Custom theme assets and stylesheets"
      }
    },

    // Security settings
    security: {
      enforcePermissions: true,
      requireAuthentication: true,
      allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".pdf", ".mp4", ".mov"],
      virusScanning: false,        // Enable when antivirus service available
      contentTypeValidation: true
    },

    // Performance settings
    performance: {
      enableCDN: false,           // Enable when CDN configured
      cacheExpiry: 86400,        // 24 hours
      enableImageOptimization: true,
      generateThumbnails: true
    }
  },

  // API Configuration
  api: {
    rateLimit: {
      translationRead: 1000, // requests per hour
      translationWrite: 100,  // requests per hour
      configRead: 100,       // requests per hour
      configWrite: 10        // requests per hour
    },
    versioning: {
      currentVersion: "v1",
      supportedVersions: ["v1"],
      deprecationNotice: false
    }
  },

  // Integration Configuration
  integrations: {
    translationServices: {
      enabled: false,
      providers: {
        google: {
          enabled: false,
          apiKey: process.env.GOOGLE_TRANSLATE_API_KEY
        },
        aws: {
          enabled: false,
          region: process.env.AWS_REGION
        }
      }
    },
    analytics: {
      enabled: true,
      provider: "internal",
      trackTranslationUsage: true,
      trackUserActivity: true
    }
  }
};