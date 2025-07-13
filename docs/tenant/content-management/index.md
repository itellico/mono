---
title: Content Management
sidebar_label: Content Management
---

# Tenant Content Management

Content Management provides comprehensive tools for creating, organizing, moderating, and publishing content within your marketplace. This includes media management, content moderation, workflow automation, and publishing controls.

## Overview

The Content Management system enables:

- **Media Library**: Centralized asset management with tenant and platform resources
- **Content Moderation**: Community-driven moderation with GoCare integration
- **Publishing Workflows**: Approval chains and scheduled publishing
- **Content Organization**: Categories, tags, and metadata management
- **Version Control**: Content history and revision tracking

## Core Features

### 📸 Media Library

Comprehensive media asset management:

**Media Sources:**
- **Tenant Media**: Your own uploaded assets
- **Platform Assets**: Shared industry templates and resources
- **External Sources**: CDN and third-party integrations

**Asset Management:**
```typescript
interface MediaAsset {
  id: string;
  filename: string;
  type: 'image' | 'video' | 'document' | 'audio';
  source: 'tenant' | 'platform' | 'external';
  metadata: {
    size: number;
    dimensions?: { width: number; height: number };
    duration?: number;
    format: string;
  };
  usage: {
    count: number;
    locations: string[];
    lastUsed: Date;
  };
  permissions: {
    public: boolean;
    accounts: string[];
    roles: string[];
  };
}
```

**Storage Features:**
- Folder organization
- Bulk upload support
- Automatic optimization
- CDN distribution
- Usage analytics

### 🛡️ Content Moderation (GoCare)

Community-driven content moderation system:

**GoCare Features:**
- **Community Reviews**: Peer-based content validation
- **AI Assistance**: Automated pre-screening
- **Multi-Reviewer System**: Consensus-based decisions
- **Transparent Process**: Clear moderation history

**Moderation Configuration:**
```typescript
interface ModerationSettings {
  gocareEnabled: boolean;
  autoApprovalThreshold: number;
  autoHideThreshold: number;
  requireManualReview: boolean;
  multipleReviewersRequired: boolean;
  flagTypes: {
    inappropriate: boolean;
    spam: boolean;
    harassment: boolean;
    copyright: boolean;
  };
}
```

**Review Process:**
1. Content submission
2. AI pre-screening (if enabled)
3. Community review assignment
4. Multiple reviewer validation
5. Automatic action or escalation
6. Final approval/rejection

### 📝 Content Creation

Rich content creation tools:

**Content Types:**
- **Listings**: Products, services, offerings
- **Articles**: Blog posts, guides, tutorials
- **Pages**: Static content, about, policies
- **Forms**: Applications, surveys, inquiries
- **Templates**: Reusable content structures

**Editor Features:**
- Rich text editing
- Media embedding
- Code snippets
- Tables and charts
- Custom widgets

### 🔄 Publishing Workflows

Structured content publishing:

**Workflow States:**
```typescript
enum ContentStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}
```

**Approval Chains:**
- Role-based approvers
- Sequential or parallel approval
- Conditional routing
- Escalation rules
- Deadline management

### 🏷️ Content Organization

Structured content categorization:

**Organization Tools:**
- **Categories**: Hierarchical taxonomy
- **Tags**: Flexible labeling
- **Collections**: Curated content groups
- **Metadata**: Custom fields
- **Search Filters**: Advanced filtering

**Category Management:**
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: string;
  children: string[];
  metadata: {
    description: string;
    image?: string;
    attributes: CustomAttribute[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}
```

## Content Moderation Details

### Community Reviewers

Manage your moderation team:

**Reviewer Roles:**
- **Senior Reviewers**: Trusted, high-accuracy moderators
- **Standard Reviewers**: Regular community moderators
- **Training Reviewers**: New moderators in training

**Reviewer Metrics:**
- Total reviews completed
- Accuracy rate
- Average review time
- Specialization areas
- Trust score

### Moderation Analytics

Track moderation effectiveness:

**Key Metrics:**
- Reviews per month
- Community accuracy rate
- Average review time
- Auto-resolved rate
- Pending reviews

**Performance Indicators:**
- False positive rate
- Escalation frequency
- Reviewer agreement
- Resolution time
- User satisfaction

### Flag Types and Actions

Configurable content flags:

| Flag Type | Description | Auto-Action | Severity |
|-----------|-------------|-------------|----------|
| Inappropriate | Adult or offensive content | Hide + Review | High |
| Spam | Promotional or repetitive | Hide | Medium |
| Harassment | Abusive behavior | Hide + Ban Check | High |
| Copyright | IP violations | Hide + Legal Review | Critical |
| Misleading | False information | Review | Medium |
| Quality | Below standards | Review | Low |

## Media Management

### Storage Organization

Efficient media organization:

**Folder Structure:**
- `/brand-assets` - Logos, brand materials
- `/products` - Product images and videos
- `/marketing` - Promotional materials
- `/blog` - Article images
- `/documents` - PDFs, guides
- `/templates` - Reusable assets

### Media Optimization

Automatic media processing:

- **Image Optimization**: Compression, resizing, format conversion
- **Video Processing**: Transcoding, thumbnail generation
- **Document Conversion**: PDF generation, preview creation
- **CDN Distribution**: Global edge caching
- **Responsive Variants**: Multiple sizes for different devices

### Usage Tracking

Monitor media utilization:

```typescript
interface MediaUsage {
  assetId: string;
  usageCount: number;
  locations: {
    type: 'listing' | 'article' | 'page' | 'email';
    id: string;
    title: string;
    lastUsed: Date;
  }[];
  performance: {
    views: number;
    clicks: number;
    conversionRate: number;
  };
}
```

## Publishing Features

### Scheduled Publishing

Time-based content release:

- **Date/Time Scheduling**: Precise publication timing
- **Timezone Support**: Multi-region scheduling
- **Recurring Publishing**: Regular content updates
- **Embargo Management**: Content hold periods
- **Bulk Scheduling**: Multiple items at once

### Version Control

Content revision management:

```typescript
interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  changes: {
    field: string;
    before: any;
    after: any;
  }[];
  author: string;
  timestamp: Date;
  status: ContentStatus;
  notes: string;
}
```

### SEO Management

Search engine optimization:

- **Meta Tags**: Title, description, keywords
- **URL Management**: Custom slugs, redirects
- **Structured Data**: Schema.org markup
- **Sitemap Generation**: Automatic XML sitemaps
- **Social Media**: Open Graph, Twitter Cards

## Workflow Automation

### Approval Workflows

Configurable approval processes:

**Workflow Configuration:**
```typescript
interface ApprovalWorkflow {
  name: string;
  triggers: WorkflowTrigger[];
  stages: {
    name: string;
    approvers: {
      type: 'role' | 'user' | 'group';
      id: string;
    }[];
    requirements: {
      minApprovals: number;
      unanimous: boolean;
      timeout: number;
    };
    actions: WorkflowAction[];
  }[];
}
```

### Automation Rules

Content automation features:

- **Auto-Tagging**: AI-based categorization
- **Quality Checks**: Automated validation
- **Notification Rules**: Alert configurations
- **Archive Policies**: Automatic archival
- **Performance Actions**: Based on metrics

## Best Practices

1. **Media Organization**: Use consistent folder structures
2. **Moderation Balance**: Configure thresholds appropriately
3. **Version Control**: Document significant changes
4. **SEO Optimization**: Complete all metadata fields
5. **Regular Audits**: Review content performance

## Integration Points

### External Services

- **CDN Providers**: Cloudflare, Fastly, Akamai
- **Image Services**: Cloudinary, Imgix
- **Video Platforms**: Vimeo, YouTube, Wistia
- **Translation Services**: For multilingual content
- **Analytics Tools**: Content performance tracking

### API Access

```typescript
// List content
GET /api/v1/tenant/content

// Create content
POST /api/v1/tenant/content
{
  type: 'article',
  title: 'New Article',
  content: '...',
  status: 'draft'
}

// Upload media
POST /api/v1/tenant/media/upload

// Moderate content
POST /api/v1/tenant/content/{id}/moderate
{
  action: 'approve',
  reason: 'Meets quality standards'
}
```

## Related Documentation

- [Media Library Guide](/tenant/media-library)
- [Content Moderation](/tenant/moderation)
- [Publishing Workflows](/tenant/workflows)
- [SEO Best Practices](/guides/seo)