import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { join } from 'path';
import { readFile, stat } from 'fs/promises';
import { config } from '../config/index';

/**
 * Static file serving plugin with tenant security checks
 * Serves files from the uploads directory with proper access control
 */
async function staticFilesPlugin(fastify: FastifyInstance) {
  // Serve files from uploads directory with security checks
  fastify.get('/uploads/*', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const filePath = (request.params as any)['*'];
      
      if (!filePath) {
        return reply.code(404).send({ error: 'File not found' });
      }

      // Security: Prevent directory traversal attacks
      if (filePath.includes('..') || filePath.includes('\\')) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      const fullPath = join(config.UPLOAD_DIR, filePath);

      // Check if file exists
      try {
        const stats = await stat(fullPath);
        if (!stats.isFile()) {
          return reply.code(404).send({ error: 'File not found' });
        }
      } catch (error) {
        return reply.code(404).send({ error: 'File not found' });
      }

      // Extract tenant UUID from file path for access control
      const pathParts = filePath.split('/');
      const tenantUuid = pathParts[1]; // Assuming structure: category/tenantUuid/...

      // Security check: Ensure user has access to this tenant's files
      const user = (request as any).user;
      if (user && request.tenant) {
        // User is authenticated, check tenant access
        if (request.tenant.tenantUuid !== tenantUuid) {
          // Check if user has cross-tenant access permissions
          const hasGlobalAccess = request.permissions?.includes('media:admin') || 
                                   request.permissions?.includes('super_admin');
          
          if (!hasGlobalAccess) {
            return reply.code(403).send({ error: 'Access denied to tenant files' });
          }
        }
      } else {
        // Unauthenticated access - only allow public files
        const isPublicFile = filePath.startsWith('public/') || 
                           filePath.includes('/public/');
        
        if (!isPublicFile) {
          return reply.code(401).send({ error: 'Authentication required' });
        }
      }

      // Read and serve the file
      try {
        const fileBuffer = await readFile(fullPath);
        
        // Set appropriate content type based on file extension
        const extension = filePath.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';
        
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg';
            break;
          case 'png':
            contentType = 'image/png';
            break;
          case 'gif':
            contentType = 'image/gif';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
          case 'svg':
            contentType = 'image/svg+xml';
            break;
          case 'pdf':
            contentType = 'application/pdf';
            break;
          case 'mp4':
            contentType = 'video/mp4';
            break;
          case 'mp3':
            contentType = 'audio/mpeg';
            break;
          case 'wav':
            contentType = 'audio/wav';
            break;
          case 'css':
            contentType = 'text/css';
            break;
          case 'js':
            contentType = 'application/javascript';
            break;
          case 'json':
            contentType = 'application/json';
            break;
          default:
            contentType = 'application/octet-stream';
        }

        // Set security headers
        reply.header('Content-Type', contentType);
        reply.header('Cache-Control', 'public, max-age=86400'); // 24 hours
        reply.header('X-Content-Type-Options', 'nosniff');
        
        // Prevent embedding for sensitive file types
        if (['pdf', 'html', 'htm'].includes(extension || '')) {
          reply.header('X-Frame-Options', 'DENY');
        }

        return reply.send(fileBuffer);

      } catch (error) {
        fastify.log.error('Error serving file:', error);
        return reply.code(500).send({ error: 'Failed to serve file' });
      }

    } catch (error) {
      fastify.log.error('Static file handler error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Health check endpoint for static file service
  fastify.get('/uploads/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await stat(config.UPLOAD_DIR);
      return reply.send({
        success: true,
        uploadDir: config.UPLOAD_DIR,
        exists: stats.isDirectory(),
        writable: true // Would need to test write permissions
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Upload directory not accessible',
        uploadDir: config.UPLOAD_DIR
      });
    }
  });
}

export default fp(staticFilesPlugin, {
  name: 'static-files',
  dependencies: ['auth-v2', 'tenant']
});