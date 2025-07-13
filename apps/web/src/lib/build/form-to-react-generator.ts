/**
 * 🔗 Form-to-React Component Generator
 * 
 * Converts form JSON definitions into:
 * 1. TypeScript interfaces/models
 * 2. Zod validation schemas
 * 3. React Hook Form components
 * 4. Usable React components for pages
 */

import { z } from 'zod';

// ============================
// 📋 FORM STRUCTURE TYPES
// ============================

export interface FormElement {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  description?: string;
  grid?: {
    col?: number;
    row?: number;
  };
}

export interface FormStructure {
  elements: FormElement[];
  layout?: 'single' | 'multi-column' | 'wizard';
  theme?: {
    primaryColor?: string;
    spacing?: 'compact' | 'normal' | 'spacious';
  };
}

// ============================
// 🏗️ TYPESCRIPT MODEL GENERATOR  
// ============================

export class TypeScriptModelGenerator {
  /**
   * Generate TypeScript interface from form structure
   */
  static generateInterface(formName: string, elements: FormElement[]): string {
    const interfaceName = this.toPascalCase(formName);
    
    const properties = elements.map(element => {
      const propName = this.toCamelCase(element.id);
      const propType = this.getTypeScriptType(element);
      const optional = element.required ? '' : '?';
      const comment = element.description ? `  /** ${element.description} */\n` : '';
      
      return `${comment}  ${propName}${optional}: ${propType};`;
    }).join('\n');

    return `/**
 * 🏷️ ${interfaceName} - Generated from form definition
 * Form: ${formName}
 * Generated: ${new Date().toISOString()}
 */
export interface ${interfaceName} {
${properties}
}

export interface ${interfaceName}Input extends Partial<${interfaceName}> {}

export interface ${interfaceName}Output extends Required<${interfaceName}> {}`;
  }

  /**
   * Generate Zod validation schema
   */
  static generateZodSchema(formName: string, elements: FormElement[]): string {
    const schemaName = `${this.toCamelCase(formName)}Schema`;
    
    const validations = elements.map(element => {
      const propName = this.toCamelCase(element.id);
      const zodType = this.getZodType(element);
      
      return `  ${propName}: ${zodType},`;
    }).join('\n');

    return `/**
 * 🛡️ ${schemaName} - Zod validation schema
 * Form: ${formName}
 * Generated: ${new Date().toISOString()}
 */
export const ${schemaName} = z.object({
${validations}
});

export type ${this.toPascalCase(formName)}Schema = z.infer<typeof ${schemaName}>;`;
  }

  private static getTypeScriptType(element: FormElement): string {
    switch (element.type) {
      case 'text':
      case 'email':
      case 'textarea':
        return 'string';
      case 'number':
        return 'number';
      case 'checkbox':
        return 'boolean';
      case 'select':
      case 'radio':
        if (element.options) {
          const values = element.options.map(opt => `'${opt.value}'`).join(' | ');
          return values;
        }
        return 'string';
      case 'file':
        return 'File | null';
      case 'date':
        return 'Date | string';
      default:
        return 'string';
    }
  }

  private static getZodType(element: FormElement): string {
    let zodType = '';
    
    switch (element.type) {
      case 'text':
      case 'textarea':
        zodType = 'z.string()';
        if (element.validation?.min) zodType += `.min(${element.validation.min})`;
        if (element.validation?.max) zodType += `.max(${element.validation.max})`;
        if (element.validation?.pattern) zodType += `.regex(/${element.validation.pattern}/)`;
        break;
      case 'email':
        zodType = 'z.string().email()';
        break;
      case 'number':
        zodType = 'z.number()';
        if (element.validation?.min) zodType += `.min(${element.validation.min})`;
        if (element.validation?.max) zodType += `.max(${element.validation.max})`;
        break;
      case 'checkbox':
        zodType = 'z.boolean()';
        break;
      case 'select':
      case 'radio':
        if (element.options) {
          const values = element.options.map(opt => `'${opt.value}'`).join(', ');
          zodType = `z.enum([${values}])`;
        } else {
          zodType = 'z.string()';
        }
        break;
      case 'file':
        zodType = 'z.instanceof(File).nullable()';
        break;
      case 'date':
        zodType = 'z.date().or(z.string())';
        break;
      default:
        zodType = 'z.string()';
    }
    
    // Add optional if not required
    if (!element.required) {
      zodType += '.optional()';
    }
    
    return zodType;
  }

  private static toPascalCase(str: string): string {
    return str.replace(/(?:^|[\s-_])+([a-z])/g, (_, char) => char.toUpperCase());
  }

  private static toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}

// ============================
// ⚛️ REACT COMPONENT GENERATOR
// ============================

export class ReactComponentGenerator {
  /**
   * Generate React Hook Form component
   */
  static generateFormComponent(formName: string, elements: FormElement[]): string {
    const componentName = `${TypeScriptModelGenerator.toPascalCase(formName)}Form`;
    const interfaceName = TypeScriptModelGenerator.toPascalCase(formName);
    const schemaName = `${TypeScriptModelGenerator.toCamelCase(formName)}Schema`;
    
    const formFields = elements.map(element => this.generateFormField(element)).join('\n\n');
    
    return `'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';
import { ${interfaceName}, ${schemaName} } from './${TypeScriptModelGenerator.toCamelCase(formName)}.types';

/**
 * 🎯 ${componentName} - Generated React Hook Form Component
 * 
 * Form: ${formName}
 * Generated: ${new Date().toISOString()}
 * 
 * @param onSubmit - Form submission handler
 * @param defaultValues - Default form values
 * @param loading - Loading state
 * @example
 * <${componentName} 
 *   onSubmit={(data) => console.log(data)}
 *   defaultValues={{}}
 * />
 */

interface ${componentName}Props {
  onSubmit: (data: ${interfaceName}) => void | Promise<void>;
  defaultValues?: Partial<${interfaceName}>;
  loading?: boolean;
  className?: string;
}

export function ${componentName}({ 
  onSubmit, 
  defaultValues = {}, 
  loading = false,
  className 
}: ${componentName}Props) {
  const form = useForm<${interfaceName}>({
    resolver: zodResolver(${schemaName}),
    defaultValues,
  });

  const handleSubmit = async (data: ${interfaceName}) => {
    try {
      browserLogger.formSubmit('${formName}', {
        formData: data,
        timestamp: new Date().toISOString(),
      });
      
      await onSubmit(data);
      
      browserLogger.userAction('form_submitted', {
        form: '${formName}',
        success: true,
      });
    } catch (error) {
      browserLogger.error('Form submission failed', {
        form: '${formName}',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          ${formFields}
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.reset()}
              disabled={loading}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ${componentName};`;
  }

  /**
   * Generate individual form field
   */
  private static generateFormField(element: FormElement): string {
    const fieldName = TypeScriptModelGenerator.toCamelCase(element.id);
    
    switch (element.type) {
      case 'text':
      case 'email':
        return `          <FormField
            control={form.control}
            name="${fieldName}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>${element.label}${element.required ? ' *' : ''}</FormLabel>
                <FormControl>
                  <Input 
                    type="${element.type}"
                    placeholder="${element.placeholder || ''}"
                    {...field} 
                  />
                </FormControl>
                ${element.description ? `<FormDescription>${element.description}</FormDescription>` : ''}
                <FormMessage />
              </FormItem>
            )}
          />`;
      
      case 'number':
        return `          <FormField
            control={form.control}
            name="${fieldName}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>${element.label}${element.required ? ' *' : ''}</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="${element.placeholder || ''}"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                ${element.description ? `<FormDescription>${element.description}</FormDescription>` : ''}
                <FormMessage />
              </FormItem>
            )}
          />`;
      
      case 'textarea':
        return `          <FormField
            control={form.control}
            name="${fieldName}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>${element.label}${element.required ? ' *' : ''}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="${element.placeholder || ''}"
                    {...field} 
                  />
                </FormControl>
                ${element.description ? `<FormDescription>${element.description}</FormDescription>` : ''}
                <FormMessage />
              </FormItem>
            )}
          />`;
      
      case 'checkbox':
        return `          <FormField
            control={form.control}
            name="${fieldName}"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>${element.label}${element.required ? ' *' : ''}</FormLabel>
                  ${element.description ? `<FormDescription>${element.description}</FormDescription>` : ''}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />`;
      
      case 'select':
        const selectOptions = element.options?.map(option => 
          `                    <SelectItem value="${option.value}">${option.label}</SelectItem>`
        ).join('\n') || '';
        
        return `          <FormField
            control={form.control}
            name="${fieldName}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>${element.label}${element.required ? ' *' : ''}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="${element.placeholder || 'Select an option'}" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
${selectOptions}
                  </SelectContent>
                </Select>
                ${element.description ? `<FormDescription>${element.description}</FormDescription>` : ''}
                <FormMessage />
              </FormItem>
            )}
          />`;
      
      case 'radio':
        const radioOptions = element.options?.map(option => 
          `                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="${option.value}" id="${option.value}" />
                      <Label htmlFor="${option.value}">${option.label}</Label>
                    </div>`
        ).join('\n') || '';
        
        return `          <FormField
            control={form.control}
            name="${fieldName}"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>${element.label}${element.required ? ' *' : ''}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
${radioOptions}
                  </RadioGroup>
                </FormControl>
                ${element.description ? `<FormDescription>${element.description}</FormDescription>` : ''}
                <FormMessage />
              </FormItem>
            )}
          />`;
      
      case 'date':
        return `          <FormField
            control={form.control}
            name="${fieldName}"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>${element.label}${element.required ? ' *' : ''}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                ${element.description ? `<FormDescription>${element.description}</FormDescription>` : ''}
                <FormMessage />
              </FormItem>
            )}
          />`;
      
      default:
        return `          <FormField
            control={form.control}
            name="${fieldName}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>${element.label}${element.required ? ' *' : ''}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />`;
    }
  }
}

// ============================
// 🏗️ FORM BUILDER SERVICE
// ============================

export class FormToReactBuilder {
  /**
   * Convert form JSON to complete React component files
   */
  static async buildFormComponents(formId: string, formName: string, structure: any): Promise<{
    types: string;
    component: string;
    usage: string;
  }> {
    const elements: FormElement[] = Array.isArray(structure) ? structure : structure.elements || [];
    
    // Generate TypeScript types and Zod schema
    const interfaceCode = TypeScriptModelGenerator.generateInterface(formName, elements);
    const zodSchemaCode = TypeScriptModelGenerator.generateZodSchema(formName, elements);
    const typesFile = `${interfaceCode}\n\n${zodSchemaCode}`;
    
    // Generate React component
    const componentCode = ReactComponentGenerator.generateFormComponent(formName, elements);
    
    // Generate usage example
    const usageExample = this.generateUsageExample(formName, elements);
    
    return {
      types: typesFile,
      component: componentCode,
      usage: usageExample,
    };
  }

  private static generateUsageExample(formName: string, elements: FormElement[]): string {
    const componentName = `${TypeScriptModelGenerator.toPascalCase(formName)}Form`;
    const interfaceName = TypeScriptModelGenerator.toPascalCase(formName);
    
    const defaultValues = elements.reduce((acc, element) => {
      const propName = TypeScriptModelGenerator.toCamelCase(element.id);
      let defaultValue = element.defaultValue;
      
      if (defaultValue === undefined) {
        switch (element.type) {
          case 'checkbox':
            defaultValue = false;
            break;
          case 'number':
            defaultValue = 0;
            break;
          default:
            defaultValue = '';
        }
      }
      
      acc[propName] = defaultValue;
      return acc;
    }, {} as Record<string, any>);

    return `/**
 * 📖 Usage Example for ${componentName}
 * 
 * Copy this code to use the generated form component in your pages
 */

'use client';

import React, { useState } from 'react';
import { ${componentName} } from '@/components/forms/${TypeScriptModelGenerator.toCamelCase(formName)}';
import { ${interfaceName} } from '@/types/forms/${TypeScriptModelGenerator.toCamelCase(formName)}.types';
import { toast } from 'sonner';

export default function ${TypeScriptModelGenerator.toPascalCase(formName)}Page() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ${interfaceName}) => {
    setLoading(true);
    
    try {
      // TODO: Replace with your actual API call
      const response = await fetch('/api/v1/forms/${formName.toLowerCase()}/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const result = await response.json();
      
      toast.success('Form submitted successfully!');
      console.log('Form submitted:', result);
      
    } catch (error) {
      toast.error('Failed to submit form');
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">${formName}</h1>
        
        <${componentName}
          onSubmit={handleSubmit}
          loading={loading}
          defaultValues={${JSON.stringify(defaultValues, null, 10)}}
        />
      </div>
    </div>
  );
}`;
  }
}

export default FormToReactBuilder; 