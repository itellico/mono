'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Globe, MapPin, Star } from 'lucide-react';
import { AVAILABLE_REGIONS, type RegionCode } from '@/lib/constants/regions';

interface RegionalMappingsEditorProps {
  value: Record<string, string>;
  onChange: (mappings: Record<string, string>) => void;
  canonicalRegion?: string;
  onCanonicalRegionChange?: (region: string) => void;
  disabled?: boolean;
  defaultValue?: string;
  onDefaultValueChange?: (value: string) => void;
}

export function RegionalMappingsEditor({
  value = {},
  onChange,
  canonicalRegion = 'GLOBAL',
  onCanonicalRegionChange,
  disabled = false,
  defaultValue = '',
  onDefaultValueChange
}: RegionalMappingsEditorProps) {
  const [newRegion, setNewRegion] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');

  const handleAddMapping = () => {
    if (newRegion && newValue && !value[newRegion]) {
      onChange({
        ...value,
        [newRegion]: newValue
      });
      setNewRegion('');
      setNewValue('');
    }
  };

  const handleRemoveMapping = (region: string) => {
    const newMappings = { ...value };
    delete newMappings[region];
    onChange(newMappings);
  };

  const handleUpdateMapping = (region: string, newValue: string) => {
    onChange({
      ...value,
      [region]: newValue
    });
  };

  const getRegionInfo = (regionCode: string) => {
    return AVAILABLE_REGIONS.find(r => r.code === regionCode) || {
      code: regionCode,
      name: regionCode,
      flag: '🌍'
    };
  };

  const availableRegions = AVAILABLE_REGIONS.filter(
    region => !value[region.code] || region.code === newRegion
  );

  return (
    <div className="space-y-6">
      {/* Platform Default Value */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Star className="h-4 w-4 fill-current" />
            Platform Default Value
          </CardTitle>
          <p className="text-sm text-blue-700">
            This is the primary value used across the platform. Regional mappings below will override this for specific regions.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="default-value" className="text-blue-900 font-medium">
                Default Value
              </Label>
              <Input
                id="default-value"
                value={defaultValue}
                onChange={(e) => onDefaultValueChange?.(e.target.value)}
                disabled={disabled}
                placeholder="Enter the platform default value"
                className="border-blue-200 focus:border-blue-400"
              />
              <p className="text-xs text-blue-600">
                This value will be used when no regional mapping is specified.
              </p>
            </div>

            {onCanonicalRegionChange && (
              <div className="space-y-2">
                <Label className="text-blue-900 font-medium">Default Region Context</Label>
                <Select
                  value={canonicalRegion}
                  onValueChange={onCanonicalRegionChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="border-blue-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_REGIONS.map(region => (
                      <SelectItem key={region.code} value={region.code}>
                        <span className="flex items-center gap-2">
                          <span>{region.flag}</span>
                          <span>{region.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600">
                  The regional context this default value represents (e.g., if default is &quot;8&quot;, is that US size 8 or EU size 8?).
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Regional Mappings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Regional Mappings
            <Badge variant="secondary" className="ml-auto">Optional</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Override the default value for specific regions. For example, if default is US size &quot;8&quot;, add EU mapping &quot;38&quot; and UK mapping &quot;6&quot;.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Mappings */}
          <div className="space-y-3">
            {Object.entries(value).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No regional overrides defined</p>
                <p className="text-xs">The platform default value will be used for all regions</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Regional Overrides</Label>
                <div className="space-y-2">
                  {Object.entries(value).map(([region, regionValue]) => {
                    const regionInfo = getRegionInfo(region);

                    return (
                      <div key={region} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                        <Badge variant="outline" className="shrink-0">
                          <span className="mr-1">{regionInfo.flag}</span>
                          {regionInfo.name}
                        </Badge>

                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-muted-foreground">shows as:</span>
                          <Input
                            value={regionValue}
                            onChange={(e) => handleUpdateMapping(region, e.target.value)}
                            disabled={disabled}
                            placeholder={`Value for ${regionInfo.name}`}
                            className="flex-1"
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMapping(region)}
                          disabled={disabled}
                          className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Add New Mapping */}
          {availableRegions.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium">Add Regional Override</Label>
              <div className="flex gap-2">
                <Select
                  value={newRegion}
                  onValueChange={setNewRegion}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRegions.map(region => (
                      <SelectItem key={region.code} value={region.code}>
                        <span className="flex items-center gap-2">
                          <span>{region.flag}</span>
                          <span>{region.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">shows as:</span>
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Regional value"
                    disabled={disabled}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMapping();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={handleAddMapping}
                  disabled={disabled || !newRegion || !newValue}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Example:</strong> If your default value is US shoe size &quot;8&quot;, you might add:
                  <br />• Europe → &quot;38&quot; (EU size equivalent)
                  <br />• United Kingdom → &quot;6&quot; (UK size equivalent)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 