'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Info,
  RefreshCw,
  Eye,
  Trash2,
  Download
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';

interface SeederStatus {
  isSeeded: boolean;
  lastSeededAt?: string;
  optionSetsCount: number;
  modelSchemasCount: number;
  modulesCount: number;
  canSeed: boolean;
  warnings: string[];
}

interface SeederResult {
  success: boolean;
  message: string;
  data?: {
    optionSets: number;
    modelSchemas: number;
    modules: number;
  };
  error?: string;
}

/**
 * Schema Seeder Admin Page
 * 
 * @component SchemaSeederPage
 * @description Admin interface for managing demo schema seeding operations
 */
export default function SchemaSeederPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current seeder status
  const { data: status, isLoading, error } = useQuery<SeederStatus>({
    queryKey: ['schema-seeder-status'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/schema-seeder/status');
      if (!response.ok) throw new Error('Failed to fetch seeder status');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Run seeder mutation
  const runSeederMutation = useMutation<SeederResult>({
    mutationFn: async () => {
      const response = await fetch('/api/v1/admin/schema-seeder/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to run seeder');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Schema Seeder Completed',
          description: data.message,
        });
        browserLogger.userAction('schema_seeder_success', JSON.stringify(data.data || {}));
      } else {
        toast({
          title: 'Schema Seeder Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['schema-seeder-status'] });
      setIsSeeding(false);
      setSeedingProgress(0);
    },
    onError: (error) => {
      toast({
        title: 'Schema Seeder Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsSeeding(false);
      setSeedingProgress(0);
    },
  });

  // Clear seeded data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/admin/schema-seeder/clear', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to clear data');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Demo Data Cleared',
        description: 'All demo schema data has been removed',
      });
      browserLogger.userAction('schema_seeder_clear_success', 'Data cleared');
      queryClient.invalidateQueries({ queryKey: ['schema-seeder-status'] });
    },
  });

  const handleRunSeeder = () => {
    setIsSeeding(true);
    setSeedingProgress(10);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setSeedingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 1000);

    runSeederMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Schema Seeder</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading seeder status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Schema Seeder</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load seeder status: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Schema Seeder</h1>
          <Badge variant={status?.isSeeded ? 'default' : 'secondary'}>
            {status?.isSeeded ? 'Seeded' : 'Not Seeded'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['schema-seeder-status'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Seeder Status
          </CardTitle>
          <CardDescription>
            Current status of the demo schema seeding system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status?.optionSetsCount || 0}</div>
              <div className="text-sm text-muted-foreground">Option Sets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{status?.modelSchemasCount || 0}</div>
              <div className="text-sm text-muted-foreground">Model Schemas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{status?.modulesCount || 0}</div>
              <div className="text-sm text-muted-foreground">UI Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {status?.lastSeededAt ? new Date(status.lastSeededAt).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm text-muted-foreground">Last Seeded</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {status?.warnings && status.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {status.warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demo Schema System</CardTitle>
              <CardDescription>
                Seed the database with comprehensive demo data for the itellico Mono modeling system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What will be created:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 11 Option Sets with 59 total values (physical attributes, modeling types, etc.)</li>
                  <li>• 2 Model Schemas (Fashion Model Profile, Pet Model Profile)</li>
                  <li>• 4 UI Modules (forms, search interfaces, listing grids)</li>
                  <li>• Regional mappings for international size conversions</li>
                  <li>• Complete validation rules and field definitions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4">
            {/* Run Seeder Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Run Demo Seeder
                </CardTitle>
                <CardDescription>
                  Execute the demo schema seeding process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSeeding && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Seeding in progress...</span>
                      <span>{seedingProgress}%</span>
                    </div>
                    <Progress value={seedingProgress} />
                  </div>
                )}
                <Button
                  onClick={handleRunSeeder}
                  disabled={!status?.canSeed || isSeeding}
                  className="w-full"
                >
                  {isSeeding ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Seeder
                    </>
                  )}
                </Button>
                {!status?.canSeed && (
                  <p className="text-sm text-muted-foreground">
                    Seeder cannot run. Data may already exist or system is not ready.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Clear Data Card */}
            {status?.isSeeded && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Clear Demo Data
                  </CardTitle>
                  <CardDescription>
                    Remove all demo schema data from the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => clearDataMutation.mutate()}
                    disabled={clearDataMutation.isPending}
                    className="w-full"
                  >
                    {clearDataMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Demo Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Demo Data Features:</h4>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Multi-tenant support with platform-wide schemas</li>
                      <li>• International size conversions (US/EU/UK/AU)</li>
                      <li>• Comprehensive field validation rules</li>
                      <li>• Tab-organized form layouts</li>
                      <li>• Role-based permission integration</li>
                      <li>• Audit trail with user tracking</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Technical Implementation:</h4>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Schema-driven form generation</li>
                      <li>• Reusable dropdown components</li>
                      <li>• Dynamic UI module configuration</li>
                      <li>• Type-safe field definitions</li>
                      <li>• Regional mapping system</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 