# itellico Mono: Universal Tagging System
## Comprehensive Tagging Architecture for All Entities

---

## 🎯 **Overview**

The Universal Tagging System provides a flexible, scalable way to tag ANY entity in the itellico Mono - from user profiles and jobs to media files and conversations. This system enables powerful search, discovery, and organization features across the entire platform.

### **Key Benefits**
- **Universal Application**: One system for all entity types
- **Efficient Queries**: Optimized junction table design
- **Smart Suggestions**: AI-powered tag recommendations
- **User Collections**: Personal favorites and custom lists
- **Multi-Tenant**: Complete tenant isolation

---

## 🏗️ **Database Architecture**

### **Core Tables**

```sql
-- Master tag repository
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,           -- URL-friendly version
  category VARCHAR(50),                 -- Optional grouping
  usage_count INTEGER DEFAULT 0,        -- Track popularity
  is_system BOOLEAN DEFAULT FALSE,      -- Platform vs user-created
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug),
  INDEX idx_tags_tenant_category (tenant_id, category),
  INDEX idx_tags_usage (usage_count DESC)
);

-- Universal junction table for any entity
CREATE TABLE entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,     -- 'profile', 'job', 'gig', 'media', etc.
  entity_id UUID NOT NULL,              -- ID of the tagged entity
  added_by UUID NOT NULL REFERENCES users(id),
  added_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tag_id, entity_type, entity_id),
  INDEX idx_entity_tags_lookup (entity_type, entity_id),
  INDEX idx_entity_tags_tenant (tenant_id, entity_type),
  INDEX idx_entity_tags_tag (tag_id)
);

-- User-specific collections
CREATE TABLE user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,            -- 'favorites', 'wishlist', 'shortlist'
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(100) UNIQUE,      -- For sharing private collections
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_collections_user (user_id),
  INDEX idx_collections_type (type)
);

-- Items in collections
CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  position INTEGER,                     -- For custom ordering
  notes TEXT,                          -- Personal notes
  metadata JSONB,                      -- Flexible additional data
  added_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(collection_id, entity_type, entity_id),
  INDEX idx_collection_items_entity (entity_type, entity_id)
);
```

### **Performance Indexes**

```sql
-- Optimize tag search
CREATE INDEX idx_tags_search ON tags 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(category, '')));

-- Optimize tag autocomplete
CREATE INDEX idx_tags_prefix ON tags(lower(name) text_pattern_ops);

-- Materialized view for popular tags
CREATE MATERIALIZED VIEW popular_tags AS
SELECT 
  t.id,
  t.tenant_id,
  t.name,
  t.slug,
  t.category,
  t.usage_count,
  COUNT(DISTINCT et.entity_type) as entity_type_count,
  COUNT(DISTINCT et.entity_id) as total_entities
FROM tags t
LEFT JOIN entity_tags et ON t.id = et.tag_id
GROUP BY t.id
ORDER BY t.usage_count DESC;

-- Refresh periodically
CREATE INDEX idx_popular_tags_tenant ON popular_tags(tenant_id);
```

---

## 🔧 **Service Implementation**

### **Tag Service**

```typescript
// src/lib/services/universal-tagging.service.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { Redis } from 'ioredis';
import slugify from 'slugify';

export class UniversalTaggingService {
  constructor(
    private db: PrismaClient,
    private redis: Redis
  ) {}

  /**
   * Tag any entity with multiple tags
   */
  async tagEntity(params: {
    entityType: string;
    entityId: string;
    tags: string[];
    userId: string;
    tenantId: string;
    createMissing?: boolean;
  }): Promise<void> {
    const { entityType, entityId, tags, userId, tenantId, createMissing = true } = params;

    // Normalize tags
    const normalizedTags = tags.map(tag => ({
      name: tag.trim(),
      slug: slugify(tag.trim(), { lower: true })
    }));

    // Find or create tags
    const tagRecords = await this.db.$transaction(async (tx) => {
      const existingTags = await tx.tag.findMany({
        where: {
          tenantId,
          slug: { in: normalizedTags.map(t => t.slug) }
        }
      });

      const existingSlugs = new Set(existingTags.map(t => t.slug));
      const newTags = normalizedTags.filter(t => !existingSlugs.has(t.slug));

      if (newTags.length > 0 && createMissing) {
        await tx.tag.createMany({
          data: newTags.map(tag => ({
            tenantId,
            name: tag.name,
            slug: tag.slug,
            createdBy: userId
          }))
        });
      }

      return tx.tag.findMany({
        where: {
          tenantId,
          slug: { in: normalizedTags.map(t => t.slug) }
        }
      });
    });

    // Create entity-tag relationships
    await this.db.entityTag.createMany({
      data: tagRecords.map(tag => ({
        tenantId,
        tagId: tag.id,
        entityType,
        entityId,
        addedBy: userId
      })),
      skipDuplicates: true
    });

    // Update usage counts
    await this.db.tag.updateMany({
      where: { id: { in: tagRecords.map(t => t.id) } },
      data: { usageCount: { increment: 1 } }
    });

    // Invalidate caches
    await this.invalidateTagCaches(tenantId, entityType);
  }

  /**
   * Get entities by tags with AND/OR logic
   */
  async getEntitiesByTags(params: {
    tags: string[];
    entityType: string;
    tenantId: string;
    operator?: 'AND' | 'OR';
    limit?: number;
    offset?: number;
  }): Promise<string[]> {
    const { tags, entityType, tenantId, operator = 'OR', limit = 50, offset = 0 } = params;

    // Cache key
    const cacheKey = `tags:${tenantId}:${entityType}:${operator}:${tags.join(',')}:${limit}:${offset}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let entityIds: string[];

    if (operator === 'AND') {
      // Find entities that have ALL specified tags
      const result = await this.db.$queryRaw<{ entity_id: string }[]>`
        SELECT entity_id
        FROM entity_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.entity_type = ${entityType}
          AND et.tenant_id = ${tenantId}
          AND t.slug = ANY(${tags})
        GROUP BY entity_id
        HAVING COUNT(DISTINCT t.slug) = ${tags.length}
        LIMIT ${limit} OFFSET ${offset}
      `;
      entityIds = result.map(r => r.entity_id);
    } else {
      // Find entities that have ANY of the specified tags
      const result = await this.db.entityTag.findMany({
        where: {
          entityType,
          tenantId,
          tag: { slug: { in: tags } }
        },
        select: { entityId: true },
        distinct: ['entityId'],
        take: limit,
        skip: offset
      });
      entityIds = result.map(r => r.entityId);
    }

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(entityIds));
    return entityIds;
  }

  /**
   * Get tag suggestions based on context
   */
  async suggestTags(params: {
    entityType: string;
    existingTags: string[];
    tenantId: string;
    limit?: number;
  }): Promise<Tag[]> {
    const { entityType, existingTags, tenantId, limit = 10 } = params;

    if (existingTags.length === 0) {
      // Return most popular tags for this entity type
      return this.db.tag.findMany({
        where: { tenantId },
        orderBy: { usageCount: 'desc' },
        take: limit
      });
    }

    // Find tags that frequently appear together
    const relatedTags = await this.db.$queryRaw<
      Array<{ id: string; name: string; slug: string; co_occurrence: number }>
    >`
      WITH existing_entities AS (
        SELECT DISTINCT et.entity_id
        FROM entity_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.entity_type = ${entityType}
          AND et.tenant_id = ${tenantId}
          AND t.slug = ANY(${existingTags})
      )
      SELECT 
        t.id,
        t.name,
        t.slug,
        COUNT(*) as co_occurrence
      FROM entity_tags et
      JOIN tags t ON et.tag_id = t.id
      WHERE et.entity_id IN (SELECT entity_id FROM existing_entities)
        AND et.entity_type = ${entityType}
        AND t.slug != ALL(${existingTags})
      GROUP BY t.id, t.name, t.slug
      ORDER BY co_occurrence DESC
      LIMIT ${limit}
    `;

    return relatedTags;
  }

  /**
   * Auto-tag using AI
   */
  async autoTag(params: {
    entityType: string;
    entityId: string;
    content: string;
    tenantId: string;
    userId: string;
  }): Promise<string[]> {
    // Get entity-specific prompts
    const prompt = this.getAutoTagPrompt(params.entityType, params.content);
    
    // Call LLM service
    const suggestedTags = await this.llmService.generateTags({
      prompt,
      maxTags: 10,
      existingTags: await this.getPopularTagsForType(params.entityType, params.tenantId)
    });

    // Apply tags
    await this.tagEntity({
      ...params,
      tags: suggestedTags
    });

    return suggestedTags;
  }

  /**
   * Manage user collections
   */
  async addToCollection(params: {
    userId: string;
    collectionName: string;
    entityType: string;
    entityId: string;
    notes?: string;
  }): Promise<void> {
    // Find or create collection
    let collection = await this.db.userCollection.findFirst({
      where: {
        userId: params.userId,
        name: params.collectionName
      }
    });

    if (!collection) {
      collection = await this.db.userCollection.create({
        data: {
          userId: params.userId,
          tenantId: await this.getUserTenantId(params.userId),
          name: params.collectionName,
          type: 'custom'
        }
      });
    }

    // Add item to collection
    await this.db.collectionItem.create({
      data: {
        collectionId: collection.id,
        entityType: params.entityType,
        entityId: params.entityId,
        notes: params.notes
      }
    });
  }

  /**
   * Cache invalidation
   */
  private async invalidateTagCaches(tenantId: string, entityType: string): Promise<void> {
    const pattern = `tags:${tenantId}:${entityType}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 🎨 **UI Components**

### **Tag Input Component**

```typescript
// src/components/tags/TagInput.tsx
import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTagSuggestions } from '@/hooks/useTagSuggestions';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  entityType: string;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  entityType,
  placeholder = 'Add tags...',
  maxTags = 20,
  allowCreate = true
}) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  
  const { suggestions, loading } = useTagSuggestions({
    entityType,
    existingTags: value,
    query: debouncedInput,
    enabled: isFocused && debouncedInput.length > 1
  });

  const addTag = useCallback((tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (
      normalizedTag &&
      !value.includes(normalizedTag) &&
      value.length < maxTags
    ) {
      onChange([...value, normalizedTag]);
      setInput('');
    }
  }, [value, onChange, maxTags]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  }, [value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (allowCreate || suggestions.some(s => s.name === input)) {
        addTag(input);
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg focus-within:ring-2 focus-within:ring-primary">
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-secondary rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent"
          disabled={value.length >= maxTags}
        />
      </div>

      {/* Suggestions dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg">
          {suggestions.map(suggestion => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => addTag(suggestion.name)}
              className="w-full px-3 py-2 text-left hover:bg-accent"
            >
              <div className="flex justify-between items-center">
                <span>{suggestion.name}</span>
                <span className="text-xs text-muted-foreground">
                  {suggestion.usageCount} uses
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### **Tag Cloud Component**

```typescript
// src/components/tags/TagCloud.tsx
interface TagCloudProps {
  tags: Array<{
    name: string;
    count: number;
    slug: string;
  }>;
  onTagClick?: (tag: string) => void;
  maxSize?: number;
  minSize?: number;
}

export const TagCloud: React.FC<TagCloudProps> = ({
  tags,
  onTagClick,
  maxSize = 2,
  minSize = 0.8
}) => {
  const maxCount = Math.max(...tags.map(t => t.count));
  const minCount = Math.min(...tags.map(t => t.count));

  const getSize = (count: number) => {
    const normalized = (count - minCount) / (maxCount - minCount);
    return minSize + (normalized * (maxSize - minSize));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <button
          key={tag.slug}
          onClick={() => onTagClick?.(tag.slug)}
          className="px-3 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          style={{ fontSize: `${getSize(tag.count)}rem` }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
};
```

---

## 🚀 **Usage Examples**

### **Tagging Different Entities**

```typescript
// Tag a model profile
await taggingService.tagEntity({
  entityType: 'profile',
  entityId: modelId,
  tags: ['fashion', 'runway', 'editorial', 'paris-based'],
  userId: currentUser.id,
  tenantId: currentTenant.id
});

// Tag a job posting
await taggingService.tagEntity({
  entityType: 'job',
  entityId: jobId,
  tags: ['urgent', 'high-paid', 'fashion-week', 'experienced-only'],
  userId: clientUser.id,
  tenantId: currentTenant.id
});

// Tag a gig service
await taggingService.tagEntity({
  entityType: 'gig',
  entityId: gigId,
  tags: ['portfolio-shoot', '24hr-delivery', 'studio', 'professional'],
  userId: photographerId,
  tenantId: currentTenant.id
});

// Tag media files
await taggingService.tagEntity({
  entityType: 'media',
  entityId: photoId,
  tags: ['editorial', 'black-and-white', 'outdoor', 'summer-2024'],
  userId: uploaderId,
  tenantId: currentTenant.id
});
```

### **Advanced Searches**

```typescript
// Find models with ALL specified tags (AND logic)
const fashionRunwayModels = await taggingService.getEntitiesByTags({
  tags: ['fashion', 'runway', 'paris'],
  entityType: 'profile',
  tenantId: currentTenant.id,
  operator: 'AND'
});

// Find jobs with ANY specified tags (OR logic)
const urgentJobs = await taggingService.getEntitiesByTags({
  tags: ['urgent', 'last-minute', 'asap'],
  entityType: 'job',
  tenantId: currentTenant.id,
  operator: 'OR'
});

// Get tag suggestions
const suggestions = await taggingService.suggestTags({
  entityType: 'profile',
  existingTags: ['fashion', 'model'],
  tenantId: currentTenant.id
});
// Returns: ['runway', 'editorial', 'commercial', 'paris', ...]
```

### **User Collections**

```typescript
// Add to favorites
await taggingService.addToCollection({
  userId: currentUser.id,
  collectionName: 'Favorite Models',
  entityType: 'profile',
  entityId: modelId,
  notes: 'Perfect for our summer campaign'
});

// Create a project shortlist
await taggingService.addToCollection({
  userId: currentUser.id,
  collectionName: 'Fashion Week 2024 Shortlist',
  entityType: 'profile',
  entityId: modelId
});

// Get collection items
const favorites = await db.collectionItem.findMany({
  where: {
    collection: {
      userId: currentUser.id,
      name: 'Favorite Models'
    }
  },
  include: {
    collection: true
  }
});
```

---

## 📊 **Tag Categories by Entity Type**

### **Profile Tags**
- **Skills**: runway, editorial, commercial, fitness, swimwear, lingerie, beauty
- **Experience**: new-face, beginner, intermediate, professional, supermodel
- **Style**: high-fashion, streetwear, classic, avant-garde, natural
- **Availability**: available-now, booking-required, traveling, local-only
- **Physical**: petite, plus-size, athletic, androgynous, mature

### **Job Tags**
- **Urgency**: urgent, flexible, planned, last-minute, open-ended
- **Type**: paid, tfp, volunteer, internship, recurring
- **Production**: small-team, large-production, solo-shoot, international
- **Duration**: half-day, full-day, multi-day, week-long, ongoing

### **Gig Tags**
- **Service**: portfolio, headshots, comp-cards, lifestyle, product
- **Delivery**: instant, 24-hours, 3-days, 1-week, flexible
- **Level**: budget, standard, premium, luxury, vip
- **Location**: studio, outdoor, on-location, travel-included

### **Media Tags**
- **Type**: portfolio, test-shoot, campaign, editorial, behind-scenes
- **Style**: color, black-white, film, digital, retouched, raw
- **Usage**: web, print, social-media, billboard, exclusive
- **Mood**: dramatic, natural, artistic, commercial, vintage

---

## 🔒 **Security & Performance**

### **Access Control**
- Tags are tenant-isolated
- Users can only tag entities they have access to
- System tags are protected from modification
- Collection visibility respects entity permissions

### **Performance Optimization**
- Indexed for fast lookups
- Materialized views for popular tags
- Redis caching for frequent queries
- Batch operations for bulk tagging

### **Scalability**
- Handles millions of tags efficiently
- Partitioning ready for large deployments
- Async processing for heavy operations
- CDN integration for tag clouds

---

This universal tagging system provides a flexible, performant foundation for organizing and discovering content across the entire itellico Mono.