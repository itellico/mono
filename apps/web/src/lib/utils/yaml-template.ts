import yaml from 'js-yaml';
import { YamlTemplate, YamlLayoutElement, YamlField, YamlInclude } from '@/lib/schemas/templates';

// ============================
// 🔧 YAML TEMPLATE UTILITIES
// ============================

/**
 * Parse YAML string to template object
 */
export function parseYamlTemplate(yamlString: string): YamlTemplate {
  try {
    const parsed = yaml.load(yamlString) as YamlTemplate;
    validateYamlTemplate(parsed);
    return parsed;
  } catch (error) {
    throw new Error(`Invalid YAML template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert template object to YAML string
 */
export function generateYamlTemplate(template: YamlTemplate): string {
  try {
    return yaml.dump(template, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
    });
  } catch (error) {
    throw new Error(`Failed to generate YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate YAML template structure
 */
export function validateYamlTemplate(template: any): asserts template is YamlTemplate {
  if (!template || typeof template !== 'object') {
    throw new Error('Template must be an object');
  }

  // Required fields
  if (!template.name || typeof template.name !== 'string') {
    throw new Error('Template must have a name');
  }

  if (!template.displayName || typeof template.displayName !== 'object') {
    throw new Error('Template must have displayName object');
  }

  if (!template.baseLayout || typeof template.baseLayout !== 'string') {
    throw new Error('Template must specify a baseLayout');
  }

  if (!template.version || typeof template.version !== 'string') {
    throw new Error('Template must have a version');
  }

  // Layout validation
  if (!Array.isArray(template.layout)) {
    throw new Error('Template layout must be an array');
  }

  template.layout.forEach((element: any, index: number) => {
    validateLayoutElement(element, `layout[${index}]`);
  });

  // Fields validation
  if (!Array.isArray(template.fields)) {
    throw new Error('Template fields must be an array');
  }

  template.fields.forEach((field: any, index: number) => {
    validateField(field, `fields[${index}]`);
  });

  // Includes validation (optional)
  if (template.includes && !Array.isArray(template.includes)) {
    throw new Error('Template includes must be an array');
  }

  if (template.includes) {
    template.includes.forEach((include: any, index: number) => {
      validateInclude(include, `includes[${index}]`);
    });
  }
}

/**
 * Validate layout element
 */
function validateLayoutElement(element: any, path: string): void {
  if (!element || typeof element !== 'object') {
    throw new Error(`${path} must be an object`);
  }

  if (!element.id || typeof element.id !== 'string') {
    throw new Error(`${path} must have an id`);
  }

  const validTypes = ['tab', 'card', 'section', 'step', 'divider', 'text'];
  if (!element.type || !validTypes.includes(element.type)) {
    throw new Error(`${path} must have a valid type: ${validTypes.join(', ')}`);
  }

  // Validate columns if present
  if (element.columns !== undefined) {
    if (!Number.isInteger(element.columns) || element.columns < 1 || element.columns > 4) {
      throw new Error(`${path} columns must be an integer between 1 and 4`);
    }
  }

  // Validate children if present
  if (element.children) {
    if (!Array.isArray(element.children)) {
      throw new Error(`${path} children must be an array`);
    }
    element.children.forEach((child: any, index: number) => {
      validateLayoutElement(child, `${path}.children[${index}]`);
    });
  }

  // Validate fields if present
  if (element.fields) {
    if (!Array.isArray(element.fields)) {
      throw new Error(`${path} fields must be an array`);
    }
    element.fields.forEach((fieldId: any, index: number) => {
      if (typeof fieldId !== 'string') {
        throw new Error(`${path}.fields[${index}] must be a string`);
      }
    });
  }
}

/**
 * Validate field definition
 */
function validateField(field: any, path: string): void {
  if (!field || typeof field !== 'object') {
    throw new Error(`${path} must be an object`);
  }

  if (!field.id || typeof field.id !== 'string') {
    throw new Error(`${path} must have an id`);
  }

  if (!field.name || typeof field.name !== 'string') {
    throw new Error(`${path} must have a name`);
  }

  if (!field.label || typeof field.label !== 'object') {
    throw new Error(`${path} must have a label object`);
  }

  if (!field.type || typeof field.type !== 'string') {
    throw new Error(`${path} must have a type`);
  }
}

/**
 * Validate include definition
 */
function validateInclude(include: any, path: string): void {
  if (!include || typeof include !== 'object') {
    throw new Error(`${path} must be an object`);
  }

  const validTypes = ['component', 'template'];
  if (!include.type || !validTypes.includes(include.type)) {
    throw new Error(`${path} must have a valid type: ${validTypes.join(', ')}`);
  }

  if (!include.id || typeof include.id !== 'string') {
    throw new Error(`${path} must have an id`);
  }

  if (!include.name || typeof include.name !== 'string') {
    throw new Error(`${path} must have a name`);
  }
}

// ============================
// 🏗️ TEMPLATE BUILDERS
// ============================

/**
 * Create a new empty template with base layout
 */
export function createEmptyTemplate(
  name: string,
  displayName: Record<string, string>,
  baseLayout: string,
  description?: Record<string, string>
): YamlTemplate {
  return {
    name,
    displayName,
    description,
    baseLayout,
    version: '1.0.0',
    layout: [],
    fields: [],
    includes: [],
  };
}

/**
 * Add a field to a template
 */
export function addFieldToTemplate(
  template: YamlTemplate,
  field: YamlField,
  layoutElementId?: string
): YamlTemplate {
  const updatedTemplate = { ...template };

  // Add field to fields array if not already present
  const existingFieldIndex = updatedTemplate.fields.findIndex(f => f.id === field.id);
  if (existingFieldIndex >= 0) {
    updatedTemplate.fields[existingFieldIndex] = field;
  } else {
    updatedTemplate.fields.push(field);
  }

  // Add field to layout element if specified
  if (layoutElementId) {
    updatedTemplate.layout = addFieldToLayoutElement(updatedTemplate.layout, field.id, layoutElementId);
  }

  return updatedTemplate;
}

/**
 * Add a layout element to a template
 */
export function addLayoutElementToTemplate(
  template: YamlTemplate,
  element: YamlLayoutElement,
  parentId?: string
): YamlTemplate {
  const updatedTemplate = { ...template };

  if (parentId) {
    // Add to parent element
    updatedTemplate.layout = addLayoutElementToParent(updatedTemplate.layout, element, parentId);
  } else {
    // Add to root level
    updatedTemplate.layout.push(element);
  }

  return updatedTemplate;
}

/**
 * Helper function to add field to layout element
 */
function addFieldToLayoutElement(
  layout: YamlLayoutElement[],
  fieldId: string,
  layoutElementId: string
): YamlLayoutElement[] {
  return layout.map(element => {
    if (element.id === layoutElementId) {
      return {
        ...element,
        fields: [...(element.fields || []), fieldId],
      };
    }

    if (element.children) {
      return {
        ...element,
        children: addFieldToLayoutElement(element.children, fieldId, layoutElementId),
      };
    }

    return element;
  });
}

/**
 * Helper function to add layout element to parent
 */
function addLayoutElementToParent(
  layout: YamlLayoutElement[],
  newElement: YamlLayoutElement,
  parentId: string
): YamlLayoutElement[] {
  return layout.map(element => {
    if (element.id === parentId) {
      return {
        ...element,
        children: [...(element.children || []), newElement],
      };
    }

    if (element.children) {
      return {
        ...element,
        children: addLayoutElementToParent(element.children, newElement, parentId),
      };
    }

    return element;
  });
}

// ============================
// 🎨 TEMPLATE EXAMPLES
// ============================

/**
 * Generate example base layouts
 */
export const BASE_LAYOUTS = {
  singleColumn: {
    name: 'single-column',
    displayName: { 'en-US': 'Single Column Form' },
    description: { 'en-US': 'Simple single column layout for forms' },
    category: 'form',
    yamlDefinition: generateYamlTemplate({
      name: 'single-column-base',
      displayName: { 'en-US': 'Single Column Base' },
      baseLayout: 'single-column',
      version: '1.0.0',
      layout: [
        {
          id: 'main-card',
          type: 'card',
          label: { 'en-US': 'Main Form' },
          columns: 1,
          fields: [],
        },
      ],
      fields: [],
    }),
  },

  twoColumn: {
    name: 'two-column',
    displayName: { 'en-US': 'Two Column Form' },
    description: { 'en-US': 'Two column layout for detailed forms' },
    category: 'form',
    yamlDefinition: generateYamlTemplate({
      name: 'two-column-base',
      displayName: { 'en-US': 'Two Column Base' },
      baseLayout: 'two-column',
      version: '1.0.0',
      layout: [
        {
          id: 'main-card',
          type: 'card',
          label: { 'en-US': 'Main Form' },
          columns: 2,
          fields: [],
        },
      ],
      fields: [],
    }),
  },

  tabbed: {
    name: 'tabbed',
    displayName: { 'en-US': 'Tabbed Form' },
    description: { 'en-US': 'Multi-section form with tabs' },
    category: 'form',
    yamlDefinition: generateYamlTemplate({
      name: 'tabbed-base',
      displayName: { 'en-US': 'Tabbed Base' },
      baseLayout: 'tabbed',
      version: '1.0.0',
      layout: [
        {
          id: 'main-tabs',
          type: 'tab',
          label: { 'en-US': 'Form Sections' },
          children: [
            {
              id: 'basic-info',
              type: 'card',
              label: { 'en-US': 'Basic Information' },
              columns: 1,
              fields: [],
            },
          ],
        },
      ],
      fields: [],
    }),
  },
} as const; 