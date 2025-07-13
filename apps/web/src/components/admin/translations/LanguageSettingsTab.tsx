'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Globe, Languages, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupportedLanguages } from '@/hooks/useTranslationsData';
import { useLanguageManagement, useAddSupportedLanguage, useUpdateSupportedLanguage } from '@/hooks/useLanguageManagement';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';

/**
 * Language Settings Tab Component
 * 
 * Allows administrators to configure the default source language
 * and other language preferences for the translation system.
 * 
 * Features:
 * - Set default source language (used as reference for all translations)
 * - Configure fallback language
 * - Auto-translation settings
 * - Language completion statistics
 * 
 * @component
 */
export function LanguageSettingsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackClick, trackFormSubmission } = useAuditTracking();

  // UI State
  const [selectedSourceLanguage, setSelectedSourceLanguage] = useState<string>('en-US');
  const [selectedFallbackLanguage, setSelectedFallbackLanguage] = useState<string>('en-US');
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Data hooks
  const { 
    data: languages = [], 
    isLoading: languagesLoading,
    error: languagesError 
  } = useSupportedLanguages();

  // Language management hooks
  const { data: managementData } = useLanguageManagement();
  const addLanguageMutation = useAddSupportedLanguage();
  const updateLanguageMutation = useUpdateSupportedLanguage();

  // Find current default language
  const currentDefaultLanguage = languages.find(lang => lang.isDefault);

  // Handle toggle changes with actual API calls
  const handleToggleChange = async (languageCode: string, field: 'isActive' | 'isLive' | 'autoTranslateEnabled', value: boolean) => {
    try {
      await updateLanguageMutation.mutateAsync({
        code: languageCode,
        data: { [field]: value }
      });

      toast({
        title: "Language Updated",
        description: `Successfully updated ${field} for ${languageCode}`,
        variant: "default"
      });

      browserLogger.info('Language toggle updated', { languageCode, field, value });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      browserLogger.error('Failed to update language toggle', { error: errorMessage, languageCode, field });

      toast({
        title: "Update Failed",
        description: `Failed to update ${field}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  // Handle add language with actual API call
  const handleAddLanguage = async () => {
    try {
      // For now, we'll add English (UK) as an example
      // In a real implementation, this would come from a language selector
      const newLanguageCode = 'en-GB';

      await addLanguageMutation.mutateAsync({
        code: newLanguageCode,
        isActive: true,
        isLive: false,
        autoTranslateEnabled: true,
        translationPriority: 5
      });

      toast({
        title: "Language Added",
        description: `Successfully added ${newLanguageCode}`,
        variant: "default"
      });

      browserLogger.info('Language added', { code: newLanguageCode });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      browserLogger.error('Failed to add language', { error: errorMessage });

      toast({
        title: "Add Language Failed",
        description: "Failed to add language. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to update language settings.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/admin/language-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseLanguageCode: selectedSourceLanguage,
          fallbackLanguageCode: selectedFallbackLanguage,
          autoTranslateEnabled
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update language settings');
      }

      toast({
        title: "Settings Updated",
        description: "Language settings have been successfully updated.",
        variant: "default"
      });

      browserLogger.userAction('language_settings_updated', selectedSourceLanguage);

    } catch (error) {
      browserLogger.error('Failed to update language settings', { error });

      toast({
        title: "Update Failed", 
        description: "Failed to update language settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle language selection changes
  const handleSourceLanguageChange = (languageCode: string) => {
    trackClick('source_language_change', { languageCode });
    setSelectedSourceLanguage(languageCode);
  };

  const handleFallbackLanguageChange = (languageCode: string) => {
    trackClick('fallback_language_change', { languageCode });
    setSelectedFallbackLanguage(languageCode);
  };

  // Show loading state
  if (languagesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (languagesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h2 className="text-xl font-semibold">Language Settings</h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load language data. Please refresh the page and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Language Settings</h2>
      </div>

      {/* Current Source Language Status */}
      {currentDefaultLanguage && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Current Default Language:</strong> {currentDefaultLanguage.name} ({currentDefaultLanguage.code})
          </AlertDescription>
        </Alert>
      )}

      {/* Default Language Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Default Language
          </CardTitle>
          <CardDescription>
            Set the primary language that will be used as the reference for all translations. 
            This language will appear as a fixed reference in the translation comparison view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="base-language" className="text-sm font-medium">Base Language</Label>
            <Select 
              value={selectedSourceLanguage} 
              onValueChange={handleSourceLanguageChange}
            >
              <SelectTrigger className="w-full h-[50px]">
                <SelectValue placeholder="Select the base language..." />
              </SelectTrigger>
              <SelectContent>
                {languages
                  .filter(lang => lang.isActive)
                  .map(language => (
                    <SelectItem key={language.code} value={language.code}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {language.code.startsWith('en') ? '🇺🇸' :
                           language.code.startsWith('de') ? '🇩🇪' :
                           language.code.startsWith('sq') ? '🇦🇱' : '🌐'}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium">{language.name}</span>
                          <span className="text-sm text-muted-foreground">{language.nativeName}</span>
                        </div>
                        {language.isDefault && (
                          <Badge variant="secondary" className="text-xs">Base</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This language will be used as the reference point for all translations and will appear 
              as a fixed reference in the translation management interface.
            </p>
          </div>

          <Separator />

          {/* Fallback Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="fallback-language" className="text-sm font-medium">Fallback Language</Label>
            <Select 
              value={selectedFallbackLanguage} 
              onValueChange={handleFallbackLanguageChange}
            >
              <SelectTrigger className="w-full h-[50px]">
                <SelectValue placeholder="Select fallback language..." />
              </SelectTrigger>
              <SelectContent>
                {languages
                  .filter(lang => lang.isActive)
                  .map(language => (
                    <SelectItem key={language.code} value={language.code}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {language.code.startsWith('en') ? '🇺🇸' :
                           language.code.startsWith('de') ? '🇩🇪' :
                           language.code.startsWith('sq') ? '🇦🇱' : '🌐'}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium">{language.name}</span>
                          <span className="text-sm text-muted-foreground">{language.nativeName}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Used when translations are missing in the target language.
            </p>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="min-w-32"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Language Management
            </div>
            <Button 
              onClick={handleAddLanguage}
              disabled={addLanguageMutation.isPending}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {addLanguageMutation.isPending ? 'Adding...' : 'Add Language'}
            </Button>
          </CardTitle>
          <CardDescription>
            Manage supported languages, activation status, and translation settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {managementData?.data.supportedLanguages.map(language => (
              <div 
                key={language.code} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  language.isActive ? 'bg-white' : 'bg-gray-50 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {language.code.startsWith('en') ? '🇺🇸' :
                     language.code.startsWith('de') ? '🇩🇪' :
                     language.code.startsWith('sq') ? '🇦🇱' : '🌐'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{language.name}</span>
                      {language.isDefault && (
                        <Badge variant="secondary" className="text-xs">Base</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{language.code} • {language.nativeName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress */}
                  <div className="text-center min-w-16">
                    <div className="text-sm font-medium">{Math.round(language.completionPercentage)}%</div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>

                  {/* Toggle Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Switch 
                        checked={language.isActive || false}
                        onCheckedChange={(checked) => {
                          trackClick('toggle_language_active', { language: language.code, active: checked });
                          handleToggleChange(language.code, 'isActive', checked);
                        }}
                        disabled={language.isDefault || updateLanguageMutation.isPending} // Can't deactivate base language
                      />
                      <Label className="text-xs">Active</Label>
                    </div>

                    <div className="flex items-center gap-1">
                      <Switch 
                        checked={language.isDefault ? true : (language.isLive || false)}
                        onCheckedChange={(checked) => {
                          if (!checked && language.isDefault) {
                            // Don't allow deactivating Live for base language
                            return;
                          }
                          trackClick('toggle_language_live', { language: language.code, live: checked });
                          handleToggleChange(language.code, 'isLive', checked);
                        }}
                        disabled={!language.isActive || language.isDefault || updateLanguageMutation.isPending} // Base language is always live
                      />
                      <Label className="text-xs">Live</Label>
                    </div>

                    <div className="flex items-center gap-1">
                      <Switch 
                        checked={language.autoTranslateEnabled || false}
                        onCheckedChange={(checked) => {
                          trackClick('toggle_auto_translate', { language: language.code, autoTranslate: checked });
                          handleToggleChange(language.code, 'autoTranslateEnabled', checked);
                        }}
                        disabled={!language.isActive || updateLanguageMutation.isPending}
                      />
                      <Label className="text-xs">Auto-Translate</Label>
                    </div>
                  </div>
                </div>
              </div>
            )) || []}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 