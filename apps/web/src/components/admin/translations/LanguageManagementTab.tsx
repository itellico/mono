'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Settings, 
  Globe, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { useLanguageManagement, useAddSupportedLanguage, useUpdateSupportedLanguage } from '@/hooks/useLanguageManagement';
import { 
  LanguageManagementListItem, 
  Language,
  getStatusColor, 
  getPriorityLabel, 
  getPriorityColor,
  LanguageStatus 
} from '@/types/language-management';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { useToast } from '@/hooks/use-toast';
interface LanguageManagementTabProps {
  tenantId?: string | null;
}
export function LanguageManagementTab({ tenantId }: LanguageManagementTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  // Audit tracking and toast
  const { trackClick, trackFormSubmission } = useAuditTracking();
  const { toast } = useToast();
  // Hooks
  const { data, isLoading, error } = useLanguageManagement(tenantId);
  const addLanguageMutation = useAddSupportedLanguage();
  const updateLanguageMutation = useUpdateSupportedLanguage();
  // Filter languages
  const filteredLanguages = data?.data.supportedLanguages.filter(lang => {
    const matchesSearch = lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lang.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lang.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];
  // Handle adding new language
  const handleAddLanguage = async () => {
    if (!selectedLanguage) return;
    try {
      trackFormSubmission('add_supported_language', true, { 
        languageCode: selectedLanguage, 
        tenantId: tenantId || 'global' 
      });
      await addLanguageMutation.mutateAsync({
        code: selectedLanguage,
        tenantId,
        isActive: true,
        translationPriority: 10,
        autoTranslateEnabled: true,
        qualityThreshold: 0.80 });
      setAddDialogOpen(false);
      setSelectedLanguage('');
      toast({
        title: 'Success',
        description: 'Language added successfully'
      });
      browserLogger.info('Language added successfully', { code: selectedLanguage, tenantId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Handle specific known errors with better messaging
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('already supported')) {
        userFriendlyMessage = `${selectedLanguage} is already supported. You can only add languages that haven't been added yet.`;
      } else if (errorMessage.includes('not found in global languages')) {
        userFriendlyMessage = `${selectedLanguage} is not available in the global languages database.`;
      } else if (errorMessage.includes('currently only be supported once globally')) {
        userFriendlyMessage = `${selectedLanguage} is already supported globally. The current system allows each language to be supported only once.`;
      }
      toast({
        title: 'Add Language Failed',
        description: userFriendlyMessage,
        variant: 'destructive'
      });
      browserLogger.error('Failed to add language', { error: errorMessage, code: selectedLanguage });
    }
  };
  // Handle status toggle with optimistic updates
  const handleStatusToggle = async (code: string, field: 'isLive' | 'isActive' | 'autoTranslateEnabled', value: boolean) => {
    // Prevent deactivating the base language's Live status
    if (data?.data.supportedLanguages) {
      const language = data.data.supportedLanguages.find(lang => lang.code === code);
      if (field === 'isLive' && !value && language?.isDefault) {
        toast({
          title: 'Error',
          description: 'Cannot deactivate Live status for base language',
          variant: 'destructive'
        });
        browserLogger.warn('Cannot deactivate Live status for base language', { code });
        return;
      }
    }
    try {
      trackClick(`toggle_${field}`, { 
        languageCode: code, 
        newValue: value,
        tenantId: tenantId || 'global'
      });
      await updateLanguageMutation.mutateAsync({
        code,
        data: { [field]: value, tenantId }
      });
      toast({
        title: 'Success',
        description: `Language ${field} updated successfully`
      });
      browserLogger.info('Language status updated', { code, field, value });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: `Failed to update language ${field}: ${errorMessage}`,
        variant: 'destructive'
      });
      browserLogger.error('Failed to update language status', { error: errorMessage, code, field });
    }
  };
  // Get available languages for adding (not already supported)
  const availableLanguages = (() => {
    if (!data?.data) return [];
    const supportedCodes = data.data.supportedLanguages;
    return data.data.availableLanguages.filter(lang => !supportedCodes.includes(lang.code));
  })();
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Language Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-gray-500">Loading language management...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Language Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load language management data. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  const { supportedLanguages, statistics } = data?.data || { supportedLanguages: [], statistics: { totalSupported: 0, liveLanguages: 0, averageCompletion: 0, autoTranslateEnabled: 0 } };
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Languages</p>
                <p className="text-2xl font-bold">{statistics.totalSupported}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Live Languages</p>
                <p className="text-2xl font-bold">{statistics.liveLanguages}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                <p className="text-2xl font-bold">{Math.round(statistics.averageCompletion)}%</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auto-Translate</p>
                <p className="text-2xl font-bold">{statistics.autoTranslateEnabled}</p>
              </div>
              <MoreHorizontal className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Language Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Supported Languages
              </CardTitle>
              <CardDescription>
                Manage supported languages, activation status, and translation settings
                {tenantId && ` for tenant ${tenantId}`}
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={availableLanguages.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  {availableLanguages.length === 0 ? 'All Languages Added' : 'Add Language'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Supported Language</DialogTitle>
                  <DialogDescription>
                    Choose a language to add to your supported languages list.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Select Language</Label>
                    {availableLanguages.length > 0 ? (
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a language..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name} ({lang.code}) - {lang.nativeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-center py-4 px-3 bg-gray-50 rounded-md border">
                        <p className="text-sm text-gray-600">
                          No languages available to add.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          All available languages are already supported.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddLanguage}
                    disabled={!selectedLanguage || addLanguageMutation.isPending || availableLanguages.length === 0}
                  >
                    {addLanguageMutation.isPending ? 'Adding...' : 'Add Language'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search languages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="translating">Translating</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Languages List */}
          <div className="space-y-4">
            {filteredLanguages.map((language) => {
              const isUpdating = updateLanguageMutation.isPending;
              const canToggleLive = language.isActive; // Live can be toggled if language is active
              const isBaseLanguage = language.isDefault;
              return (
                <Card key={language.code} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold">{language.name}</h3>
                        <p className="text-sm text-gray-600">
                          {language.code} • {language.nativeName}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(language.status)}>
                          {language.status.charAt(0).toUpperCase() + language.status.slice(1)}
                        </Badge>
                        {language.isDefault && (
                          <Badge variant="outline" className="text-blue-600">
                            Base
                          </Badge>
                        )}
                        <Badge className={getPriorityColor(language.translationPriority)}>
                          {getPriorityLabel(language.translationPriority)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Completion Progress */}
                      <div className="flex items-center space-x-2">
                        <div className="w-24">
                          <Progress value={language.completionPercentage} />
                        </div>
                        <span className="text-sm font-medium w-12">
                          {Math.round(language.completionPercentage)}%
                        </span>
                        <span className="text-xs text-muted-foreground">Complete</span>
                      </div>
                      {/* Toggle Controls */}
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`active-${language.code}`} className="text-sm font-medium">
                            Active
                          </Label>
                          <Switch
                            id={`active-${language.code}`}
                            checked={!!language.isActive}
                            onCheckedChange={(checked) => 
                              handleStatusToggle(language.code, 'isActive', checked)
                            }
                            disabled={isUpdating || isBaseLanguage}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`live-${language.code}`} className="text-sm font-medium">
                            Live
                          </Label>
                          <Switch
                            id={`live-${language.code}`}
                            checked={isBaseLanguage ? true : !!language.isLive}
                            onCheckedChange={(checked) => {
                                // Base language must always be live
                                if (!checked && isBaseLanguage) {
                                  toast({
                                    title: 'Error',
                                    description: 'Cannot disable Live status for base language',
                                    variant: 'destructive'
                                  });
                                  browserLogger.warn('Cannot disable Live status for base language', { code: language.code });
                                  return;
                                }
                                handleStatusToggle(language.code, 'isLive', checked);
                              }}
                            disabled={
                              isUpdating || 
                              !canToggleLive ||
                              (isBaseLanguage && language.isLive) // Base can't be turned off when live
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`auto-${language.code}`} className="text-sm font-medium">
                            Auto-Translate
                          </Label>
                          <Switch
                            id={`auto-${language.code}`}
                            checked={!!language.autoTranslateEnabled}
                            onCheckedChange={(checked) => 
                              handleStatusToggle(language.code, 'autoTranslateEnabled', checked)
                            }
                            disabled={isUpdating}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {filteredLanguages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No languages found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 