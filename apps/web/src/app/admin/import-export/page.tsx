'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  FileJson, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Folder,
  Tag,
  Database,
  Settings,
  Trash2,
  Plus,
  Eye,
  Clock,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
  warnings: string[];
}

interface ExportResult {
  success: boolean;
  data?: any;
  message: string;
}

type ImportMode = 'delete' | 'append';
type EntityType = 'categories' | 'model-schemas' | 'option-sets';

/**
 * Import/Export Manager Dashboard
 * 
 * Comprehensive dashboard for importing and exporting:
 * - Categories (hierarchical)
 * - Tags
 * - Model Schemas (with fields)
 * - Option Sets (with values)
 * 
 * @component
 * @example
 * <ImportExportPage />
 */
export default function ImportExportPage() {
  const t = useTranslations();
  const { trackClick, trackView } = useAuditTracking();

  // State management
  const [activeTab, setActiveTab] = useState<EntityType>('categories');
  const [importMode, setImportMode] = useState<ImportMode>('append');
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [includeSystem, setIncludeSystem] = useState(false);

  // Track page view
  React.useEffect(() => {
    trackView('ImportExportPage');
    browserLogger.userAction('Visited import/export page', 'ImportExportPage');
  }, [trackView]);

  // Entity configurations
  const entityConfigs = {
    categories: {
      title: 'Categories',
      description: 'Import/export hierarchical categories with parent-child relationships',
      icon: Folder,
      color: 'bg-blue-500',
      endpoint: '/api/v1/admin/import-export/categories',
      sampleData: [
        {
          name: 'Fashion',
          slug: 'fashion',
          description: 'Fashion and style category',
          categoryType: 'content',
          level: 0,
          sortOrder: 1,
          color: '#FF6B6B',
          icon: 'shirt'
        },
        {
          name: 'Women\'s Fashion',
          slug: 'womens-fashion',
          description: 'Women\'s clothing and accessories',
          categoryType: 'content',
          parentId: 'fashion-id',
          level: 1,
          sortOrder: 1
        }
      ]
    },

    'model-schemas': {
      title: 'Model Schemas',
      description: 'Import/export model schemas with field definitions',
      icon: Database,
      color: 'bg-purple-500',
      endpoint: '/api/v1/admin/import-export/model-schemas',
      sampleData: [
        {
          type: 'human_model',
          subType: 'fitness',
          displayName: { 'en-US': 'Fitness Model' },
          description: { 'en-US': 'Professional fitness models' },
          schema: {
            fields: [
              {
                id: 'height',
                name: 'height',
                label: { 'en-US': 'Height' },
                type: 'number',
                required: true,
                unit: 'cm',
                order: 1
              },
              {
                id: 'weight',
                name: 'weight',
                label: { 'en-US': 'Weight' },
                type: 'number',
                required: true,
                unit: 'kg',
                order: 2
              }
            ],
            version: '1.0'
          }
        }
      ]
    },
    'option-sets': {
      title: 'Option Sets',
      description: 'Import/export option sets with values for dropdowns',
      icon: Settings,
      color: 'bg-orange-500',
      endpoint: '/api/v1/admin/import-export/option-sets',
      sampleData: [
        {
          slug: 'hair-colors',
          label: 'Hair Colors',
          values: [
            {
              label: 'Blonde',
              value: 'blonde',
              order: 1,
              isDefault: false,
              canonicalRegion: 'GLOBAL'
            },
            {
              label: 'Brunette',
              value: 'brunette',
              order: 2,
              isDefault: true,
              canonicalRegion: 'GLOBAL'
            }
          ]
        }
      ]
    }
  };

  const currentConfig = entityConfigs[activeTab];

  // Handle tab change
  const handleTabChange = (tab: EntityType) => {
    setActiveTab(tab);
    setImportResult(null);
    setExportResult(null);
    setJsonInput('');
    trackClick('ImportExportPage', { action: 'tab-change', tab });
    browserLogger.userAction('Changed import/export tab', 'ImportExportPage', { tab });
  };

  // Handle import
  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setImportResult({
        success: false,
        message: 'Please provide JSON data to import',
        imported: 0,
        errors: ['No JSON data provided'],
        warnings: []
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      // Parse JSON
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch (error) {
        setImportResult({
          success: false,
          message: 'Invalid JSON format',
          imported: 0,
          errors: ['Failed to parse JSON: ' + (error instanceof Error ? error.message : 'Unknown error')],
          warnings: []
        });
        return;
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        data = [data];
      }

      trackClick('ImportExportPage', { 
        action: 'import', 
        entityType: activeTab, 
        mode: importMode,
        count: data.length 
      });

      browserLogger.userAction('Started import operation', 'ImportExportPage', {
        entityType: activeTab,
        mode: importMode,
        count: data.length
      });

      // Make API call
      const response = await fetch(currentConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          mode: importMode
        })
      });

      const result = await response.json();

      if (result.success) {
        setImportResult(result.data);
        browserLogger.userAction('Import completed successfully', 'ImportExportPage', {
          entityType: activeTab,
          imported: result.data.imported
        });
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Import failed',
          imported: 0,
          errors: [result.error || 'Unknown error'],
          warnings: []
        });
      }

    } catch (error) {
      setImportResult({
        success: false,
        message: 'Import failed',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      });
      browserLogger.userAction('Import failed', 'ImportExportPage', { 
        entityType: activeTab, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      trackClick('ImportExportPage', { 
        action: 'export', 
        entityType: activeTab,
        includeSystem 
      });

      browserLogger.userAction('Started export operation', 'ImportExportPage', {
        entityType: activeTab,
        includeSystem
      });

      const url = new URL(currentConfig.endpoint, window.location.origin);
      if (includeSystem && activeTab === 'categories') {
        url.searchParams.set('includeSystem', 'true');
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.success) {
        setExportResult(result);
        browserLogger.userAction('Export completed successfully', 'ImportExportPage', {
          entityType: activeTab,
          count: result.data?.length || 0
        });
      } else {
        setExportResult({
          success: false,
          message: result.error || 'Export failed'
        });
      }

    } catch (error) {
      setExportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Export failed'
      });
      browserLogger.userAction('Export failed', 'ImportExportPage', { 
        entityType: activeTab, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Download exported data
  const downloadExportedData = () => {
    if (!exportResult?.data) return;

    const dataStr = JSON.stringify(exportResult.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab}-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    trackClick('ImportExportPage', { action: 'download', entityType: activeTab });
    browserLogger.userAction('Downloaded export data', 'ImportExportPage', { entityType: activeTab });
  };

  // Load sample data
  const loadSampleData = () => {
    setJsonInput(JSON.stringify(currentConfig.sampleData, null, 2));
    trackClick('ImportExportPage', { action: 'load-sample', entityType: activeTab });
    browserLogger.userAction('Loaded sample data', 'ImportExportPage', { entityType: activeTab });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import/Export Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage data import and export for categories, model schemas, and option sets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Data Management
          </Badge>
        </div>
      </div>

      {/* Entity Type Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as EntityType)}>
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(entityConfigs).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {config.title}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(entityConfigs).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <TabsContent key={key} value={key} className="space-y-6">
              {/* Entity Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${config.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {config.title} Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{config.description}</p>
                </CardContent>
              </Card>

              {/* Import/Export Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Import Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Import {config.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Import Mode */}
                    <div className="space-y-2">
                      <Label>Import Mode</Label>
                      <RadioGroup
                        value={importMode}
                        onValueChange={(value) => setImportMode(value as ImportMode)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="append" id="append" />
                          <Label htmlFor="append" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Append - Add to existing data
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delete" id="delete" />
                          <Label htmlFor="delete" className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Replace - Delete existing and import new
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Separator />

                    {/* JSON Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>JSON Data</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadSampleData}
                          className="text-xs"
                        >
                          Load Sample
                        </Button>
                      </div>
                      <Textarea
                        placeholder={`Paste your ${config.title.toLowerCase()} JSON data here...`}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>

                    {/* Import Button */}
                    <Button
                      onClick={handleImport}
                      disabled={isImporting || !jsonInput.trim()}
                      className="w-full"
                    >
                      {isImporting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import {config.title}
                        </>
                      )}
                    </Button>

                    {/* Import Result */}
                    {importResult && (
                      <Alert className={`${importResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} p-3`}>
                        {/* Fixed layout to prevent overlap */}
                        <div className="flex items-start gap-3">
                          {importResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Main message */}
                            <div className="font-medium text-sm">{importResult.message}</div>
                            
                            {/* Stats and warnings in separate rows */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={importResult.success ? 'default' : 'destructive'} className="text-xs">
                                {importResult.imported} items imported
                              </Badge>
                              
                              {importResult.warnings.length > 0 && (
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                  {importResult.warnings.length} warning{importResult.warnings.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                              
                              {importResult.errors.length > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                        </div>
                        
                            {/* Detailed warnings/errors */}
                        {(importResult.warnings.length > 0 || importResult.errors.length > 0) && (
                              <div className="text-xs space-y-1">
                            {importResult.warnings.length > 0 && (
                                  <div className="flex items-start gap-1 text-yellow-700">
                                    <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                    <span>{importResult.warnings[0]}{importResult.warnings.length > 1 ? ` (+${importResult.warnings.length - 1} more)` : ''}</span>
                              </div>
                            )}
                            {importResult.errors.length > 0 && (
                                  <div className="flex items-start gap-1 text-red-700">
                                    <XCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                    <span>{importResult.errors[0]}{importResult.errors.length > 1 ? ` (+${importResult.errors.length - 1} more)` : ''}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Export Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export {config.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Export Options */}
                    {activeTab === 'categories' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeSystem"
                          checked={includeSystem}
                          onChange={(e) => setIncludeSystem(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="includeSystem" className="text-sm">
                          Include system {config.title.toLowerCase()}
                        </Label>
                      </div>
                    )}

                    {/* Export Button */}
                    <Button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="w-full"
                      variant="outline"
                    >
                      {isExporting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export {config.title}
                        </>
                      )}
                    </Button>

                    {/* Export Result */}
                    {exportResult && (
                      <Alert className={exportResult.success ? 'border-green-500' : 'border-red-500'}>
                        <div className="flex items-center gap-2">
                          {exportResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="font-medium">{exportResult.message}</p>
                              {exportResult.success && exportResult.data && (
                                <div className="space-y-2">
                                  <p className="text-sm text-green-600">
                                    Exported {exportResult.data.length} items
                                  </p>
                                  <Button
                                    onClick={downloadExportedData}
                                    size="sm"
                                    className="w-full"
                                  >
                                    <FileJson className="h-4 w-4 mr-2" />
                                    Download JSON File
                                  </Button>
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </div>
                      </Alert>
                    )}

                    {/* Preview */}
                    {exportResult?.success && exportResult.data && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Data Preview
                        </Label>
                        <ScrollArea className="h-32 w-full rounded border p-2">
                          <pre className="text-xs">
                            {JSON.stringify(exportResult.data.slice(0, 2), null, 2)}
                            {exportResult.data.length > 2 && '\n... and more'}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
} 