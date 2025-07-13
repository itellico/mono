'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { useUserPreferences } from '@/hooks/useUserProfile';
import { useComponentLogger } from '@/lib/platform/logging';
import { useDebounce } from '@/hooks/useDebounce';
import { Save, Check, AlertCircle, Globe, Clock, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import TimezoneSelect, { allTimezones } from 'react-timezone-select';

// Language options
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'pt', label: 'Português', flag: '🇵🇹' },
  { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
];


// Date format options
const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)', example: '12/31/2024' },
  { value: 'MM.DD.YYYY', label: 'MM.DD.YYYY', example: '12.31.2024' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)', example: '31/12/2024' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY', example: '31.12.2024' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)', example: '2024-12-31' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY', example: '31 Dec 2024' },
  { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY', example: 'December 31, 2024' },
];

// Time format options
const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12-hour (AM/PM)', example: '2:30 PM' },
  { value: '24h', label: '24-hour', example: '14:30' },
];

// Number format options
const NUMBER_FORMAT_OPTIONS = [
  { value: 'en-US', label: 'US (1,234.56)', example: '1,234.56' },
  { value: 'en-GB', label: 'UK (1,234.56)', example: '1,234.56' },
  { value: 'de-DE', label: 'German (1.234,56)', example: '1.234,56' },
  { value: 'fr-FR', label: 'French (1 234,56)', example: '1 234,56' },
  { value: 'es-ES', label: 'Spanish (1.234,56)', example: '1.234,56' },
];

interface LocalizationPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
}

export function LocalizationSection() {
  const log = useComponentLogger('LocalizationSection');
  const { preferences, updatePreferences, isLoading } = useUserPreferences();

  const [formData, setFormData] = useState<LocalizationPreferences>({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: 'en-US',
    currency: 'USD',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save debounced changes
  const debouncedFormData = useDebounce(formData, 2000);

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences?.localization) {
      const localization = preferences.localization;
      setFormData({
        language: localization.language || 'en',
        timezone: localization.timezone || 'UTC',
        dateFormat: localization.dateFormat || 'MM/DD/YYYY',
        timeFormat: localization.timeFormat || '12h',
        numberFormat: localization.numberFormat || 'en-US',
        currency: localization.currency || 'USD',
      });
      setHasChanges(false);
      log.debug('Localization preferences loaded', { preferences: localization });
    }
  }, [preferences, log]);

  // Auto-save when debounced data changes
  useEffect(() => {
    if (hasChanges && !isLoading) {
      const saveChanges = async () => {
        try {
          await updatePreferences({
            localization: debouncedFormData,
          });
          setHasChanges(false);
          setLastSaved(new Date());
          log.debug('Localization preferences auto-saved successfully');
          
          // Dispatch custom event for other components to react to locale changes
          window.dispatchEvent(new CustomEvent('localizationChanged', {
            detail: { localization: debouncedFormData }
          }));
        } catch (error) {
          console.error('Save failed:', error);
          log.error('Localization preferences auto-save failed', { error });
        }
      };

      saveChanges();
    }
  }, [debouncedFormData, hasChanges, isLoading, updatePreferences, log]);

  const handleSelectChange = useCallback((field: keyof LocalizationPreferences, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    log.debug('Localization preference changed', { field, value });
  }, [log]);

  const getSaveStatus = () => {
    if (isLoading) {
      return { icon: Save, text: 'Saving...', color: 'bg-blue-500' };
    }
    if (hasChanges) {
      return { icon: AlertCircle, text: 'Unsaved changes', color: 'bg-orange-500' };
    }
    if (lastSaved) {
      return { icon: Check, text: `Saved ${lastSaved.toLocaleTimeString()}`, color: 'bg-green-500' };
    }
    return { icon: Check, text: 'All saved', color: 'bg-green-500' };
  };

  const status = getSaveStatus();

  // Get current time in selected timezone for preview
  const getCurrentTimePreview = () => {
    try {
      const now = new Date();
      const timeOptions: Intl.DateTimeFormatOptions = {
        timeZone: formData.timezone,
        hour: formData.timeFormat === '12h' ? 'numeric' : '2-digit',
        minute: '2-digit',
        hour12: formData.timeFormat === '12h',
      };
      return now.toLocaleTimeString(formData.language, timeOptions);
    } catch {
      return 'Invalid timezone';
    }
  };

  // Get current date in selected format for preview
  const getCurrentDatePreview = () => {
    try {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: formData.timezone,
        year: 'numeric',
        month: formData.dateFormat.includes('MMM') ? 'short' : '2-digit',
        day: '2-digit',
      };
      
      if (formData.dateFormat === 'MMMM DD, YYYY') {
        return now.toLocaleDateString(formData.language, {
          timeZone: formData.timezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      
      return now.toLocaleDateString(formData.language, dateOptions);
    } catch {
      return 'Invalid date format';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localization Settings
          </CardTitle>
          <Badge className={cn('text-white', status.color)}>
            <status.icon className="h-3 w-3 mr-1" />
            {status.text}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure your language, timezone, and regional display preferences. Changes are automatically saved.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Language
          </Label>
          <SearchableSelect
            value={formData.language}
            onValueChange={(value) => handleSelectChange('language', value)}
            options={LANGUAGE_OPTIONS.map(option => ({
              value: option.value,
              label: `${option.flag} ${option.label}`,
            }))}
            placeholder="Select language"
            searchPlaceholder="Search languages..."
          />
        </div>

        {/* Timezone Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timezone
          </Label>
          <TimezoneSelect
            value={formData.timezone}
            onChange={(selectedTimezone: any) => {
              const timezoneValue = typeof selectedTimezone === 'string' ? selectedTimezone : selectedTimezone.value;
              handleSelectChange('timezone', timezoneValue);
            }}
            timezones={allTimezones}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Current time: {getCurrentTimePreview()}
          </p>
        </div>

        {/* Date Format */}
        <div className="space-y-2">
          <Label>Date Format</Label>
          <SearchableSelect
            value={formData.dateFormat}
            onValueChange={(value) => handleSelectChange('dateFormat', value)}
            options={DATE_FORMAT_OPTIONS.map(option => ({
              value: option.value,
              label: option.label,
              description: option.example,
            }))}
            placeholder="Select date format"
            searchPlaceholder="Search date formats..."
          />
          <p className="text-xs text-muted-foreground">
            Current date: {getCurrentDatePreview()}
          </p>
        </div>

        {/* Time Format */}
        <div className="space-y-2">
          <Label>Time Format</Label>
          <SearchableSelect
            value={formData.timeFormat}
            onValueChange={(value) => handleSelectChange('timeFormat', value)}
            options={TIME_FORMAT_OPTIONS.map(option => ({
              value: option.value,
              label: option.label,
              description: option.example,
            }))}
            placeholder="Select time format"
            searchPlaceholder="Search time formats..."
          />
        </div>

        {/* Number Format */}
        <div className="space-y-2">
          <Label>Number Format</Label>
          <SearchableSelect
            value={formData.numberFormat}
            onValueChange={(value) => handleSelectChange('numberFormat', value)}
            options={NUMBER_FORMAT_OPTIONS.map(option => ({
              value: option.value,
              label: option.label,
              description: option.example,
            }))}
            placeholder="Select number format"
            searchPlaceholder="Search number formats..."
          />
        </div>

        {/* Preview Section */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Language:</strong> {LANGUAGE_OPTIONS.find(l => l.value === formData.language)?.label}</p>
            <p><strong>Timezone:</strong> {formData.timezone}</p>
            <p><strong>Current Date/Time:</strong> {getCurrentDatePreview()} at {getCurrentTimePreview()}</p>
            <p><strong>Number Example:</strong> {(1234.56).toLocaleString(formData.numberFormat)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 