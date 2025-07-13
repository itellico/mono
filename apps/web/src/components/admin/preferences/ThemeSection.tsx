'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUserPreferences } from '@/hooks/useUserProfile';
import { useComponentLogger } from '@/lib/platform/logging';
import { useDebounce } from '@/hooks/useDebounce';
import { Save, Check, AlertCircle, Palette, Sun, Moon, Monitor, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

// Theme options
const THEME_OPTIONS = [
  { 
    value: 'light', 
    label: 'Light', 
    description: 'Clean light interface',
    icon: Sun,
    preview: 'bg-white border border-gray-200'
  },
  { 
    value: 'dark', 
    label: 'Dark', 
    description: 'Easy on the eyes',
    icon: Moon,
    preview: 'bg-gray-900 border border-gray-700'
  },
  { 
    value: 'system', 
    label: 'System', 
    description: 'Match your device settings',
    icon: Monitor,
    preview: 'bg-gradient-to-br from-white to-gray-900 border border-gray-400'
  },
];

// Color scheme options
const COLOR_SCHEME_OPTIONS = [
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
  { value: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
  { value: 'teal', label: 'Teal', color: 'bg-teal-500' },
];

// Font size options
const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small', description: '14px base font size' },
  { value: 'medium', label: 'Medium', description: '16px base font size' },
  { value: 'large', label: 'Large', description: '18px base font size' },
];

// Density options
const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compact', description: 'More content, less spacing' },
  { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
  { value: 'spacious', label: 'Spacious', description: 'Extra spacing for accessibility' },
];

interface ThemePreferences {
  theme: string;
  colorScheme: string;
  fontSize: string;
  density: string;
  reducedMotion: boolean;
  highContrast: boolean;
}

export function ThemeSection() {
  const log = useComponentLogger('ThemeSection');
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState<ThemePreferences>({
    theme: 'system',
    colorScheme: 'blue',
    fontSize: 'medium',
    density: 'comfortable',
    reducedMotion: false,
    highContrast: false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save debounced changes
  const debouncedFormData = useDebounce(formData, 2000);

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences?.theme) {
      const themePrefs = preferences.theme;
      setFormData({
        theme: themePrefs.theme || 'system',
        colorScheme: themePrefs.colorScheme || 'blue',
        fontSize: themePrefs.fontSize || 'medium',
        density: themePrefs.density || 'comfortable',
        reducedMotion: themePrefs.reducedMotion || false,
        highContrast: themePrefs.highContrast || false,
      });
      setHasChanges(false);
      log.debug('Theme preferences loaded', { preferences: themePrefs });
    }
  }, [preferences, log]);

  // Auto-save when debounced data changes
  useEffect(() => {
    if (hasChanges && !isLoading) {
      const saveChanges = async () => {
        try {
          await updatePreferences({
            theme: debouncedFormData,
          });
          setHasChanges(false);
          setLastSaved(new Date());
          log.debug('Theme preferences auto-saved successfully');
          
          // Apply theme changes immediately
          setTheme(debouncedFormData.theme);
          
          // Dispatch custom event for other components to react to theme changes
          window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: debouncedFormData }
          }));
        } catch (error) {
          log.error('Theme preferences auto-save failed', { error });
        }
      };

      saveChanges();
    }
  }, [debouncedFormData, hasChanges, isLoading, updatePreferences, setTheme, log]);

  const handleThemeChange = useCallback((field: keyof ThemePreferences, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    log.debug('Theme preference changed', { field, value });

    // Apply theme immediately for better UX
    if (field === 'theme' && typeof value === 'string') {
      setTheme(value);
    }
  }, [setTheme, log]);

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

  const resetToDefaults = useCallback(() => {
    const defaults: ThemePreferences = {
      theme: 'system',
      colorScheme: 'blue',
      fontSize: 'medium',
      density: 'comfortable',
      reducedMotion: false,
      highContrast: false,
    };
    setFormData(defaults);
    setHasChanges(true);
    log.debug('Theme preferences reset to defaults');
  }, [log]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme & Appearance
          </CardTitle>
          <Badge className={cn('text-white', status.color)}>
            <status.icon className="h-3 w-3 mr-1" />
            {status.text}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of your interface. Changes are automatically saved.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Theme</Label>
          <RadioGroup
            value={formData.theme}
            onValueChange={(value) => handleThemeChange('theme', value)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {THEME_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              return (
                <div key={option.value} className="relative">
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      'flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors',
                      'hover:border-primary/50',
                      formData.theme === option.value ? 'border-primary' : 'border-border'
                    )}
                  >
                    <div className={cn('w-16 h-12 rounded-md mb-3', option.preview)} />
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-center">
                      {option.description}
                    </span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Color Scheme */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Accent Color</Label>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {COLOR_SCHEME_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => handleThemeChange('colorScheme', option.value)}
                className={cn(
                  'h-12 w-full flex flex-col items-center gap-1 p-2',
                  formData.colorScheme === option.value && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                <div className={cn('w-6 h-6 rounded-full', option.color)} />
                <span className="text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Font Size</Label>
          <RadioGroup
            value={formData.fontSize}
            onValueChange={(value) => handleThemeChange('fontSize', value)}
            className="space-y-2"
          >
            {FONT_SIZE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`font-${option.value}`} />
                <Label htmlFor={`font-${option.value}`} className="flex-1">
                  <div className="flex justify-between items-center">
                    <span>{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Layout Density */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Layout Density</Label>
          <RadioGroup
            value={formData.density}
            onValueChange={(value) => handleThemeChange('density', value)}
            className="space-y-2"
          >
            {DENSITY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`density-${option.value}`} />
                <Label htmlFor={`density-${option.value}`} className="flex-1">
                  <div className="flex justify-between items-center">
                    <span>{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Accessibility Options */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Accessibility</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reducedMotion">Reduced Motion</Label>
                <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
              </div>
              <Button
                variant={formData.reducedMotion ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange('reducedMotion', !formData.reducedMotion)}
              >
                {formData.reducedMotion ? 'On' : 'Off'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="highContrast">High Contrast</Label>
                <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
              </div>
              <Button
                variant={formData.highContrast ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange('highContrast', !formData.highContrast)}
              >
                {formData.highContrast ? 'On' : 'Off'}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </h4>
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <p><strong>Theme:</strong> {THEME_OPTIONS.find(t => t.value === formData.theme)?.label}</p>
            <p><strong>Accent:</strong> {COLOR_SCHEME_OPTIONS.find(c => c.value === formData.colorScheme)?.label}</p>
            <p><strong>Font Size:</strong> {FONT_SIZE_OPTIONS.find(f => f.value === formData.fontSize)?.label}</p>
            <p><strong>Density:</strong> {DENSITY_OPTIONS.find(d => d.value === formData.density)?.label}</p>
            <div className="flex gap-4 text-xs">
              <span className={formData.reducedMotion ? 'text-green-600' : 'text-muted-foreground'}>
                Reduced Motion: {formData.reducedMotion ? 'On' : 'Off'}
              </span>
              <span className={formData.highContrast ? 'text-green-600' : 'text-muted-foreground'}>
                High Contrast: {formData.highContrast ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 