---
title: Complete Developer Workflow Guide
category: guides
tags:
  - developer-guide
  - schema-compilation
  - static-pages
  - deployment
  - api-integration
priority: critical
lastUpdated: '2025-07-09'
---

# Complete Developer Workflow: From Schema to Production

## Overview

This guide covers the complete workflow for building SaaS applications with Mono Platform, from schema definition to static page deployment with API integration.

## Table of Contents

1. [Schema Creation & Compilation](#schema-creation)
2. [Option Sets Integration](#option-sets)
3. [API Generation](#api-generation)
4. [Building Static Marketing Pages](#static-pages)
5. [Dynamic Widget Integration](#dynamic-widgets)
6. [Deployment Strategy](#deployment)
7. [Real Example: go-models.com](#real-example)

## Schema Creation & Compilation {#schema-creation}

### Step 1: Define Your Schema

Create a schema file that defines your data model:

```typescript
// schemas/modeling-agency/fashion-model.ts
import { SchemaBuilder } from '@mono/schema-sdk';

export const FashionModelSchema = SchemaBuilder.create({
  name: 'fashion_model',
  displayName: 'Fashion Model',
  version: '1.0',
  
  fields: {
    // Basic Information
    firstName: {
      type: 'string',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 50,
        pattern: '^[a-zA-Z\\s-]+$'
      }
    },
    
    lastName: {
      type: 'string',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    
    email: {
      type: 'email',
      required: true,
      unique: true
    },
    
    // Physical Attributes with Regional Support
    height: {
      type: 'measurement',
      unit: 'height',
      required: true,
      regional: true,
      conversions: {
        metric: { unit: 'cm', format: '{value} cm' },
        imperial: { unit: 'inches', format: '{feet}′{inches}″' }
      }
    },
    
    // Option Set References
    hairColor: {
      type: 'select',
      optionSet: 'hair_colors',
      required: true
    },
    
    eyeColor: {
      type: 'select',
      optionSet: 'eye_colors',
      required: true
    },
    
    // Multi-select with Option Set
    languages: {
      type: 'multiselect',
      optionSet: 'languages',
      validation: {
        minItems: 1,
        maxItems: 10
      }
    },
    
    // Complex Fields
    measurements: {
      type: 'group',
      fields: {
        bust: { type: 'number', unit: 'cm' },
        waist: { type: 'number', unit: 'cm' },
        hips: { type: 'number', unit: 'cm' }
      }
    },
    
    // Media Fields
    profilePhoto: {
      type: 'image',
      required: true,
      validation: {
        maxSize: '5MB',
        formats: ['jpg', 'jpeg', 'png', 'webp']
      }
    },
    
    portfolio: {
      type: 'image[]',
      validation: {
        maxFiles: 20,
        maxSize: '10MB',
        formats: ['jpg', 'jpeg', 'png', 'webp']
      }
    },
    
    // Relations
    agency: {
      type: 'relation',
      model: 'agency',
      relation: 'manyToOne'
    },
    
    bookings: {
      type: 'relation',
      model: 'booking',
      relation: 'oneToMany'
    }
  },
  
  // Database Indexes
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['agency', 'isActive'] },
    { fields: ['createdAt'], order: 'DESC' }
  ],
  
  // Search Configuration
  search: {
    fields: ['firstName', 'lastName', 'email'],
    weights: {
      firstName: 2,
      lastName: 2,
      email: 1
    }
  },
  
  // API Permissions
  permissions: {
    create: ['agency.admin', 'agency.scout'],
    read: ['public'], // Public can view models
    update: ['agency.admin', 'self'],
    delete: ['agency.admin']
  }
});
```

### Step 2: Define Option Sets

Create option sets that your schemas reference:

```typescript
// schemas/modeling-agency/option-sets.ts
export const optionSets = {
  hair_colors: {
    name: 'Hair Colors',
    options: [
      { value: 'blonde', label: 'Blonde' },
      { value: 'brown', label: 'Brown' },
      { value: 'black', label: 'Black' },
      { value: 'red', label: 'Red' },
      { value: 'gray', label: 'Gray' },
      { value: 'other', label: 'Other' }
    ]
  },
  
  eye_colors: {
    name: 'Eye Colors',
    options: [
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' },
      { value: 'brown', label: 'Brown' },
      { value: 'hazel', label: 'Hazel' },
      { value: 'gray', label: 'Gray' },
      { value: 'other', label: 'Other' }
    ]
  },
  
  languages: {
    name: 'Languages',
    searchable: true,
    options: [
      { value: 'en', label: 'English', metadata: { native: 'English' } },
      { value: 'es', label: 'Spanish', metadata: { native: 'Español' } },
      { value: 'fr', label: 'French', metadata: { native: 'Français' } },
      { value: 'de', label: 'German', metadata: { native: 'Deutsch' } },
      { value: 'it', label: 'Italian', metadata: { native: 'Italiano' } },
      { value: 'pt', label: 'Portuguese', metadata: { native: 'Português' } },
      // ... more languages
    ]
  }
};
```

### Step 3: Compile Schema

Run the compilation command to generate all necessary code:

```bash
# Compile single schema
mono compile schema fashion-model

# Compile all schemas in a directory
mono compile schemas/modeling-agency/

# Watch mode for development
mono compile --watch schemas/modeling-agency/
```

### What Gets Generated

The compiler generates the following files:

```
generated/
├── prisma/
│   └── fashion-model.prisma     # Database schema
├── types/
│   └── fashion-model.ts         # TypeScript types
├── api/
│   └── fashion-model/
│       ├── routes.ts            # Fastify routes
│       ├── service.ts           # Business logic
│       └── validation.ts        # Request validation
├── hooks/
│   └── useFashionModel.ts       # React Query hooks
└── components/
    └── fashion-model/
        ├── FashionModelForm.tsx  # Create/Edit form
        ├── FashionModelList.tsx  # List component
        └── FashionModelCard.tsx  # Display card
```

## Option Sets Integration {#option-sets}

### Using Option Sets in Forms

The generated form components automatically use option sets:

```typescript
// Auto-generated component
export function FashionModelForm({ model, onSubmit }) {
  const { data: hairColors } = useOptionSet('hair_colors');
  const { data: eyeColors } = useOptionSet('eye_colors');
  const { data: languages } = useOptionSet('languages');
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Text fields */}
      <Input
        {...register('firstName')}
        label="First Name"
        required
      />
      
      {/* Option set dropdown */}
      <Select
        {...register('hairColor')}
        label="Hair Color"
        options={hairColors}
        required
      />
      
      {/* Multi-select with search */}
      <MultiSelect
        {...register('languages')}
        label="Languages"
        options={languages}
        searchable
        placeholder="Select languages..."
      />
      
      {/* Regional measurement field */}
      <MeasurementInput
        {...register('height')}
        type="height"
        label="Height"
        regional
        required
      />
    </form>
  );
}
```

### Option Set API

Option sets are available through the API:

```typescript
// Get all option sets
GET /api/v1/platform/option-sets

// Get specific option set
GET /api/v1/platform/option-sets/hair_colors

// Search within option set
GET /api/v1/platform/option-sets/languages?search=eng
```

## API Generation {#api-generation}

### Generated API Routes

For each schema, the following API routes are created:

```typescript
// List with filtering, sorting, pagination
GET /api/v1/tenant/fashion-models
  ?hairColor=blonde
  &languages=en,es
  &sort=-createdAt
  &page=1
  &limit=20

// Get single model
GET /api/v1/tenant/fashion-models/:id

// Create new model
POST /api/v1/tenant/fashion-models

// Update model
PATCH /api/v1/tenant/fashion-models/:id

// Delete model
DELETE /api/v1/tenant/fashion-models/:id

// Search models
GET /api/v1/tenant/fashion-models/search?q=jane

// Public endpoints (if configured)
GET /api/v1/public/models/featured
GET /api/v1/public/models/:slug
```

### Using Generated Hooks

React Query hooks are generated for all operations:

```typescript
// In your React component
import { 
  useFashionModels, 
  useFashionModel,
  useCreateFashionModel,
  useUpdateFashionModel 
} from '@mono/generated/hooks';

function ModelListPage() {
  // List with automatic caching
  const { data, isLoading } = useFashionModels({
    filters: { agency: 'elite' },
    sort: '-createdAt',
    page: 1,
    limit: 20
  });
  
  // Single model
  const { data: model } = useFashionModel(modelId);
  
  // Mutations with optimistic updates
  const createModel = useCreateFashionModel();
  const updateModel = useUpdateFashionModel();
  
  return (
    <div>
      {data?.items.map(model => (
        <FashionModelCard key={model.id} model={model} />
      ))}
    </div>
  );
}
```

## Building Static Marketing Pages {#static-pages}

### Project Structure

Create a separate Next.js app for marketing pages:

```bash
# Create marketing site
mono create marketing-site go-models --template=marketing

# Structure
apps/go-models-marketing/
├── pages/
│   ├── index.tsx              # Homepage
│   ├── models/
│   │   ├── index.tsx         # Model listing
│   │   └── [slug].tsx        # Model profile
│   ├── join.tsx              # Registration
│   ├── about.tsx             # About page
│   └── contact.tsx           # Contact
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   └── FeaturedModels.tsx
│   └── common/
│       └── ModelCard.tsx
├── lib/
│   └── api.ts                # API client
├── public/
│   ├── images/
│   └── fonts/
└── next.config.js
```

### Homepage Example

```typescript
// pages/index.tsx
import { GetStaticProps } from 'next';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedModels } from '@/components/home/FeaturedModels';
import { TestimonialSlider } from '@/components/home/TestimonialSlider';
import { NewsletterSignup } from '@/components/home/NewsletterSignup';
import { api } from '@/lib/api';

interface HomePageProps {
  featuredModels: Model[];
  testimonials: Testimonial[];
  stats: CompanyStats;
}

export default function HomePage({ 
  featuredModels, 
  testimonials, 
  stats 
}: HomePageProps) {
  return (
    <>
      <HeroSection />
      
      {/* Featured Models Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Featured Models
          </h2>
          <FeaturedModels models={featuredModels} />
          <div className="text-center mt-8">
            <Link href="/models">
              <a className="btn btn-primary">View All Models</a>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold">{stats.totalModels}</div>
              <div className="text-gray-600">Professional Models</div>
            </div>
            <div>
              <div className="text-5xl font-bold">{stats.totalBookings}</div>
              <div className="text-gray-600">Successful Bookings</div>
            </div>
            <div>
              <div className="text-5xl font-bold">{stats.countries}</div>
              <div className="text-gray-600">Countries Worldwide</div>
            </div>
          </div>
        </div>
      </section>
      
      <TestimonialSlider testimonials={testimonials} />
      <NewsletterSignup />
    </>
  );
}

// Fetch data at build time
export const getStaticProps: GetStaticProps = async () => {
  // Fetch from your API
  const [featuredModels, testimonials, stats] = await Promise.all([
    api.get('/public/models/featured?limit=6'),
    api.get('/public/testimonials?limit=10'),
    api.get('/public/stats')
  ]);
  
  return {
    props: {
      featuredModels,
      testimonials,
      stats
    },
    // Regenerate page every hour
    revalidate: 3600
  };
};
```

## Dynamic Widget Integration {#dynamic-widgets}

### Creating Reusable Widgets

Build widgets that fetch data from your API:

```typescript
// components/widgets/LatestModels.tsx
import { useEffect, useState } from 'react';
import { ModelCard } from '../common/ModelCard';

interface LatestModelsProps {
  category?: string;
  limit?: number;
  showViewAll?: boolean;
}

export function LatestModels({ 
  category, 
  limit = 3, 
  showViewAll = true 
}: LatestModelsProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch from public API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/models/latest?` + 
      new URLSearchParams({
        ...(category && { category }),
        limit: limit.toString()
      }))
      .then(res => res.json())
      .then(data => {
        setModels(data);
        setLoading(false);
      });
  }, [category, limit]);
  
  if (loading) {
    return <div className="grid grid-cols-3 gap-6">
      {[...Array(limit)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-64 rounded" />
      ))}
    </div>;
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map(model => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
      
      {showViewAll && (
        <div className="text-center mt-8">
          <Link href={`/models${category ? `?category=${category}` : ''}`}>
            <a className="btn btn-outline">View All Models</a>
          </Link>
        </div>
      )}
    </div>
  );
}
```

### Registration Form Widget

Connect forms to your API:

```typescript
// components/widgets/QuickRegistration.tsx
export function QuickRegistration() {
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/registration/quick`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.get('email'),
            type: formData.get('type'),
            source: 'marketing_site'
          })
        }
      );
      
      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };
  
  if (submitted) {
    return (
      <div className="bg-green-50 p-8 rounded-lg text-center">
        <h3 className="text-2xl font-bold text-green-800 mb-2">
          Thank You!
        </h3>
        <p className="text-green-600">
          Check your email to complete registration.
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        name="email"
        placeholder="Your email"
        className="input input-bordered w-full"
        required
      />
      
      <select name="type" className="select select-bordered w-full" required>
        <option value="">I am a...</option>
        <option value="model">Model</option>
        <option value="photographer">Photographer</option>
        <option value="agency">Agency</option>
      </select>
      
      <button type="submit" className="btn btn-primary w-full">
        Get Started
      </button>
    </form>
  );
}
```

## Deployment Strategy {#deployment}

### 1. Build Configuration

Configure Next.js for static export:

```javascript
// next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true, // For static export
    domains: ['api.go-models.com', 'cdn.go-models.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL || 'https://api.go-models.com',
    NEXT_PUBLIC_CDN_URL: process.env.CDN_URL || 'https://cdn.go-models.com',
  },
  
  // Generate redirects
  async redirects() {
    return [
      {
        source: '/register',
        destination: '/join',
        permanent: true,
      },
    ];
  },
  
  // Generate sitemap
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

### 2. Build & Export

```bash
# Install dependencies
npm install

# Build static site
npm run build

# Export static files
npm run export

# Output in 'out' directory
ls -la out/
```

### 3. CDN Deployment

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Custom domain
vercel domains add go-models.com
```

#### Option B: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=out

# Custom domain in Netlify dashboard
```

#### Option C: AWS S3 + CloudFront
```bash
# Upload to S3
aws s3 sync out/ s3://go-models-marketing --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id ABCDEFG \
  --paths "/*"
```

### 4. API Configuration

Configure Fastify to handle CORS for your marketing domain:

```typescript
// apps/api/src/app.ts
await app.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = [
      'https://go-models.com',
      'https://www.go-models.com',
      'http://localhost:3000', // Development
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});

// Public routes with caching
app.get('/api/v1/public/models/featured', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 6 }
      }
    }
  },
  handler: async (request, reply) => {
    const { limit } = request.query;
    
    const models = await db.fashionModel.findMany({
      where: { 
        isFeatured: true,
        isActive: true 
      },
      take: limit,
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
        height: true,
        location: true,
      }
    });
    
    // Cache for 5 minutes
    reply.header('Cache-Control', 'public, max-age=300, s-maxage=600');
    
    return models;
  }
});
```

### 5. Media Strategy

#### Development
```typescript
// Use local images during development
<img src="/images/hero-model.jpg" alt="Fashion Model" />
```

#### Production
```typescript
// Use CDN in production
const imageUrl = process.env.NODE_ENV === 'production' 
  ? `${process.env.NEXT_PUBLIC_CDN_URL}/images/hero-model.jpg`
  : '/images/hero-model.jpg';
```

#### User Uploads
```typescript
// User uploaded images from API
<img 
  src={`${process.env.NEXT_PUBLIC_API_URL}/media/${model.profilePhoto}`}
  alt={model.name}
/>
```

## Real Example: go-models.com {#real-example}

### Complete Implementation

Here's how go-models.com is structured:

```
mono-repo/
├── apps/
│   ├── go-models-marketing/    # Static marketing site
│   │   ├── pages/
│   │   ├── components/
│   │   └── public/
│   ├── go-models-app/          # Main application (React)
│   │   └── src/
│   └── api/                    # Fastify API
│       └── src/
├── packages/
│   ├── ui-components/          # Shared UI library
│   ├── api-client/            # TypeScript API client
│   └── schemas/               # Shared schemas
└── infrastructure/
    ├── cdn/                   # CDN configuration
    └── docker/                # Container setup
```

### Deployment Pipeline

```yaml
# .github/workflows/deploy-marketing.yml
name: Deploy Marketing Site

on:
  push:
    branches: [main]
    paths:
      - 'apps/go-models-marketing/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install deps
        run: npm ci
        
      - name: Build site
        run: npm run build:marketing
        env:
          API_URL: ${{ secrets.API_URL }}
          CDN_URL: ${{ secrets.CDN_URL }}
          
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Performance Results

With this architecture, go-models.com achieves:

- **Lighthouse Score**: 98-100
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **CDN Cache Hit Rate**: > 95%
- **API Response Time**: < 100ms (cached)

## Best Practices

### 1. API Design
- Create specific public endpoints for marketing
- Use aggressive caching headers
- Implement rate limiting
- Return only necessary fields

### 2. Static Site
- Pre-render all possible pages
- Use ISR for frequently updated content
- Optimize images with next/image
- Implement proper SEO tags

### 3. Performance
- Lazy load below-the-fold content
- Use WebP images with fallbacks
- Minimize JavaScript bundles
- Enable Brotli compression

### 4. Security
- Never expose sensitive data in public APIs
- Implement CORS properly
- Use rate limiting on all endpoints
- Validate all user inputs

## Troubleshooting

### CORS Issues
```typescript
// Add to Fastify
reply.header('Access-Control-Allow-Origin', 'https://go-models.com');
reply.header('Access-Control-Allow-Methods', 'GET, POST');
reply.header('Access-Control-Allow-Headers', 'Content-Type');
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next out node_modules/.cache
npm run build
```

### API Connection
```typescript
// Use environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

## Summary

This workflow enables you to:

1. Define schemas once and generate everything
2. Build static marketing pages with Next.js
3. Integrate dynamic data via API calls
4. Deploy to CDN for maximum performance
5. Maintain separation between marketing and app

The result is a fast, SEO-friendly marketing site that can handle millions of visitors while keeping your main application secure and separate.