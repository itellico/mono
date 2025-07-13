import Anthropic from '@anthropic-ai/sdk';
import { Config } from '../config';

/**
 * Anthropic Service
 * Provides access to Claude models for documentation optimization
 */
class AnthropicService {
  private client: Anthropic | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = Config.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  Anthropic API key not configured. Claude features will be limited.');
      return;
    }

    try {
      this.client = new Anthropic({
        apiKey,
      });
      console.log('✅ Anthropic service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Anthropic service:', error);
    }
  }

  /**
   * Get the messages API
   */
  public get messages() {
    if (!this.client) {
      throw new Error('Anthropic service not initialized. Please configure ANTHROPIC_API_KEY.');
    }
    return this.client.messages;
  }

  /**
   * Check if Anthropic is available
   */
  public isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Review documentation for technical accuracy
   */
  public async reviewDocumentation(content: string, options?: {
    maxTokens?: number;
  }): Promise<string> {
    if (!this.client) {
      throw new Error('Anthropic service not available');
    }

    const response = await this.client.messages.create({
      model: 'claude-3-opus-20240229',
      messages: [
        {
          role: 'user',
          content: `Review and improve this technical documentation for accuracy and best practices:\n\n${content}`
        }
      ],
      max_tokens: options?.maxTokens || 4000,
    });

    // Extract text from the response
    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.text || content;
  }

  /**
   * Analyze documentation for security issues
   */
  public async analyzeSecurityConcerns(content: string): Promise<{
    hasIssues: boolean;
    issues: Array<{ type: string; severity: string; message: string }>;
  }> {
    if (!this.client) {
      throw new Error('Anthropic service not available');
    }

    const response = await this.client.messages.create({
      model: 'claude-3-opus-20240229',
      messages: [
        {
          role: 'user',
          content: `Analyze this documentation for security issues. Return a JSON response with format: { "hasIssues": boolean, "issues": [{ "type": string, "severity": "low|medium|high", "message": string }] }\n\nDocumentation:\n${content}`
        }
      ],
      max_tokens: 2000,
    });

    try {
      const textContent = response.content.find(c => c.type === 'text');
      const result = JSON.parse(textContent?.text || '{}');
      return result;
    } catch {
      return { hasIssues: false, issues: [] };
    }
  }
}

// Export singleton instance
export const anthropic = new AnthropicService();