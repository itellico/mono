# itellico Mono Promo Pages CMS - Simple Component-Based System

## 🚀 Overview

The itellico Mono Promo Pages CMS is a lightweight, component-based content management system designed specifically for tenant promotional pages. Inspired by modern headless CMS solutions but simplified for promo page needs, it provides drag-and-drop functionality with reusable components while maintaining tenant isolation.

## 📋 Table of Contents

- [System Philosophy](#system-philosophy)
- [Database Architecture](#database-architecture)
- [Component Library](#component-library)
- [Template System](#template-system)
- [Multilingual Management](#multilingual-management)
- [Admin Interface](#admin-interface)
- [API Endpoints](#api-endpoints)
- [Integration with itellico Mono](#integration-with-mono-platform)
- [Implementation Guide](#implementation-guide)

---

## 🎯 System Philosophy

### Design Principles

**"Simple, Reusable, Multilingual"**

1. **Not a Full CMS**: Focus exclusively on promotional page requirements
2. **Component-Driven**: Pre-built, drag-and-drop reusable blocks
3. **Code-First Approach**: Components built by developers, content managed by users
4. **Tenant-Isolated**: Complete separation between tenant promo content
5. **Multilingual by Design**: Built-in language management and hreflang support
6. **SEO Optimized**: Automatic meta tags, schema markup, and performance optimization

### What's Included
- ✅ Pre-built component library (Hero, Features, Testimonials, etc.)
- ✅ Header/Footer template management
- ✅ Drag-and-drop page builder
- ✅ Multilingual content management
- ✅ SEO optimization tools
- ✅ Live data integration (models, jobs, blog posts)
- ✅ Basic form handling
- ✅ Performance optimization

### What's NOT Included (Keeping It Simple)
- ❌ Custom component creation (code-only)
- ❌ Complex workflows or approvals
- ❌ Advanced media library management
- ❌ Complex form builders
- ❌ Page versioning (just draft/published)
- ❌ User-generated content

---

## 💾 Database Architecture

### Core Models

#### PromoPageTemplate Model
```typescript
model PromoPageTemplate {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId        Int
  name            String           @db.VarChar(100)
  type            TemplateType     // HEADER, FOOTER, PAGE, SECTION
  isGlobal        Boolean          @default(false) // Reusable across pages
  
  // Component Structure
  components      Json             // Array of component configurations
  layoutGrid      Json?            // Grid/layout configuration
  customCSS       String?          @db.Text
  customJS        String?          @db.Text
  
  // Multilingual Support
  language        String           @default("en") @db.VarChar(5)
  parentTemplateId Int?
  
  // Metadata
  isActive        Boolean          @default(true)
  version         Int              @default(1)
  createdBy       Int
  updatedAt       DateTime         @updatedAt
  
  // Relationships
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  creator         User             @relation(fields: [createdBy], references: [id])
  translations    PromoPageTemplate[] @relation("TemplateTranslations")
  parentTemplate  PromoPageTemplate?  @relation("TemplateTranslations", fields: [parentTemplateId], references: [id])
  pages           PromoPage[]      // Pages using this template
  
  @@unique([tenantId, name, language])
}

enum TemplateType {
  HEADER
  FOOTER  
  PAGE
  SECTION
}
```

#### ComponentLibrary Model
```typescript
model ComponentLibrary {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId        Int?             // null = platform-wide component
  name            String           @db.VarChar(100)
  category        ComponentCategory
  description     String?
  
  // Component Definition
  componentType   String           @db.VarChar(50)  // "HeroSection", "FeatureGrid"
  defaultConfig   Json             // Default props/settings
  schema          Json             // JSON schema for validation
  previewImage    String?          // Thumbnail for admin
  
  // Permissions & Usage
  isPublic        Boolean          @default(true)
  usageCount      Int              @default(0)
  isActive        Boolean          @default(true)
  version         String           @default("1.0.0")
  
  tenant          Tenant?          @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, componentType])
}

enum ComponentCategory {
  LAYOUT        // Headers, footers, navigation
  HERO          // Hero sections, banners
  CONTENT       // Text blocks, image galleries
  FEATURES      // Feature grids, cards
  TESTIMONIALS  // Reviews, testimonials
  FORMS         // Contact forms, newsletters
  MEDIA         // Videos, images, carousels
  CTA           // Call-to-action sections
  STATS         // Counters, metrics
  CUSTOM        // Tenant-specific components
}
```

#### Enhanced PromoPage Model
```typescript
model PromoPage {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId        Int
  slug            String           @db.VarChar(200)
  title           String           @db.VarChar(255)
  
  // Template System
  templateId      Int?             // Optional base template
  headerTemplateId Int?            // Custom header
  footerTemplateId Int?            // Custom footer
  
  // Page Content (Component-based)
  sections        Json             // Array of PageSection objects
  globalSettings  Json?            // Theme, fonts, colors, etc.
  
  // Status & Publishing
  status          PageStatus       @default(DRAFT)
  publishedAt     DateTime?
  scheduledAt     DateTime?
  
  // SEO Optimization
  seoTitle        String?          @db.VarChar(60)
  metaDescription String?          @db.VarChar(160)
  focusKeyword    String?          @db.VarChar(100)
  openGraphTitle  String?          @db.VarChar(60)
  openGraphDesc   String?          @db.VarChar(160)
  openGraphImage  String?
  twitterTitle    String?          @db.VarChar(60)
  twitterDesc     String?          @db.VarChar(160)
  twitterImage    String?
  canonicalUrl    String?
  structuredData  Json?            // Schema.org markup
  
  // Multilingual Support
  language        String           @default("en") @db.VarChar(5)
  parentPageId    Int?             // For translations
  hreflangData    Json?            // Language alternatives
  
  // Performance Tracking
  viewCount       Int              @default(0)
  conversionRate  Float?
  averageTime     Float?           // Average time on page
  
  // Relationships
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  template        PromoPageTemplate? @relation(fields: [templateId], references: [id])
  headerTemplate  PromoPageTemplate? @relation("PageHeader", fields: [headerTemplateId], references: [id])
  footerTemplate  PromoPageTemplate? @relation("PageFooter", fields: [footerTemplateId], references: [id])
  translations    PromoPage[]      @relation("PageTranslations")
  parentPage      PromoPage?       @relation("PageTranslations", fields: [parentPageId], references: [id])
  featuredContent PromoFeaturedContent[]
  
  @@unique([tenantId, slug, language])
}

enum PageStatus {
  DRAFT
  PUBLISHED
  SCHEDULED
  ARCHIVED
}
```

#### PromoFeaturedContent Model
```typescript
model PromoFeaturedContent {
  id              Int              @id @default(autoincrement())
  tenantId        Int
  pageId          Int
  contentType     FeaturedContentType
  entityId        String           @db.Uuid  // UUID of featured entity
  displayOrder    Int              @default(0)
  isActive        Boolean          @default(true)
  customData      Json?            // Custom display data/overrides
  
  page            PromoPage        @relation(fields: [pageId], references: [id])
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  
  @@unique([pageId, contentType, entityId])
}

enum FeaturedContentType {
  MODEL
  JOB
  PROFESSIONAL
  TESTIMONIAL
  BLOG_POST
  ACADEMY_COURSE
  CATEGORY
  SUCCESS_STORY
}
```

---

## 🧩 Component Library

### Pre-built Component Registry

```typescript
const PROMO_COMPONENTS = {
  // Layout Components
  HEADER_NAV: {
    name: "Navigation Header",
    category: "LAYOUT",
    description: "Main site navigation with logo and menu",
    props: {
      logo: { type: "string", required: true, description: "Logo URL or text" },
      menuItems: { 
        type: "array", 
        required: true, 
        items: { type: "object", properties: { label: "string", url: "string", isExternal: "boolean" } }
      },
      ctaButton: { 
        type: "object", 
        properties: { text: "string", url: "string", style: "string" }
      },
      sticky: { type: "boolean", default: true },
      backgroundColor: { type: "string", default: "#ffffff" },
      textColor: { type: "string", default: "#333333" }
    },
    responsive: {
      mobile: { hideSecondaryMenu: true, collapsible: true },
      tablet: { showFullMenu: true },
      desktop: { showFullMenu: true, horizontalLayout: true }
    }
  },
  
  FOOTER_SIMPLE: {
    name: "Simple Footer", 
    category: "LAYOUT",
    description: "Basic footer with company info and links",
    props: {
      companyInfo: {
        type: "object",
        properties: {
          name: "string",
          address: "string", 
          phone: "string",
          email: "string"
        }
      },
      socialLinks: {
        type: "array",
        items: { type: "object", properties: { platform: "string", url: "string", icon: "string" } }
      },
      quickLinks: {
        type: "array", 
        items: { type: "object", properties: { label: "string", url: "string" } }
      },
      copyright: { type: "string", required: true },
      backgroundColor: { type: "string", default: "#f8f9fa" }
    }
  },
  
  // Hero Sections
  HERO_BANNER: {
    name: "Hero Banner",
    category: "HERO",
    description: "Large hero section with background image and CTA",
    props: {
      title: { type: "string", required: true, maxLength: 100 },
      subtitle: { type: "string", maxLength: 200 },
      backgroundImage: { type: "string", format: "url" },
      backgroundVideo: { type: "string", format: "url" },
      overlay: { type: "boolean", default: true },
      overlayOpacity: { type: "number", min: 0, max: 1, default: 0.5 },
      ctaButtons: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            text: "string",
            url: "string", 
            style: { enum: ["primary", "secondary", "outline"] },
            size: { enum: ["small", "medium", "large"] }
          }
        }
      },
      textAlignment: { enum: ["left", "center", "right"], default: "center" },
      height: { enum: ["small", "medium", "large", "fullscreen"], default: "large" }
    }
  },
  
  HERO_VIDEO: {
    name: "Video Hero",
    category: "HERO", 
    description: "Hero section with background video",
    props: {
      videoUrl: { type: "string", required: true, format: "url" },
      posterImage: { type: "string", format: "url" },
      title: { type: "string", required: true },
      description: { type: "string" },
      autoplay: { type: "boolean", default: true },
      muted: { type: "boolean", default: true },
      loop: { type: "boolean", default: true },
      controls: { type: "boolean", default: false }
    }
  },
  
  // Feature Components
  FEATURE_GRID: {
    name: "Feature Grid",
    category: "FEATURES",
    description: "Grid layout showcasing key features or benefits",
    props: {
      title: { type: "string" },
      subtitle: { type: "string" },
      features: {
        type: "array",
        required: true,
        items: {
          type: "object",
          properties: {
            icon: "string",        // Icon name or URL
            title: "string",
            description: "string",
            link: "string"         // Optional link
          }
        }
      },
      columns: { type: "number", min: 1, max: 4, default: 3 },
      style: { enum: ["card", "minimal", "centered", "bordered"], default: "card" },
      backgroundColor: { type: "string", default: "#ffffff" }
    }
  },
  
  // Content Components (Live Data Integration)
  MODEL_SHOWCASE: {
    name: "Model Showcase",
    category: "CONTENT",
    description: "Display featured models from the platform",
    props: {
      title: { type: "string", default: "Featured Models" },
      subtitle: { type: "string" },
      modelCount: { type: "number", min: 3, max: 12, default: 6 },
      categories: { type: "array", items: { type: "string" } }, // Filter by categories
      layout: { enum: ["grid", "carousel", "masonry"], default: "grid" },
      showProfile: { type: "boolean", default: true },
      showStats: { type: "boolean", default: true },
      viewAllLink: { type: "string", default: "/models" },
      autoRefresh: { type: "boolean", default: true } // Live data updates
    }
  },
  
  JOB_LISTINGS: {
    name: "Latest Jobs",
    category: "CONTENT",
    description: "Display recent job postings", 
    props: {
      title: { type: "string", default: "Latest Opportunities" },
      jobCount: { type: "number", min: 3, max: 20, default: 10 },
      categories: { type: "array", items: { type: "string" } },
      showSalary: { type: "boolean", default: false },
      showCompany: { type: "boolean", default: true },
      showLocation: { type: "boolean", default: true },
      viewAllLink: { type: "string", default: "/jobs" },
      refreshInterval: { type: "number", default: 300000 } // 5 minutes
    }
  },
  
  BLOG_PREVIEW: {
    name: "Blog Articles Preview",
    category: "CONTENT",
    description: "Showcase recent blog articles",
    props: {
      title: { type: "string", default: "Latest Articles" },
      articleCount: { type: "number", min: 3, max: 9, default: 3 },
      categories: { type: "array", items: { type: "string" } },
      showExcerpt: { type: "boolean", default: true },
      showAuthor: { type: "boolean", default: true },
      showDate: { type: "boolean", default: true },
      layout: { enum: ["grid", "list", "featured"], default: "grid" },
      viewAllLink: { type: "string", default: "/blog" }
    }
  },
  
  // Testimonials & Social Proof
  TESTIMONIAL_CAROUSEL: {
    name: "Testimonial Carousel",
    category: "TESTIMONIALS",
    description: "Rotating customer testimonials",
    props: {
      title: { type: "string" },
      testimonials: {
        type: "array",
        required: true,
        items: {
          type: "object",
          properties: {
            quote: "string",
            author: "string",
            role: "string",
            company: "string",
            avatar: "string",
            rating: "number"
          }
        }
      },
      autoplay: { type: "boolean", default: true },
      autoplaySpeed: { type: "number", default: 5000 },
      showRating: { type: "boolean", default: true },
      showNavigation: { type: "boolean", default: true },
      style: { enum: ["card", "minimal", "quote"], default: "card" }
    }
  },
  
  // Forms & CTAs
  CONTACT_FORM: {
    name: "Contact Form",
    category: "FORMS",
    description: "Simple contact form with customizable fields",
    props: {
      title: { type: "string", default: "Get in Touch" },
      description: { type: "string" },
      fields: {
        type: "array",
        required: true,
        items: {
          type: "object",
          properties: {
            name: "string",
            type: { enum: ["text", "email", "phone", "textarea", "select"] },
            label: "string",
            placeholder: "string",
            required: "boolean",
            options: "array" // For select fields
          }
        }
      },
      submitText: { type: "string", default: "Send Message" },
      successMessage: { type: "string", default: "Thank you! We'll be in touch soon." },
      redirectUrl: { type: "string" }
    }
  },
  
  NEWSLETTER_SIGNUP: {
    name: "Newsletter Signup",
    category: "FORMS",
    description: "Email newsletter subscription form",
    props: {
      title: { type: "string", default: "Stay Updated" },
      description: { type: "string", default: "Get the latest news and opportunities" },
      placeholder: { type: "string", default: "Enter your email address" },
      buttonText: { type: "string", default: "Subscribe" },
      showPrivacyNote: { type: "boolean", default: true },
      privacyText: { type: "string", default: "We respect your privacy. Unsubscribe at any time." },
      style: { enum: ["inline", "stacked", "minimal"], default: "inline" }
    }
  },
  
  // Stats & Metrics
  STATS_COUNTER: {
    name: "Stats Counter",
    category: "STATS",
    description: "Animated statistics counters",
    props: {
      title: { type: "string" },
      stats: {
        type: "array",
        required: true,
        items: {
          type: "object", 
          properties: {
            number: "number",
            label: "string",
            suffix: "string",     // e.g., "+", "%", "k"
            icon: "string",
            color: "string"
          }
        }
      },
      animateOnScroll: { type: "boolean", default: true },
      animationDuration: { type: "number", default: 2000 },
      backgroundColor: { type: "string", default: "#f8f9fa" }
    }
  },
  
  CTA_SECTION: {
    name: "Call to Action",
    category: "CTA",
    description: "Prominent call-to-action section",
    props: {
      title: { type: "string", required: true },
      description: { type: "string" },
      buttons: {
        type: "array",
        maxItems: 2,
        items: {
          type: "object",
          properties: {
            text: "string",
            url: "string",
            style: { enum: ["primary", "secondary", "outline"] }
          }
        }
      },
      backgroundColor: { type: "string", default: "#007bff" },
      textColor: { type: "string", default: "#ffffff" },
      backgroundImage: { type: "string" },
      fullWidth: { type: "boolean", default: false }
    }
  }
};
```

### Component Configuration Schema

```typescript
interface ComponentInstance {
  id: string;                      // Unique component instance ID
  type: string;                    // Component type from PROMO_COMPONENTS
  order: number;                   // Display order within section
  config: Record<string, any>;     // Component-specific configuration
  styling: {
    marginTop?: number;
    marginBottom?: number;
    paddingTop?: number;
    paddingBottom?: number;
    backgroundColor?: string;
    textColor?: string;
    customCSS?: string;
  };
  responsive: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    hideOnDesktop?: boolean;
    mobileConfig?: Partial<Record<string, any>>; // Mobile-specific overrides
    tabletConfig?: Partial<Record<string, any>>;
  };
  multilingual: {
    language: string;
    translations?: Record<string, any>; // Language-specific content
  };
  animation?: {
    type: 'fade' | 'slide' | 'zoom' | 'none';
    delay?: number;
    duration?: number;
  };
}

interface PageSection {
  id: string;
  name: string;
  components: ComponentInstance[];
  containerWidth: "full" | "container" | "narrow";
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  parallax?: boolean;
  padding: {
    top: number;
    bottom: number;
  };
}
```

---

## 📝 Template System

### Header Templates

```typescript
interface HeaderTemplate {
  id: string;
  name: string;
  type: "simple" | "mega" | "minimal" | "sidebar";
  components: ComponentInstance[];
  settings: {
    sticky: boolean;
    transparent: boolean;
    showOnScroll: boolean;
    mobileBreakpoint: number;
  };
  navigation: {
    items: NavigationItem[];
    style: "horizontal" | "vertical";
    dropdownStyle: "simple" | "mega";
  };
}

interface NavigationItem {
  label: string;
  url: string;
  isExternal: boolean;
  children?: NavigationItem[];
  icon?: string;
  badge?: string;
}
```

### Footer Templates

```typescript
interface FooterTemplate {
  id: string;
  name: string;
  type: "simple" | "detailed" | "minimal";
  sections: {
    id: string;
    title?: string;
    content: "links" | "text" | "social" | "newsletter";
    data: any;
  }[];
  settings: {
    backgroundColor: string;
    textColor: string;
    showCopyright: boolean;
    showSocial: boolean;
  };
}
```

### Global Settings

```typescript
interface GlobalPageSettings {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    fontSizes: {
      h1: string;
      h2: string;
      h3: string;
      body: string;
    };
  };
  seo: {
    defaultTitle: string;
    titleSuffix: string;
    defaultDescription: string;
    defaultKeywords: string[];
    defaultImage: string;
  };
  analytics: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customTrackingCode?: string;
  };
  performance: {
    lazyLoading: boolean;
    imageOptimization: boolean;
    cssMinification: boolean;
    jsMinification: boolean;
  };
}
```

---

## 🌍 Multilingual Management

### Language Configuration

```typescript
interface MultilingualConfig {
  defaultLanguage: string;
  supportedLanguages: SupportedLanguage[];
  autoDetectLanguage: boolean;
  fallbackToDefault: boolean;
  hreflangGeneration: boolean;
  urlStrategy: "subdirectory" | "subdomain" | "parameter";
}

interface SupportedLanguage {
  code: string;        // ISO 639-1 (e.g., "en", "fr", "es")
  name: string;        // Display name
  region?: string;     // ISO 3166-1 Alpha 2 (e.g., "US", "CA", "MX")
  rtl: boolean;        // Right-to-left text direction
  isActive: boolean;
  translationProgress: number; // 0-100%
}
```

### Translation Workflow

```typescript
interface TranslationWorkflow {
  sourcePageId: number;
  targetLanguages: string[];
  translationStatus: {
    language: string;
    status: 'pending' | 'in_progress' | 'review' | 'completed';
    progress: number;
    translator?: string;
    reviewer?: string;
    deadline?: Date;
    lastUpdated: Date;
  }[];
  translationMemory: TranslationMemoryEntry[];
}

interface TranslationMemoryEntry {
  sourceText: string;
  translatedText: string;
  language: string;
  context: string;        // Component type or field name
  confidence: number;     // 0-1
  approved: boolean;
  lastUsed: Date;
}
```

### Hreflang Generation

```typescript
class HreflangService {
  generateHreflangTags(page: PromoPage): string[] {
    const tags: string[] = [];
    
    if (page.hreflangData) {
      // Add self-referencing tag
      const selfLang = page.language;
      tags.push(`<link rel="alternate" hreflang="${selfLang}" href="${this.getPageUrl(page)}" />`);
      
      // Add alternative language tags
      page.hreflangData.alternatives?.forEach(alt => {
        const langCode = alt.region ? `${alt.language}-${alt.region}` : alt.language;
        tags.push(`<link rel="alternate" hreflang="${langCode}" href="${alt.url}" />`);
      });
      
      // Add x-default tag if specified
      if (page.hreflangData.xDefault) {
        tags.push(`<link rel="alternate" hreflang="x-default" href="${page.hreflangData.xDefault}" />`);
      }
    }
    
    return tags;
  }
  
  private getPageUrl(page: PromoPage): string {
    const baseUrl = this.getBaseUrl(page.tenantId);
    const languagePrefix = page.language !== 'en' ? `/${page.language}` : '';
    return `${baseUrl}${languagePrefix}/${page.slug}`;
  }
}
```

---

## 🖥️ Admin Interface

### Page Builder Interface

```typescript
const PromoPageBuilder = () => {
  const [currentPage, setCurrentPage] = useState<PromoPage>();
  const [selectedComponent, setSelectedComponent] = useState<ComponentInstance>();
  const [previewMode, setPreviewMode] = useState(false);
  
  return (
    <div className="promo-cms-builder">
      {/* Top Toolbar */}
      <BuilderToolbar>
        <div className="page-info">
          <h2>{currentPage?.title}</h2>
          <PageStatusBadge status={currentPage?.status} />
          <LanguageSelector 
            currentLanguage={currentPage?.language}
            availableLanguages={tenantLanguages}
            onLanguageChange={handleLanguageSwitch}
          />
        </div>
        
        <div className="actions">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <PublishButton 
            status={currentPage?.status}
            onPublish={handlePublish}
            onSchedule={handleSchedule}
          />
        </div>
      </BuilderToolbar>
      
      {!previewMode ? (
        <div className="builder-workspace">
          {/* Component Library Sidebar */}
          <ComponentLibrarySidebar>
            <ComponentPalette 
              components={PROMO_COMPONENTS}
              categories={componentCategories}
              onComponentDrag={handleComponentDragStart}
              searchQuery={componentSearch}
              onSearchChange={setComponentSearch}
            />
          </ComponentLibrarySidebar>
          
          {/* Main Canvas */}
          <div className="builder-canvas">
            <DragDropProvider onDrop={handleComponentDrop}>
              {/* Header Template Section */}
              <TemplateSection 
                type="header"
                template={currentPage?.headerTemplate}
                onTemplateChange={handleHeaderTemplateChange}
              />
              
              {/* Page Sections */}
              <div className="page-sections">
                {currentPage?.sections?.map((section, index) => (
                  <EditableSection
                    key={section.id}
                    section={section}
                    index={index}
                    onSectionUpdate={handleSectionUpdate}
                    onSectionDelete={handleSectionDelete}
                    onComponentSelect={setSelectedComponent}
                  />
                ))}
                
                {/* Drop Zone for New Sections */}
                <SectionDropZone onSectionAdd={handleSectionAdd} />
              </div>
              
              {/* Footer Template Section */}
              <TemplateSection 
                type="footer"
                template={currentPage?.footerTemplate}
                onTemplateChange={handleFooterTemplateChange}
              />
            </DragDropProvider>
          </div>
          
          {/* Properties Panel */}
          <PropertiesPanel>
            {selectedComponent ? (
              <ComponentPropertiesEditor
                component={selectedComponent}
                componentDefinition={PROMO_COMPONENTS[selectedComponent.type]}
                onChange={handleComponentUpdate}
                onDelete={handleComponentDelete}
              />
            ) : (
              <PagePropertiesEditor
                page={currentPage}
                onChange={handlePageUpdate}
              />
            )}
          </PropertiesPanel>
        </div>
      ) : (
        <PagePreview 
          page={currentPage}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
        />
      )}
    </div>
  );
};
```

### Component Properties Editor

```typescript
const ComponentPropertiesEditor = ({ 
  component, 
  componentDefinition, 
  onChange, 
  onDelete 
}) => {
  return (
    <div className="component-properties">
      <div className="properties-header">
        <h3>{componentDefinition.name}</h3>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(component.id)}
        >
          Delete
        </Button>
      </div>
      
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="styling">Styling</TabsTrigger>
          <TabsTrigger value="responsive">Responsive</TabsTrigger>
          <TabsTrigger value="animation">Animation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <ContentPropertiesForm
            config={component.config}
            schema={componentDefinition.props}
            onChange={(config) => onChange(component.id, { config })}
          />
        </TabsContent>
        
        <TabsContent value="styling">
          <StylingPropertiesForm
            styling={component.styling}
            onChange={(styling) => onChange(component.id, { styling })}
          />
        </TabsContent>
        
        <TabsContent value="responsive">
          <ResponsivePropertiesForm
            responsive={component.responsive}
            onChange={(responsive) => onChange(component.id, { responsive })}
          />
        </TabsContent>
        
        <TabsContent value="animation">
          <AnimationPropertiesForm
            animation={component.animation}
            onChange={(animation) => onChange(component.id, { animation })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### Template Management Interface

```typescript
const TemplateManager = () => {
  return (
    <div className="template-manager">
      <div className="template-header">
        <h2>Template Management</h2>
        <Button onClick={handleCreateTemplate}>
          Create New Template
        </Button>
      </div>
      
      <Tabs defaultValue="headers">
        <TabsList>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="footers">Footers</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="pages">Page Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="headers">
          <TemplateGrid 
            templates={headerTemplates}
            type="header"
            onTemplateSelect={handleTemplateSelect}
            onTemplateEdit={handleTemplateEdit}
            onTemplateDuplicate={handleTemplateDuplicate}
            onTemplateDelete={handleTemplateDelete}
          />
        </TabsContent>
        
        <TabsContent value="footers">
          <TemplateGrid 
            templates={footerTemplates}
            type="footer"
            onTemplateSelect={handleTemplateSelect}
            onTemplateEdit={handleTemplateEdit}
            onTemplateDuplicate={handleTemplateDuplicate}
            onTemplateDelete={handleTemplateDelete}
          />
        </TabsContent>
        
        <TabsContent value="sections">
          <TemplateGrid 
            templates={sectionTemplates}
            type="section"
            onTemplateSelect={handleTemplateSelect}
            onTemplateEdit={handleTemplateEdit}
            onTemplateDuplicate={handleTemplateDuplicate}
            onTemplateDelete={handleTemplateDelete}
          />
        </TabsContent>
        
        <TabsContent value="pages">
          <TemplateGrid 
            templates={pageTemplates}
            type="page"
            onTemplateSelect={handleTemplateSelect}
            onTemplateEdit={handleTemplateEdit}
            onTemplateDuplicate={handleTemplateDuplicate}
            onTemplateDelete={handleTemplateDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### Translation Management Interface

```typescript
const TranslationManager = () => {
  return (
    <div className="translation-manager">
      <div className="translation-header">
        <h2>Page Translations</h2>
        <LanguageSelector
          languages={tenantLanguages}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />
      </div>
      
      <div className="translation-workspace">
        <div className="source-content">
          <h3>Source ({sourceLanguage})</h3>
          <ComponentTranslationView
            components={sourceComponents}
            language={sourceLanguage}
            readonly={true}
          />
        </div>
        
        <div className="target-content">
          <h3>Target ({currentLanguage})</h3>
          <ComponentTranslationEditor
            components={targetComponents}
            sourceComponents={sourceComponents}
            language={currentLanguage}
            onComponentUpdate={handleTranslationUpdate}
          />
        </div>
      </div>
      
      <div className="translation-actions">
        <Button 
          variant="outline"
          onClick={handleCopyFromSource}
        >
          Copy from Source
        </Button>
        <Button 
          variant="outline"
          onClick={handleAutoTranslate}
        >
          Auto Translate
        </Button>
        <Button onClick={handleSaveTranslation}>
          Save Translation
        </Button>
      </div>
    </div>
  );
};
```

---

## 🔌 API Endpoints

### Page Management

#### Create Promo Page
```typescript
POST /api/v1/promo/pages
{
  title: string;
  slug: string;
  templateId?: number;
  headerTemplateId?: number;
  footerTemplateId?: number;
  language?: string;
  seoData?: {
    title?: string;
    metaDescription?: string;
    focusKeyword?: string;
    openGraphData?: object;
  };
  globalSettings?: object;
}

Response: {
  page: PromoPage;
  message: string;
}
```

#### Update Page
```typescript
PUT /api/v1/promo/pages/:uuid
{
  title?: string;
  sections?: PageSection[];
  seoData?: object;
  globalSettings?: object;
  status?: PageStatus;
}

Response: {
  page: PromoPage;
  message: string;
}
```

#### Get Pages
```typescript
GET /api/v1/promo/pages?language=en&status=published&page=1&limit=20

Response: {
  pages: PromoPage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    languages: string[];
    templates: PromoPageTemplate[];
  };
}
```

#### Publish Page
```typescript
POST /api/v1/promo/pages/:uuid/publish
{
  publishedAt?: Date;
  scheduledAt?: Date;
}

Response: {
  page: PromoPage;
  message: string;
}
```

### Template Management

#### Create Template
```typescript
POST /api/v1/promo/templates
{
  name: string;
  type: TemplateType;
  components: ComponentInstance[];
  isGlobal?: boolean;
  language?: string;
}
```

#### Get Templates
```typescript
GET /api/v1/promo/templates?type=header&language=en

Response: {
  templates: PromoPageTemplate[];
  categories: ComponentCategory[];
}
```

### Component Library

#### Get Components
```typescript
GET /api/v1/promo/components?category=HERO&search=banner

Response: {
  components: ComponentDefinition[];
  categories: ComponentCategory[];
}
```

#### Validate Component Configuration
```typescript
POST /api/v1/promo/components/validate
{
  componentType: string;
  config: object;
}

Response: {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

### Live Data Integration

#### Get Featured Content
```typescript
GET /api/v1/promo/featured-content?type=MODEL&count=6&category=fashion

Response: {
  content: FeaturedContent[];
  metadata: {
    totalAvailable: number;
    lastUpdated: Date;
  };
}
```

#### Get Live Stats
```typescript
GET /api/v1/promo/live-stats

Response: {
  totalModels: number;
  activeJobs: number;
  totalProfessionals: number;
  successStories: number;
  lastUpdated: Date;
}
```

### Translation APIs

#### Create Translation
```typescript
POST /api/v1/promo/pages/:uuid/translations
{
  targetLanguage: string;
  copyFromSource?: boolean;
}

Response: {
  translationPage: PromoPage;
  workflow: TranslationWorkflow;
}
```

#### Update Translation
```typescript
PUT /api/v1/promo/pages/:uuid/translations/:language
{
  sections: PageSection[];
  seoData?: object;
}
```

#### Generate Hreflang
```typescript
POST /api/v1/promo/pages/:uuid/hreflang

Response: {
  hreflangTags: string[];
  hreflangData: HreflangData;
}
```

---

## 🔗 Integration with itellico Mono

### Live Data Services

```typescript
class PromoContentService {
  private redis: Redis;
  private db: PrismaClient;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.db = new PrismaClient();
  }
  
  // Get featured models for showcase components
  async getFeaturedModels(tenantId: number, options: FeaturedModelOptions = {}) {
    const cacheKey = `tenant:${tenantId}:promo:featured-models:${this.hashOptions(options)}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const models = await this.db.user.findMany({
      where: { 
        tenantId,
        roles: { some: { role: { code: 'model' } } },
        isActive: true,
        isFeatured: true,
        ...(options.categories && { 
          profile: { 
            categories: { some: { name: { in: options.categories } } }
          }
        })
      },
      take: options.limit || 6,
      include: { 
        profile: true, 
        media: { where: { isActive: true }, take: 3 },
        stats: true
      },
      orderBy: options.orderBy || { featuredAt: 'desc' }
    });
    
    // Transform for promo display
    const transformedModels = models.map(model => ({
      id: model.uuid,
      name: model.profile?.displayName || `${model.firstName} ${model.lastName}`,
      avatar: model.profile?.avatarUrl,
      portfolio: model.media.map(m => m.url),
      location: model.profile?.location,
      specialties: model.profile?.specialties,
      rating: model.stats?.averageRating,
      profileUrl: `/models/${model.uuid}`
    }));
    
    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(transformedModels));
    
    return transformedModels;
  }
  
  // Get latest jobs for job listing components
  async getLatestJobs(tenantId: number, options: JobListingOptions = {}) {
    const cacheKey = `tenant:${tenantId}:promo:latest-jobs:${this.hashOptions(options)}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const jobs = await this.db.jobPosting.findMany({
      where: { 
        tenantId, 
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
        ...(options.categories && { 
          category: { name: { in: options.categories } }
        })
      },
      orderBy: { postedAt: 'desc' },
      take: options.limit || 10,
      include: { 
        category: true, 
        company: true,
        requirements: true 
      }
    });
    
    const transformedJobs = jobs.map(job => ({
      id: job.uuid,
      title: job.title,
      company: job.company?.name,
      location: job.location,
      type: job.type,
      salary: options.showSalary ? job.salaryRange : null,
      description: job.shortDescription,
      postedAt: job.postedAt,
      category: job.category?.name,
      urgent: job.isUrgent,
      jobUrl: `/jobs/${job.uuid}`
    }));
    
    await this.redis.setex(cacheKey, 300, JSON.stringify(transformedJobs));
    
    return transformedJobs;
  }
  
  // Get featured blog posts for content sections
  async getFeaturedBlogPosts(tenantId: number, options: BlogPostOptions = {}) {
    const cacheKey = `tenant:${tenantId}:promo:blog-posts:${this.hashOptions(options)}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const posts = await this.db.blogPost.findMany({
      where: { 
        tenantId, 
        status: 'PUBLISHED',
        isFeatured: true,
        ...(options.categories && { 
          categories: { some: { name: { in: options.categories } } }
        })
      },
      orderBy: { publishedAt: 'desc' },
      take: options.limit || 3,
      include: { 
        author: { include: { profile: true } },
        categories: true,
        _count: { select: { comments: true } }
      }
    });
    
    const transformedPosts = posts.map(post => ({
      id: post.uuid,
      title: post.title,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      author: {
        name: post.author.profile?.displayName || `${post.author.firstName} ${post.author.lastName}`,
        avatar: post.author.profile?.avatarUrl
      },
      publishedAt: post.publishedAt,
      readingTime: post.readingTime,
      categories: post.categories.map(c => c.name),
      commentsCount: post._count.comments,
      postUrl: `/blog/${post.slug}`
    }));
    
    await this.redis.setex(cacheKey, 600, JSON.stringify(transformedPosts)); // 10 minutes
    
    return transformedPosts;
  }
  
  // Get platform statistics for stats counter components
  async getPlatformStats(tenantId: number) {
    const cacheKey = `tenant:${tenantId}:promo:platform-stats`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const [
      totalModels,
      activeJobs,
      successfulProjects,
      totalProfessionals
    ] = await Promise.all([
      this.db.user.count({ 
        where: { 
          tenantId, 
          roles: { some: { role: { code: 'model' } } },
          isActive: true 
        } 
      }),
      this.db.jobPosting.count({ 
        where: { 
          tenantId, 
          status: 'ACTIVE',
          expiresAt: { gt: new Date() }
        } 
      }),
      this.db.project.count({ 
        where: { 
          tenantId, 
          status: 'COMPLETED' 
        } 
      }),
      this.db.user.count({ 
        where: { 
          tenantId, 
          roles: { some: { role: { code: { in: ['photographer', 'designer', 'creative'] } } } },
          isActive: true 
        } 
      })
    ]);
    
    const stats = {
      totalModels,
      activeJobs,
      successfulProjects,
      totalProfessionals,
      lastUpdated: new Date()
    };
    
    await this.redis.setex(cacheKey, 1800, JSON.stringify(stats)); // 30 minutes
    
    return stats;
  }
  
  private hashOptions(options: any): string {
    return Buffer.from(JSON.stringify(options)).toString('base64');
  }
}
```

### Component Rendering Service

```typescript
class ComponentRenderer {
  private contentService: PromoContentService;
  
  constructor() {
    this.contentService = new PromoContentService();
  }
  
  async renderComponent(component: ComponentInstance, tenantId: number): Promise<string> {
    const componentDef = PROMO_COMPONENTS[component.type];
    if (!componentDef) {
      throw new Error(`Unknown component type: ${component.type}`);
    }
    
    // Get live data if component requires it
    let liveData = {};
    switch (component.type) {
      case 'MODEL_SHOWCASE':
        liveData = { models: await this.contentService.getFeaturedModels(tenantId, component.config) };
        break;
      case 'JOB_LISTINGS':
        liveData = { jobs: await this.contentService.getLatestJobs(tenantId, component.config) };
        break;
      case 'BLOG_PREVIEW':
        liveData = { posts: await this.contentService.getFeaturedBlogPosts(tenantId, component.config) };
        break;
      case 'STATS_COUNTER':
        liveData = { stats: await this.contentService.getPlatformStats(tenantId) };
        break;
    }
    
    // Merge config with live data
    const renderProps = { ...component.config, ...liveData };
    
    // Apply styling and responsive settings
    const styles = this.generateComponentStyles(component);
    
    // Render component with Next.js/React
    return await this.renderReactComponent(component.type, renderProps, styles);
  }
  
  private generateComponentStyles(component: ComponentInstance): string {
    const styles: string[] = [];
    
    if (component.styling) {
      const { styling } = component;
      
      if (styling.marginTop) styles.push(`margin-top: ${styling.marginTop}px;`);
      if (styling.marginBottom) styles.push(`margin-bottom: ${styling.marginBottom}px;`);
      if (styling.paddingTop) styles.push(`padding-top: ${styling.paddingTop}px;`);
      if (styling.paddingBottom) styles.push(`padding-bottom: ${styling.paddingBottom}px;`);
      if (styling.backgroundColor) styles.push(`background-color: ${styling.backgroundColor};`);
      if (styling.textColor) styles.push(`color: ${styling.textColor};`);
      if (styling.customCSS) styles.push(styling.customCSS);
    }
    
    return styles.join(' ');
  }
  
  private async renderReactComponent(
    componentType: string, 
    props: any, 
    styles: string
  ): Promise<string> {
    // Implementation would use React server-side rendering
    // This is a simplified example
    const ComponentClass = this.getComponentClass(componentType);
    return await renderToString(
      React.createElement(ComponentClass, { ...props, style: styles })
    );
  }
}
```

---

## 🚀 Implementation Guide

### Phase 1: Core CMS Foundation (Weeks 1-3)

#### Week 1: Database & Models
1. Create promo page database models
2. Set up component library schema
3. Implement basic CRUD operations
4. Add template management system

#### Week 2: Component System
1. Build component registry and validation
2. Implement pre-built component library
3. Create component rendering service
4. Add component configuration schemas

#### Week 3: Basic Admin Interface
1. Create page management dashboard
2. Build simple page editor
3. Implement template selection
4. Add basic component placement

### Phase 2: Page Builder & Templates (Weeks 4-6)

#### Week 4: Drag-and-Drop Builder
1. Implement drag-and-drop functionality
2. Create component palette
3. Build section management
4. Add component properties panel

#### Week 5: Template System
1. Create header/footer template editor
2. Implement template inheritance
3. Build template management interface
4. Add global settings management

#### Week 6: Live Data Integration
1. Integrate with existing Mono platform data
2. Implement live model/job components
3. Add auto-refresh functionality
4. Create data caching system

### Phase 3: Multilingual & SEO (Weeks 7-9)

#### Week 7: Multilingual Foundation
1. Implement language management
2. Create translation workflow
3. Add hreflang generation
4. Build language switching interface

#### Week 8: SEO Optimization
1. Add SEO meta tag management
2. Implement schema markup generation
3. Create SEO analysis tools
4. Add social media optimization

#### Week 9: Translation Interface
1. Build translation management UI
2. Implement component translation
3. Add translation memory system
4. Create bulk translation tools

### Phase 4: Performance & Launch (Weeks 10-12)

#### Week 10: Performance Optimization
1. Implement caching strategies
2. Add image optimization
3. Create CDN integration
4. Optimize rendering performance

#### Week 11: Advanced Features
1. Add animation support
2. Implement responsive design tools
3. Create form handling system
4. Add analytics integration

#### Week 12: Testing & Launch
1. Comprehensive testing
2. Performance optimization
3. Security audit
4. Documentation and training

### Caching Strategy

```typescript
// Redis cache patterns for promo CMS
const PROMO_CACHE_PATTERNS = {
  // Page caching
  PUBLISHED_PAGE: 'tenant:{tenantId}:promo:page:{slug}:{language}', // 1 hour TTL
  PAGE_PREVIEW: 'tenant:{tenantId}:promo:preview:{uuid}', // 10 minutes TTL
  
  // Component data caching
  FEATURED_MODELS: 'tenant:{tenantId}:promo:featured-models:{hash}', // 5 minutes TTL
  LATEST_JOBS: 'tenant:{tenantId}:promo:latest-jobs:{hash}', // 5 minutes TTL
  BLOG_POSTS: 'tenant:{tenantId}:promo:blog-posts:{hash}', // 10 minutes TTL
  PLATFORM_STATS: 'tenant:{tenantId}:promo:platform-stats', // 30 minutes TTL
  
  // Template caching
  TEMPLATES: 'tenant:{tenantId}:promo:templates:{type}:{language}', // 1 hour TTL
  COMPONENT_LIBRARY: 'tenant:{tenantId}:promo:components', // 1 hour TTL
  
  // SEO and metadata
  SEO_DATA: 'tenant:{tenantId}:promo:seo:{pageId}', // 1 hour TTL
  HREFLANG: 'tenant:{tenantId}:promo:hreflang:{pageId}', // 1 hour TTL
};
```

### Performance Considerations

#### Frontend Optimization
- Component lazy loading
- Image optimization and responsive images
- CSS/JS minification and compression
- Progressive loading for heavy components

#### Backend Optimization
- Redis caching for all data queries
- Database query optimization
- CDN integration for static assets
- API response compression

#### SEO Performance
- Server-side rendering for public pages
- Automatic sitemap generation
- Meta tag optimization
- Structured data implementation

---

## 📈 Success Metrics

### Content Management Efficiency
- Page creation time: Target <10 minutes for basic pages
- Template reuse rate: Target >70%
- Component reuse rate: Target >80%
- Translation completion time: Target <2 hours per page

### Performance Metrics
- Page load time: Target <2 seconds
- Component rendering time: Target <100ms
- Cache hit rate: Target >90%
- SEO score: Target >85

### User Experience
- Admin interface usability score
- Content editor training time
- Error rate in page building
- User satisfaction ratings

---

This comprehensive promo pages CMS provides a perfect balance of simplicity and functionality, allowing tenants to create professional promotional pages while maintaining the Mono platform's architectural integrity and performance standards.