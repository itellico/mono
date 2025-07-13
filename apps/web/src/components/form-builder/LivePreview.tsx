'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Upload, Star, Phone, Mail, User, MapPin, Globe, Clock, DollarSign, Hash, Lock, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface FormElement {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: any;
  style?: any;
  schemaField?: string;
  optionSetId?: number;
  properties?: any;
  children?: FormElement[];
}

interface LivePreviewProps {
  elements: FormElement[];
  deviceSize: 'desktop' | 'tablet' | 'mobile';
}

export const LivePreview: React.FC<LivePreviewProps> = ({ elements, deviceSize }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const updateFormData = (elementId: string, value: any) => {
    setFormData(prev => ({ ...prev, [elementId]: value }));
    // Clear error when user starts typing
    if (errors[elementId]) {
      setErrors(prev => ({ ...prev, [elementId]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    elements.forEach(element => {
      const value = formData[element.id];
      
      // Required field validation
      if (element.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        newErrors[element.id] = `${element.label} is required`;
      }
      
      // Email validation
      if (element.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[element.id] = 'Please enter a valid email address';
      }
      
      // Phone validation (basic)
      if (element.type === 'phone' && value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
        newErrors[element.id] = 'Please enter a valid phone number';
      }
      
      // URL validation
      if (element.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
        newErrors[element.id] = 'Please enter a valid URL';
      }
      
      // Number validation
      if (element.type === 'number' && value && isNaN(Number(value))) {
        newErrors[element.id] = 'Please enter a valid number';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setSubmitted(true);
      console.log('Form submitted:', formData);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({});
      }, 3000);
    }
  };

  const handleReset = () => {
    setFormData({});
    setErrors({});
    setSubmitted(false);
  };

  const renderFormElement = (element: FormElement) => {
    const value = formData[element.id] || '';
    const error = errors[element.id];
    const commonProps = {
      id: element.id,
      className: error ? 'border-red-500' : '',
    };

    const renderLabel = () => (
      <Label htmlFor={element.id} className="text-sm font-medium">
        {element.label}
        {element.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
    );

    const renderError = () => (
      error ? <p className="text-red-500 text-xs mt-1">{error}</p> : null
    );

    switch (element.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <Input
              {...commonProps}
              type={element.type}
              placeholder={element.placeholder}
              value={value}
              onChange={(e) => updateFormData(element.id, e.target.value)}
            />
            {renderError()}
          </div>
        );

      case 'phone':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...commonProps}
                type="tel"
                placeholder={element.placeholder || '+1 (555) 123-4567'}
                value={value}
                onChange={(e) => updateFormData(element.id, e.target.value)}
                className="pl-10"
              />
            </div>
            {renderError()}
          </div>
        );

      case 'password':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...commonProps}
                type={showPassword[element.id] ? 'text' : 'password'}
                placeholder={element.placeholder}
                value={value}
                onChange={(e) => updateFormData(element.id, e.target.value)}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, [element.id]: !prev[element.id] }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword[element.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {renderError()}
          </div>
        );

      case 'number':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...commonProps}
                type="number"
                placeholder={element.placeholder}
                value={value}
                onChange={(e) => updateFormData(element.id, e.target.value)}
                className="pl-10"
              />
            </div>
            {renderError()}
          </div>
        );

      case 'currency':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...commonProps}
                type="number"
                step="0.01"
                placeholder={element.placeholder || '0.00'}
                value={value}
                onChange={(e) => updateFormData(element.id, e.target.value)}
                className="pl-10"
              />
            </div>
            {renderError()}
          </div>
        );

      case 'textarea':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <Textarea
              {...commonProps}
              placeholder={element.placeholder}
              value={value}
              onChange={(e) => updateFormData(element.id, e.target.value)}
              rows={4}
            />
            {renderError()}
          </div>
        );

      case 'dropdown':
      case 'select':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <Select value={value} onValueChange={(val) => updateFormData(element.id, val)}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={element.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {element.options && element.options.length > 0 ? (
                  element.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="placeholder" disabled>
                    No options configured
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {renderError()}
          </div>
        );

      case 'checkbox':
        return (
          <div key={element.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={element.id}
                checked={value === true}
                onCheckedChange={(checked) => updateFormData(element.id, checked)}
              />
              <Label htmlFor={element.id} className="text-sm font-medium">
                {element.label}
                {element.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {renderError()}
          </div>
        );

      case 'radio':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <RadioGroup value={value} onValueChange={(val) => updateFormData(element.id, val)}>
              {element.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${element.id}-${option.value}`} />
                  <Label htmlFor={`${element.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {renderError()}
          </div>
        );

      case 'switch':
        return (
          <div key={element.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id={element.id}
                checked={value === true}
                onCheckedChange={(checked) => updateFormData(element.id, checked)}
              />
              <Label htmlFor={element.id} className="text-sm font-medium">
                {element.label}
                {element.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {renderError()}
          </div>
        );

      case 'slider':
      case 'range':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <div className="px-2">
              <Slider
                value={[value || element.properties?.defaultValue || 0]}
                onValueChange={(vals) => updateFormData(element.id, vals[0])}
                max={element.properties?.max || element.properties?.maxValue || 100}
                min={element.properties?.min || element.properties?.minValue || 0}
                step={element.properties?.step || 1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{element.properties?.min || element.properties?.minValue || 0}</span>
                <span className="font-medium">{value || element.properties?.defaultValue || 0}</span>
                <span>{element.properties?.max || element.properties?.maxValue || 100}</span>
              </div>
            </div>
            {renderError()}
          </div>
        );

      case 'date':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${error ? 'border-red-500' : ''} ${!value ? 'text-muted-foreground' : ''}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => updateFormData(element.id, date?.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {renderError()}
          </div>
        );

      case 'time':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...commonProps}
                type="time"
                value={value}
                onChange={(e) => updateFormData(element.id, e.target.value)}
                className="pl-10"
              />
            </div>
            {renderError()}
          </div>
        );

      case 'file':
      case 'image':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {element.type === 'image' ? 'PNG, JPG, GIF up to 10MB' : 'Any file up to 10MB'}
              </p>
              <Input
                type="file"
                className="hidden"
                accept={element.type === 'image' ? 'image/*' : '*/*'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  updateFormData(element.id, file?.name || '');
                }}
              />
            </div>
            {value && (
              <p className="text-sm text-green-600">Selected: {value}</p>
            )}
            {renderError()}
          </div>
        );

      case 'rating':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                    star <= (value || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                  onClick={() => updateFormData(element.id, star)}
                />
              ))}
              {value && <span className="ml-2 text-sm text-gray-600">({value}/5)</span>}
            </div>
            {renderError()}
          </div>
        );

      case 'divider':
        return <Separator key={element.id} className="my-6" />;

      case 'text_block':
      case 'heading':
        return (
          <div key={element.id} className="space-y-2">
            {element.type === 'heading' ? (
              <h3 className="text-lg font-semibold">{element.label}</h3>
            ) : (
              <p className="text-sm text-gray-600">{element.label}</p>
            )}
          </div>
        );

      case 'card':
        return (
          <Card key={element.id} className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{element.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {element.placeholder || 'Card content goes here'}
              </p>
            </CardContent>
          </Card>
        );

      case 'progress':
        return (
          <div key={element.id} className="space-y-2">
            {renderLabel()}
            <Progress value={value || 0} className="w-full" />
            <p className="text-xs text-gray-500 text-center">{value || 0}% complete</p>
          </div>
        );

      case 'badge':
        return (
          <div key={element.id} className="space-y-2">
            <Badge variant="secondary">{element.label}</Badge>
          </div>
        );

      case 'section':
        const columns = element.properties?.columns || 1;
        const children = element.children || [];
        
        return (
          <div key={element.id} className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            {element.label && (
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2">
                {element.label}
              </h3>
            )}
            
            {/* Column Layout */}
            {columns > 1 ? (
              <div className={`grid gap-4 ${
                columns === 2 ? 'grid-cols-2' : 
                columns === 3 ? 'grid-cols-3' : 
                'grid-cols-1'
              }`}>
                {Array.from({ length: columns }, (_, colIndex) => (
                  <div key={colIndex} className="space-y-4">
                    {children
                      .filter((child: FormElement, index: number) => index % columns === colIndex)
                      .map(renderFormElement)
                    }
                    {children.filter((child: FormElement, index: number) => index % columns === colIndex).length === 0 && (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded text-center text-gray-400 text-sm">
                        Column {colIndex + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {children.length > 0 ? (
                  children.map(renderFormElement)
                ) : (
                  <p className="text-sm text-gray-500 italic text-center p-4 border-2 border-dashed border-gray-300 rounded">
                    Drop form elements into this section
                  </p>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <Alert key={element.id}>
            <AlertDescription>
              Preview not available for element type: {element.type}
            </AlertDescription>
          </Alert>
        );
    }
  };

  if (submitted) {
    return (
      <div className="p-6">
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription className="text-green-800">
            Form submitted successfully! Thank you for your submission.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {elements.map(renderFormElement)}
        
        {elements.length > 0 && (
          <div className="flex space-x-4 pt-4 border-t">
            <Button type="submit" className="flex-1">
              Submit Form
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        )}
        
        {elements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Add form elements to see the preview</p>
          </div>
        )}
      </form>
    </div>
  );
};
