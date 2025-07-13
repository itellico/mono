import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * @openapi
 * /api/v1/admin/model-schemas/export/template:
 *   get:
 *     summary: Export model schema template
 *     description: Export a sample JSON structure for model schema imports
 *     tags:
 *       - Admin
 *       - Model Schemas
 *       - Import/Export
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Model schema template exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     isTemplate:
 *                       type: boolean
 *                     version:
 *                       type: string
 *                     description:
 *                       type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id || '0');

    logger.info('Exporting model schema template', { userId });

    const templateData = [
      {
        type: 'profile',
        subType: 'model',
        displayName: {
          'en-US': 'Model Profile',
          'de-DE': 'Model Profil'
        },
        description: {
          'en-US': 'Profile schema for models',
          'de-DE': 'Profil-Schema für Models'
        },
        schema: {
          type: 'object',
          properties: {
            personalInfo: {
              type: 'object',
              properties: {
                height: { type: 'number', minimum: 100, maximum: 250 },
                weight: { type: 'number', minimum: 30, maximum: 200 },
                eyeColor: { type: 'string', enum: ['blue', 'brown', 'green', 'hazel', 'gray'] },
                hairColor: { type: 'string', enum: ['blonde', 'brown', 'black', 'red', 'gray'] }
              }
            },
            experience: {
              type: 'object',
              properties: {
                yearsActive: { type: 'number', minimum: 0 },
                specialties: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          },
          required: ['personalInfo']
        },
        isActive: true,
        isTemplate: false,
        version: '1.0.0'
      },
      {
        type: 'application',
        subType: 'casting',
        displayName: {
          'en-US': 'Casting Application',
          'de-DE': 'Casting-Bewerbung'
        },
        description: {
          'en-US': 'Application form for casting calls',
          'de-DE': 'Bewerbungsformular für Castings'
        },
        schema: {
          type: 'object',
          properties: {
            availability: {
              type: 'object',
              properties: {
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                flexible: { type: 'boolean' }
              }
            },
            motivation: {
              type: 'string',
              maxLength: 1000
            },
            portfolio: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['photo', 'video', 'document'] },
                  url: { type: 'string', format: 'uri' },
                  description: { type: 'string' }
                }
              }
            }
          },
          required: ['availability', 'motivation']
        },
        isActive: true,
        isTemplate: false,
        version: '1.0.0'
      }
    ];

    return NextResponse.json({
      success: true,
      data: templateData,
      meta: {
        isTemplate: true,
        version: '1.0.0',
        description: 'Sample model schema structure for imports'
      },
      message: 'Model schema template exported successfully.'
    });

  } catch (error) {
    logger.error('Model schema template export API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 