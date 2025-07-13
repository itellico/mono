/**
 * Bundle Strategy Configuration
 * Defines different approaches for bundling templates into deployable applications
 */

export type BundleStrategy = 'monolithic' | 'modular' | 'hybrid' | 'micro-frontend';

export interface BundleConfig {
  strategy: BundleStrategy;
  optimization: {
    treeShaking: boolean;
    codesplitting: boolean;
    lazyLoading: boolean;
    minification: boolean;
  };
  output: {
    format: 'esm' | 'cjs' | 'umd';
    target: 'web' | 'node' | 'electron';
    splitChunks: boolean;
  };
  features: {
    sourceMap: boolean;
    hotReload: boolean;
    progressiveWebApp: boolean;
    serverSideRendering: boolean;
  };
}

export const BUNDLE_STRATEGIES: Record<BundleStrategy, BundleConfig> = {
  monolithic: {
    strategy: 'monolithic',
    optimization: {
      treeShaking: true,
      codesplitting: false,
      lazyLoading: false,
      minification: true
    },
    output: {
      format: 'esm',
      target: 'web',
      splitChunks: false
    },
    features: {
      sourceMap: false,
      hotReload: false,
      progressiveWebApp: true,
      serverSideRendering: false
    }
  },

  modular: {
    strategy: 'modular',
    optimization: {
      treeShaking: true,
      codesplitting: true,
      lazyLoading: true,
      minification: true
    },
    output: {
      format: 'esm',
      target: 'web',
      splitChunks: true
    },
    features: {
      sourceMap: true,
      hotReload: true,
      progressiveWebApp: true,
      serverSideRendering: true
    }
  },

  hybrid: {
    strategy: 'hybrid',
    optimization: {
      treeShaking: true,
      codeSplitting: true,
      lazyLoading: true,
      minification: true
    },
    output: {
      format: 'esm',
      target: 'web',
      splitChunks: true
    },
    features: {
      sourceMap: true,
      hotReload: true,
      progressiveWebApp: true,
      serverSideRendering: true
    }
  },

  'micro-frontend': {
    strategy: 'micro-frontend',
    optimization: {
      treeShaking: true,
      codeSpitting: true,
      lazyLoading: true,
      minification: true
    },
    output: {
      format: 'esm',
      target: 'web',
      splitChunks: true
    },
    features: {
      sourceMap: true,
      hotReload: true,
      progressiveWebApp: true,
      serverSideRendering: true
    }
  }
};

export interface ComponentBundle {
  id: string;
  name: string;
  type: 'core' | 'feature' | 'industry' | 'shared';
  size: number;
  dependencies: string[];
  lazyLoadable: boolean;
  critical: boolean;
}

export interface BundleOutput {
  strategy: BundleStrategy;
  bundles: ComponentBundle[];
  totalSize: number;
  loadingStrategy: {
    critical: string[];
    deferred: string[];
    lazy: string[];
  };
  deployment: {
    files: string[];
    routes: string[];
    services?: string[];
  };
}

/**
 * Bundle Strategy Generator
 * Creates different bundle configurations based on template requirements
 */
export class BundleStrategyGenerator {
  
  /**
   * Generate monolithic bundle
   */
  generateMonolithicBundle(templateComponents: any[]): BundleOutput {
    const allComponents = templateComponents.map(comp => ({
      id: comp.id,
      name: comp.name,
      type: comp.isStandard ? 'core' : 'industry',
      size: this.estimateComponentSize(comp),
      dependencies: comp.dependencies || [],
      lazyLoadable: false,
      critical: comp.isRequired
    }));

    return {
      strategy: 'monolithic',
      bundles: [{
        id: 'main-bundle',
        name: 'Complete Application Bundle',
        type: 'core',
        size: allComponents.reduce((sum, comp) => sum + comp.size, 0),
        dependencies: [],
        lazyLoadable: false,
        critical: true
      }],
      totalSize: allComponents.reduce((sum, comp) => sum + comp.size, 0),
      loadingStrategy: {
        critical: ['main-bundle'],
        deferred: [],
        lazy: []
      },
      deployment: {
        files: ['index.html', 'main-bundle.js', 'styles.css'],
        routes: ['/']
      }
    };
  }

  /**
   * Generate modular bundle
   */
  generateModularBundle(templateComponents: any[]): BundleOutput {
    const componentBundles: ComponentBundle[] = [];
    
    // Group components by type
    const componentGroups = this.groupComponentsByType(templateComponents);
    
    Object.entries(componentGroups).forEach(([type, components]) => {
      componentBundles.push({
        id: `${type}-bundle`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Components`,
        type: type as any,
        size: components.reduce((sum, comp) => sum + this.estimateComponentSize(comp), 0),
        dependencies: this.extractDependencies(components),
        lazyLoadable: type !== 'core',
        critical: type === 'core'
      });
    });

    return {
      strategy: 'modular',
      bundles: componentBundles,
      totalSize: componentBundles.reduce((sum, bundle) => sum + bundle.size, 0),
      loadingStrategy: {
        critical: componentBundles.filter(b => b.critical).map(b => b.id),
        deferred: componentBundles.filter(b => !b.critical && !b.lazyLoadable).map(b => b.id),
        lazy: componentBundles.filter(b => b.lazyLoadable).map(b => b.id)
      },
      deployment: {
        files: [
          'index.html',
          ...componentBundles.map(b => `${b.id}.js`),
          'shared-styles.css'
        ],
        routes: ['/']
      }
    };
  }

  /**
   * Generate hybrid bundle
   */
  generateHybridBundle(templateComponents: any[]): BundleOutput {
    const coreComponents = templateComponents.filter(comp => 
      comp.isRequired || comp.isStandard
    );
    
    const featureComponents = templateComponents.filter(comp => 
      !comp.isRequired && !comp.isStandard
    );

    const bundles: ComponentBundle[] = [
      {
        id: 'core-bundle',
        name: 'Core Application Bundle',
        type: 'core',
        size: coreComponents.reduce((sum, comp) => sum + this.estimateComponentSize(comp), 0),
        dependencies: [],
        lazyLoadable: false,
        critical: true
      }
    ];

    // Create feature bundles
    const featureGroups = this.groupComponentsByFeature(featureComponents);
    Object.entries(featureGroups).forEach(([feature, components]) => {
      bundles.push({
        id: `${feature}-bundle`,
        name: `${feature} Feature Bundle`,
        type: 'feature',
        size: components.reduce((sum, comp) => sum + this.estimateComponentSize(comp), 0),
        dependencies: ['core-bundle'],
        lazyLoadable: true,
        critical: false
      });
    });

    return {
      strategy: 'hybrid',
      bundles,
      totalSize: bundles.reduce((sum, bundle) => sum + bundle.size, 0),
      loadingStrategy: {
        critical: ['core-bundle'],
        deferred: [],
        lazy: bundles.filter(b => b.lazyLoadable).map(b => b.id)
      },
      deployment: {
        files: [
          'index.html',
          'core-bundle.js',
          ...bundles.filter(b => b.lazyLoadable).map(b => `${b.id}.js`),
          'styles.css'
        ],
        routes: ['/']
      }
    };
  }

  /**
   * Generate micro-frontend bundle
   */
  generateMicroFrontendBundle(templateComponents: any[]): BundleOutput {
    const services = this.identifyMicroServices(templateComponents);
    
    const bundles: ComponentBundle[] = services.map(service => ({
      id: service.id,
      name: service.name,
      type: 'core',
      size: service.components.reduce((sum, comp) => sum + this.estimateComponentSize(comp), 0),
      dependencies: service.dependencies,
      lazyLoadable: false,
      critical: service.critical
    }));

    return {
      strategy: 'micro-frontend',
      bundles,
      totalSize: bundles.reduce((sum, bundle) => sum + bundle.size, 0),
      loadingStrategy: {
        critical: bundles.filter(b => b.critical).map(b => b.id),
        deferred: bundles.filter(b => !b.critical).map(b => b.id),
        lazy: []
      },
      deployment: {
        files: bundles.map(b => `${b.id}/index.html`),
        routes: bundles.map(b => `/${b.id}/*`),
        services: bundles.map(b => `${b.id}.service.com`)
      }
    };
  }

  /**
   * Helper methods
   */
  private estimateComponentSize(component: any): number {
    // Estimate component size based on type and complexity
    const baseSizes = {
      schema: 5000,
      module: 15000,
      page: 10000,
      form: 8000,
      option_set: 2000
    };
    
    return baseSizes[component.componentType] || 5000;
  }

  private groupComponentsByType(components: any[]) {
    return components.reduce((groups, comp) => {
      const type = comp.isStandard ? 'core' : 'industry';
      groups[type] = groups[type] || [];
      groups[type].push(comp);
      return groups;
    }, {});
  }

  private groupComponentsByFeature(components: any[]) {
    return components.reduce((groups, comp) => {
      const feature = comp.componentType;
      groups[feature] = groups[feature] || [];
      groups[feature].push(comp);
      return groups;
    }, {});
  }

  private extractDependencies(components: any[]): string[] {
    return [...new Set(components.flatMap(comp => comp.dependencies || []))];
  }

  private identifyMicroServices(components: any[]) {
    return [
      {
        id: 'auth-service',
        name: 'Authentication Service',
        components: components.filter(c => c.componentType === 'authentication'),
        dependencies: [],
        critical: true
      },
      {
        id: 'user-service',
        name: 'User Management Service',
        components: components.filter(c => c.componentType === 'user'),
        dependencies: ['auth-service'],
        critical: true
      },
      {
        id: 'industry-service',
        name: 'Industry Features Service',
        components: components.filter(c => !c.isStandard),
        dependencies: ['auth-service', 'user-service'],
        critical: false
      }
    ];
  }
} 