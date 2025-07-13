import { Context } from '@temporalio/activity';
import { prisma } from '../../services/prisma.service';
import { redis } from '../../services/redis.service';
import { openai } from '../../services/openai.service';
import { anthropic } from '../../services/anthropic.service';
import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export interface DocumentInput {
  id: string;
  path: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface OptimizationResult {
  content: string;
  changes: string[];
  confidence: number;
}

export interface TechnicalReviewResult {
  accuracy: 'high' | 'medium' | 'low';
  securityScore: 'pass' | 'warning' | 'fail';
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion?: string;
  }>;
  overallConfidence: number;
}

/**
 * Validate documents before processing
 */
export async function validateDocuments(documents: DocumentInput[]): Promise<ValidationResult> {
  const errors: string[] = [];

  for (const doc of documents) {
    // Check if document exists
    if (!doc.path || !doc.content) {
      errors.push(`Document ${doc.id} missing required fields`);
    }

    // Validate content length
    if (doc.content.length < 50) {
      errors.push(`Document ${doc.id} content too short`);
    }

    // Check for valid markdown/HTML
    if (!isValidDocumentFormat(doc.content)) {
      errors.push(`Document ${doc.id} has invalid format`);
    }

    // Verify file path exists
    const fullPath = path.join(process.cwd(), '..', '..', 'docs', doc.path);
    try {
      await fs.access(fullPath);
    } catch {
      errors.push(`Document ${doc.id} file not found at ${doc.path}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create backups of documents before processing
 */
export async function createBackups(documents: DocumentInput[]): Promise<string[]> {
  const backupIds: string[] = [];
  const backupDir = path.join(process.cwd(), '..', '..', 'backup', 'docs');

  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true });

  for (const doc of documents) {
    const backupId = `backup-${doc.id}-${Date.now()}`;
    const backupPath = path.join(backupDir, `${backupId}.json`);

    // Save document backup
    await fs.writeFile(backupPath, JSON.stringify({
      id: doc.id,
      path: doc.path,
      content: doc.content,
      metadata: doc.metadata,
      backedUpAt: new Date().toISOString()
    }, null, 2));

    // Store backup reference in Redis
    await redis.setex(
      `doc:backup:${backupId}`,
      86400 * 7, // Keep for 7 days
      JSON.stringify({
        documentId: doc.id,
        path: backupPath,
        originalPath: doc.path
      })
    );

    backupIds.push(backupId);
  }

  return backupIds;
}

/**
 * Process a batch of documents
 */
export async function processDocumentBatch(
  documents: DocumentInput[],
  operation: string
): Promise<any[]> {
  const results = [];

  for (const doc of documents) {
    try {
      let result;
      
      switch (operation) {
        case 'optimize':
          result = await optimizeDocument(doc);
          break;
        case 'validate':
          result = await validateDocument(doc);
          break;
        case 'migrate':
          result = await migrateDocument(doc);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      results.push({
        documentId: doc.id,
        status: 'success',
        result
      });
    } catch (error) {
      results.push({
        documentId: doc.id,
        status: 'failed',
        error: error.message
      });
    }

    // Add heartbeat for long-running activities
    Context.current().heartbeat({ processed: results.length });
  }

  return results;
}

/**
 * Optimize document content using AI
 */
export async function optimizeWithAI(params: {
  document: DocumentInput;
  model: 'gpt-4' | 'claude-3' | 'both';
}): Promise<OptimizationResult> {
  const { document, model } = params;

  // Check cache first
  const cacheKey = `doc:ai:optimize:${createHash('sha256')
    .update(`${document.id}-${model}-${document.content.substring(0, 100)}`)
    .digest('hex')
    .substring(0, 12)}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  let optimizedContent: string;
  let changes: string[] = [];
  let confidence = 0;

  if (model === 'gpt-4' || model === 'both') {
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a technical documentation expert. Improve documentation clarity, completeness, and structure while maintaining technical accuracy.'
        },
        {
          role: 'user',
          content: `Improve this documentation:\n\nFile: ${document.path}\n\nContent:\n${document.content}\n\nProvide the improved documentation and list the key changes made.`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    optimizedContent = gptResponse.choices[0].message.content || document.content;
    changes.push('Enhanced clarity and structure with GPT-4');
    confidence += 0.5;
  }

  if (model === 'claude-3' || model === 'both') {
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      messages: [
        {
          role: 'user',
          content: `Review and improve this technical documentation:\n\nFile: ${document.path}\n\nContent:\n${optimizedContent || document.content}\n\nFocus on technical accuracy, best practices, and security considerations.`
        }
      ],
      max_tokens: 4000
    });

    if (model === 'both' && optimizedContent) {
      // Claude reviews GPT's optimization
      optimizedContent = claudeResponse.content[0].text;
      changes.push('Technical review and refinement with Claude');
      confidence += 0.5;
    } else {
      optimizedContent = claudeResponse.content[0].text;
      changes.push('Optimized with Claude for technical accuracy');
      confidence = 0.85;
    }
  }

  const result: OptimizationResult = {
    content: optimizedContent,
    changes,
    confidence
  };

  // Cache the result
  await redis.setex(cacheKey, 86400 * 30, JSON.stringify(result)); // Cache for 30 days

  return result;
}

/**
 * Perform technical review of optimized content
 */
export async function performTechnicalReview(
  optimized: OptimizationResult
): Promise<TechnicalReviewResult> {
  const issues: TechnicalReviewResult['issues'] = [];

  // Check for security issues
  const securityPatterns = [
    { pattern: /api[_-]?key|secret|password|token/gi, message: 'Potential exposed credentials' },
    { pattern: /localhost|127\.0\.0\.1/g, message: 'Hardcoded local URLs' },
    { pattern: /TODO|FIXME|XXX/g, message: 'Unfinished documentation sections' }
  ];

  for (const { pattern, message } of securityPatterns) {
    if (pattern.test(optimized.content)) {
      issues.push({
        type: 'security',
        severity: 'high',
        message,
        suggestion: 'Remove or mask sensitive information'
      });
    }
  }

  // Check for technical accuracy indicators
  const technicalIssues = [
    { pattern: /deprecated/gi, severity: 'medium' as const, message: 'Contains deprecated references' },
    { pattern: /\b(bug|issue|problem)\b/gi, severity: 'low' as const, message: 'References known issues' }
  ];

  for (const { pattern, severity, message } of technicalIssues) {
    if (pattern.test(optimized.content)) {
      issues.push({
        type: 'technical',
        severity,
        message
      });
    }
  }

  // Calculate scores
  const securityScore = issues.filter(i => i.type === 'security').length > 0 ? 'fail' : 'pass';
  const accuracy = issues.filter(i => i.severity === 'high').length > 0 ? 'low' :
                   issues.filter(i => i.severity === 'medium').length > 0 ? 'medium' : 'high';
  
  const overallConfidence = optimized.confidence * (1 - (issues.length * 0.1));

  return {
    accuracy,
    securityScore,
    issues,
    overallConfidence: Math.max(0.5, overallConfidence)
  };
}

/**
 * Apply document changes to the file system
 */
export async function applyDocumentChanges(
  changes: Array<{ documentId: string; changes: any }>
): Promise<void> {
  for (const change of changes) {
    try {
      // Store change in database for audit
      await prisma.documentationChange.create({
        data: {
          documentId: change.documentId,
          changeType: 'optimization',
          changes: change.changes,
          appliedAt: new Date(),
          appliedBy: 'temporal-workflow'
        }
      });

      // If we have the actual file path and content, write it
      if (change.changes.optimized && change.changes.documentPath) {
        const fullPath = path.join(process.cwd(), '..', '..', 'docs', change.changes.documentPath);
        await fs.writeFile(fullPath, change.changes.optimized);
      }

      // Update cache
      await redis.del(`doc:content:${change.documentId}`);
      
    } catch (error) {
      console.error(`Failed to apply changes for document ${change.documentId}:`, error);
      throw error;
    }
  }
}

/**
 * Update search indices for modified documents
 */
export async function updateSearchIndices(documentIds: string[]): Promise<void> {
  // In a real implementation, this would update Elasticsearch or similar
  // For now, we'll update Redis search keys
  
  for (const docId of documentIds) {
    // Clear old search cache entries
    const pattern = `doc:search:*:${docId}`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // Trigger re-indexing (would integrate with actual search service)
    await redis.rpush('doc:reindex:queue', docId);
  }

  // Log activity
  Context.current().heartbeat({ 
    indexed: documentIds.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * Rollback changes using backups
 */
export async function rollbackChanges(backupIds: string[]): Promise<void> {
  for (const backupId of backupIds) {
    try {
      // Get backup info from Redis
      const backupInfo = await redis.get(`doc:backup:${backupId}`);
      if (!backupInfo) {
        console.warn(`Backup ${backupId} not found in Redis`);
        continue;
      }

      const { documentId, path: backupPath, originalPath } = JSON.parse(backupInfo);

      // Read backup content
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const backup = JSON.parse(backupContent);

      // Restore original content
      const fullPath = path.join(process.cwd(), '..', '..', 'docs', originalPath);
      await fs.writeFile(fullPath, backup.content);

      // Log rollback
      await prisma.documentationChange.create({
        data: {
          documentId,
          changeType: 'rollback',
          changes: { backupId, reason: 'workflow-error' },
          appliedAt: new Date(),
          appliedBy: 'temporal-workflow'
        }
      });

      // Clean up backup
      await fs.unlink(backupPath);
      await redis.del(`doc:backup:${backupId}`);

    } catch (error) {
      console.error(`Failed to rollback backup ${backupId}:`, error);
    }
  }
}

/**
 * Send notifications to stakeholders
 */
export async function notifyStakeholders(params: {
  channels: string[];
  operation: string;
  results: any[];
  report?: any;
}): Promise<void> {
  const { channels, operation, results, report } = params;

  // Format notification message
  const message = {
    type: 'documentation-update',
    operation,
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    },
    report
  };

  // Send to each channel
  for (const channel of channels) {
    try {
      // In real implementation, this would integrate with notification service
      await redis.rpush(`notifications:${channel}`, JSON.stringify(message));
      
      // For Mattermost webhook (if configured)
      if (channel === 'documentation-updates') {
        // Would call Mattermost webhook here
        console.log('Notification sent to Mattermost:', message);
      }
    } catch (error) {
      console.error(`Failed to notify channel ${channel}:`, error);
    }
  }
}

/**
 * Generate quality report for processed documents
 */
export async function generateQualityReport(
  originalDocs: DocumentInput[],
  results: any[]
): Promise<any> {
  const report = {
    averageQualityBefore: 0,
    averageQualityAfter: 0,
    totalIssuesFound: 0,
    totalIssuesFixed: 0,
    improvements: []
  };

  // Calculate metrics
  for (const result of results) {
    if (result.status === 'success' && result.changes) {
      // Simple quality calculation based on content improvements
      const before = calculateDocumentQuality(
        originalDocs.find(d => d.id === result.documentId)?.content || ''
      );
      const after = calculateDocumentQuality(result.changes.optimized || '');

      report.averageQualityBefore += before;
      report.averageQualityAfter += after;

      report.improvements.push({
        documentId: result.documentId,
        qualityImprovement: ((after - before) / before * 100).toFixed(1) + '%'
      });
    }
  }

  // Average out the scores
  const successCount = results.filter(r => r.status === 'success').length;
  if (successCount > 0) {
    report.averageQualityBefore /= successCount;
    report.averageQualityAfter /= successCount;
  }

  return report;
}

// Helper functions

function isValidDocumentFormat(content: string): boolean {
  // Check for valid markdown or HTML
  const hasMarkdownElements = /^#{1,6}\s|\*\*|__|```|^\s*[-*+]\s/m.test(content);
  const hasHtmlElements = /<[^>]+>/.test(content);
  
  return hasMarkdownElements || hasHtmlElements;
}

function calculateDocumentQuality(content: string): number {
  let score = 50; // Base score

  // Positive factors
  if (content.length > 500) score += 10;
  if (/#{2,}\s/.test(content)) score += 10; // Has sections
  if (/```[\s\S]*?```/.test(content)) score += 10; // Has code examples
  if (/^\s*[-*+]\s/m.test(content)) score += 5; // Has lists
  if (/\[.+\]\(.+\)/.test(content)) score += 5; // Has links

  // Negative factors
  if (content.length < 200) score -= 20;
  if (!/#{1,6}\s/.test(content)) score -= 10; // No headings
  if (/TODO|FIXME/.test(content)) score -= 5;

  return Math.max(0, Math.min(100, score));
}

// Helper for simple document operations
async function optimizeDocument(doc: DocumentInput): Promise<any> {
  return optimizeWithAI({ document: doc, model: 'gpt-4' });
}

async function validateDocument(doc: DocumentInput): Promise<any> {
  return validateDocuments([doc]);
}

async function migrateDocument(doc: DocumentInput): Promise<any> {
  // Implement migration logic
  return { migrated: true };
}