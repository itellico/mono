import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * @openapi
 * /api/v1/zones:
 *   get:
 *     summary: Get all zones
 *     description: Retrieves all saved zones
 *     tags:
 *       - Zones
 *     responses:
 *       200:
 *         description: Successful response
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
 *   post:
 *     summary: Create a new zone
 *     description: Creates a new zone with the provided configuration
 *     tags:
 *       - Zones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - elements
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               elements:
 *                 type: array
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Zone created successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */

const ZONES_DIR = join(process.cwd(), 'storage', 'zones');

// Ensure zones directory exists
async function ensureZonesDir() {
  if (!existsSync(ZONES_DIR)) {
    await mkdir(ZONES_DIR, { recursive: true });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureZonesDir();
    
    const files = await readdir(ZONES_DIR);
    const zoneFiles = files.filter(file => file.endsWith('.json'));
    
    const zones = await Promise.all(
      zoneFiles.map(async (file) => {
        const filePath = join(ZONES_DIR, file);
        const content = await readFile(filePath, 'utf-8');
        const zone = JSON.parse(content);
        return {
          id: file.replace('.json', ''),
          ...zone,
          savedAt: new Date().toISOString()
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: zones,
      meta: {
        total: zones.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch zones'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.elements) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and elements are required'
        },
        { status: 400 }
      );
    }

    await ensureZonesDir();

    // Generate unique ID and filename
    const zoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `${zoneId}.json`;
    const filePath = join(ZONES_DIR, filename);

    // Prepare zone data
    const zoneData = {
      id: zoneId,
      title: body.title,
      description: body.description || '',
      elements: body.elements,
      settings: body.settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to file
    await writeFile(filePath, JSON.stringify(zoneData, null, 2));

    return NextResponse.json({
      success: true,
      data: zoneData,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create zone'
      },
      { status: 500 }
    );
  }
} 