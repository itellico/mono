/**
 * @openapi
 * /api/openapi:
 *   get:
 *     tags:
 *       - Documentation
 *     summary: OpenAPI Specification
 *     description: OpenAPI specification for the Mono API
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Operation successful
 *       '401':
 *         description: Authentication required
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { openApiExtractor } from '@/lib/openapi-extractor';
import { openApiConfig } from '@/lib/openapi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Extract API routes and generate OpenAPI spec
    let spec;
    try {
      spec = await openApiExtractor.generateSpec();
    } catch (extractorError) {
      console.warn('OpenAPI extractor failed, falling back to basic spec:', extractorError);
      // Fallback to basic spec
      spec = {
        openapi: '3.0.3',
        info: {
          title: 'Mono API',
          version: '1.0.0',
          description: 'Multi-tenant modeling platform API'
        },
        paths: {},
        components: openApiConfig.components,
        servers: openApiConfig.servers,
        security: openApiConfig.security
      };
    }

    if (format === 'yaml') {
      // You'd need a YAML library for this
      return new NextResponse('YAML format not implemented yet', { status: 501 });
    }

    return NextResponse.json(spec);
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification' },
      { status: 500 }
    );
  }
}

export async function POST() {
  const swaggerHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Mono API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin:0; background: #fafafa; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js"></script>
    <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/openapi?format=json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
    </script>
  </body>
</html>`;

  return new NextResponse(swaggerHtml, {
    headers: { 'Content-Type': 'text/html' }
  });
}