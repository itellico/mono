import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/with-admin-auth';
import { logger } from '@/lib/logger';
import path from 'path';

/**
 * @openapi
 * /api/v1/admin/translations/extract-strings:
 *   post:
 *     tags:
 *       - Translations
 *     summary: Validate translation JSON structure
 *     description: Validates JSON structure and ensures consistency across languages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Translation validation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 results:
 *                   type: object
 *                   properties:
 *                     totalKeys:
 *                       type: number
 *                       example: 348
 *                     languagesProcessed:
 *                       type: number
 *                       example: 2
 *                     missingTranslations:
 *                       type: number
 *                       example: 0
 *                     structuralConflicts:
 *                       type: number
 *                       example: 0
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *       400:
 *         description: Translation validation failed
 *       500:
 *         description: Internal server error
 */
async function POST(request: NextRequest) {
  try {
    logger.info('Starting translation JSON validation');

    // Load the validator using eval to bypass module resolution issues
    const validatorPath = path.join(process.cwd(), 'scripts', 'validate-translations.js');
    const TranslationValidator = eval('require')(validatorPath);

    // Create validator instance
    const validator = new TranslationValidator();

    // Run validation
    const isValid = await validator.validate();

    // Extract results
    const results = {
      totalKeys: validator.stats.totalKeys,
      languagesProcessed: validator.stats.languagesProcessed,
      missingTranslations: validator.stats.missingTranslations,
      structuralConflicts: validator.stats.structuralConflicts,
      errors: validator.errors,
      warnings: validator.warnings,
      isValid
    };

    logger.info('Translation validation completed', results);

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Translation structure is valid',
        results
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Translation validation failed',
        results
      }, { status: 400 });
    }

  } catch (error: any) {
    logger.error('Translation validation API error', { 
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error during translation validation',
      details: error.message
    }, { status: 500 });
  }
}

// Apply admin authentication middleware and export
export const authenticatedPOST = withAdminAuth(POST, ['super_admin', 'tenant_admin']);

export { authenticatedPOST as POST }; 