# Page Builder Performance Analysis & Optimization Strategy

## 🚨 Performance Impact Overview

The shift from static Next.js pages to dynamic page builder creates several performance challenges:

### Current Architecture (Static)
```
Request → CDN → Static HTML → Fast Response (10-50ms)
```

### New Architecture (Dynamic)
```
Request → Next.js → Database → Widget Resolution → Schema Queries → 
Option Set Loading → Rendering → Response (200-500ms+)
```

## 📊 Performance Bottlenecks

### 1. Database Queries (Biggest Impact)

**Problem**: Each page load requires multiple database queries:
```sql
-- Page resolution
SELECT * FROM pages WHERE tenant_id = ? AND slug = ?

-- Widget configurations
SELECT * FROM page_sections WHERE page_id = ? ORDER BY position

-- For EACH widget:
SELECT * FROM models WHERE tenant_id = ? AND filters...
SELECT * FROM option_sets WHERE id IN (...)
SELECT * FROM model_schemas WHERE name = ?
```

**Impact**: 
- Page with 5 widgets = 15+ database queries
- Each query: 10-50ms
- Total: 150-750ms just for data fetching

### 2. Widget Rendering Complexity

**Problem**: Each widget must:
- Parse configuration
- Apply schema mappings
- Convert option sets (regional)
- Apply filters and sorting
- Render dynamic content

**Impact**: 50-100ms per complex widget

### 3. No More Static Optimization

**Lost Benefits**:
- ❌ Next.js Static Site Generation (SSG)
- ❌ Automatic code splitting per route
- ❌ Build-time optimization
- ❌ Edge caching of HTML

## 🚀 Optimization Strategy

### Layer 1: Smart Caching Architecture

```typescript
// 1. CDN/Edge Caching (Cloudflare/Vercel)
const cacheHeaders = {
  'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
  'CDN-Cache-Control': 'max-age=300'
};

// 2. Redis Caching Hierarchy
const CACHE_KEYS = {
  // Page configurations (5 min)
  page: `tenant:${tenantId}:page:${slug}`,
  
  // Widget data (1-5 min based on type)
  widget: `widget:${widgetId}:${schemaHash}:${filterHash}`,
  
  // Compiled schemas (1 hour)
  schema: `schema:${schemaName}:compiled`,
  
  // Option sets (24 hours)
  optionSet: `option:${setName}:${locale}`
};

// 3. In-Memory Caching
const memoryCache = new LRU({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 minutes
});
```

### Layer 2: Database Optimization

```typescript
// 1. Query Optimization
const optimizedPageQuery = `
  SELECT 
    p.*,
    json_agg(
      json_build_object(
        'id', ps.id,
        'widget_type', ps.widget_type,
        'configuration', ps.configuration,
        'position', ps.position
      ) ORDER BY ps.position
    ) as sections
  FROM pages p
  LEFT JOIN page_sections ps ON p.id = ps.page_id
  WHERE p.tenant_id = $1 AND p.slug = $2
  GROUP BY p.id
`;

// 2. Connection Pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 3. Read Replicas
const readPool = new Pool({
  host: process.env.DATABASE_READ_REPLICA,
  max: 30
});
```

### Layer 3: Widget Data Loading Strategy

```typescript
// Parallel Widget Loading
async function loadPageWidgets(sections: PageSection[]) {
  // Group by widget type for batch loading
  const widgetGroups = groupBy(sections, 'widget_type');
  
  // Load all data in parallel
  const widgetData = await Promise.all(
    Object.entries(widgetGroups).map(async ([type, widgets]) => {
      const loader = WIDGET_LOADERS[type];
      return loader.batchLoad(widgets);
    })
  );
  
  return flattenWidgetData(widgetData);
}

// Widget-Specific Optimizations
const WIDGET_LOADERS = {
  'model-grid': {
    batchLoad: async (widgets) => {
      // Single query for all model grids
      const allFilters = widgets.map(w => w.configuration.filters);
      const models = await db.models.findMany({
        where: { OR: allFilters },
        take: Math.max(...widgets.map(w => w.configuration.limit))
      });
      
      // Distribute to widgets
      return distributeModelsToWidgets(models, widgets);
    }
  }
};
```

### Layer 4: Incremental Static Regeneration (ISR)

```typescript
// pages/[tenant]/[[...slug]]/page.tsx
export default async function DynamicPage({ params }) {
  const { tenant, slug } = params;
  
  // Try cache first
  const cached = await getCachedPage(tenant, slug);
  if (cached && !isStale(cached)) {
    return <CachedPage data={cached} />;
  }
  
  // Generate page
  const page = await generatePage(tenant, slug);
  
  // Cache for next request
  await cachePage(tenant, slug, page);
  
  return <Page data={page} />;
}

// Enable ISR for published pages
export async function generateStaticParams() {
  // Pre-render popular pages
  const popularPages = await getPopularPages();
  return popularPages.map(page => ({
    tenant: page.tenant_slug,
    slug: page.slug.split('/')
  }));
}

export const revalidate = 300; // 5 minutes
```

### Layer 5: Client-Side Optimizations

```typescript
// 1. Progressive Enhancement
const ModelGrid = dynamic(() => import('./ModelGrid'), {
  loading: () => <ModelGridSkeleton />,
  ssr: true
});

// 2. Intersection Observer for Lazy Loading
const useWidgetVisibility = (ref: RefObject<HTMLElement>) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '100px' }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  
  return isVisible;
};

// 3. Data Prefetching
const prefetchWidgetData = (widgetType: string, config: any) => {
  queryClient.prefetchQuery({
    queryKey: ['widget', widgetType, config],
    queryFn: () => fetchWidgetData(widgetType, config),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
```

## 📈 Performance Metrics & Monitoring

### Key Metrics to Track

```typescript
// 1. Page Load Performance
const metrics = {
  TTFB: 'Time to First Byte',          // Target: <200ms
  FCP: 'First Contentful Paint',      // Target: <1.8s
  LCP: 'Largest Contentful Paint',    // Target: <2.5s
  FID: 'First Input Delay',          // Target: <100ms
  CLS: 'Cumulative Layout Shift',    // Target: <0.1
  
  // Custom metrics
  widgetLoadTime: 'Per widget load time',     // Target: <100ms
  dataFetchTime: 'Database query time',       // Target: <50ms
  cacheHitRate: 'Percentage of cache hits',   // Target: >80%
};

// 2. Monitoring Implementation
import { metrics } from '@opentelemetry/api-metrics';

const meter = metrics.getMeter('page-builder');
const pageLoadHistogram = meter.createHistogram('page_load_duration');
const cacheHitCounter = meter.createCounter('cache_hits');
const dbQueryHistogram = meter.createHistogram('db_query_duration');
```

### Real User Monitoring (RUM)

```typescript
// Client-side monitoring
export function PageMetrics({ pageId }: { pageId: string }) {
  useEffect(() => {
    // Core Web Vitals
    onLCP((metric) => {
      sendMetric('lcp', metric.value, { pageId });
    });
    
    onFID((metric) => {
      sendMetric('fid', metric.value, { pageId });
    });
    
    onCLS((metric) => {
      sendMetric('cls', metric.value, { pageId });
    });
    
    // Custom widget metrics
    performance.mark('widgets-start');
    // ... widget loading
    performance.mark('widgets-end');
    performance.measure('widgets-load', 'widgets-start', 'widgets-end');
  }, [pageId]);
  
  return null;
}
```

## 🎯 Performance Targets & Trade-offs

### Acceptable Performance Targets

| Metric | Static Pages | Dynamic Pages | Degradation |
|--------|--------------|---------------|-------------|
| TTFB | 50ms | 200ms | 4x slower |
| Full Page Load | 500ms | 2000ms | 4x slower |
| Cache Hit Rate | 95% | 80% | More origin hits |
| Database Queries | 0 | 5-15 | New overhead |

### Performance Budget

```javascript
// webpack.config.js
module.exports = {
  performance: {
    maxAssetSize: 300000,      // 300KB max bundle
    maxEntrypointSize: 500000, // 500KB max entry
    hints: 'error',
    
    // Custom budget for widgets
    budgets: [
      {
        type: 'bundle',
        name: 'widget-*',
        maximumSize: 50000 // 50KB per widget
      }
    ]
  }
};
```

## 🔄 Migration Strategy for Performance

### Phase 1: Hybrid Approach (Recommended)
```typescript
// Keep static routes for critical pages
pages/
├── [tenant]/
│   ├── index.tsx          // Static homepage
│   ├── models.tsx         // Static model listing
│   └── [[...slug]].tsx    // Dynamic for custom pages

// This maintains performance for high-traffic pages
```

### Phase 2: Selective Pre-rendering
```typescript
// Pre-render popular configurations
const POPULAR_WIDGETS = {
  'model-grid': [
    { columns: 3, limit: 12, fields: ['name', 'height'] },
    { columns: 4, limit: 20, fields: ['name', 'height', 'location'] }
  ]
};

// Build time: pre-render these combinations
await preRenderWidgetVariations(POPULAR_WIDGETS);
```

### Phase 3: Edge Computing
```typescript
// Move widget rendering to edge
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Render closest to user
  const widgetHtml = await renderWidgetAtEdge(request);
  return new Response(widgetHtml, {
    headers: {
      'content-type': 'text/html',
      'cache-control': 'public, s-maxage=300',
    },
  });
}
```

## 📋 Performance Checklist

### Before Launch
- [ ] Implement 3-layer caching (CDN, Redis, Memory)
- [ ] Set up database read replicas
- [ ] Configure connection pooling
- [ ] Implement query optimization
- [ ] Set up performance monitoring
- [ ] Configure ISR for popular pages
- [ ] Implement progressive loading
- [ ] Set performance budgets
- [ ] Load test with expected traffic

### Ongoing Optimization
- [ ] Monitor Core Web Vitals daily
- [ ] Track cache hit rates
- [ ] Optimize slow queries weekly
- [ ] Review widget performance
- [ ] A/B test loading strategies
- [ ] Update pre-rendered pages
- [ ] Adjust cache TTLs based on usage

## 🚦 Go/No-Go Performance Criteria

### Minimum Acceptable Performance
- **Page Load**: <3 seconds on 4G
- **Interactive**: <1 second
- **Cache Hit Rate**: >70%
- **Error Rate**: <0.1%
- **Uptime**: 99.9%

### If Performance Degrades Beyond Targets
1. **Immediate**: Increase cache TTLs
2. **Short-term**: Add more cache layers
3. **Medium-term**: Optimize database queries
4. **Long-term**: Consider hybrid static/dynamic approach

## 💡 Key Takeaways

1. **Performance WILL degrade** - Plan for 3-5x slower initial loads
2. **Caching is CRITICAL** - Without proper caching, the system will fail
3. **Monitor EVERYTHING** - You can't optimize what you don't measure
4. **Start hybrid** - Keep critical pages static
5. **Budget for infrastructure** - You'll need more servers and Redis

The page builder provides tremendous flexibility but at a significant performance cost. Success depends on implementing comprehensive caching, monitoring, and optimization strategies from day one.