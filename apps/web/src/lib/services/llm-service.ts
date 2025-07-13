import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";

export interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  context?: string;
  entityType?: string;
}

export interface TranslationResponse {
  translatedText: string;
  confidence: number;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class LLMService {
  private readonly CACHE_PREFIX = "llm:";
  private readonly CACHE_TTL = 86400; // 24 hours
  private readonly DEFAULT_MODEL = "gpt-4o-mini";

  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    if (!this.apiKey) {
      logger.warn("OpenAI API key not configured - LLM features will be disabled");
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      if (!this.isAvailable()) {
        throw new Error("Translation service not available - OpenAI API key not configured");
      }

      logger.info('LLM translation request', { 
        fromLanguage: request.fromLanguage,
        toLanguage: request.toLanguage,
        textLength: request.text.length,
        entityType: request.entityType 
      });

      // Create cache key
      const cacheKey = this.createCacheKey('translation', {
        text: request.text,
        fromLanguage: request.fromLanguage,
        toLanguage: request.toLanguage,
        context: request.context,
        entityType: request.entityType
      });

      // Try cache first
      try {
        const redis = await getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info('Translation found in cache', { 
            fromLanguage: request.fromLanguage,
            toLanguage: request.toLanguage 
          });
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.warn('Cache error, proceeding without cache', { error: cacheError.message });
      }

      // Build system prompt
      const systemPrompt = this.buildTranslationSystemPrompt(request);

      // Make API request
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.DEFAULT_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: request.text }
          ],
          temperature: 0.3,
          max_tokens: Math.max(request.text.length * 2, 500),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        throw new Error('No response from OpenAI API');
      }

      const translatedText = this.extractTranslation(choice.message.content);
      const confidence = this.calculateTranslationConfidence(request.text, translatedText, choice);

      const result: TranslationResponse = {
        translatedText,
        confidence,
        model: data.model,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };

      // Cache the result
      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      } catch (cacheError) {
        logger.warn('Failed to cache translation', { error: cacheError.message });
      }

      logger.info('LLM translation completed', { 
        fromLanguage: request.fromLanguage,
        toLanguage: request.toLanguage,
        originalLength: request.text.length,
        translatedLength: translatedText.length,
        confidence: confidence,
        usage: result.usage 
      });

      return result;
    } catch (error) {
      logger.error('LLM translation failed', { 
        error: error.message,
        fromLanguage: request.fromLanguage,
        toLanguage: request.toLanguage,
        textLength: request.text.length 
      });
      throw error;
    }
  }

  private buildTranslationSystemPrompt(request: TranslationRequest): string {
    const contextInfo = request.entityType ? ` for ${request.entityType} content` : '';

    return `You are a professional translator specializing in software localization${contextInfo}. 
Your task is to translate text from ${request.fromLanguage} to ${request.toLanguage} with high accuracy and cultural appropriateness.

Guidelines:
- Provide only the translated text, no explanations or additional content
- Maintain the original meaning and tone
- Use natural, native-sounding language for the target locale
- Preserve any technical terms, brand names, or proper nouns when appropriate
- Keep placeholders like {variable}, [placeholder], or %s unchanged
- Consider cultural context and local conventions
- For UI elements, use standard terminology for the target language

${request.context ? `Additional context: ${request.context}` : ''}`;
  }

  private extractTranslation(content: string): string {
    // Remove common prefixes/suffixes that LLMs might add
    let translation = content.trim();

    // Remove quotes if the entire response is wrapped in them
    if ((translation.startsWith('"') && translation.endsWith('"')) ||
        (translation.startsWith("'") && translation.endsWith("'"))) {
      translation = translation.slice(1, -1);
    }

    // Remove common response patterns
    const patterns = [
      /^Translation:\s*/i,
      /^Translated text:\s*/i,
      /^Result:\s*/i,
      /^Output:\s*/i,
    ];

    for (const pattern of patterns) {
      translation = translation.replace(pattern, '');
    }

    return translation.trim();
  }

  private calculateTranslationConfidence(
    originalText: string, 
    translatedText: string, 
    choice: any
  ): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on finish reason
    if (choice.finish_reason === 'stop') {
      confidence += 0.1;
    } else if (choice.finish_reason === 'length') {
      confidence -= 0.2; // Truncated response
    }

    // Adjust based on length ratio (very different lengths might indicate issues)
    const lengthRatio = translatedText.length / originalText.length;
    if (lengthRatio > 0.5 && lengthRatio < 2.0) {
      confidence += 0.1;
    } else if (lengthRatio < 0.3 || lengthRatio > 3.0) {
      confidence -= 0.2;
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  private createCacheKey(operation: string, data: Record<string, any>): string {
    const hash = Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 32);
    return `${this.CACHE_PREFIX}${operation}:${hash}`;
  }
}

export const llmService = new LLMService();
