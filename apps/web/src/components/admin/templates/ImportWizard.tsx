'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertTriangle, 
  Info,
  Download,
  Database,
  Tag,
  Settings,
  Eye,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    templateId: string;
    name: string;
    description: string;
    industry: string;
    version: string;
    includes: {
      categories: number;
      optionSets: number;
      attributeDefinitions: number;
    };
    compatibility?: {
      isCompatible: boolean;
      riskLevel: 'low' | 'medium' | 'high';
      conflicts: string[];
      recommendations: string[];
    };
  } | null;
  tenants: Array<{ id: string; name: string; isActive: boolean }>;
  onImport: (config: ImportConfig) => Promise<void>;
}

interface ImportConfig {
  templateId: string;
  tenantId: string;
  components: {
    categories: boolean;
    optionSets: boolean;
    attributeDefinitions: boolean;
  };
  conflictResolution: 'update' | 'skip' | 'error';
  dryRun: boolean;
}

/**
 * Multi-step import wizard for template data
 * 
 * @component
 * @param {ImportWizardProps} props - The component props
 * @param {boolean} props.isOpen - Whether the wizard is open
 * @param {Function} props.onClose - Callback when wizard is closed
 * @param {Object} props.template - Template to import
 * @param {Array} props.tenants - Available tenants
 * @param {Function} props.onImport - Callback when import is initiated
 * 
 * @example
 * ```tsx
 * <ImportWizard
 *   isOpen={showWizard}
 *   onClose={() => setShowWizard(false)}
 *   template={selectedTemplate}
 *   tenants={availableTenants}
 *   onImport={handleImport}
 * />
 * ```
 */
export function ImportWizard({ isOpen, onClose, template, tenants, onImport }: ImportWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importConfig, setImportConfig] = useState<ImportConfig>({
    templateId: '',
    tenantId: '',
    components: {
      categories: true,
      optionSets: true,
      attributeDefinitions: true
    },
    conflictResolution: 'update',
    dryRun: false
  });

  const steps = [
    { title: 'Select Tenant', description: 'Choose the target tenant for import' },
    { title: 'Choose Components', description: 'Select which data to import' },
    { title: 'Conflict Resolution', description: 'Configure how to handle conflicts' },
    { title: 'Review & Import', description: 'Review settings and start import' }
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleImport = useCallback(async (dryRun: boolean = false) => {
    if (!template) return;

    setIsImporting(true);
    try {
      const config = {
        ...importConfig,
        templateId: template.templateId,
        dryRun
      };

      await onImport(config);
      
      if (!dryRun) {
        toast({
          title: 'Import Successful',
          description: `Template "${template.name}" has been imported successfully.`,
        });
        onClose();
      } else {
        toast({
          title: 'Preview Generated',
          description: 'Import preview completed. Review the results below.',
        });
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }, [template, importConfig, onImport, toast, onClose]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return importConfig.tenantId !== '';
      case 1:
        return Object.values(importConfig.components).some(Boolean);
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, importConfig]);

  const resetWizard = useCallback(() => {
    setCurrentStep(0);
    setIsImporting(false);
    setImportConfig({
      templateId: '',
      tenantId: '',
      components: {
        categories: true,
        optionSets: true,
        attributeDefinitions: true
      },
      conflictResolution: 'update',
      dryRun: false
    });
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      resetWizard();
    }
  }, [isOpen, resetWizard]);

  if (!template) return null;

  const selectedComponentsCount = Object.values(importConfig.components).filter(Boolean).length;
  const totalComponents = template.includes.categories + template.includes.optionSets + template.includes.attributeDefinitions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Import Template: {template.name}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                ${index <= currentStep 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background border-muted-foreground text-muted-foreground'
                }
              `}>
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* Step Content */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Target Tenant</CardTitle>
                <CardDescription>
                  Choose which tenant will receive the imported template data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup 
                  value={importConfig.tenantId} 
                  onValueChange={(value) => setImportConfig({ ...importConfig, tenantId: value })}
                >
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={tenant.id} id={tenant.id} disabled={!tenant.isActive} />
                      <Label htmlFor={tenant.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span>{tenant.name}</span>
                          <Badge variant={tenant.isActive ? "default" : "secondary"}>
                            {tenant.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Components to Import</CardTitle>
                <CardDescription>
                  Select which parts of the template you want to import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="categories"
                      checked={importConfig.components.categories}
                      onCheckedChange={(checked) => 
                        setImportConfig({
                          ...importConfig,
                          components: { ...importConfig.components, categories: checked as boolean }
                        })
                      }
                    />
                    <Label htmlFor="categories" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4" />
                          <span>Categories ({template.includes.categories})</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Content organization and hierarchies
                        </span>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="optionSets"
                      checked={importConfig.components.optionSets}
                      onCheckedChange={(checked) => 
                        setImportConfig({
                          ...importConfig,
                          components: { ...importConfig.components, optionSets: checked as boolean }
                        })
                      }
                    />
                    <Label htmlFor="optionSets" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Settings className="h-4 w-4" />
                          <span>Option Sets ({template.includes.optionSets})</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Dropdown values and selections
                        </span>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="attributeDefinitions"
                      checked={importConfig.components.attributeDefinitions}
                      onCheckedChange={(checked) => 
                        setImportConfig({
                          ...importConfig,
                          components: { ...importConfig.components, attributeDefinitions: checked as boolean }
                        })
                      }
                    />
                    <Label htmlFor="attributeDefinitions" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4" />
                          <span>Attribute Definitions ({template.includes.attributeDefinitions})</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Form fields and data structures
                        </span>
                      </div>
                    </Label>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Selected {selectedComponentsCount} of 3 component types. 
                    This will import approximately {totalComponents} data items.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Conflict Resolution Strategy</CardTitle>
                <CardDescription>
                  Configure how to handle existing data conflicts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup 
                  value={importConfig.conflictResolution} 
                  onValueChange={(value: 'update' | 'skip' | 'error') => 
                    setImportConfig({ ...importConfig, conflictResolution: value })
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="update" id="update" className="mt-1" />
                      <Label htmlFor="update" className="cursor-pointer">
                        <div>
                          <div className="font-medium">Update Existing (Recommended)</div>
                          <div className="text-sm text-muted-foreground">
                            Update existing items with new template data. Safe for most use cases.
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="skip" id="skip" className="mt-1" />
                      <Label htmlFor="skip" className="cursor-pointer">
                        <div>
                          <div className="font-medium">Skip Existing</div>
                          <div className="text-sm text-muted-foreground">
                            Only import new items, skip items that already exist. Conservative approach.
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="error" id="error" className="mt-1" />
                      <Label htmlFor="error" className="cursor-pointer">
                        <div>
                          <div className="font-medium">Stop on Conflicts</div>
                          <div className="text-sm text-muted-foreground">
                            Stop import if conflicts are found. Requires manual resolution.
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {template.compatibility && (
                  <Alert className={
                    template.compatibility.riskLevel === 'high' ? 'border-red-200 bg-red-50' :
                    template.compatibility.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-medium">
                          Compatibility: {template.compatibility.isCompatible ? 'Compatible' : 'Conflicts Detected'}
                        </div>
                        {template.compatibility.conflicts.length > 0 && (
                          <div>
                            <div className="text-sm font-medium">Potential Conflicts:</div>
                            <ul className="text-sm list-disc list-inside">
                              {template.compatibility.conflicts.map((conflict, index) => (
                                <li key={index}>{conflict}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {template.compatibility.recommendations.length > 0 && (
                          <div>
                            <div className="text-sm font-medium">Recommendations:</div>
                            <ul className="text-sm list-disc list-inside">
                              {template.compatibility.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Import Configuration</CardTitle>
                <CardDescription>
                  Review your settings before starting the import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label className="text-sm font-medium">Template</Label>
                    <div className="text-sm text-muted-foreground">
                      {template.name} (v{template.version})
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Target Tenant</Label>
                    <div className="text-sm text-muted-foreground">
                      {tenants.find(t => t.id === importConfig.tenantId)?.name || 'Unknown'}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Components to Import</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {importConfig.components.categories && (
                        <Badge variant="secondary">Categories ({template.includes.categories})</Badge>
                      )}
                      {importConfig.components.optionSets && (
                        <Badge variant="secondary">Option Sets ({template.includes.optionSets})</Badge>
                      )}
                      {importConfig.components.attributeDefinitions && (
                        <Badge variant="secondary">Attributes ({template.includes.attributeDefinitions})</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Conflict Resolution</Label>
                    <div className="text-sm text-muted-foreground capitalize">
                      {importConfig.conflictResolution} existing items
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleImport(true)}
                    disabled={isImporting}
                    className="flex-1"
                  >
                    {isImporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Preview Import
                  </Button>
                  <Button
                    onClick={() => handleImport(false)}
                    disabled={isImporting}
                    className="flex-1"
                  >
                    {isImporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Start Import
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isImporting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isImporting}>
              Cancel
            </Button>
            
            {currentStep < steps.length - 1 && (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isImporting}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 