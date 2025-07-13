'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Zap, 
  Layers, 
  Network, 
  Download, 
  Clock, 
  Gauge,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface BundleStrategy {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  pros: string[];
  cons: string[];
  bestFor: string[];
  estimatedSize: string;
  loadTime: string;
  complexity: 'Low' | 'Medium' | 'High';
  recommended?: boolean;
}

const bundleStrategies: BundleStrategy[] = [
  {
    id: 'monolithic',
    name: 'Monolithic Bundle',
    description: 'Everything bundled into a single large file',
    icon: <Package className="h-6 w-6" />,
    pros: [
      'Simple deployment',
      'No loading delays after initial load',
      'Easier debugging',
      'Single cache strategy'
    ],
    cons: [
      'Large initial download (2.1MB)',
      'Slower initial load',
      'Must redeploy entire bundle for updates',
      'Unused features still downloaded'
    ],
    bestFor: [
      'Simple applications',
      'Internal tools',
      'Prototypes',
      'Single-page applications'
    ],
    estimatedSize: '2.1MB',
    loadTime: '3-5 seconds',
    complexity: 'Low'
  },
  {
    id: 'hybrid',
    name: 'Hybrid Approach',
    description: 'Core bundle + lazy-loaded feature modules',
    icon: <Zap className="h-6 w-6" />,
    pros: [
      'Fast initial load (800KB)',
      'Features load on-demand',
      'Update individual features',
      'Best performance balance'
    ],
    cons: [
      'Moderate deployment complexity',
      'Some features have loading delay',
      'Requires proper code splitting'
    ],
    bestFor: [
      'Production applications',
      'Customer-facing platforms',
      'Complex feature sets',
      'Performance-critical apps'
    ],
    estimatedSize: '800KB + modules',
    loadTime: '1-2 seconds',
    complexity: 'Medium',
    recommended: true
  },
  {
    id: 'modular',
    name: 'Modular Components',
    description: 'Independent components loaded as needed',
    icon: <Layers className="h-6 w-6" />,
    pros: [
      'Fastest initial load (120KB)',
      'Update individual components',
      'Perfect caching strategy',
      'Parallel development'
    ],
    cons: [
      'Complex deployment',
      'More network requests',
      'Potential loading delays',
      'Dependency management'
    ],
    bestFor: [
      'Large development teams',
      'Frequently updated apps',
      'Component libraries',
      'Enterprise applications'
    ],
    estimatedSize: '120KB + components',
    loadTime: '0.5-1 second',
    complexity: 'High'
  },
  {
    id: 'micro-frontend',
    name: 'Micro-Frontend',
    description: 'Completely independent services',
    icon: <Network className="h-6 w-6" />,
    pros: [
      'Team independence',
      'Technology flexibility',
      'Independent deployments',
      'Fault isolation'
    ],
    cons: [
      'Highest complexity',
      'Integration challenges',
      'Potential duplication',
      'Network overhead'
    ],
    bestFor: [
      'Large organizations',
      'Multiple teams',
      'Different technologies',
      'Scalable architectures'
    ],
    estimatedSize: 'Variable per service',
    loadTime: '1-3 seconds',
    complexity: 'High'
  }
];

interface BundleStrategySelectorProps {
  onStrategySelect: (strategy: string) => void;
  currentStrategy?: string;
}

export function BundleStrategySelector({ onStrategySelect, currentStrategy }: BundleStrategySelectorProps) {
  const [selectedStrategy, setSelectedStrategy] = useState(currentStrategy || 'hybrid');

  const handleStrategySelect = (strategyId: string) => {
    setSelectedStrategy(strategyId);
    onStrategySelect(strategyId);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Bundle Strategy</h3>
        <p className="text-sm text-muted-foreground">
          Select how your template components should be bundled and deployed
        </p>
      </div>

      <Tabs value={selectedStrategy} onValueChange={handleStrategySelect} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {bundleStrategies.map((strategy) => (
            <TabsTrigger key={strategy.id} value={strategy.id} className="relative">
              <div className="flex items-center space-x-2">
                {strategy.icon}
                <span className="hidden sm:inline">{strategy.name}</span>
              </div>
              {strategy.recommended && (
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                  Recommended
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {bundleStrategies.map((strategy) => (
          <TabsContent key={strategy.id} value={strategy.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {strategy.icon}
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{strategy.name}</span>
                        {strategy.recommended && (
                          <Badge className="bg-green-500 text-white">Recommended</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{strategy.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getComplexityColor(strategy.complexity)}>
                    {strategy.complexity} Complexity
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Download className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Bundle Size</p>
                      <p className="text-sm text-muted-foreground">{strategy.estimatedSize}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Load Time</p>
                      <p className="text-sm text-muted-foreground">{strategy.loadTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Complexity</p>
                      <p className="text-sm text-muted-foreground">{strategy.complexity}</p>
                    </div>
                  </div>
                </div>

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Advantages
                    </h4>
                    <ul className="space-y-1">
                      {strategy.pros.map((pro, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Considerations
                    </h4>
                    <ul className="space-y-1">
                      {strategy.cons.map((con, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-red-500 mr-1">•</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Best For */}
                <div>
                  <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    Best For
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {strategy.bestFor.map((use, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {use}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Performance Visualization */}
                <div className="space-y-2">
                  <h4 className="font-medium">Performance Profile</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Initial Load Speed</span>
                      <span>{strategy.id === 'monolithic' ? '40%' : strategy.id === 'hybrid' ? '85%' : '95%'}</span>
                    </div>
                    <Progress value={strategy.id === 'monolithic' ? 40 : strategy.id === 'hybrid' ? 85 : 95} />
                    
                    <div className="flex justify-between text-sm">
                      <span>Feature Availability</span>
                      <span>{strategy.id === 'monolithic' ? '100%' : strategy.id === 'hybrid' ? '90%' : '80%'}</span>
                    </div>
                    <Progress value={strategy.id === 'monolithic' ? 100 : strategy.id === 'hybrid' ? 90 : 80} />
                    
                    <div className="flex justify-between text-sm">
                      <span>Update Flexibility</span>
                      <span>{strategy.id === 'monolithic' ? '30%' : strategy.id === 'hybrid' ? '80%' : '95%'}</span>
                    </div>
                    <Progress value={strategy.id === 'monolithic' ? 30 : strategy.id === 'hybrid' ? 80 : 95} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          You can change the bundle strategy later in build settings
        </p>
        <Button onClick={() => handleStrategySelect(selectedStrategy)}>
          Use {bundleStrategies.find(s => s.id === selectedStrategy)?.name}
        </Button>
      </div>
    </div>
  );
} 