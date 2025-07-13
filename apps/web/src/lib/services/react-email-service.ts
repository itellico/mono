import { render } from '@react-email/render';
import { logger } from '@/lib/logger';
import * as React from 'react';

// Import React Email templates
import { WelcomeEmail } from '@/emails/templates/WelcomeEmail';

// Email template registry
const EMAIL_TEMPLATES = {
  welcome: WelcomeEmail,
  // Add more templates here as we create them
} as const;

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATES;

export interface ReactEmailRenderOptions {
  pretty?: boolean;
  plainText?: boolean;
}

export class ReactEmailService {
  private static instance: ReactEmailService;

  static getInstance(): ReactEmailService {
    if (!ReactEmailService.instance) {
      ReactEmailService.instance = new ReactEmailService();
    }
    return ReactEmailService.instance;
  }

  /**
   * Render a React Email template to HTML
   */
  async renderToHtml(
    templateName: EmailTemplateName,
    props: Record<string, any>,
    options: ReactEmailRenderOptions = {}
  ): Promise<string> {
    try {
      const Template = EMAIL_TEMPLATES[templateName];

      if (!Template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      // Create React element with props
      const element = React.createElement(Template, props);

      // Render to HTML
      const html = await render(element, {
        pretty: options.pretty ?? true,
      });

      logger.info('React Email template rendered to HTML', {
        templateName,
        propsKeys: Object.keys(props),
        htmlLength: html.length
      });

      return html;
    } catch (error) {
      logger.error('Failed to render React Email template to HTML', {
        error: error.message,
        templateName,
        props
      });
      throw error;
    }
  }

  /**
   * Render a React Email template to plain text
   */
  async renderToText(
    templateName: EmailTemplateName,
    props: Record<string, any>
  ): Promise<string> {
    try {
      const Template = EMAIL_TEMPLATES[templateName];

      if (!Template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      // Create React element with props
      const element = React.createElement(Template, props);

      // Render to plain text
      const text = await render(element, {
        plainText: true,
      });

      logger.info('React Email template rendered to text', {
        templateName,
        propsKeys: Object.keys(props),
        textLength: text.length
      });

      return text;
    } catch (error) {
      logger.error('Failed to render React Email template to text', {
        error: error.message,
        templateName,
        props
      });
      throw error;
    }
  }

  /**
   * Render a React Email template to both HTML and text
   */
  async renderTemplate(
    templateName: EmailTemplateName,
    props: Record<string, any>,
    options: ReactEmailRenderOptions = {}
  ): Promise<{ html: string; text: string }> {
    try {
      const [html, text] = await Promise.all([
        this.renderToHtml(templateName, props, options),
        this.renderToText(templateName, props)
      ]);

      return { html, text };
    } catch (error) {
      logger.error('Failed to render React Email template', {
        error: error.message,
        templateName,
        props
      });
      throw error;
    }
  }

  /**
   * Get available template names
   */
  getAvailableTemplates(): EmailTemplateName[] {
    return Object.keys(EMAIL_TEMPLATES) as EmailTemplateName[];
  }

  /**
   * Check if a template exists
   */
  hasTemplate(templateName: string): templateName is EmailTemplateName {
    return templateName in EMAIL_TEMPLATES;
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(
    templateName: EmailTemplateName,
    sampleData?: Record<string, any>
  ): Promise<{ html: string; text: string }> {
    // Default sample data for preview
    const defaultSampleData: Record<string, any> = {
      userFirstName: 'John',
      userEmail: 'john@example.com',
      tenantName: 'GoModels',
      tenantDomain: 'mono.com',
      systemDomain: 'https://mono.com',
      systemSupportEmail: 'support@mono.com',
    };

    const mergedData = { ...defaultSampleData, ...sampleData };

    return this.renderTemplate(templateName, mergedData);
  }
}

// Export singleton instance
export const reactEmailService = ReactEmailService.getInstance(); 