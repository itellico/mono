'use client';
import React from 'react';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter, 
  Download, 
  Upload, 
  Languages, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  BarChart3,
  Globe,
  FileText,
  Play,
  Tag,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { LanguageCard } from '@/components/admin/translations/LanguageCard';
import { LanguageSettingsTab } from '@/components/admin/translations/LanguageSettingsTab';
import { LanguageDisplay, LanguageOption } from '@/components/admin/translations/LanguageDisplay';
import { SearchableLanguageSelect } from '@/components/admin/translations/SearchableLanguageSelect';
import { LanguageManagementTab } from '@/components/admin/translations/LanguageManagementTab';
import { 
  TRANSLATION_SCOPES, 
  getScopeForEntityType, 
  getAllScopes,
  getScopeColorClasses,
  type TranslationScope 
} from '@/lib/types/translation-scopes';
// TanStack Query hooks following cursor rules
import {
  useTranslations,
  useSupportedLanguages,
  useTranslationStatistics,
  useLanguageComparison,
  useUpdateTranslation,
  useBulkMarkReviewed,
  useExtractStrings,
  type Translation,
  type SupportedLanguage,
  type LanguageStatistics,
  type TranslationFilters
} from '@/hooks/useTranslationsData';
// Audit tracking integration (cursor rules requirement)
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
// Zustand store for UI state (cursor rules pattern)
import { useTranslationUIStore } from '@/stores/translation-ui-store';
/**
 * Admin Translations Page Component
 * 
 * Features:
 * - TanStack Query for server state management
 * - Redis caching coordination 
 * - Source/target language comparison in list view
 * - Audit tracking integration
 * - Proper error boundaries and loading states
 * - Optimistic updates with rollback
 * 
 * @component
 * @example
 * <TranslationsPage />
 */
export default function TranslationsPage() {
  const { user, loading: isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  // Audit tracking integration (cursor rules requirement)
  const { trackClick, trackView, trackSearch, trackFormSubmission } = useAuditTracking();
  usePageTracking('admin_translations');
  // UI state management with Zustand (cursor rules pattern)
  const {
    view,
    setView,
    selectedTranslations,
    setSelectedTranslations,
    editDialogOpen,
    setEditDialogOpen,
    selectedTranslation,
    setSelectedTranslation,
    editForm,
    setEditForm,
    filter,
    setFilter,
    updateFilter,
    targetLanguage,
    setTargetLanguage
  } = useTranslationUIStore();
  // TanStack Query hooks (cursor rules requirement)
  const { 
    data: translations = [], 
    isLoading: translationsLoading, 
    error: translationsError 
  } = useTranslations(filter);
  // Log loading errors for debugging (cursor rules requirement)
  if (translationsError && typeof window !== 'undefined') {
    browserLogger.error('Translation loading failed', { 
      error: translationsError?.message, 
      filter 
    });
  }
  const { 
    data: languages = [], 
    isLoading: languagesLoading 
  } = useSupportedLanguages();
  const { 
    data: statistics, 
    isLoading: statisticsLoading 
  } = useTranslationStatistics();
  // Language comparison for list view (moved from overview)
  const { 
    data: comparisonData, 
    isLoading: comparisonLoading 
  } = useLanguageComparison(
    view === 'list' ? 'en-US' : 'en-US', // Always provide source language
    view === 'list' ? targetLanguage : 'de-DE', // Always provide target language  
    view === 'list' ? filter : {} // Only filter when in list view
  );
  // Mutations with optimistic updates (cursor rules requirement)
  const updateTranslationMutation = useUpdateTranslation();
  const bulkMarkReviewedMutation = useBulkMarkReviewed();
  const extractStringsMutation = useExtractStrings();
  // Authentication check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!user) {
    router.push('/auth/signin');
    return null;
  }
  const adminRole = user?.roles?.[0] || '';
  if (!adminRole || !['super_admin', 'tenant_admin'].includes(adminRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin access to view this page.</p>
        </div>
      </div>
    );
  }
  const handleOpenEditor = (languageCode?: string, entityType?: string) => {
    trackClick('translation_editor_open', { languageCode, entityType });
      const params = new URLSearchParams();
    if (languageCode) params.set('language', languageCode);
    if (entityType) params.set('entityType', entityType);
    router.push(`/admin/translations/editor?${params.toString()}`);
  };
  const handleBulkMarkReviewed = async () => {
    trackClick('bulk_mark_reviewed', { count: selectedTranslations.length });
    try {
      await bulkMarkReviewedMutation.mutateAsync(selectedTranslations);
      setSelectedTranslations([]);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };
  const handleExtractStrings = async () => {
    trackClick('extract_strings');
    try {
      const result = await extractStringsMutation.mutateAsync();
      // Show detailed results in toast with comprehensive DEBUG INFO
      if (result?.results) {
        const { filesScanned, keysFound, addedKeys, removedKeys, languagesUpdated, debug, warnings } = result.results;
        // Check for structural conflicts (the main issue)
        const conflictKeys = warnings?.filter((w: string) => w.includes('already mapped to a map')).map((w: string) => w.split(': ')[1]) || [];
        const hasStructuralConflicts = conflictKeys.length > 0;
        // Log comprehensive debug info
        console.log('🔍 EXTRACTION DEBUG INFO:');
        console.log('📊 Stats:', { filesScanned, keysFound, addedKeys, removedKeys, languagesUpdated: languagesUpdated?.length });
        console.log('⚠️ ALL WARNINGS:', warnings);
        console.log('🚨 STRUCTURAL CONFLICTS:', conflictKeys);
        console.log('🆕 ADDED KEYS:', debug?.addedKeysByFile);
        console.log('🔧 Raw output (first 1000 chars):', result.results.output?.substring(0, 1000));
        // Determine variant and message based on issue type
        let variant: "default" | "destructive" = "default";
        let title = "String Extraction Complete";
        let description = `Found ${keysFound} strings in ${filesScanned} files. Added ${addedKeys || 0} new, removed ${removedKeys || 0} old. Updated ${languagesUpdated?.length || 0} languages.`;
        if (hasStructuralConflicts) {
          variant = "destructive";
          title = "🚨 Translation Structure Conflict";
          description = `DETECTED: Flat key conflicts with nested objects (${conflictKeys.length} conflicts). This causes ${addedKeys} keys to be detected repeatedly. Fix: Remove flat keys like "${conflictKeys[0]}" that conflict with nested objects.`;
        } else if (addedKeys > 50) {
          variant = "destructive";
          title = "⚠️ High Key Count Detected";
          description += ` Warning: ${addedKeys} new keys detected - this might indicate a configuration issue.`;
        }
        toast({
          title,
          description,
          variant
        });
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };
  const handleEditTranslation = async () => {
    if (!selectedTranslation) return;
    trackClick('translation_edit', { 
      translationId: selectedTranslation.id,
      languageCode: selectedTranslation.languageCode 
    });
    try {
      await updateTranslationMutation.mutateAsync({
        id: selectedTranslation.id,
        data: editForm
      });
      setEditDialogOpen(false);
      setSelectedTranslation(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };
  const handleFilterChange = (key: keyof TranslationFilters, value: string) => {
    trackSearch(`translation_filter_${key}`, value);
    updateFilter({ [key]: value });
  };
  // Get default language for fallback
  const defaultLanguage = Array.isArray(languages) ? languages.find(l => l.isDefault) : undefined;
    return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Translation Management</h1>
          <p className="text-muted-foreground">
            Manage translations across all languages and scopes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'overview' ? 'default' : 'outline'}
            onClick={() => {
              trackClick('view_change', { view: 'overview' });
              setView('overview');
            }}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => {
              trackClick('view_change', { view: 'list' });
              setView('list');
            }}
          >
            <Languages className="h-4 w-4 mr-2" />
            Translations
          </Button>
          <Button 
            variant={view === 'settings' ? 'default' : 'outline'}
            onClick={() => {
              trackClick('view_change', { view: 'settings' });
              setView('settings');
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Language Settings
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExtractStrings}
            disabled={extractStringsMutation.isPending}
          >
            {extractStringsMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {extractStringsMutation.isPending ? 'Extracting...' : 'Extract Strings'}
          </Button>
        </div>
      </div>
      {/* Loading State */}
      {(translationsLoading || languagesLoading || statisticsLoading) && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading translations data...
          </CardContent>
        </Card>
      )}
      {/* Error State */}
      {translationsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load translations: {translationsError.message}</span>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Overview Section - Simplified */}
      {view === 'overview' && !translationsLoading && !statisticsLoading && (
        <div className="space-y-6">
          {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Languages</span>
                </div>
                <div className="text-2xl font-bold">{statistics?.languages.length || 0}</div>
                <div className="text-sm text-muted-foreground">Supported</div>
                </CardContent>
              </Card>
              <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Total Keys</span>
                </div>
                <div className="text-2xl font-bold">{statistics?.totalKeys || 0}</div>
                <div className="text-sm text-muted-foreground">Translation keys</div>
                </CardContent>
              </Card>
              <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Entity Types</span>
                </div>
                <div className="text-2xl font-bold">{statistics?.entityTypes.length || 0}</div>
                <div className="text-sm text-muted-foreground">Different types</div>
                </CardContent>
              </Card>
              <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Avg Progress</span>
                </div>
                  <div className="text-2xl font-bold">
                  {statistics?.languages.length 
                    ? Math.round(statistics.languages.reduce((acc, lang) => acc + lang.completionPercentage, 0) / statistics.languages.length)
                    : 0}%
                  </div>
                <div className="text-sm text-muted-foreground">Completion rate</div>
                </CardContent>
              </Card>
            </div>
          {/* Language Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">All Languages</h2>
              <div className="flex items-center gap-2">
                <Select 
                  value={filter.scope} 
                  onValueChange={(value) => handleFilterChange('scope', value)}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filter by scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Scopes</SelectItem>
                    {getAllScopes().map(scope => (
                      <SelectItem key={scope.id} value={scope.id}>
                        <div className="flex items-center gap-2">
                          <span>{scope.icon}</span>
                          <span>{scope.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => handleOpenEditor()}>
                  <Globe className="h-4 w-4 mr-2" />
                  Open Translation Editor
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {statistics?.languages.map(language => (
                <LanguageCard
                  key={language.code}
                  language={language}
                  onOpenEditor={(languageCode) => handleOpenEditor(languageCode)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* List View Section - Enhanced with Language Comparison */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Language Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Comparison Controls - Fixed padding */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="sourceLanguage" className="text-sm font-medium">Source Language</Label>
                  <div className="flex items-center gap-3 px-4 py-3 border rounded-md bg-white shadow-sm h-[50px]">
                    <span className="text-lg">🇺🇸</span>
                    <div className="flex flex-col">
                      <span className="font-medium">English (US)</span>
                      <span className="text-sm text-muted-foreground">EN-US</span>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-auto">Source</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set in Language Settings
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ArrowRight className="h-5 w-5" />
                    <span className="text-sm font-medium">Compare to</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetLanguage" className="text-sm font-medium">Target Language</Label>
                  <div className="border rounded-md bg-white shadow-sm h-[50px] flex items-center">
                    <SearchableLanguageSelect
                      languages={languages.filter(lang => lang.code !== 'en-US')}
                      value={targetLanguage}
                      onValueChange={(value) => {
                        trackClick('target_language_change', { language: value });
                        setTargetLanguage(value);
                      }}
                      placeholder="Select target language..."
                      className="w-full border-none h-full bg-transparent"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose language to compare translations
                  </p>
                </div>
              </div>
              {/* Comparison Stats */}
              {comparisonData && !comparisonLoading && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{comparisonData.stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Keys</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{comparisonData.stats.both}</div>
                    <div className="text-sm text-muted-foreground">Both Languages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{comparisonData.stats.sourceOnly}</div>
                    <div className="text-sm text-muted-foreground">Source Only</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{comparisonData.stats.targetOnly}</div>
                    <div className="text-sm text-muted-foreground">Target Only</div>
                  </div>
                </div>
              )}
              {/* Filter Controls */}
              <div className="border rounded-lg p-6 space-y-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                {/* First Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="entityType" className="text-sm font-medium">Entity Type</Label>
                    <Select 
                      value={filter.entityType || '__all__'} 
                      onValueChange={(value) => handleFilterChange('entityType', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Types</SelectItem>
                        <SelectItem value="ui">UI Text</SelectItem>
                        <SelectItem value="field">Form Fields</SelectItem>
                        <SelectItem value="option">Option Values</SelectItem>
                        <SelectItem value="email_template">Email Templates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="needsReview" className="text-sm font-medium">Review Status</Label>
                    <Select 
                      value={filter.needsReview === null ? '__all__' : filter.needsReview?.toString() || '__all__'}
                      onValueChange={(value) => handleFilterChange('needsReview', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Statuses</SelectItem>
                        <SelectItem value="true">Needs Review</SelectItem>
                        <SelectItem value="false">Reviewed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Search Input */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search translations..."
                      value={filter.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedTranslations.length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={handleBulkMarkReviewed}
                      disabled={bulkMarkReviewedMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark {selectedTranslations.length} as Reviewed
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Enhanced Translations Table with Source/Target Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>
                Translations
                {comparisonData && (
                  <>
                    {' '}({comparisonData.comparisons.length})
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      Comparing {comparisonData.sourceLanguage} → {comparisonData.targetLanguage}
                    </span>
                  </>
                )}
                {!comparisonData && translations.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({translations.length} total)
                  </span>
                )}
              </CardTitle>
              {/* Debug Information */}
              {typeof window !== 'undefined' && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Comparison Loading: {comparisonLoading ? 'Yes' : 'No'}</div>
                  <div>Comparison Data: {comparisonData ? `${comparisonData.comparisons.length} items` : 'None'}</div>
                  <div>Regular Translations: {translations.length} items</div>
                  <div>Target Language: {targetLanguage}</div>
                  <div>Filter: {JSON.stringify(filter)}</div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* Loading State */}
              {(translationsLoading || comparisonLoading) && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading translations...</span>
                </div>
              )}
              {/* Error State */}
              {translationsError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load translations: {translationsError.message}
                  </AlertDescription>
                </Alert>
              )}
              {/* Empty State */}
              {!translationsLoading && !comparisonLoading && !translationsError && 
               ((comparisonData && comparisonData.comparisons.length === 0) || 
                (!comparisonData && translations.length === 0)) && (
                <div className="text-center py-12">
                  <Languages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No translations found</h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your filters or add some translations
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Loaded {comparisonData ? comparisonData.comparisons.length : translations.length} translations</div>
                  </div>
                </div>
              )}
              {/* Table with Data */}
              {!translationsLoading && !comparisonLoading && !translationsError && 
               ((comparisonData && comparisonData.comparisons.length > 0) || 
                (!comparisonData && translations.length > 0)) && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTranslations.length === (comparisonData ? comparisonData.comparisons.length : translations.length) 
                                    && (comparisonData ? comparisonData.comparisons.length : translations.length) > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              if (comparisonData) {
                                const ids = comparisonData.comparisons.flatMap(c => 
                                  [c.source?.id, c.target?.id].filter((id): id is string => Boolean(id))
                                );
                                setSelectedTranslations(ids);
                              } else {
                                setSelectedTranslations(translations.map(t => t.id));
                              }
                            } else {
                              setSelectedTranslations([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Key</TableHead>
                      {comparisonData ? (
                        <>
                          <TableHead>Source ({comparisonData.sourceLanguage})</TableHead>
                          <TableHead>Target ({comparisonData.targetLanguage})</TableHead>
                          <TableHead>Status</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Language</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Status</TableHead>
                        </>
                      )}
                      <TableHead className="w-16" title="Last Updated">
                        <Clock className="h-4 w-4" />
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData ? (
                      // Language comparison mode
                      comparisonData.comparisons.map((comparison, index) => (
                        <TableRow key={`${comparison.key}-${index}`}>
                          <TableCell>
                            <Checkbox
                              checked={[comparison.source?.id, comparison.target?.id]
                                .filter((id): id is string => Boolean(id))
                                .some(id => selectedTranslations.includes(id))}
                              onCheckedChange={(checked) => {
                                const ids = [comparison.source?.id, comparison.target?.id].filter((id): id is string => Boolean(id));
                                if (checked) {
                                  setSelectedTranslations([...selectedTranslations, ...ids]);
                                } else {
                                  setSelectedTranslations(selectedTranslations.filter((id: string) => !ids.includes(id)));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{comparison.entityType}</div>
                              <div className="text-sm text-muted-foreground">{comparison.entityId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const scope = getScopeForEntityType(comparison.entityType);
                              if (!scope) {
                                return <Badge variant="outline" className="text-xs">Unknown</Badge>;
                              }
                              return (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getScopeColorClasses(scope.color).badge}`}
                                >
                                  <span className="mr-1">{scope.icon}</span>
                                  {scope.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{comparison.key}</TableCell>
                          <TableCell className="max-w-xs">
                            {comparison.source ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <LanguageDisplay 
                                    languageCode={comparison.source?.languageCode || ''}
                                    languageName={languages.find(l => l.code === comparison.source?.languageCode)?.name}
                                    variant="minimal"
                                  />
                                </div>
                                <div className="truncate text-sm" title={comparison.source?.value}>
                                  {comparison.source?.value}
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-sm">Not translated</div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {comparison.target ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <LanguageDisplay 
                                    languageCode={comparison.target?.languageCode || ''}
                                    languageName={languages.find(l => l.code === comparison.target?.languageCode)?.name}
                                    variant="minimal"
                                  />
                                </div>
                                <div className="truncate text-sm" title={comparison.target?.value}>
                                  {comparison.target?.value}
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-sm">Not translated</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {comparison.source && comparison.target ? (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Both
                                </Badge>
                              ) : comparison.source ? (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  Source Only
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  Target Only
                                </Badge>
                              )}
                              {comparison.target?.needsReview && (
                                <Badge variant="destructive" className="text-xs">
                                  Needs Review
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {comparison.target?.updatedAt 
                                ? new Date(comparison.target.updatedAt).toLocaleDateString()
                                : comparison.source?.updatedAt 
                                  ? new Date(comparison.source.updatedAt).toLocaleDateString()
                                  : '-'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {comparison.target && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTranslation(comparison.target);
                                    setEditForm({
                                      value: comparison.target!.value,
                                      needsReview: comparison.target!.needsReview
                                    });
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      // Regular translation list mode
                      translations.map((translation) => (
                        <TableRow key={translation.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTranslations.includes(translation.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTranslations([...selectedTranslations, translation.id]);
                                } else {
                                  setSelectedTranslations(selectedTranslations.filter(id => id !== translation.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{translation.entityType}</div>
                              <div className="text-sm text-muted-foreground">{translation.entityId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const scope = getScopeForEntityType(translation.entityType);
                              if (!scope) {
                                return <Badge variant="outline" className="text-xs">Unknown</Badge>;
                              }
                              return (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getScopeColorClasses(scope.color).badge}`}
                                >
                                  <span className="mr-1">{scope.icon}</span>
                                  {scope.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{translation.key}</TableCell>
                          <TableCell>
                            <LanguageDisplay 
                              languageCode={translation.languageCode}
                              languageName={languages.find(l => l.code === translation.languageCode)?.name}
                              variant="minimal"
                            />
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={translation.value}>
                              {translation.value}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={translation.needsReview ? "destructive" : "secondary"} className="text-xs">
                                {translation.needsReview ? "Needs Review" : "Reviewed"}
                              </Badge>
                              {translation.isAutoTranslated && (
                                <Badge variant="outline" className="text-xs">
                                  Auto
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {new Date(translation.updatedAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTranslation(translation);
                                setEditForm({
                                  value: translation.value,
                                  needsReview: translation.needsReview
                                });
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {/* Language Settings View */}
      {view === 'settings' && (
        <LanguageSettingsTab />
      )}
      {/* Edit Translation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Translation</DialogTitle>
            <DialogDescription>
              Update the translation value and review status.
            </DialogDescription>
          </DialogHeader>
          {selectedTranslation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Entity</Label>
                  <div>{selectedTranslation.entityType}</div>
              </div>
              <div>
                  <Label className="font-medium">Language</Label>
                  <div className="flex items-center gap-2">
                    <LanguageDisplay 
                      languageCode={selectedTranslation.languageCode}
                      languageName={languages.find(l => l.code === selectedTranslation.languageCode)?.name}
                      variant="compact"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="font-medium">Key</Label>
                  <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {selectedTranslation.key}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Translation</Label>
                <Textarea
                  id="value"
                  value={editForm.value}
                  onChange={(e) => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsReview"
                  checked={editForm.needsReview}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, needsReview: !!checked }))}
                />
                <Label htmlFor="needsReview">Needs Review</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditTranslation} 
              disabled={updateTranslationMutation.isPending}
            >
              {updateTranslationMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 