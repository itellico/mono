import OpenAI from 'openai';
import { Config } from '../config';

/**
 * OpenAI Service
 * Provides access to OpenAI's GPT models for documentation optimization
 */
class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = Config.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  OpenAI API key not configured. AI features will be limited.');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey,
        maxRetries: 3,
      });
      console.log('✅ OpenAI service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI service:', error);
    }
  }

  /**
   * Get the OpenAI client
   */
  public get chat() {
    if (!this.client) {
      throw new Error('OpenAI service not initialized. Please configure OPENAI_API_KEY.');
    }
    return this.client.chat;
  }

  /**
   * Check if OpenAI is available
   */
  public isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Optimize documentation content
   */
  public async optimizeDocumentation(content: string, options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI service not available');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a technical documentation expert. Improve documentation clarity, completeness, and structure while maintaining technical accuracy.'
        },
        {
          role: 'user',
          content: `Improve this documentation:\n\n${content}`
        }
      ],
      temperature: options?.temperature || 0.3,
      max_tokens: options?.maxTokens || 4000,
    });

    return response.choices[0].message.content || content;
  }
}

// Export singleton instance
export const openai = new OpenAIService();