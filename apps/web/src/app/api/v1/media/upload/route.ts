/**
 * @fileoverview Media Upload API Endpoint
 * @category API
 * @subcategory Media
 * @tenant-aware true
 * @business-context Multi-tenant media upload with subscription limits and optimization tracking
 * @version 1.0.0
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant-context';
import { mediaUploadService } from '@/lib/services/media-upload-service';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

/**
 * @openapi
 * /api/v1/media/upload:
 *   post:
 *     summary: Upload media files with tenant isolation and optimization
     tags:
       - Media Management
 *     description: |
 *       **Business Context**: Primary upload endpoint for all media types in the mono platform.
 *       Handles profile pictures, portfolio images, comp cards, and documents with automatic
 *       optimization, thumbnail generation, and subscription limit enforcement.
 *       
 *       **Key Features**:
 *       - Multi-tenant file isolation with tenant-specific storage paths
 *       - Automatic subscription limit validation before upload
 *       - Background optimization job queuing
 *       - Progress tracking with WebSocket notifications
 *       - CDN integration for global delivery
 *       
 *       **Security**: Requires valid session token and tenant context validation.
 *       
 *     tags:
 *       - Media
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-ID
 *         required: true
 *         schema:
 *           type: string
 *           example: "tenant_123"
 *         description: Tenant identifier for multi-tenant isolation
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - context
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (images, videos, documents)
 *                 example: "profile-picture.jpg"
 *               context:
 *                 type: string
 *                 enum: 
 *                   - profile_picture
 *                   - compcard
 *                   - portfolio
 *                   - video_library
 *                   - voice_portfolio
 *                   - application
 *                   - document
 *                 description: Upload context determining storage location and processing rules
 *                 example: "profile_picture"
 *               contextId:
 *                 type: string
 *                 description: Optional context identifier (e.g., profile ID, application ID)
 *                 example: "profile_456"
 *               slotId:
 *                 type: string
 *                 description: Optional slot identifier for organized uploads
 *                 example: "slot_1"
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MediaUploadResponse'
 *             examples:
 *               profilePicture:
 *                 summary: Profile Picture Upload
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 123
 *                     fileName: "abc123_def456.jpg"
 *                     originalName: "profile-picture.jpg"
 *                     mimeType: "image/jpeg"
 *                     fileSize: 2048576
 *                     cdnUrl: "https://cdn.itellico.com/media/tenant1/abc123_def456.jpg"
 *                     processingStatus: "pending"
 *                     jobId: "job_789"
 *                     metadata:
 *                       width: 1920
 *                       height: 1080
 *                       aspectRatio: "16:9"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   tenantId: "tenant_123"
 *       400:
 *         description: Invalid request or file validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Subscription limit exceeded or insufficient permissions
 *       413:
 *         description: File too large
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 * 
 * components:
 *   schemas:
 *     MediaUploadResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - timestamp
 *         - tenantId
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           $ref: '#/components/schemas/MediaAsset'
 *         error:
 *           $ref: '#/components/schemas/ApiError'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *         tenantId:
 *           type: string
 *           description: Tenant context identifier
 *     
 *     MediaAsset:
 *       type: object
 *       description: Media asset information with processing status
 *       required:
 *         - id
 *         - fileName
 *         - originalName
 *         - mimeType
 *         - fileSize
 *         - cdnUrl
 *         - processingStatus
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique asset identifier
 *           example: 123
 *         fileName:
 *           type: string
 *           description: Generated unique filename
 *           example: "abc123_def456.jpg"
 *         originalName:
 *           type: string
 *           description: Original uploaded filename
 *           example: "profile-picture.jpg"
 *         mimeType:
 *           type: string
 *           description: File MIME type
 *           example: "image/jpeg"
 *         fileSize:
 *           type: integer
 *           description: File size in bytes
 *           example: 2048576
 *         cdnUrl:
 *           type: string
 *           description: CDN URL for file access
 *           example: "https://cdn.itellico.com/media/tenant1/abc123_def456.jpg"
 *         processingStatus:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *           description: Background processing status
 *         jobId:
 *           type: string
 *           description: Background job identifier for tracking
 *           example: "job_789"
 *         isOptimized:
 *           type: boolean
 *           description: Whether optimization is complete
 *         thumbnailFormats:
 *           type: object
 *           description: Available thumbnail sizes and URLs
 *           additionalProperties:
 *             type: string
 *         metadata:
 *           type: object
 *           description: File metadata (dimensions, duration, etc.)
 *           properties:
 *             width:
 *               type: integer
 *             height:
 *               type: integer
 *             duration:
 *               type: number
 *             aspectRatio:
 *               type: string
 */

/**
 * Upload media file with tenant isolation and optimization
 * 
 * @business-impact Affects subscription storage limits and usage metrics
 * @tenant-isolation All uploads are stored in tenant-specific directories
 * @subscription-enforcement Validates storage limits before processing
 * @background-jobs Queues optimization and thumbnail generation
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Authentication and tenant validation
    const session = await auth();
    if (!session) {
      return errorResponse('Authentication required', 401);
    }

    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return errorResponse('Invalid tenant context', 403);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const context = formData.get('context') as string;
    const contextId = formData.get('contextId') as string | undefined;
    const slotId = formData.get('slotId') as string | undefined;

    // Validate required fields
    if (!file || !context) {
      return errorResponse('File and context are required', 400);
    }

    // Process upload through service layer
    const result = await mediaUploadService.uploadFile(file, {
      tenantId: tenantContext.id,
      userId: parseInt(session.user.id),
      context,
      contextId,
      slotId,
    });

    return successResponse(result);

  } catch (error) {
    return handleApiError(error);
  }
} 