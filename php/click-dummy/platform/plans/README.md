# 🚀 Complete Subscription Management System

## Architecture Overview

The itellico Mono subscription system uses a **5-layer architecture** that separates concerns for maximum flexibility and clarity:

```
┌─────────────────┐
│   Plan Builder  │ ← Creates subscription plans
└────────┬────────┘
         │ uses
┌────────┴────────┐
│ Feature Builder │ ← Defines features with permissions + limits
└────────┬────────┘
         │ combines
    ┌────┴────┐────────────┐
    │         │            │
┌───▼──────┐ ▼──────┐ ┌───▼────────┐
│Permissions│ Limits │ │Feature Sets│
│  Builder  │Builder │ │  Builder   │
└───────────┴────────┘ └────────────┘
```

## 🎯 Best Practice: Permissions vs Limits

### ✅ CORRECT Pattern

```json
{
  "feature": "comp_card",
  "permissions": {
    "feature.comp_card.access": true,    // Can use comp cards? YES
    "feature.comp_card.create": true     // Can create new? YES
  },
  "limits": {
    "comp_cards": 5,                     // How many? 5 maximum
    "comp_card_images": 10               // How many images? 10 per card
  }
}
```

### ❌ ANTI-PATTERN (Don't do this!)

```json
{
  "limits": {
    "comp_cards": 0    // Using 0 to deny access - WRONG!
  }
}
```

## 🏗️ The 5 Builders Explained

### 1. **Plan Builder** (`plan-builder.php`)
Creates subscription plans by selecting features. Limits are automatically embedded within feature cards.

**Purpose**: Assemble features into marketable subscription tiers

### 2. **Permissions Builder** (`permissions-builder.php`)
Defines access control permissions following the pattern: `category.resource.action`

**Examples**:
- `feature.comp_card.access` - Can view comp card feature?
- `feature.comp_card.create` - Can create new comp cards?
- `data.users.update` - Can edit user data?
- `admin.billing.access` - Can access billing?

**Purpose**: Control feature access (binary yes/no)

### 3. **Limits Builder** (`limits-builder.php`)
Configures numeric values for resource limits by plan tier.

**Examples**:
- Storage: Starter=1GB, Pro=50GB, Agency=500GB
- Users: Starter=5, Pro=25, Agency=100
- API Calls: Starter=1000/day, Pro=10000/day

**Purpose**: Control resource usage (quantities)

### 4. **Feature Builder** (`feature-builder.php`)
Creates individual features and connects them to:
- **Required Permissions**: What permissions enable this feature
- **Required Limits**: Essential limits (red badges)
- **Optional Limits**: Enhanced capabilities (blue badges)

**Purpose**: Define features with their permission and limit requirements

### 5. **Feature Set Builder** (`feature-set-builder.php`)
Bundles related features for easy reuse across plans.

**Examples**:
- Core Bundle: User management, basic search, profile
- Professional Bundle: Analytics, portfolio, calendar
- Agency Bundle: Team management, client CRM, bulk ops

**Purpose**: Create reusable feature collections

## 💻 Code Implementation Pattern

### Frontend (React/Next.js)

```typescript
// Component: CreateCompCardButton.tsx
export function CreateCompCardButton() {
  const { permissions, limits } = useSubscription();
  const { compCardCount } = useUserData();
  
  // Check BOTH permission and limit
  const canCreate = 
    permissions.includes('feature.comp_card.create') && 
    compCardCount < limits.comp_cards;
  
  if (!permissions.includes('feature.comp_card.access')) {
    return null; // Feature not available in plan
  }
  
  if (!permissions.includes('feature.comp_card.create')) {
    return <UpgradePrompt feature="Comp Card Creation" />;
  }
  
  if (compCardCount >= limits.comp_cards) {
    return (
      <Button disabled>
        Comp Card Limit Reached ({compCardCount}/{limits.comp_cards})
        <Link href="/upgrade">Upgrade for more</Link>
      </Button>
    );
  }
  
  return (
    <Button onClick={createCompCard}>
      Create Comp Card ({compCardCount}/{limits.comp_cards})
    </Button>
  );
}
```

### Backend (Fastify API)

```typescript
// Route: POST /api/v1/user/comp-cards
fastify.post('/comp-cards', {
  preHandler: [
    fastify.authenticate,
    // Step 1: Check permission
    fastify.requirePermission('feature.comp_card.create'),
    // Step 2: Check limit
    async (request, reply) => {
      const userLimits = await getUserLimits(request.user.id);
      const currentCount = await getCompCardCount(request.user.id);
      
      if (currentCount >= userLimits.comp_cards) {
        return reply.status(429).send({
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: `Comp card limit reached (${currentCount}/${userLimits.comp_cards})`,
          details: {
            limit_type: 'comp_cards',
            current: currentCount,
            maximum: userLimits.comp_cards,
            upgrade_url: '/plans/upgrade'
          }
        });
      }
    }
  ],
  async handler(request, reply) {
    const compCard = await createCompCard({
      userId: request.user.id,
      ...request.body
    });
    
    return {
      success: true,
      data: compCard
    };
  }
});
```

## 🔄 Complete Workflow Example

### Step 1: Define Limits (Limits Builder)
```json
{
  "comp_cards": {
    "starter": { "value": 1, "unit": "cards" },
    "professional": { "value": 5, "unit": "cards" },
    "agency": { "value": -1, "unit": "unlimited" }
  },
  "comp_card_images": {
    "starter": { "value": 5, "unit": "images" },
    "professional": { "value": 20, "unit": "images" },
    "agency": { "value": 50, "unit": "images" }
  }
}
```

### Step 2: Define Permissions (Permissions Builder)
```json
{
  "feature.comp_card.access": "Can view comp card feature",
  "feature.comp_card.create": "Can create new comp cards",
  "feature.comp_card.update": "Can edit own comp cards",
  "feature.comp_card.delete": "Can delete comp cards"
}
```

### Step 3: Create Feature (Feature Builder)
```json
{
  "id": "comp_card_management",
  "name": "Comp Card Management",
  "required_permissions": [
    "feature.comp_card.access"
  ],
  "required_limits": [
    "comp_cards",
    "comp_card_images",
    "storage"
  ],
  "optional_limits": [
    "bandwidth"
  ]
}
```

### Step 4: Build Plan (Plan Builder)
```json
{
  "name": "Professional Plan",
  "features": [
    "comp_card_management",
    "portfolio_management",
    "analytics_basic"
  ],
  "permissions": [
    "feature.comp_card.access",
    "feature.comp_card.create",
    "feature.comp_card.update",
    "feature.portfolio.access",
    "feature.analytics.access"
  ],
  "limits": {
    "comp_cards": 5,
    "comp_card_images": 20,
    "portfolios": 10,
    "storage": "50GB"
  }
}
```

## 📊 UI/UX Guidelines

### Show Permission State
```html
<!-- Feature locked by permission -->
<div class="feature-card disabled">
  <i class="fas fa-lock"></i>
  <h3>Comp Cards</h3>
  <p>Upgrade to Professional to unlock</p>
</div>

<!-- Feature available but limit reached -->
<div class="feature-card">
  <h3>Comp Cards (5/5)</h3>
  <button disabled>Limit Reached - Upgrade for more</button>
</div>
```

### Error Messages
```javascript
// Permission denied (403)
{
  "error": "PERMISSION_DENIED",
  "message": "Comp card creation requires Professional plan"
}

// Limit exceeded (429)
{
  "error": "LIMIT_EXCEEDED", 
  "message": "You've reached your comp card limit (5/5)"
}
```

## 🎯 Key Takeaways

1. **Permissions** = Access control (Can I use this feature?)
2. **Limits** = Usage control (How much can I use?)
3. **Never** use `limit = 0` to deny access
4. **Always** check permissions first, then limits
5. **Features** combine permissions + limits
6. **Plans** are collections of features with configured values

This architecture provides maximum flexibility while maintaining clarity and preventing common pitfalls in subscription management systems.