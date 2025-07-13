import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const extractStringsRoutes: FastifyPluginAsync = async (fastify) => {
  // Extract translatable strings from code/content
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:extract')],
    schema: {
      tags: ['platform.translations'],
      body: Type.Object({
        content: Type.String({ minLength: 1 }),
        contentType: Type.Union([
          Type.Literal('javascript'),
          Type.Literal('typescript'),
          Type.Literal('jsx'),
          Type.Literal('tsx'),
          Type.Literal('vue'),
          Type.Literal('html'),
          Type.Literal('json'),
          Type.Literal('yaml')
        ]),
        extractionRules: Type.Optional(Type.Object({
          patterns: Type.Optional(Type.Array(Type.String())),
          functions: Type.Optional(Type.Array(Type.String())),
          attributes: Type.Optional(Type.Array(Type.String())),
          excludePatterns: Type.Optional(Type.Array(Type.String())),
        })),
        context: Type.Optional(Type.Object({
          filePath: Type.Optional(Type.String()),
          project: Type.Optional(Type.String()),
          component: Type.Optional(Type.String()),
        })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            extractedStrings: Type.Array(Type.Object({
              key: Type.String(),
              value: Type.String(),
              context: Type.Optional(Type.String()),
              location: Type.Object({
                line: Type.Optional(Type.Number()),
                column: Type.Optional(Type.Number()),
                function: Type.Optional(Type.String()),
                attribute: Type.Optional(Type.String()),
              }),
              category: Type.String(),
              confidence: Type.Number(),
            })),
            statistics: Type.Object({
              totalStrings: Type.Number(),
              uniqueStrings: Type.Number(),
              categories: Type.Object({
                ui: Type.Number(),
                validation: Type.Number(),
                message: Type.Number(),
                label: Type.Number(),
                other: Type.Number(),
              }),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { content, contentType, extractionRules = {}, context = {} } = request.body;

      // Default extraction patterns for different content types
      const defaultPatterns: Record<string, string[]> = {
        javascript: [
          't\\([\'"`]([^\'"`]+)[\'"`]\\)',
          'i18n\\.[a-z]+\\([\'"`]([^\'"`]+)[\'"`]\\)',
          'translate\\([\'"`]([^\'"`]+)[\'"`]\\)',
          '__\\([\'"`]([^\'"`]+)[\'"`]\\)',
        ],
        typescript: [
          't\\([\'"`]([^\'"`]+)[\'"`]\\)',
          'i18n\\.[a-z]+\\([\'"`]([^\'"`]+)[\'"`]\\)',
          'translate\\([\'"`]([^\'"`]+)[\'"`]\\)',
          '__\\([\'"`]([^\'"`]+)[\'"`]\\)',
        ],
        jsx: [
          't\\([\'"`]([^\'"`]+)[\'"`]\\)',
          '<Trans[^>]*>([^<]+)</Trans>',
          'i18nKey=[\'"`]([^\'"`]+)[\'"`]',
        ],
        tsx: [
          't\\([\'"`]([^\'"`]+)[\'"`]\\)',
          '<Trans[^>]*>([^<]+)</Trans>',
          'i18nKey=[\'"`]([^\'"`]+)[\'"`]',
        ],
        vue: [
          '\\$t\\([\'"`]([^\'"`]+)[\'"`]\\)',
          'v-t=[\'"`]([^\'"`]+)[\'"`]',
        ],
        html: [
          'data-i18n=[\'"`]([^\'"`]+)[\'"`]',
          'translate=[\'"`]([^\'"`]+)[\'"`]',
        ],
        json: [
          '"([^"]+)"\\s*:\\s*"([^"]+)"',
        ],
        yaml: [
          '^\\s*([^:]+):\\s*(.+)$',
        ],
      };

      const patterns = extractionRules.patterns || defaultPatterns[contentType] || [];
      const excludePatterns = extractionRules.excludePatterns || [
        '^[a-zA-Z0-9_-]+$', // Variable names
        '^\\d+$', // Numbers only
        '^[^a-zA-Z]*$', // No letters
      ];

      const extractedStrings: Array<{
        key: string;
        value: string;
        context?: string;
        location: {
          line?: number;
          column?: number;
          function?: string;
          attribute?: string;
        };
        category: string;
        confidence: number;
      }> = [];

      const lines = content.split('\n');
      const uniqueStrings = new Set<string>();

      // Extract strings using patterns
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        for (const pattern of patterns) {
          const regex = new RegExp(pattern, 'g');
          let match;

          while ((match = regex.exec(line)) !== null) {
            const extractedValue = match[1] || match[0];
            
            // Skip if matches exclude patterns
            const shouldExclude = excludePatterns.some(excludePattern => {
              const excludeRegex = new RegExp(excludePattern);
              return excludeRegex.test(extractedValue);
            });

            if (shouldExclude || extractedValue.length < 2) {
              continue;
            }

            // Generate key from value
            const key = extractedValue
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/^_+|_+$/g, '')
              .substring(0, 50);

            // Categorize the string
            const category = categorizeString(extractedValue);
            
            // Calculate confidence based on context and content
            const confidence = calculateConfidence(extractedValue, line, pattern);

            const stringInfo = {
              key,
              value: extractedValue,
              context: context.component || context.filePath,
              location: {
                line: lineIndex + 1,
                column: match.index,
                function: extractFunctionName(line),
                attribute: extractAttributeName(line, match.index || 0),
              },
              category,
              confidence,
            };

            extractedStrings.push(stringInfo);
            uniqueStrings.add(extractedValue);
          }
        }
      }

      // Calculate statistics
      const statistics = {
        totalStrings: extractedStrings.length,
        uniqueStrings: uniqueStrings.size,
        categories: {
          ui: extractedStrings.filter(s => s.category === 'ui').length,
          validation: extractedStrings.filter(s => s.category === 'validation').length,
          message: extractedStrings.filter(s => s.category === 'message').length,
          label: extractedStrings.filter(s => s.category === 'label').length,
          other: extractedStrings.filter(s => s.category === 'other').length,
        },
      };

      request.log.info('Strings extracted from content', {
        contentType,
        totalStrings: statistics.totalStrings,
        uniqueStrings: statistics.uniqueStrings,
        filePath: context.filePath,
      });

      return {
        success: true,
        data: {
          extractedStrings: extractedStrings.sort((a, b) => b.confidence - a.confidence),
          statistics,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to extract strings', {
        error: error.message,
        contentType: request.body.contentType,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_EXTRACT_STRINGS_FROM_CONTENT',
      });
    }
  });

  // Scan project files for translatable strings
  fastify.post('/scan-strings', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:extract')],
    schema: {
      tags: ['platform.translations'],
      body: Type.Object({
        projectPath: Type.String({ minLength: 1 }),
        filePatterns: Type.Optional(Type.Array(Type.String())),
        excludePatterns: Type.Optional(Type.Array(Type.String())),
        extractionRules: Type.Optional(Type.Object({
          patterns: Type.Optional(Type.Array(Type.String())),
          functions: Type.Optional(Type.Array(Type.String())),
          attributes: Type.Optional(Type.Array(Type.String())),
        })),
        maxFiles: Type.Optional(Type.Number({ minimum: 1, maximum: 1000, default: 100 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            scannedFiles: Type.Array(Type.Object({
              filePath: Type.String(),
              contentType: Type.String(),
              extractedStrings: Type.Number(),
              errors: Type.Optional(Type.Array(Type.String())),
            })),
            allStrings: Type.Array(Type.Object({
              key: Type.String(),
              value: Type.String(),
              occurrences: Type.Array(Type.Object({
                filePath: Type.String(),
                line: Type.Number(),
                context: Type.Optional(Type.String()),
              })),
              category: Type.String(),
              confidence: Type.Number(),
            })),
            statistics: Type.Object({
              totalFiles: Type.Number(),
              scannedFiles: Type.Number(),
              totalStrings: Type.Number(),
              uniqueStrings: Type.Number(),
              categories: Type.Object({
                ui: Type.Number(),
                validation: Type.Number(),
                message: Type.Number(),
                label: Type.Number(),
                other: Type.Number(),
              }),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const {
        projectPath,
        filePatterns = ['**/*.{js,ts,jsx,tsx,vue}'],
        excludePatterns = ['**/node_modules/**', '**/dist/**', '**/build/**'],
        extractionRules = {},
        maxFiles = 100
      } = request.body;

      // Simulated file scanning (in real implementation, use file system scanning)
      const mockFiles = [
        { path: 'src/components/Button.tsx', type: 'tsx' },
        { path: 'src/pages/Home.tsx', type: 'tsx' },
        { path: 'src@/utils/validation.ts', type: 'typescript' },
        { path: 'src/components/Form.vue', type: 'vue' },
      ];

      const scannedFiles: Array<{
        filePath: string;
        contentType: string;
        extractedStrings: number;
        errors?: string[];
      }> = [];

      const allStringsMap = new Map<string, {
        key: string;
        value: string;
        occurrences: Array<{
          filePath: string;
          line: number;
          context?: string;
        }>;
        category: string;
        confidence: number;
      }>();

      // Mock scanning results
      for (const file of mockFiles.slice(0, maxFiles)) {
        try {
          // Mock extracted strings per file
          const mockExtractedStrings = [
            {
              key: 'click_here',
              value: 'Click here',
              line: 15,
              category: 'ui',
              confidence: 0.9,
            },
            {
              key: 'required_field',
              value: 'This field is required',
              line: 23,
              category: 'validation',
              confidence: 0.95,
            },
          ];

          scannedFiles.push({
            filePath: file.path,
            contentType: file.type,
            extractedStrings: mockExtractedStrings.length,
          });

          // Add to global strings map
          for (const str of mockExtractedStrings) {
            if (!allStringsMap.has(str.value)) {
              allStringsMap.set(str.value, {
                key: str.key,
                value: str.value,
                occurrences: [],
                category: str.category,
                confidence: str.confidence,
              });
            }

            const stringInfo = allStringsMap.get(str.value)!;
            stringInfo.occurrences.push({
              filePath: file.path,
              line: str.line,
              context: file.type,
            });
          }

        } catch (error: any) {
          scannedFiles.push({
            filePath: file.path,
            contentType: file.type,
            extractedStrings: 0,
            errors: [error.message],
          });
        }
      }

      const allStrings = Array.from(allStringsMap.values());

      const statistics = {
        totalFiles: mockFiles.length,
        scannedFiles: scannedFiles.length,
        totalStrings: allStrings.reduce((sum, str) => sum + str.occurrences.length, 0),
        uniqueStrings: allStrings.length,
        categories: {
          ui: allStrings.filter(s => s.category === 'ui').length,
          validation: allStrings.filter(s => s.category === 'validation').length,
          message: allStrings.filter(s => s.category === 'message').length,
          label: allStrings.filter(s => s.category === 'label').length,
          other: allStrings.filter(s => s.category === 'other').length,
        },
      };

      request.log.info('Project files scanned for strings', {
        projectPath,
        scannedFiles: statistics.scannedFiles,
        totalStrings: statistics.totalStrings,
        uniqueStrings: statistics.uniqueStrings,
      });

      return {
        success: true,
        data: {
          scannedFiles,
          allStrings: allStrings.sort((a, b) => b.confidence - a.confidence),
          statistics,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to scan project for strings', {
        error: error.message,
        projectPath: request.body.projectPath,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_SCAN_PROJECT_FOR_TRANSLATABLE_STRINGS',
      });
    }
  });
};

// Helper functions
function categorizeString(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('error') || lowerText.includes('invalid') || lowerText.includes('required')) {
    return 'validation';
  }
  
  if (lowerText.includes('success') || lowerText.includes('saved') || lowerText.includes('updated')) {
    return 'message';
  }
  
  if (lowerText.includes('label') || lowerText.includes('name') || lowerText.includes('title')) {
    return 'label';
  }
  
  if (lowerText.includes('click') || lowerText.includes('button') || lowerText.includes('submit')) {
    return 'ui';
  }
  
  return 'other';
}

function calculateConfidence(text: string, line: string, pattern: string): number {
  let confidence = 0.5;
  
  // Higher confidence for longer strings
  if (text.length > 10) confidence += 0.2;
  if (text.length > 20) confidence += 0.1;
  
  // Higher confidence for strings with spaces (likely user-facing)
  if (text.includes(' ')) confidence += 0.2;
  
  // Higher confidence for capitalized strings
  if (text[0] === text[0].toUpperCase()) confidence += 0.1;
  
  // Lower confidence for strings that look like code
  if (/^[a-z_]+$/.test(text)) confidence -= 0.3;
  if (/^\d+$/.test(text)) confidence -= 0.4;
  
  // Pattern-specific adjustments
  if (pattern.includes('Trans')) confidence += 0.2;
  if (pattern.includes('i18n')) confidence += 0.2;
  
  return Math.max(0, Math.min(1, confidence));
}

function extractFunctionName(line: string): string | undefined {
  const functionMatch = line.match(/function\s+(\w+)|(\w+)\s*=\s*\(/);
  return functionMatch ? (functionMatch[1] || functionMatch[2]) : undefined;
}

function extractAttributeName(line: string, position: number): string | undefined {
  const beforePosition = line.substring(0, position);
  const attributeMatch = beforePosition.match(/(\w+)=[^=]*$/);
  return attributeMatch ? attributeMatch[1] : undefined;
}