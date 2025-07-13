'use client';
import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HardDriveIcon, 
  ImageIcon, 
  VideoIcon, 
  FileIcon, 
  InfoIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SparklesIcon
} from 'lucide-react';
interface FileSizePreset {
  label: string;
  value: number;
  description: string;
  icon: any;
  color: string;
  useCase: string;
}
const FILE_SIZE_PRESETS: FileSizePreset[] = [
  {
    label: '5MB',
    value: 5,
    description: 'Small images only',
    icon: ImageIcon,
    color: 'bg-green-100 text-green-800 border-green-200',
    useCase: 'Profile pictures, thumbnails'
  },
  {
    label: '10MB',
    value: 10,
    description: 'Standard images',
    icon: ImageIcon,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    useCase: 'High-quality photos, documents'
  },
  {
    label: '25MB',
    value: 25,
    description: 'Large files',
    icon: FileIcon,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    useCase: 'PDFs, presentations, large images'
  },
  {
    label: '50MB',
    value: 50,
    description: 'Video files',
    icon: VideoIcon,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    useCase: 'Short videos, large documents'
  },
  {
    label: '100MB',
    value: 100,
    description: 'Large media',
    icon: VideoIcon,
    color: 'bg-red-100 text-red-800 border-red-200',
    useCase: 'Professional videos, archives'
  },
  {
    label: '250MB',
    value: 250,
    description: 'Enterprise files',
    icon: HardDriveIcon,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    useCase: 'Large datasets, enterprise content'
  }
];
interface FileSizePresetSelectorProps {
  currentValue: number;
  maxValue?: number;
  minValue?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}
export const FileSizePresetSelector = function FileSizePresetSelector({
  currentValue,
  maxValue = 500,
  minValue = 1,
  onValueChange,
  disabled = false,
  className = ''
}) {
  const [customMode, setCustomMode] = useState(false);
  const [sliderValue, setSliderValue] = useState([currentValue]);
  // Filter presets based on max value
  const availablePresets = FILE_SIZE_PRESETS.filter(
    (preset) => preset.value >= minValue && preset.value <= maxValue
  );
  const handlePresetClick = (value: number) => {
    onValueChange(value);
    setSliderValue([value]);
    setCustomMode(false);
  };
  const handleSliderChange = (values: number[]) => {
    setSliderValue(values);
    onValueChange(values[0]);
  };
  const handleCustomInput = (value: string) => {
    const numValue = parseInt(value);
    if (numValue >= minValue && numValue <= maxValue) {
      onValueChange(numValue);
      setSliderValue([numValue]);
    }
  };
  const getCurrentPreset = () => {
    return availablePresets.find(preset => preset.value === currentValue);
  };
  const currentPreset = getCurrentPreset();
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Selection Display */}
      <Card className={currentPreset ? currentPreset.color : 'bg-gray-50 border-gray-200'}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {currentPreset ? (
              <currentPreset.icon className="h-5 w-5" />
            ) : (
              <FileIcon className="h-5 w-5" />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">
                Current Limit: {currentValue}MB
              </div>
              <div className="text-xs opacity-75">
                {currentPreset?.useCase || 'Custom configuration'}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentPreset ? 'Preset' : 'Custom'}
            </Badge>
          </div>
        </CardContent>
      </Card>
      {/* Preset Buttons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Custom Mode</Label>
            <Switch
              checked={customMode}
              onCheckedChange={setCustomMode}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availablePresets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = currentValue === preset.value && !customMode;
            return (
              <Button
                key={preset.value}
                variant={isSelected ? 'default' : 'outline'}
                size="lg"
                className="h-auto flex flex-col gap-2 p-4"
                onClick={() => handlePresetClick(preset.value)}
                disabled={disabled}
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs opacity-75">{preset.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
      {/* Custom Controls */}
      {customMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              Custom File Size
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>File Size (MB)</Label>
                <span className="font-medium">{sliderValue[0]}MB</span>
              </div>
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={maxValue}
                min={minValue}
                step={1}
                className="w-full"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{minValue}MB</span>
                <span>{maxValue}MB</span>
              </div>
            </div>
            {/* Direct Input */}
            <div className="flex items-center gap-2">
              <Label className="text-sm w-20">Exact value:</Label>
              <Input
                type="number"
                value={currentValue}
                onChange={(e) => handleCustomInput(e.target.value)}
                className="w-24"
                min={minValue}
                max={maxValue}
                disabled={disabled}
              />
              <span className="text-sm text-muted-foreground">MB</span>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Constraints Info */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>File Size Constraints:</strong> This setting controls the maximum size for uploaded files. 
          Consider your storage capacity and user experience when setting limits.
          <div className="mt-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Minimum allowed:</span>
              <span className="font-medium">{minValue}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum allowed:</span>
              <span className="font-medium">{maxValue}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Current setting:</span>
              <span className="font-medium text-blue-600">{currentValue}MB</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
      {/* Usage Recommendations */}
      {currentPreset && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm text-green-900">
                  Recommended for: {currentPreset.useCase}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  This preset is optimized for {currentPreset.description.toLowerCase()} and provides 
                  a good balance between functionality and performance.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Warning for very large sizes */}
      {currentValue > 100 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Large File Warning:</strong> Files over 100MB may impact server performance 
            and user upload experience. Consider implementing chunked uploads for better reliability.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 