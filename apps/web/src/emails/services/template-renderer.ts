/**
 * MJML + Nunjucks Template Renderer
 * 
 * This service implements the finalized email architecture:
 * - MJML for responsive email HTML generation
 * - Nunjucks for template variables and logic (Smarty-like syntax)
 * - Automatic text version generation from HTML
 * - Support for layouts, components, and inheritance
 * 
 * Template Structure:
 * src/emails/templates/
 * ├── system/           # Developer-managed templates
 * ├── tenant/          # Tenant admin-customizable  
 * ├── layouts/         # Base layouts (base.mjml, system.mjml, tenant.mjml)
 * └── components/      # Reusable components (header.mjml, footer.mjml, button.mjml)
 */

import mjml from 'mjml';
import nunjucks from 'nunjucks';
import { convert } from 'html-to-text';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Types
export interface EmailTemplate {
  html: string;
  text: string;
  subject: string;
}

export interface TemplateVariables {
  // System variables (always available)
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  currentYear: number;
  
  // Tenant variables (when rendering tenant templates)
  tenantName?: string;
  tenantDomain?: string;
  tenantBranding?: {
    primaryColor: string;
    logoUrl?: string;
    customCss?: string;
  };
  
  // User variables
  userName?: string;
  userEmail?: string;
  userType?: string;
  
  // Template-specific variables
  [key: string]: any;
}

export interface TemplateConfig {
  subject: string;
  layout?: string;
  preheader?: string;
  category: 'authentication' | 'notification' | 'workflow' | 'marketing' | 'system';
}

export class TemplateRenderer {
  private nunjucksEnv: nunjucks.Environment;
  private templatesDir: string;
  
  constructor(templatesDir?: string) {
    // Default to src/emails/templates relative to this file
    this.templatesDir = templatesDir || join(process.cwd(), 'src', 'emails', 'templates');
    
    // Configure Nunjucks environment
    this.nunjucksEnv = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(this.templatesDir, {
        watch: process.env.NODE_ENV === 'development',
        noCache: process.env.NODE_ENV === 'development',
      }),
      {
        autoescape: false, // MJML handles escaping
        throwOnUndefined: false,
        trimBlocks: true,
        lstripBlocks: true,
      }
    );
    
    // Add custom filters
    this.setupCustomFilters();
  }
  
  /**
   * Render a template with variables
   */
  async renderTemplate(
    templatePath: string, 
    variables: TemplateVariables,
    tenantId?: number
  ): Promise<EmailTemplate> {
    try {
      // Enhance variables with system defaults
      const enhancedVariables = this.enhanceVariables(variables, tenantId);
      
      // Load template configuration
      const config = await this.loadTemplateConfig(templatePath);
      
      // Render subject line
      const subject = this.nunjucksEnv.renderString(config.subject, enhancedVariables);
      
      // Determine template file path
      const mjmlFilePath = `${templatePath}.mjml`;
      
      // Check if template exists
      const fullPath = join(this.templatesDir, mjmlFilePath);
      await this.ensureTemplateExists(fullPath, templatePath);
      
      // Render MJML template with Nunjucks
      const mjmlTemplate = await this.nunjucksEnv.render(mjmlFilePath, enhancedVariables);
      
      // Compile MJML to HTML
      const mjmlResult = mjml(mjmlTemplate, {
        keepComments: false,
        beautify: process.env.NODE_ENV === 'development',
        validationLevel: process.env.NODE_ENV === 'development' ? 'strict' : 'soft',
      });
      
      if (mjmlResult.errors.length > 0) {
        console.warn('MJML compilation warnings:', mjmlResult.errors);
      }
      
      // Generate text version
      const text = this.generateTextVersion(mjmlResult.html);
      
      return {
        html: mjmlResult.html,
        text,
        subject,
      };
      
    } catch (error) {
      console.error('Template rendering error:', error);
      throw new Error(`Failed to render email template "${templatePath}": ${error.message}`);
    }
  }
  
  /**
   * Render a template string directly (for dynamic templates)
   */
  async renderTemplateString(
    mjmlTemplate: string,
    variables: TemplateVariables,
    subject: string = 'mono Platform Notification'
  ): Promise<EmailTemplate> {
    try {
      // Enhance variables with system defaults
      const enhancedVariables = this.enhanceVariables(variables);
      
      // Render MJML template with Nunjucks
      const renderedMjml = this.nunjucksEnv.renderString(mjmlTemplate, enhancedVariables);
      
      // Compile MJML to HTML
      const mjmlResult = mjml(renderedMjml, {
        keepComments: false,
        beautify: process.env.NODE_ENV === 'development',
        validationLevel: 'soft',
      });
      
      // Generate text version
      const text = this.generateTextVersion(mjmlResult.html);
      
      // Render subject
      const renderedSubject = this.nunjucksEnv.renderString(subject, enhancedVariables);
      
      return {
        html: mjmlResult.html,
        text,
        subject: renderedSubject,
      };
      
    } catch (error) {
      console.error('Template string rendering error:', error);
      throw new Error(`Failed to render email template string: ${error.message}`);
    }
  }
  
  /**
   * Check if a template exists
   */
  async templateExists(templatePath: string): Promise<boolean> {
    try {
      const fullPath = join(this.templatesDir, `${templatePath}.mjml`);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * List available templates
   */
  async listTemplates(category?: string): Promise<string[]> {
    try {
      const templates: string[] = [];
      
      const scanDirectory = async (dir: string, prefix: string = ''): Promise<void> => {
        const entries = await fs.readdir(join(this.templatesDir, dir), { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            await scanDirectory(join(dir, entry.name), `${prefix}${entry.name}/`);
          } else if (entry.name.endsWith('.mjml')) {
            const templatePath = `${prefix}${entry.name.replace('.mjml', '')}`;
            
            if (!category) {
              templates.push(templatePath);
            } else {
              const config = await this.loadTemplateConfig(templatePath);
              if (config.category === category) {
                templates.push(templatePath);
              }
            }
          }
        }
      };
      
      await scanDirectory('');
      return templates.sort();
      
    } catch (error) {
      console.error('Error listing templates:', error);
      return [];
    }
  }
  
  /**
   * Enhanced variables with system defaults
   */
  private enhanceVariables(variables: TemplateVariables, tenantId?: number): TemplateVariables {
    return {
      // System defaults
      platformName: process.env.PLATFORM_NAME || 'mono Platform',
      platformUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@monoplatform.com',
      currentYear: new Date().getFullYear(),
      
      // Environment info
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      
      // Template utilities
      formatDate: (date: Date | string) => new Date(date).toLocaleDateString(),
      formatDateTime: (date: Date | string) => new Date(date).toLocaleString(),
      truncate: (text: string, length: number) => text.length > length ? text.substring(0, length) + '...' : text,
      
      // User-provided variables (override defaults)
      ...variables,
      
      // Tenant context (if provided)
      ...(tenantId && {
        tenantId,
        // TODO: Load tenant branding from database
      }),
    };
  }
  
  /**
   * Load template configuration from JSON file
   */
  private async loadTemplateConfig(templatePath: string): Promise<TemplateConfig> {
    try {
      const configPath = join(this.templatesDir, `${templatePath}.json`);
      const configContent = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configContent);
    } catch {
      // Return default config if file doesn't exist
      return {
        subject: 'mono Platform Notification',
        category: 'notification',
      };
    }
  }
  
  /**
   * Ensure template exists or provide helpful error
   */
  private async ensureTemplateExists(fullPath: string, templatePath: string): Promise<void> {
    try {
      await fs.access(fullPath);
    } catch {
      const availableTemplates = await this.listTemplates();
      throw new Error(
        `Template "${templatePath}" not found at ${fullPath}. ` +
        `Available templates: ${availableTemplates.join(', ')}`
      );
    }
  }
  
  /**
   * Generate text version from HTML
   */
  private generateTextVersion(html: string): string {
    return convert(html, {
      wordwrap: 72,
      preserveNewlines: true,
      selectors: [
        { selector: 'a', options: { ignoreHref: false } },
        { selector: 'img', format: 'skip' },
        { selector: 'h1', options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
        { selector: 'h2', options: { leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: 'h3', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'table', options: { uppercaseHeaderCells: false } },
      ],
    });
  }
  
  /**
   * Setup custom Nunjucks filters
   */
  private setupCustomFilters(): void {
    // Date formatting filter
    this.nunjucksEnv.addFilter('date', (date: Date | string, format: string = 'short') => {
      const d = new Date(date);
      switch (format) {
        case 'short':
          return d.toLocaleDateString();
        case 'long':
          return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'time':
          return d.toLocaleTimeString();
        case 'datetime':
          return d.toLocaleString();
        default:
          return d.toLocaleDateString();
      }
    });
    
    // Currency formatting filter
    this.nunjucksEnv.addFilter('currency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    });
    
    // Truncate text filter
    this.nunjucksEnv.addFilter('truncate', (text: string, length: number = 100) => {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    });
    
    // Title case filter
    this.nunjucksEnv.addFilter('title', (text: string) => {
      if (!text) return '';
      return text.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    });
    
    // URL encoding filter
    this.nunjucksEnv.addFilter('urlencode', (text: string) => {
      return encodeURIComponent(text || '');
    });
  }
}

// Export singleton instance
export const templateRenderer = new TemplateRenderer();

// Export types
export type { EmailTemplate, TemplateVariables, TemplateConfig };