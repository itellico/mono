import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { documentationService } from '@/services/documentation.service';
import { documentationApprovalService } from '@/services/documentation-approval.service';
import { sendSuccess, sendError } from '@/utils/response-helpers';
import { createHash } from 'crypto';
import { glob } from 'glob';
import { promises as fs } from 'fs';
import path from 'path';
import { temporalClient } from '@/services/temporal-client.service';

/**
 * Platform-level documentation routes
 * Following 4-tier architecture: Platform → Tenant → Account → User
 */
export async function documentationRoutes(fastify: FastifyInstance) {
  // Get documentation structure
  fastify.get('/structure', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Get documentation structure',
      description: 'Retrieves the complete documentation structure with categories and files',
      querystring: Type.Object({
        refresh: Type.Optional(Type.Boolean({ description: 'Force refresh from filesystem' }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            name: Type.String(),
            path: Type.String(),
            files: Type.Array(Type.Object({
              path: Type.String(),
              title: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              lastModified: Type.String(),
              related: Type.Optional(Type.Array(Type.String()))
            })),
            subcategories: Type.Array(Type.Any())
          })
        })
      }
    },
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.read')]
  }, async (request, reply) => {
    const { refresh } = request.query as { refresh?: boolean };
    
    try {
      const structure = await documentationService.getDocumentationStructure(refresh);
      return createSuccessResponse(structure);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        createErrorResponse('DOCS_STRUCTURE_ERROR', 'Failed to retrieve documentation structure')
      );
    }
  });

  // Add implementation to learning log
  fastify.post('/implementations', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Add implementation to learning log',
      description: 'Records a new implementation in the learning system',
      body: Type.Object({
        feature: Type.String(),
        request: Type.String(),
        implementation: Type.String(),
        filesChanged: Type.Array(Type.String()),
        patternsUsed: Type.Array(Type.String()),
        learnings: Type.String(),
        gotchas: Type.Optional(Type.String()),
        relatedDocs: Type.Optional(Type.Array(Type.String()))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String()
          })
        })
      }
    },
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.write')]
  }, async (request, reply) => {
    try {
      await documentationService.addImplementation(request.body);
      return createSuccessResponse({ 
        message: 'Implementation recorded successfully' 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        createErrorResponse('IMPLEMENTATION_LOG_ERROR', 'Failed to record implementation')
      );
    }
  });

  // Get recent implementations
  fastify.get('/implementations/recent', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Get recent implementations',
      description: 'Retrieves recent implementations from the learning log',
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 5 }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            implementations: Type.Array(Type.Object({
              date: Type.String(),
              feature: Type.String(),
              summary: Type.String()
            }))
          })
        })
      }
    },
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.read')]
  }, async (request, reply) => {
    const { limit = 5 } = request.query as { limit?: number };
    
    try {
      const implementations = await documentationService.getRecentImplementations(limit);
      return createSuccessResponse({ implementations });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        createErrorResponse('RECENT_IMPLEMENTATIONS_ERROR', 'Failed to retrieve recent implementations')
      );
    }
  });

  // Refresh documentation cache
  fastify.post('/refresh', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Refresh documentation cache',
      description: 'Forces a refresh of the documentation structure cache',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String()
          })
        })
      }
    },
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.manage')]
  }, async (request, reply) => {
    try {
      await documentationService.getDocumentationStructure(true);
      return createSuccessResponse({ 
        message: 'Documentation cache refreshed successfully' 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        createErrorResponse('REFRESH_ERROR', 'Failed to refresh documentation cache')
      );
    }
  });

  // Propose documentation update (for Claude/developers)
  fastify.post('/propose', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Propose documentation update',
      description: 'Submit a documentation update for human review',
      body: Type.Object({
        type: Type.Union([
          Type.Literal('implementation'),
          Type.Literal('pattern'),
          Type.Literal('guide'),
          Type.Literal('api')
        ]),
        title: Type.String(),
        description: Type.String(),
        proposedBy: Type.String(),
        changes: Type.Array(Type.Object({
          file: Type.String(),
          before: Type.String(),
          after: Type.String()
        })),
        metadata: Type.Optional(Type.Object({
          feature: Type.Optional(Type.String()),
          filesChanged: Type.Optional(Type.Array(Type.String())),
          patternsUsed: Type.Optional(Type.Array(Type.String())),
          learnings: Type.Optional(Type.String()),
          gotchas: Type.Optional(Type.String())
        }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            message: Type.String()
          })
        })
      }
    },
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ]
  }, async (request, reply) => {
    try {
      const update = await documentationApprovalService.proposeUpdate(request.body);
      return createSuccessResponse({ 
        message: 'Documentation update proposed successfully. Awaiting human review.' 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        createErrorResponse('PROPOSE_ERROR', 'Failed to propose documentation update')
      );
    }
  });

  // Get pending updates
  fastify.get('/pending', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Get pending documentation updates',
      description: 'Retrieves all pending documentation updates awaiting review',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            updates: Type.Array(Type.Any())
          })
        })
      }
    },
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.review')]
  }, async (request, reply) => {
    try {
      const updates = await documentationApprovalService.getPendingUpdates();
      return createSuccessResponse({ updates });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        createErrorResponse('PENDING_ERROR', 'Failed to retrieve pending updates')
      );
    }
  });

  // Approve update
  fastify.post('/approve/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Approve documentation update',
      description: 'Approve a pending documentation update',
      params: Type.Object({
        id: Type.String()
      }),
      body: Type.Object({
        comment: Type.Optional(Type.String())
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String()
          })
        })
      }
    },
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.review')]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { comment } = request.body as { comment?: string };
    const userId = request.user?.userId || 'system';

    try {
      await documentationApprovalService.approveUpdate(id, userId, comment);
      return createSuccessResponse({ 
        message: 'Documentation update approved and applied successfully' 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        createErrorResponse('APPROVE_ERROR', error.message || 'Failed to approve update')
      );
    }
  });

  // Reject update
  fastify.post('/reject/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Reject documentation update',
      description: 'Reject a pending documentation update with reason',
      params: Type.Object({
        id: Type.String()
      }),
      body: Type.Object({
        reason: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String()
          })
        })
      }
    },
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.review')]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason: string };
    const userId = request.user?.userId || 'system';

    try {
      await documentationApprovalService.rejectUpdate(id, userId, reason);
      return createSuccessResponse({ 
        message: 'Documentation update rejected' 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        createErrorResponse('REJECT_ERROR', error.message || 'Failed to reject update')
      );
    }
  });

  // Get approval statistics
  fastify.get('/stats', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.documentation.read')
    ],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Get documentation approval statistics',
      description: 'Retrieves statistics about documentation proposals and reviews',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Record(Type.String(), Type.Number())
        })
      }
    },
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.read')]
  }, async (request, reply) => {
    try {
      const stats = await documentationApprovalService.getStats();
      return createSuccessResponse(stats);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        createErrorResponse('STATS_ERROR', 'Failed to retrieve statistics')
      );
    }
  });

  // Documentation quality check endpoint
  fastify.post('/quality-check', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.read')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Check documentation quality',
      description: 'Analyze documentation files for quality metrics',
      body: Type.Object({
        filePath: Type.String(),
        content: Type.String(),
        checkType: Type.Optional(Type.Union([
          Type.Literal('clarity'),
          Type.Literal('completeness'),
          Type.Literal('accuracy'),
          Type.Literal('all')
        ]))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            qualityScore: Type.Number({ minimum: 0, maximum: 100 }),
            issues: Type.Array(Type.Object({
              type: Type.String(),
              severity: Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high')]),
              message: Type.String(),
              line: Type.Optional(Type.Number()),
              suggestion: Type.Optional(Type.String())
            })),
            metadata: Type.Object({
              wordCount: Type.Number(),
              readingTime: Type.Number(),
              lastModified: Type.String(),
              hasCodeExamples: Type.Boolean(),
              hasTOC: Type.Boolean()
            })
          })
        })
      }
    }
  }, async (request, reply) => {
    const { filePath, content, checkType = 'all' } = request.body;

    // Calculate basic quality metrics
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    const hasCodeExamples = /```[\s\S]*?```/.test(content);
    const hasTOC = /#{2,}\s+Table of Contents|#{2,}\s+Contents|#{2,}\s+TOC/i.test(content);
    
    const issues = [];
    
    // Check for common documentation issues
    if (wordCount < 100) {
      issues.push({
        type: 'completeness',
        severity: 'high',
        message: 'Documentation is too short',
        suggestion: 'Add more detailed explanations and examples'
      });
    }
    
    // Check for missing sections
    const requiredSections = ['Overview', 'Usage', 'Examples'];
    for (const section of requiredSections) {
      if (!new RegExp(`##+\\s*${section}`, 'i').test(content)) {
        issues.push({
          type: 'completeness',
          severity: 'medium',
          message: `Missing section: ${section}`,
          suggestion: `Add a ${section} section to improve documentation completeness`
        });
      }
    }
    
    // Check for broken links (basic check)
    const brokenLinkPattern = /\[([^\]]+)\]\((\s*|#)\)/g;
    let match;
    let lineNumber = 1;
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (brokenLinkPattern.test(line)) {
        issues.push({
          type: 'accuracy',
          severity: 'high',
          message: 'Potential broken link detected',
          line: lineNumber,
          suggestion: 'Ensure all links have valid targets'
        });
      }
      lineNumber++;
    }
    
    // Calculate quality score
    const baseScore = 100;
    const highIssuesPenalty = issues.filter(i => i.severity === 'high').length * 15;
    const mediumIssuesPenalty = issues.filter(i => i.severity === 'medium').length * 10;
    const lowIssuesPenalty = issues.filter(i => i.severity === 'low').length * 5;
    
    const qualityScore = Math.max(0, baseScore - highIssuesPenalty - mediumIssuesPenalty - lowIssuesPenalty);
    
    return sendSuccess({
      qualityScore,
      issues,
      metadata: {
        wordCount,
        readingTime,
        lastModified: new Date().toISOString(),
        hasCodeExamples,
        hasTOC
      }
    });
  });

  // Documentation optimization queue endpoint
  fastify.post('/optimization-queue', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.write')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Add documentation to optimization queue',
      description: 'Queue documentation for LLM optimization',
      body: Type.Object({
        filePath: Type.String(),
        content: Type.String(),
        optimizationType: Type.Union([
          Type.Literal('clarity'),
          Type.Literal('completeness'),
          Type.Literal('technical_accuracy'),
          Type.Literal('seo'),
          Type.Literal('all')
        ]),
        priority: Type.Optional(Type.Union([
          Type.Literal('low'),
          Type.Literal('medium'),
          Type.Literal('high')
        ]))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            queueId: Type.String(),
            status: Type.String(),
            estimatedProcessingTime: Type.Number()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { filePath, content, optimizationType, priority = 'medium' } = request.body;
    
    // Generate unique queue ID
    const queueId = createHash('sha256')
      .update(`${filePath}-${Date.now()}`)
      .digest('hex')
      .substring(0, 12);
    
    // Store in Redis queue
    const queueKey = `doc:optimization:queue:${priority}`;
    await fastify.redis.rpush(queueKey, JSON.stringify({
      queueId,
      filePath,
      content,
      optimizationType,
      priority,
      createdAt: new Date().toISOString(),
      status: 'queued'
    }));
    
    // Set TTL for queue item details
    await fastify.redis.setex(
      `doc:optimization:item:${queueId}`,
      86400, // 24 hours
      JSON.stringify({
        filePath,
        optimizationType,
        priority,
        status: 'queued',
        createdAt: new Date().toISOString()
      })
    );
    
    return sendSuccess({
      queueId,
      status: 'queued',
      estimatedProcessingTime: priority === 'high' ? 300 : priority === 'medium' ? 900 : 1800
    });
  });

  // Documentation analytics endpoint
  fastify.post('/analytics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.read')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Submit documentation analytics',
      description: 'Track documentation usage and effectiveness',
      body: Type.Object({
        documentPath: Type.String(),
        event: Type.Union([
          Type.Literal('view'),
          Type.Literal('search'),
          Type.Literal('helpful'),
          Type.Literal('not_helpful'),
          Type.Literal('edit_requested')
        ]),
        metadata: Type.Optional(Type.Object({
          searchQuery: Type.Optional(Type.String()),
          timeSpent: Type.Optional(Type.Number()),
          userId: Type.Optional(Type.String()),
          feedback: Type.Optional(Type.String())
        }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            eventId: Type.String()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { documentPath, event, metadata = {} } = request.body;
    
    // Generate event ID
    const eventId = createHash('sha256')
      .update(`${documentPath}-${event}-${Date.now()}`)
      .digest('hex')
      .substring(0, 12);
    
    // Store analytics event
    const analyticsKey = `doc:analytics:${new Date().toISOString().split('T')[0]}`;
    await fastify.redis.rpush(analyticsKey, JSON.stringify({
      eventId,
      documentPath,
      event,
      metadata,
      timestamp: new Date().toISOString(),
      userId: request.user?.userId
    }));
    
    // Update document metrics
    const metricsKey = `doc:metrics:${documentPath}`;
    await fastify.redis.hincrby(metricsKey, event, 1);
    
    // Set TTL for daily analytics (keep for 90 days)
    await fastify.redis.expire(analyticsKey, 7776000);
    
    return sendSuccess({ eventId });
  });

  // Smart tagging endpoint
  fastify.post('/smart-tag', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.write')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Generate smart tags for documentation',
      description: 'Automatically categorize and tag documentation',
      body: Type.Object({
        filePath: Type.String(),
        content: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            category: Type.String(),
            tags: Type.Array(Type.String()),
            relatedDocuments: Type.Array(Type.String()),
            targetAudience: Type.Array(Type.String()),
            complexity: Type.Union([
              Type.Literal('beginner'),
              Type.Literal('intermediate'),
              Type.Literal('advanced')
            ])
          })
        })
      }
    }
  }, async (request, reply) => {
    const { filePath, content } = request.body;
    
    // Basic categorization based on file path and content
    let category = 'general';
    if (filePath.includes('/architecture/')) category = 'architecture';
    else if (filePath.includes('/features/')) category = 'features';
    else if (filePath.includes('/guides/')) category = 'guides';
    else if (filePath.includes('/testing/')) category = 'testing';
    else if (filePath.includes('/workflows/')) category = 'workflows';
    
    // Extract potential tags from content
    const tags = [];
    
    // Technology detection
    if (/react|component|hooks?|state/i.test(content)) tags.push('react');
    if (/fastify|api|endpoint|route/i.test(content)) tags.push('api');
    if (/prisma|database|postgres|sql/i.test(content)) tags.push('database');
    if (/redis|cache|caching/i.test(content)) tags.push('caching');
    if (/auth|authentication|jwt|permission/i.test(content)) tags.push('authentication');
    if (/docker|container|kubernetes/i.test(content)) tags.push('devops');
    if (/test|jest|vitest|cypress/i.test(content)) tags.push('testing');
    
    // Feature detection
    if (/multi-tenant|tenant/i.test(content)) tags.push('multi-tenant');
    if (/workflow|temporal/i.test(content)) tags.push('workflows');
    if (/monitor|metric|grafana|prometheus/i.test(content)) tags.push('monitoring');
    
    // Determine complexity
    const codeBlockCount = (content.match(/```/g) || []).length / 2;
    const technicalTerms = (content.match(/\b(async|await|interface|abstract|polymorphism|dependency injection|microservice|orchestration)\b/gi) || []).length;
    
    let complexity: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (codeBlockCount > 5 || technicalTerms > 10) complexity = 'advanced';
    else if (codeBlockCount > 2 || technicalTerms > 5) complexity = 'intermediate';
    
    // Determine target audience
    const targetAudience = [];
    if (/developer|programming|code|implementation/i.test(content)) targetAudience.push('developer');
    if (/admin|configuration|setup|deployment/i.test(content)) targetAudience.push('admin');
    if (/user|end-user|usage/i.test(content)) targetAudience.push('end-user');
    if (/devops|infrastructure|deployment|ci\/cd/i.test(content)) targetAudience.push('devops');
    
    // Find related documents (simplified - in production, use vector similarity)
    const relatedDocuments = [];
    if (tags.includes('authentication')) {
      relatedDocuments.push('/docs/architecture/AUTHENTICATION_BEST_PRACTICES');
      relatedDocuments.push('/docs/features/PERMISSION_SYSTEM_IMPLEMENTATION');
    }
    if (tags.includes('api')) {
      relatedDocuments.push('/docs/architecture/4-TIER-API-ARCHITECTURE');
      relatedDocuments.push('/docs/architecture/API_RESPONSE_FORMAT_STANDARD');
    }
    
    return sendSuccess({
      category,
      tags: [...new Set(tags)], // Remove duplicates
      relatedDocuments,
      targetAudience: targetAudience.length > 0 ? targetAudience : ['developer'],
      complexity
    });
  });

  // Code validation endpoint
  fastify.post('/validate-code-examples', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.read')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Validate code examples in documentation',
      description: 'Check if code examples are syntactically correct and up-to-date',
      body: Type.Object({
        filePath: Type.String(),
        content: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalExamples: Type.Number(),
            validExamples: Type.Number(),
            issues: Type.Array(Type.Object({
              line: Type.Number(),
              language: Type.String(),
              error: Type.String(),
              suggestion: Type.Optional(Type.String())
            }))
          })
        })
      }
    }
  }, async (request, reply) => {
    const { content } = request.body;
    
    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'plaintext';
      const code = match[2];
      const line = content.substring(0, match.index).split('\n').length;
      
      codeBlocks.push({ language, code, line });
    }
    
    const issues = [];
    let validExamples = 0;
    
    for (const block of codeBlocks) {
      try {
        // Basic validation based on language
        if (block.language === 'typescript' || block.language === 'javascript') {
          // Check for common issues
          if (block.code.includes('console.log') && !block.code.includes('// eslint-disable')) {
            issues.push({
              line: block.line,
              language: block.language,
              error: 'Console.log statement found',
              suggestion: 'Remove console.log or add eslint disable comment'
            });
          } else {
            validExamples++;
          }
        } else if (block.language === 'json') {
          try {
            JSON.parse(block.code);
            validExamples++;
          } catch (e) {
            issues.push({
              line: block.line,
              language: block.language,
              error: 'Invalid JSON syntax',
              suggestion: 'Fix JSON syntax errors'
            });
          }
        } else {
          // For other languages, consider valid if not empty
          if (block.code.trim().length > 0) {
            validExamples++;
          }
        }
      } catch (error) {
        issues.push({
          line: block.line,
          language: block.language,
          error: `Validation error: ${error.message}`
        });
      }
    }
    
    return sendSuccess({
      totalExamples: codeBlocks.length,
      validExamples,
      issues
    });
  });

  // List all documentation files
  fastify.get('/files', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.read')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'List all documentation files',
      description: 'Get a list of all documentation files in the system',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            files: Type.Array(Type.Object({
              path: Type.String(),
              type: Type.String(),
              size: Type.Number(),
              lastModified: Type.String()
            })),
            total: Type.Number()
          })
        })
      }
    }
  }, async (request, reply) => {
    const docsPath = path.join(process.cwd(), '..', '..', 'docs');
    
    try {
      // Find all markdown and HTML files
      const patterns = ['**/*.md', '**/*.html'];
      const files = [];
      
      for (const pattern of patterns) {
        const matches = await glob(pattern, {
          cwd: docsPath,
          nodir: true
        });
        
        for (const match of matches) {
          const fullPath = path.join(docsPath, match);
          const stats = await fs.stat(fullPath);
          
          files.push({
            path: match,
            type: path.extname(match).substring(1),
            size: stats.size,
            lastModified: stats.mtime.toISOString()
          });
        }
      }
      
      // Sort by last modified date
      files.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      
      return sendSuccess({
        files,
        total: files.length
      });
    } catch (error) {
      return reply.status(500).send(
        sendError('DOCUMENTATION_SCAN_FAILED', 'Failed to scan documentation files')
      );
    }
  });

  // Start complex documentation processing workflow (Temporal)
  fastify.post('/process-complex', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.write')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Start complex documentation processing',
      description: 'Initiates a Temporal workflow for complex multi-stage documentation processing',
      body: Type.Object({
        documents: Type.Array(Type.Object({
          id: Type.String(),
          path: Type.String(),
          content: Type.String(),
          metadata: Type.Optional(Type.Record(Type.String(), Type.Any()))
        })),
        operation: Type.Union([
          Type.Literal('optimize'),
          Type.Literal('migrate'),
          Type.Literal('bulk-update'),
          Type.Literal('quality-check')
        ]),
        options: Type.Optional(Type.Object({
          aiModel: Type.Optional(Type.Union([
            Type.Literal('gpt-4'),
            Type.Literal('claude-3'),
            Type.Literal('both')
          ])),
          requireApproval: Type.Optional(Type.Boolean()),
          priority: Type.Optional(Type.Union([
            Type.Literal('low'),
            Type.Literal('medium'),
            Type.Literal('high')
          ])),
          notificationChannels: Type.Optional(Type.Array(Type.String()))
        }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            workflowId: Type.String(),
            runId: Type.String(),
            status: Type.String()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { documents, operation, options } = request.body;

    try {
      // Validate complexity threshold
      const totalSize = documents.reduce((sum, doc) => sum + doc.content.length, 0);
      const complexity = calculateDocumentComplexity(documents);
      
      if (complexity < 5 && totalSize < 10000) {
        return reply.status(400).send(
          sendError('LOW_COMPLEXITY', 'Use the regular endpoints for simple operations. This endpoint is for complex, multi-stage processing.')
        );
      }

      // Initialize Temporal client if needed
      await temporalClient.initialize();

      // Start workflow
      const result = await temporalClient.startDocumentationWorkflow(
        { documents, operation, options }
      );

      return sendSuccess({
        workflowId: result.workflowId,
        runId: result.runId,
        status: 'RUNNING'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        sendError('WORKFLOW_START_FAILED', 'Failed to start documentation workflow')
      );
    }
  });

  // Get workflow status
  fastify.get('/workflow/:workflowId', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.read')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Get workflow status',
      description: 'Check the status of a documentation processing workflow',
      params: Type.Object({
        workflowId: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            status: Type.String(),
            result: Type.Optional(Type.Any()),
            error: Type.Optional(Type.String())
          })
        })
      }
    }
  }, async (request, reply) => {
    const { workflowId } = request.params as { workflowId: string };

    try {
      const status = await temporalClient.getWorkflowStatus(workflowId);
      return sendSuccess(status);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        sendError('WORKFLOW_STATUS_FAILED', 'Failed to get workflow status')
      );
    }
  });

  // Signal workflow (pause/resume/cancel)
  fastify.post('/workflow/:workflowId/signal', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.write')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'Signal workflow',
      description: 'Send a signal to control workflow execution',
      params: Type.Object({
        workflowId: Type.String()
      }),
      body: Type.Object({
        signal: Type.Union([
          Type.Literal('pause'),
          Type.Literal('resume'),
          Type.Literal('cancel')
        ])
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { workflowId } = request.params as { workflowId: string };
    const { signal } = request.body;

    try {
      await temporalClient.signalWorkflow(workflowId, signal);
      return sendSuccess({
        message: `Workflow ${signal} signal sent successfully`
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        sendError('WORKFLOW_SIGNAL_FAILED', 'Failed to signal workflow')
      );
    }
  });

  // List active workflows
  fastify.get('/workflows', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.documentation.read')],
    schema: {
      tags: ['platform.documentation'],
      summary: 'List active workflows',
      description: 'Get a list of active documentation processing workflows',
      querystring: Type.Object({
        pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            workflows: Type.Array(Type.Object({
              workflowId: Type.String(),
              runId: Type.String(),
              type: Type.String(),
              status: Type.String(),
              startTime: Type.String()
            })),
            total: Type.Number()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { pageSize = 50 } = request.query as { pageSize?: number };

    try {
      const workflows = await temporalClient.listWorkflows({ pageSize });
      return sendSuccess({
        workflows,
        total: workflows.length
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(
        sendError('LIST_WORKFLOWS_FAILED', 'Failed to list workflows')
      );
    }
  });
}

// Helper function to calculate document complexity
function calculateDocumentComplexity(documents: any[]): number {
  let complexity = 0;
  
  for (const doc of documents) {
    // Size factor
    complexity += doc.content.length / 1000;
    
    // Code block factor
    const codeBlocks = (doc.content.match(/```/g) || []).length / 2;
    complexity += codeBlocks * 2;
    
    // Technical terms factor
    const technicalTerms = (doc.content.match(/\b(async|await|interface|class|function|api|endpoint|workflow|temporal|microservice)\b/gi) || []).length;
    complexity += technicalTerms * 0.1;
    
    // Cross-references factor
    const crossRefs = (doc.content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    complexity += crossRefs * 0.5;
  }
  
  return Math.round(complexity);
}

export default documentationRoutes;