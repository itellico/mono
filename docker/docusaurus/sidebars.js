/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Getting Started',
    },
    {
      type: 'doc',
      id: 'CLAUDE',
      label: 'Development Guidelines',
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/README',
        'architecture/4-TIER-API-ARCHITECTURE',
        'architecture/THREE_LAYER_CACHING_STRATEGY',
        'architecture/STORAGE_STRATEGY_BEST_PRACTICES',
        'architecture/REACT_PERFORMANCE_PATTERNS',
        'architecture/REDIS_VS_TANSTACK_QUERY_STRATEGY',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/AUDIT_SYSTEM_GUIDE',
        'features/PERMISSION_SYSTEM_IMPLEMENTATION',
        'features/OPTION_SETS_AND_MODEL_SCHEMAS',
        'features/MARKETPLACE_SYSTEM_GUIDE',
        'features/MULTI_TENANT_ARCHITECTURE',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/README',
        'development/DOCKER_SERVICES_GUIDE',
        'development/COMPONENT_LIBRARY_GUIDE',
        'development/TESTING_GUIDE',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/QUICK_START',
        'getting-started/AUDIT_QUICK_START',
        'getting-started/MARKETPLACE_QUICK_START',
      ],
    },
    {
      type: 'category',
      label: 'Roadmap',
      items: [
        'roadmap/IMPLEMENTATION_STATUS_TRACKER',
        'roadmap/FUTURE_FEATURES',
      ],
    },
  ],
};

export default sidebars;