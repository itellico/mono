---
title: Account Templates
sidebar_label: Templates
---

# Account Templates

Pre-configured feature combinations designed for specific business models. Start with a template and customize as needed, or build your own from scratch.

## Overview

Templates provide:
- **Quick Start**: Pre-selected features for common use cases
- **Best Practices**: Proven feature combinations
- **Customizable**: Modify any template to fit your needs
- **Cost-Effective**: Bundled pricing for feature sets
- **Industry-Specific**: Tailored for different sectors

## Available Templates

### 🏢 Agency Template

**Perfect for:** Talent agencies, model management, casting agencies

**Included Features:**
- ✅ Manage Others (unlimited talent)
- ✅ Team Collaboration (15 seats)
- ✅ Commission Processing
- ✅ Project Management
- ✅ Advanced Analytics
- ✅ Client Portal
- ✅ Contract Management
- ✅ Invoicing Pro

**Configuration:**
```typescript
interface AgencyTemplate {
  baseFeatures: {
    talentManagement: {
      roster: 'unlimited';
      profiles: 'full_control';
      bookings: 'manage_all';
    };
    teamTools: {
      seats: 15;
      roles: ['admin', 'agent', 'scout', 'coordinator'];
      permissions: 'customizable';
    };
    financial: {
      commissions: '5-50% configurable';
      invoicing: 'automated';
      payments: 'split_processing';
    };
  };
  pricing: {
    monthly: 299;
    annual: 2990; // 2 months free
    additionalSeat: 19;
  };
}
```

**Use Cases:**
- Model agencies
- Acting agencies
- Sports management
- Music management
- Influencer agencies

### 📸 Professional Template

**Perfect for:** Photographers, stylists, makeup artists, freelancers

**Included Features:**
- ✅ Professional Profile
- ✅ Portfolio Showcase
- ✅ Booking Calendar
- ✅ Direct Payments
- ✅ Client Reviews
- ✅ Basic Invoicing
- ✅ Service Packages
- ✅ Availability Management

**Configuration:**
```typescript
interface ProfessionalTemplate {
  baseFeatures: {
    profile: {
      type: 'enhanced';
      portfolio: 'unlimited_items';
      seo: 'optimized';
    };
    booking: {
      calendar: 'integrated';
      rules: 'customizable';
      deposits: 'supported';
    };
    business: {
      invoicing: 'professional';
      contracts: 'templates';
      payments: 'direct';
    };
  };
  pricing: {
    monthly: 49;
    annual: 490; // 2 months free
  };
}
```

**Ideal For:**
- Fashion photographers
- Makeup artists
- Hair stylists
- Creative directors
- Set designers

### 🛍️ Vendor Template

**Perfect for:** Equipment rental, prop houses, service providers

**Included Features:**
- ✅ Product Catalog
- ✅ Inventory Management
- ✅ Rental Calendar
- ✅ Dynamic Pricing
- ✅ Order Processing
- ✅ Delivery Management
- ✅ Insurance Options
- ✅ Bundle Creation

**Configuration:**
```typescript
interface VendorTemplate {
  baseFeatures: {
    catalog: {
      products: 'unlimited';
      variations: 'supported';
      categories: 'hierarchical';
    };
    inventory: {
      tracking: 'real_time';
      locations: 'multiple';
      maintenance: 'scheduled';
    };
    commerce: {
      pricing: 'dynamic';
      discounts: 'rule_based';
      shipping: 'integrated';
    };
  };
  addons: {
    warehouseManagement: 29;
    barcodeScanning: 19;
    mobileApp: 49;
  };
}
```

**Applications:**
- Camera equipment rental
- Lighting rental
- Props and wardrobe
- Studio rental
- Location services

### 🎬 Production Template

**Perfect for:** Production companies, event organizers, casting directors

**Included Features:**
- ✅ Project Workspaces
- ✅ Casting Tools
- ✅ Budget Management
- ✅ Team Collaboration
- ✅ Vendor Network
- ✅ Call Sheets
- ✅ Approval Workflows
- ✅ Resource Planning

**Configuration:**
```typescript
interface ProductionTemplate {
  baseFeatures: {
    projects: {
      workspaces: 'unlimited';
      templates: 'custom';
      sharing: 'controlled';
    };
    casting: {
      database: 'searchable';
      auditions: 'scheduled';
      selections: 'collaborative';
    };
    operations: {
      budgets: 'detailed';
      schedules: 'integrated';
      logistics: 'managed';
    };
  };
  teamSize: 'unlimited';
  storage: '500GB';
}
```

**Use Cases:**
- Film production
- Commercial shoots
- Fashion shows
- Event planning
- Content creation

### 💼 Client Template

**Perfect for:** Brands, businesses, buyers, project creators

**Included Features:**
- ✅ Project Posting
- ✅ Talent Search
- ✅ Secure Payments
- ✅ Contract Management
- ✅ Team Access
- ✅ Approval Tools
- ✅ Analytics
- ✅ Vendor Management

**Configuration:**
```typescript
interface ClientTemplate {
  baseFeatures: {
    posting: {
      projects: 'unlimited';
      visibility: 'controlled';
      applications: 'managed';
    };
    search: {
      filters: 'advanced';
      saved: 'unlimited';
      alerts: 'real_time';
    };
    management: {
      contracts: 'digital';
      payments: 'escrow';
      disputes: 'mediated';
    };
  };
  compliance: {
    ndas: 'automated';
    insurance: 'verified';
    background: 'checked';
  };
}
```

## Custom Templates

### Build Your Own

Create a custom template for your unique needs:

**Step 1: Analyze Requirements**
```typescript
interface RequirementsAnalysis {
  businessModel: string;
  userTypes: string[];
  keyWorkflows: string[];
  integrations: string[];
  budget: number;
}
```

**Step 2: Select Features**
- Core functionality
- Add-on services
- Third-party integrations
- Custom development

**Step 3: Optimize Pricing**
- Bundle discounts
- Volume pricing
- Annual savings
- Growth allowance

### Industry-Specific Templates

**Fashion Industry Bundle**
- Model agencies
- Fashion photographers
- Stylists
- Designers
- Fashion brands

**Entertainment Bundle**
- Casting agencies
- Production companies
- Location scouts
- Equipment rental
- Post-production

**Events Bundle**
- Event planners
- Venue providers
- Catering services
- Entertainment booking
- Equipment rental

## Template Comparison

| Feature | Agency | Professional | Vendor | Production | Client |
|---------|---------|--------------|---------|------------|---------|
| **Team Seats** | 15 | 1 | 5 | Unlimited | 10 |
| **Profiles** | Unlimited | 1 | 1 | 5 | 3 |
| **Projects** | Unlimited | 50/mo | N/A | Unlimited | Unlimited |
| **Storage** | 100GB | 50GB | 200GB | 500GB | 100GB |
| **Invoicing** | Advanced | Basic | Advanced | Advanced | Basic |
| **API Access** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **White Label** | ✅ | ❌ | Optional | ✅ | Optional |
| **Price/Month** | $299 | $49 | $149 | $499 | $199 |

## Migration Between Templates

### Upgrade Path

**Professional → Agency:**
1. Data migration assistance
2. Team onboarding
3. Feature training
4. Gradual rollout
5. Support transition

**Downgrade Protection:**
- Data export
- Feature sunset period
- Cost credits
- Migration support

### Template Switching

**Instant Changes:**
- Feature activation
- Billing adjustment
- Access updates
- Setting preservation

**Planned Migration:**
- 30-day notice
- Data preparation
- Team training
- Phased approach

## Success Metrics

### Template Performance

**Agency Template Success:**
- Average talent roster: 156
- Monthly revenue: $247K
- Client retention: 92%
- ROI: 380%

**Professional Template Success:**
- Booking increase: 40%
- Revenue growth: 65%
- Time saved: 15hrs/week
- Client satisfaction: 4.9/5

## Best Practices

### Choosing a Template

1. **Start with Core Needs**: Identify must-have features
2. **Consider Growth**: Plan for expansion
3. **Evaluate ROI**: Calculate feature value
4. **Test First**: Use trial periods
5. **Get Feedback**: Consult team/clients

### Customization Tips

- Don't over-feature initially
- Add features based on usage
- Remove unused features
- Monitor adoption rates
- Regular review cycles

### Cost Optimization

**Bundle Strategies:**
- Annual payments (save 17%)
- Feature bundles (save 25%)
- Team packages (save 30%)
- Early adoption (save 20%)

## Support & Resources

### Template Support

**Included with All Templates:**
- Onboarding assistance
- Video tutorials
- Best practice guides
- Community access
- Email support

**Premium Support (Add-on):**
- Dedicated account manager
- Priority support
- Custom training
- Quarterly reviews
- Strategic consulting

### Learning Resources

- Template selection wizard
- Feature comparison tool
- ROI calculator
- Implementation guides
- Success stories

## Related Documentation

- [Feature Catalog](/account/features)
- [Pricing Details](/account/pricing)
- [Migration Guide](/guides/template-migration)
- [Custom Development](/platform/custom-development)