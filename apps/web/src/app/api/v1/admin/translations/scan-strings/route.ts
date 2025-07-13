import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import path from 'path';

/**
 * @openapi
 * /api/v1/admin/translations/scan-strings:
 *   get:
 *     summary: Scan React components for hardcoded strings and missing translation keys
 *     description: |
 *       Admin endpoint that scans all React/TypeScript files for:
 *       - Hardcoded strings that should be in translation JSON files
 *       - t() calls with keys that don't exist in JSON files
 *       - Unused translation keys in JSON files
 *       
 *       Requires admin permissions. Enforces JSON-first translation approach per cursor rules.
 *     tags:
 *       - Admin
 *       - Translations
 *       - Development
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Scan results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hardcodedStrings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           string:
 *                             type: string
 *                           file:
 *                             type: string
 *                           line:
 *                             type: number
 *                           code:
 *                             type: string
 *                     missingTranslationKeys:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           file:
 *                             type: string
 *                           line:
 *                             type: number
 *                           code:
 *                             type: string
 *                     unusedTranslationKeys:
 *                       type: array
 *                       items:
 *                         type: string
 *                     totalFiles:
 *                       type: number
 *                     totalStrings:
 *                       type: number
 *                     totalTranslationCalls:
 *                       type: number
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       401:
 *         description: Unauthorized - No valid session
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/v1/admin/translations/scan-strings');

    // Validate session
    const session = await auth();
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to scan-strings endpoint');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use unified permission system to check access
    const userContext = extractUserContext(session);
    const apiAccess = canAccessAPI(userContext, '/api/v1/admin/translations/scan-strings', 'GET');

    if (!apiAccess.allowed) {
      logger.warn(`Access denied for scan-strings: ${apiAccess.reason || 'Insufficient permissions'}`, {
        userId: userContext.userId,
        adminRole: userContext.adminRole,
        reason: apiAccess.reason
      });
      return NextResponse.json(
        { success: false, error: apiAccess.reason || 'Admin access required' },
        { status: 403 }
      );
    }

    logger.info('Access granted for scan-strings', {
      userId: userContext.userId,
      adminRole: userContext.adminRole
    });

    // Load and execute the scanner
    try {
      const scannerPath = path.join(process.cwd(), 'scripts', 'scan-react-strings.js');

      // Use eval to load the scanner (cache busting handled by restarting server)
      const ReactStringScanner = eval('require')(scannerPath);

      const scanner = new ReactStringScanner();
      const results = await scanner.scan();

      if (!results) {
        logger.error('String scanner execution failed');
        return NextResponse.json(
          { success: false, error: 'Scanner execution failed' },
          { status: 500 }
        );
      }

      logger.info(`String scan completed: ${results.hardcodedStrings.length} hardcoded, ${results.missingTranslationKeys.length} missing`);

      return NextResponse.json({
        success: true,
        data: results,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

    } catch (scannerError: any) {
      logger.error(`String scanner error: ${scannerError.message}`);

      return NextResponse.json(
        { 
          success: false, 
          error: 'Scanner execution failed',
          details: scannerError.message 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    logger.error(`API error in scan-strings: ${error.message}`);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 