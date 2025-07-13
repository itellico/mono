---
title: Subscription Management System
category: features
tags:
  - subscriptions
  - billing
  - plans
  - stripe
  - click-dummy
priority: critical
lastUpdated: '2025-07-09'
---

# Subscription Management System

## Overview

Complete subscription lifecycle management with Stripe integration, plan builder, and usage tracking. Implements the click-dummy design patterns for intuitive subscription flows.

## Click-Dummy Implementation

### Visual Plan Builder
Based on the click-dummy design, we provide a drag-and-drop interface for creating subscription plans:

```typescript
interface PlanBuilderState {
  // Visual elements from click-dummy
  planCard: {
    name: string;
    icon: IconType;
    color: string;
    highlight: boolean;
  };
  
  // Feature selection UI
  featureGroups: {
    essential: Feature[];
    advanced: Feature[];
    premium: Feature[];
  };
  
  // Pricing calculator
  pricing: {
    basePrice: number;
    currency: Currency;
    interval: 'monthly' | 'yearly';
    discount?: DiscountRule;
  };
  
  // Limit sliders (visual from click-dummy)
  limits: {
    [key: string]: {
      value: number;
      min: number;
      max: number;
      step: number;
      unit: string;
    };
  };
}
```

### User-Facing Subscription Flow

#### 1. Plan Selection Page
```tsx
// Implements click-dummy's card-based selection
<SubscriptionPlans>
  <PlanCard 
    popular={true}
    name="Professional"
    price="$99"
    features={['Unlimited models', '1000 API calls']}
    onSelect={handleSelectPlan}
  />
</SubscriptionPlans>
```

#### 2. Checkout Experience
```tsx
// Stripe Elements integration matching click-dummy design
<CheckoutForm>
  <BillingDetails />
  <PaymentElement />
  <OrderSummary />
  <PromoCodeInput />
</CheckoutForm>
```

#### 3. Usage Dashboard
```tsx
// Visual usage bars from click-dummy
<UsageDashboard>
  <UsageBar 
    label="API Calls"
    current={750}
    limit={1000}
    color="blue"
  />
  <UsageBar 
    label="Storage"
    current={4.5}
    limit={10}
    unit="GB"
    color="green"
  />
</UsageDashboard>
```

## Database Schema

### Core Tables
```prisma
model Subscription {
  id              String   @id @default(cuid())
  tenantId        Int
  planId          String
  stripeSubId     String   @unique
  status          SubscriptionStatus
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean @default(false)
  
  // Relations
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  plan            Plan     @relation(fields: [planId], references: [id])
  usage           Usage[]
  invoices        Invoice[]
  
  @@index([tenantId, status])
  @@index([stripeSubId])
}

model Plan {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  stripePriceId   String?
  
  // Pricing
  basePrice       Decimal
  currency        String   @default("USD")
  interval        String   // monthly, yearly
  
  // Features & Limits (JSONB)
  features        Json     // Feature flags
  limits          Json     // Numeric limits
  metadata        Json?    // Display properties
  
  // Hierarchy
  isDefault       Boolean  @default(false)
  sortOrder       Int      @default(0)
  
  subscriptions   Subscription[]
}

model Usage {
  id              String   @id @default(cuid())
  subscriptionId  String
  metric          String   // api_calls, storage_gb, etc
  value           Int
  recordedAt      DateTime @default(now())
  
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  
  @@index([subscriptionId, metric, recordedAt])
}
```

## API Implementation

### Public Endpoints

#### Get Available Plans
```typescript
GET /api/v1/public/plans

Response: {
  success: true,
  data: {
    plans: [{
      id: "plan_pro",
      name: "Professional", 
      price: 99,
      currency: "USD",
      interval: "month",
      features: {
        unlimited_models: true,
        api_calls: 1000,
        priority_support: true
      },
      limits: {
        storage_gb: 10,
        team_members: 5
      }
    }]
  }
}
```

### Tenant Endpoints

#### Create Subscription
```typescript
POST /api/v1/tenant/subscription

Request: {
  planId: "plan_pro",
  paymentMethodId: "pm_xxx", // From Stripe
  promoCode?: "LAUNCH20"
}

Response: {
  success: true,
  data: {
    subscription: {
      id: "sub_xxx",
      status: "active",
      currentPeriodEnd: "2025-08-09"
    }
  }
}
```

#### Get Current Usage
```typescript
GET /api/v1/tenant/subscription/usage

Response: {
  success: true,
  data: {
    usage: {
      api_calls: {
        current: 750,
        limit: 1000,
        percentage: 75
      },
      storage_gb: {
        current: 4.5,
        limit: 10,
        percentage: 45
      }
    },
    period: {
      start: "2025-07-09",
      end: "2025-08-09"
    }
  }
}
```

### Platform Endpoints

#### Manage All Subscriptions
```typescript
GET /api/v1/platform/subscriptions

// Admin view of all subscriptions
Response: {
  success: true,
  data: {
    subscriptions: [...],
    metrics: {
      total: 1250,
      active: 1100,
      mrr: 109890
    }
  }
}
```

## Stripe Integration

### Webhook Handling
```typescript
// Handle Stripe events
POST /api/v1/public/stripe/webhook

Events handled:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

### Payment Method Management
```typescript
// Update payment method
PUT /api/v1/tenant/subscription/payment-method

Request: {
  paymentMethodId: "pm_new_xxx"
}
```

## Usage Tracking

### Real-time Updates
```typescript
// Track API usage
export async function trackApiUsage(tenantId: number, endpoint: string) {
  const subscription = await getActiveSubscription(tenantId);
  
  await redis.hincrby(
    `usage:${subscription.id}:${getCurrentPeriod()}`,
    'api_calls',
    1
  );
  
  // Check limits
  const usage = await getCurrentUsage(subscription.id);
  if (usage.api_calls >= subscription.plan.limits.api_calls) {
    throw new ApiLimitExceededError();
  }
}
```

### Usage Aggregation
```typescript
// Daily aggregation job
export async function aggregateUsage() {
  const subscriptions = await getActiveSubscriptions();
  
  for (const sub of subscriptions) {
    const redisUsage = await redis.hgetall(`usage:${sub.id}:${getCurrentPeriod()}`);
    
    await prisma.usage.createMany({
      data: Object.entries(redisUsage).map(([metric, value]) => ({
        subscriptionId: sub.id,
        metric,
        value: parseInt(value),
        recordedAt: new Date()
      }))
    });
  }
}
```

## Plan Management UI

### Admin Plan Builder
```tsx
export function PlanBuilder() {
  const [plan, setPlan] = useState<PlanConfig>(defaultPlan);
  
  return (
    <div className="plan-builder">
      {/* Visual card preview matching click-dummy */}
      <PlanPreview plan={plan} />
      
      {/* Feature selection */}
      <FeatureSelector
        selected={plan.features}
        onChange={(features) => setPlan({...plan, features})}
      />
      
      {/* Limit configuration with sliders */}
      <LimitConfigurator
        limits={plan.limits}
        onChange={(limits) => setPlan({...plan, limits})}
      />
      
      {/* Pricing setup */}
      <PricingConfig
        pricing={plan.pricing}
        onChange={(pricing) => setPlan({...plan, pricing})}
      />
    </div>
  );
}
```

### Feature Toggle Matrix
```tsx
// Visual feature comparison from click-dummy
<FeatureComparison>
  <FeatureRow
    name="Unlimited Models"
    plans={{
      basic: false,
      pro: true,
      enterprise: true
    }}
  />
</FeatureComparison>
```

## Billing Portal

### Customer Self-Service
```typescript
// Redirect to Stripe billing portal
POST /api/v1/tenant/subscription/portal

Response: {
  success: true,
  data: {
    url: "https://billing.stripe.com/session/xxx"
  }
}
```

### Invoice History
```typescript
GET /api/v1/tenant/subscription/invoices

Response: {
  success: true,
  data: {
    invoices: [{
      id: "inv_xxx",
      amount: 99,
      currency: "USD",
      status: "paid",
      pdfUrl: "https://...",
      createdAt: "2025-07-09"
    }]
  }
}
```

## Upgrade/Downgrade Flow

### Plan Change Preview
```typescript
POST /api/v1/tenant/subscription/preview-change

Request: {
  newPlanId: "plan_enterprise"
}

Response: {
  success: true,
  data: {
    prorationAmount: 45.50,
    immediatePayment: false,
    effectiveDate: "2025-07-09",
    changes: {
      features: {
        added: ["priority_support", "custom_domain"],
        removed: []
      },
      limits: {
        api_calls: { from: 1000, to: 10000 },
        storage_gb: { from: 10, to: 100 }
      }
    }
  }
}
```

## Implementation Status

### Completed ✅
- Database schema with Stripe integration
- Basic subscription CRUD operations
- Stripe webhook handling
- Usage tracking in Redis

### In Progress 🚧
- Visual plan builder UI
- Usage dashboard components
- Billing portal integration

### Pending ⏳
- Advanced proration logic
- Multi-currency support
- Usage-based billing tiers
- Subscription analytics dashboard

## Best Practices

1. **Always use Stripe as source of truth** for subscription status
2. **Cache subscription data** in Redis for fast access
3. **Track usage in Redis**, aggregate to database periodically
4. **Use webhooks** for all subscription state changes
5. **Implement retry logic** for failed payments
6. **Show clear usage warnings** before limits are hit

## Security Considerations

- Never store credit card details
- Use Stripe's PCI-compliant infrastructure
- Implement webhook signature verification
- Rate limit subscription creation endpoints
- Audit all subscription changes