import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { mediaAssets } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const STORAGE_BASE_PATH = process.env.STORAGE_BASE_PATH || './public';

// GET /media/[...path] - Serve media files
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  let requestedPath: string[] | undefined;

  try {
    const params = await context.params;
    const path = params.path;
    requestedPath = path;

    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Reconstruct the file path using the storage base path + media folder
    const filePath = join(STORAGE_BASE_PATH, 'media', ...path);

    // Security check: ensure path is within storage directory
    const normalizedBasePath = join(STORAGE_BASE_PATH, 'media');
    if (!filePath.startsWith(normalizedBasePath)) {
      logger.warn('Attempted access outside media root', { requestedPath: filePath });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
      // Check if file exists
      const stats = await stat(filePath);
      if (!stats.isFile()) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      // Read the file
      const fileBuffer = await readFile(filePath);

      // Determine content type
      const contentType = getContentType(filePath);

      // Log successful access
      logger.info('Media file served', { 
        path: filePath,
        size: stats.size,
        contentType 
      });

      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': `"${stats.mtime.getTime()}-${stats.size}"`,
        },
      });

    } catch (fileError) {
      // File not found or access error
      logger.info('Media file not found', { 
        requestedPath: filePath,
        error: fileError 
      });
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

  } catch (error) {
    logger.error('Media serving error', { error, path: requestedPath });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to determine content type
function getContentType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop();

  const contentTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',

    // Videos
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'webm': 'video/webm',

    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'aac': 'audio/aac',
    'm4a': 'audio/mp4',

    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
  };

  return contentTypes[ext || ''] || 'application/octet-stream';
} 