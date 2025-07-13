'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, Download, FileText, AlertTriangle, 
  CheckCircle, Loader2, Database, FileJson,
  Info,
  FileSpreadsheet,
  Archive,
  Clock,
  Eye,
  Trash2
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

// Export formats available
const EXPORT_FORMATS = [
  {
    id: 'json',
    name: 'JSON Format',
    icon: FileJson,
    description: 'Complete data with metadata and structure',
    extension: '.json',
    mimeType: 'application/json'
  },
  {
    id: 'csv',
    name: 'CSV Format',
    icon: FileSpreadsheet,
    description: 'Spreadsheet compatible format',
    extension: '.csv',
    mimeType: 'text/csv'
  }
];

// API functions
const exportData = async (format: string, tenantId?: number) => {
  const params = new URLSearchParams();
  params.append('format', format);
  if (tenantId) {
    params.append('tenantId', tenantId.toString());
  }

  const response = await fetch(`/api/v1/admin/option-sets/export?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to export data');
  }

  return response.blob();
};

const previewImportData = async (data: string, format: string) => {
  // This would typically validate and preview the import data
  // For now, we'll simulate the validation
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        if (format === 'json') {
          const parsed = JSON.parse(data);
          resolve({
            valid: true,
            optionSets: parsed.optionSets?.length || 0,
            totalValues: parsed.totalValues || 0,
            errors: []
          });
        } else {
          // CSV validation
          const lines = data.split('\n');
          resolve({
            valid: true,
            optionSets: Math.floor(lines.length / 5), // Estimate
            totalValues: lines.length - 1, // Minus header
            errors: []
          });
        }
      } catch (error) {
        resolve({
          valid: false,
          errors: ['Invalid format: ' + (error as Error).message]
        });
      }
    }, 1000);
  });
};

const importOptionSets = async (data: any, format: 'json' | 'csv') => {
  const formData = new FormData();
  formData.append('format', format);
  formData.append('data', JSON.stringify(data));

  const response = await fetch('/api/v1/admin/option-sets/import', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) throw new Error('Failed to import option sets');
  return response.json();
};

const validateImportData = async (data: any, format: 'json' | 'csv') => {
  const response = await fetch('/api/v1/admin/option-sets/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, format })
  });

  if (!response.ok) throw new Error('Failed to validate data');
  return response.json();
};

export function BulkImportExportManager() {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState('json');
  const [importData, setImportData] = useState('');
  const [importFormat, setImportFormat] = useState('json');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: ({ format, tenantId }: { format: string; tenantId?: number }) => 
      exportData(format, tenantId),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `option-sets-${new Date().toISOString().split('T')[0]}${
        EXPORT_FORMATS.find(f => f.id === variables.format)?.extension
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Option sets exported as ${variables.format.toUpperCase()}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: ({ data, format }: { data: string; format: string }) => 
      previewImportData(data, format),
    onSuccess: (preview) => {
      setImportPreview(preview);
    },
    onError: (error: Error) => {
      toast({
        title: 'Preview Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const importMutation = useMutation({
    mutationFn: async ({ data, format }: { data: any, format: 'json' | 'csv' }) => {
      setIsProcessing(true);
      setProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 85));
      }, 300);

      try {
        const result = await importOptionSets(data, format);
        clearInterval(progressInterval);
        setProgress(100);

        setTimeout(() => {
          setIsProcessing(false);
          setProgress(0);
        }, 1000);

        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setIsProcessing(false);
        setProgress(0);
        throw error;
      }
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      toast({
        title: 'Import Successful',
        description: `Imported ${result.imported} option sets`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleExport = () => {
    exportMutation.mutate({ format: exportFormat });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);

      // Auto-detect format based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'json') {
        setImportFormat('json');
      } else if (extension === 'csv') {
        setImportFormat('csv');
      }
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    if (!importData.trim()) {
      toast({
        title: 'No Data',
        description: 'Please provide data to preview',
        variant: 'destructive'
      });
      return;
    }

    previewMutation.mutate({ data: importData, format: importFormat });
  };

  const handleClearImport = () => {
    setImportData('');
    setImportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!importPreview?.valid) {
      toast({
        title: 'Validation Required',
        description: 'Please validate your data before importing',
        variant: 'destructive'
      });
      return;
    }

    let parsedData;
    try {
      if (importFormat === 'json') {
        parsedData = JSON.parse(importData);
      } else {
        parsedData = importData;
      }
    } catch (error) {
      toast({
        title: 'Parse Error',
        description: 'Invalid data format',
        variant: 'destructive'
      });
      return;
    }

    importMutation.mutate({ data: parsedData, format: importFormat as 'json' | 'csv' });
  };

  const exampleJson = {
    optionSets: [
      {
        slug: "example-colors",
        label: "Example Colors",
        tenantId: null,
        values: [
          {
            label: "Red",
            value: "red",
            order: 1,
            isDefault: false,
            canonicalRegion: "GLOBAL",
            regionalMappings: {},
            metadata: {}
          }
        ]
      }
    ]
  };

  const selectedExportFormat = EXPORT_FORMATS.find(f => f.id === exportFormat);
  const selectedImportFormat = EXPORT_FORMATS.find(f => f.id === importFormat);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Bulk Import & Export</h2>
        <p className="text-muted-foreground">
          Import and export option sets in various formats for backup, migration, or bulk editing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Option Sets
              </CardTitle>
              <CardDescription>
                Download all option sets and values in your preferred format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_FORMATS.map(format => {
                      const Icon = format.icon;
                      return (
                        <SelectItem key={format.id} value={format.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{format.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedExportFormat && (
                <div className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <selectedExportFormat.icon className="h-4 w-4" />
                    <span className="font-medium">{selectedExportFormat.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedExportFormat.description}
                  </p>
                </div>
              )}

              <Separator />

              <Button 
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="w-full gap-2"
                size="lg"
              >
                {exportMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Export Formats Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Export Formats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {EXPORT_FORMATS.map(format => {
                const Icon = format.icon;
                return (
                  <div key={format.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Icon className="h-5 w-5 mt-0.5" />
                    <div>
                      <div className="font-medium">{format.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format.description}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {format.extension}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Import Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Option Sets
              </CardTitle>
              <CardDescription>
                Upload option sets from file or paste data directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Import Method</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleClearImport}
                    disabled={!importData}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select value={importFormat} onValueChange={setImportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_FORMATS.map(format => {
                      const Icon = format.icon;
                      return (
                        <SelectItem key={format.id} value={format.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{format.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={`Paste your ${importFormat.toUpperCase()} data here...`}
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handlePreview}
                  disabled={!importData.trim() || previewMutation.isPending}
                  variant="outline"
                  className="gap-2"
                >
                  {previewMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Preview
                    </>
                  )}
                </Button>

                <Button 
                  disabled={!importPreview?.valid}
                  className="flex-1 gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Results */}
          {importPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importPreview.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  Import Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {importPreview.valid ? (
                  <div className="space-y-2">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Data Validation Successful</AlertTitle>
                      <AlertDescription>
                        Ready to import {importPreview.optionSets} option sets with {importPreview.totalValues} values
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Option Sets</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {importPreview.optionSets}
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Option Values</div>
                        <div className="text-2xl font-bold text-green-600">
                          {importPreview.totalValues}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 space-y-1">
                        {importPreview.errors?.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Import Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Import Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">JSON Format</div>
                <div className="text-muted-foreground">
                  Complete structure with metadata and relationships
                </div>
              </div>
              <div>
                <div className="font-medium">CSV Format</div>
                <div className="text-muted-foreground">
                  Flat structure with predefined columns
                </div>
              </div>
              <div>
                <div className="font-medium">Validation</div>
                <div className="text-muted-foreground">
                  All imports are validated before applying changes
                </div>
              </div>
              <div>
                <div className="font-medium">Backup</div>
                <div className="text-muted-foreground">
                  Consider exporting current data before importing
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 