---
title: Feature Set Builder
sidebar_label: Feature Set Builder
---

# Feature Set Builder

The Feature Set Builder is a powerful tool for creating and managing feature combinations that can be assigned to subscription plans. It provides a visual interface for selecting features, configuring limits, and organizing feature sets.

## Overview

The Feature Set Builder allows platform administrators to:
- Create custom feature sets for different subscription tiers
- Configure feature limits and restrictions
- Use quick templates for common plan types
- Manage feature dependencies and conflicts
- Preview feature combinations before applying them to plans

## Key Components

### 1. Feature Categories
Features are organized into logical categories:
- **Core Features**: Essential functionality like authentication and basic storage
- **Advanced Features**: Enhanced capabilities like AI features and analytics
- **Security & Compliance**: Security-focused features like 2FA and SSO
- **Collaboration**: Team and workflow features

### 2. Feature Configuration
Each feature can be configured with:
- **Enable/Disable Toggle**: Turn features on or off
- **Custom Limits**: Set numeric or boolean limits (e.g., storage size, API rate limits)
- **Tier Assignment**: Specify which tier level the feature belongs to

### 3. Quick Sets
Pre-configured templates to quickly create common feature sets:
- **Starter Plan**: Basic features for small teams
- **Professional Plan**: Advanced features for growing businesses
- **Enterprise Plan**: Complete feature set with unlimited access

## Implementation Details

### Frontend Components
- **Location**: `/apps/web/src/app/platform/plans/feature-set-builder/page.tsx`
- **UI Components**: Uses shadcn/ui components for consistent design
- **State Management**: React hooks with TanStack Query for data fetching

### API Endpoints
- **GET** `/api/v1/platform/features` - List all available features
- **GET** `/api/v1/platform/feature-sets` - List all feature sets
- **POST** `/api/v1/platform/feature-sets` - Create new feature set
- **PUT** `/api/v1/platform/feature-sets/:id` - Update feature set
- **DELETE** `/api/v1/platform/feature-sets/:id` - Delete feature set

### Permissions
Required permissions for feature set management:
- `platform.feature-sets.view` - View feature sets
- `platform.feature-sets.create` - Create new feature sets
- `platform.feature-sets.update` - Modify existing feature sets
- `platform.feature-sets.delete` - Remove feature sets

## Usage Guide

### Creating a Feature Set

1. Navigate to **Platform → Plans → Feature Set Builder**
2. Enter a name and description for your feature set
3. Select the target tier (platform, tenant, account, user, public)
4. Choose features from each category tab
5. Configure limits for selected features
6. Optionally set as default for new plans
7. Click **Save Feature Set**

### Using Quick Templates

1. Click on one of the quick set buttons:
   - Starter Plan Template
   - Professional Plan Template
   - Enterprise Plan Template
2. Review and modify the pre-selected features
3. Adjust limits as needed
4. Save the customized feature set

### Managing Feature Limits

For features with configurable limits:
1. Enable the feature using the toggle
2. Expand the feature card to see limit options
3. Set numeric values for limits like:
   - Storage size (GB)
   - API rate limits (requests/minute)
   - User counts
   - Retention periods
4. Toggle boolean options for capabilities

## Best Practices

1. **Start with Templates**: Use quick sets as a starting point and customize
2. **Consider Dependencies**: Some features may require others to function
3. **Test Combinations**: Preview how features work together before applying to live plans
4. **Document Changes**: Use descriptive names and descriptions for feature sets
5. **Version Control**: Keep track of changes to feature sets over time

## Integration with Plans

Feature sets created in the builder can be:
- Assigned to subscription plans
- Used as templates for new plans
- Applied to existing customer subscriptions
- Exported and imported between environments

## Related Resources

- [Subscription Management Overview](/platform/subscription-management/overview)
- [Platform Access Control](/platform/access-control/)
- [API Documentation](/api/v1/platform/feature-sets)