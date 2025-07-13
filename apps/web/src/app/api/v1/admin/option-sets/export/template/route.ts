import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * @openapi
 * /api/v1/admin/option-sets/export/template:
 *   get:
 *     summary: Export option set template
 *     description: Export a sample JSON structure for option set imports
 *     tags:
 *       - Admin
 *       - Option Sets
 *       - Import/Export
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Option set template exported successfully
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

    logger.info('Exporting option set template', { userId });

    const templateData = [
      {
        slug: 'hair-colors',
        label: {
          'en-US': 'Hair Colors',
          'de-DE': 'Haarfarben'
        },
        description: {
          'en-US': 'Available hair color options',
          'de-DE': 'Verfügbare Haarfarbenoptionen'
        },
        isActive: true,
        values: [
          {
            value: 'blonde',
            label: {
              'en-US': 'Blonde',
              'de-DE': 'Blond'
            },
            order: 1,
            canonicalRegion: 'US',
            regionalMappings: {},
            metadata: {
              hexColor: '#F5DEB3'
            },
            isActive: true
          },
          {
            value: 'brown',
            label: {
              'en-US': 'Brown',
              'de-DE': 'Braun'
            },
            order: 2,
            canonicalRegion: 'US',
            regionalMappings: {},
            metadata: {
              hexColor: '#8B4513'
            },
            isActive: true
          },
          {
            value: 'black',
            label: {
              'en-US': 'Black',
              'de-DE': 'Schwarz'
            },
            order: 3,
            canonicalRegion: 'US',
            regionalMappings: {},
            metadata: {
              hexColor: '#000000'
            },
            isActive: true
          }
        ]
      },
      {
        slug: 'clothing-sizes',
        label: {
          'en-US': 'Clothing Sizes',
          'de-DE': 'Kleidergrößen'
        },
        description: {
          'en-US': 'International clothing size options',
          'de-DE': 'Internationale Kleidergrößenoptionen'
        },
        isActive: true,
        values: [
          {
            value: 'xs',
            label: {
              'en-US': 'Extra Small (XS)',
              'de-DE': 'Extra Klein (XS)'
            },
            order: 1,
            canonicalRegion: 'US',
            regionalMappings: {
              'EU': '32',
              'UK': '6',
              'US': 'XS'
            },
            metadata: {
              measurements: {
                chest: '81-86 cm',
                waist: '61-66 cm',
                hips: '86-91 cm'
              }
            },
            isActive: true
          },
          {
            value: 's',
            label: {
              'en-US': 'Small (S)',
              'de-DE': 'Klein (S)'
            },
            order: 2,
            canonicalRegion: 'US',
            regionalMappings: {
              'EU': '34',
              'UK': '8',
              'US': 'S'
            },
            metadata: {
              measurements: {
                chest: '86-91 cm',
                waist: '66-71 cm',
                hips: '91-96 cm'
              }
            },
            isActive: true
          },
          {
            value: 'm',
            label: {
              'en-US': 'Medium (M)',
              'de-DE': 'Mittel (M)'
            },
            order: 3,
            canonicalRegion: 'US',
            regionalMappings: {
              'EU': '36',
              'UK': '10',
              'US': 'M'
            },
            metadata: {
              measurements: {
                chest: '91-96 cm',
                waist: '71-76 cm',
                hips: '96-101 cm'
              }
            },
            isActive: true
          }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: templateData,
      meta: {
        isTemplate: true,
        version: '1.0.0',
        description: 'Sample option set structure for imports with regional mappings'
      },
      message: 'Option set template exported successfully.'
    });

  } catch (error) {
    logger.error('Option set template export API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 