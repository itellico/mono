import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * Seed hierarchical upload settings for the itellico Mono
 * 
 * Structure:
 * - Global settings (super admin) define maximum constraints
 * - Tenant settings can override within those constraints
 * - Settings use individual entries for simple values, JSONB for arrays
 */

export async function seedUploadSettings() {
  console.log('🌱 Seeding upload settings...');

  // ============================================
  // PICTURE/IMAGE UPLOAD SETTINGS
  // ============================================
  
  const pictureSettings = [
    {
      category: 'media' as const,
      key: 'picture_max_file_size_mb',
      value: 25,
      defaultValue: 25,
      maxValue: 200,  // Super admin constraint: no tenant can exceed 200MB
      minValue: 1,    // Super admin constraint: must be at least 1MB
      displayName: 'Maximum Picture File Size (MB)',
      helpText: 'Maximum file size allowed for image uploads in megabytes',
      description: 'Controls the maximum file size for picture uploads across the platform',
      level: 'global' as const,
      governance: 'tenant_admin' as const,
      validationSchema: {
        type: 'number',
        minimum: 1,
        maximum: 200
      }
    },
    {
      category: 'media' as const,
      key: 'picture_allowed_formats',
      value: ['image/jpeg', 'image/png', 'image/webp'],
      defaultValue: ['image/jpeg', 'image/png', 'image/webp'],
      allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/heic', 'image/avif'],
      displayName: 'Allowed Picture Formats',
      helpText: 'MIME types allowed for picture uploads. Tenants can only remove formats, not add new ones.',
      description: 'List of allowed MIME types for picture uploads',
      level: 'global' as const,
      governance: 'tenant_admin' as const,
      validationSchema: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      }
    },
    {
      category: 'media' as const,
      key: 'picture_min_width',
      value: 200,
      defaultValue: 200,
      minValue: 100,   // Platform minimum
      maxValue: 4000,  // Platform maximum
      displayName: 'Minimum Picture Width (pixels)',
      helpText: 'Minimum width required for uploaded pictures',
      description: 'Ensures uploaded images meet minimum quality standards',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'picture_min_height',
      value: 200,
      defaultValue: 200,
      minValue: 100,   // Platform minimum
      maxValue: 4000,  // Platform maximum
      displayName: 'Minimum Picture Height (pixels)',
      helpText: 'Minimum height required for uploaded pictures',
      description: 'Ensures uploaded images meet minimum quality standards',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'picture_compression_quality',
      value: 85,
      defaultValue: 85,
      minValue: 60,    // Don't allow too low quality
      maxValue: 100,   // Maximum quality
      displayName: 'Picture Compression Quality (%)',
      helpText: 'JPEG compression quality (60-100). Higher = better quality but larger files',
      description: 'Controls the quality/size tradeoff for compressed images',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'picture_auto_optimize',
      value: true,
      defaultValue: true,
      displayName: 'Auto-Optimize Pictures',
      helpText: 'Automatically optimize pictures for web delivery',
      description: 'Enables automatic image optimization and format conversion',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'picture_strip_exif',
      value: true,
      defaultValue: true,
      displayName: 'Strip EXIF Data',
      helpText: 'Remove EXIF metadata from images for privacy (recommended)',
      description: 'Removes camera info, GPS location, and other metadata from images',
      level: 'global' as const,
      governance: 'tenant_admin' as const,
      requiresApproval: false  // Tenants can change this without approval
    },
    {
      category: 'media' as const,
      key: 'picture_generate_thumbnails',
      value: true,
      defaultValue: true,
      displayName: 'Generate Thumbnails',
      helpText: 'Automatically generate thumbnail versions of uploaded pictures',
      description: 'Creates small, medium, and large thumbnail versions',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },

    // ============================================
    // VIDEO UPLOAD SETTINGS
    // ============================================
    
    {
      category: 'media' as const,
      key: 'video_max_file_size_mb',
      value: 500,
      defaultValue: 500,
      maxValue: 2000,  // Super admin constraint: 2GB max
      minValue: 50,    // At least 50MB for videos
      displayName: 'Maximum Video File Size (MB)',
      helpText: 'Maximum file size allowed for video uploads in megabytes',
      description: 'Controls the maximum file size for video uploads',
      level: 'global' as const,
      governance: 'tenant_admin' as const,
      requiresApproval: true  // Changes require super admin approval
    },
    {
      category: 'media' as const,
      key: 'video_allowed_formats',
      value: ['video/mp4', 'video/quicktime', 'video/webm'],
      defaultValue: ['video/mp4', 'video/quicktime', 'video/webm'],
      allowedFormats: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-ms-wmv', 'video/mpeg', 'video/ogg'],
      displayName: 'Allowed Video Formats',
      helpText: 'MIME types allowed for video uploads',
      description: 'List of allowed video formats. MP4 recommended for compatibility.',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'video_max_duration_minutes',
      value: 15,
      defaultValue: 15,
      minValue: 1,
      maxValue: 60,    // Platform max: 1 hour
      displayName: 'Maximum Video Duration (minutes)',
      helpText: 'Maximum length allowed for video uploads',
      description: 'Prevents excessively long videos that consume storage',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'video_min_resolution_width',
      value: 640,
      defaultValue: 640,
      minValue: 480,   // Absolute minimum
      maxValue: 3840,  // 4K maximum
      displayName: 'Minimum Video Width (pixels)',
      helpText: 'Minimum resolution width for video uploads',
      description: 'Ensures video quality meets platform standards',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'video_min_resolution_height',
      value: 360,
      defaultValue: 360,
      minValue: 360,   // Absolute minimum
      maxValue: 2160,  // 4K maximum
      displayName: 'Minimum Video Height (pixels)',
      helpText: 'Minimum resolution height for video uploads',
      description: 'Ensures video quality meets platform standards',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'video_auto_transcode',
      value: true,
      defaultValue: true,
      displayName: 'Auto-Transcode Videos',
      helpText: 'Automatically convert videos to MP4 for compatibility',
      description: 'Ensures all videos work across different devices and browsers',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'video_generate_thumbnails',
      value: true,
      defaultValue: true,
      displayName: 'Generate Video Thumbnails',
      helpText: 'Extract thumbnail images from video frames',
      description: 'Creates preview images for video files',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },

    // ============================================
    // AUDIO UPLOAD SETTINGS
    // ============================================
    
    {
      category: 'media' as const,
      key: 'audio_max_file_size_mb',
      value: 50,
      defaultValue: 50,
      maxValue: 100,   // Super admin constraint
      minValue: 1,
      displayName: 'Maximum Audio File Size (MB)',
      helpText: 'Maximum file size allowed for audio uploads',
      description: 'Controls the maximum file size for audio/voice uploads',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'audio_allowed_formats',
      value: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a'],
      defaultValue: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a'],
      allowedFormats: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/webm', 'audio/flac'],
      displayName: 'Allowed Audio Formats',
      helpText: 'MIME types allowed for audio uploads',
      description: 'List of allowed audio formats. MP3 recommended for compatibility.',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'audio_max_duration_minutes',
      value: 10,
      defaultValue: 10,
      minValue: 1,
      maxValue: 30,    // Platform max: 30 minutes
      displayName: 'Maximum Audio Duration (minutes)',
      helpText: 'Maximum length allowed for audio uploads',
      description: 'Limits audio file duration for voice portfolios',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'audio_min_bitrate_kbps',
      value: 128,
      defaultValue: 128,
      minValue: 64,    // Minimum acceptable quality
      maxValue: 320,   // Maximum quality
      displayName: 'Minimum Audio Bitrate (kbps)',
      helpText: 'Minimum audio quality required (64-320 kbps)',
      description: 'Ensures audio uploads meet quality standards',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },

    // ============================================
    // DOCUMENT UPLOAD SETTINGS
    // ============================================
    
    {
      category: 'media' as const,
      key: 'document_max_file_size_mb',
      value: 25,
      defaultValue: 25,
      maxValue: 50,    // Super admin constraint
      minValue: 1,
      displayName: 'Maximum Document File Size (MB)',
      helpText: 'Maximum file size allowed for document uploads',
      description: 'Controls the maximum file size for PDFs and documents',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'document_allowed_formats',
      value: ['application/pdf'],
      defaultValue: ['application/pdf'],
      allowedFormats: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      displayName: 'Allowed Document Formats',
      helpText: 'MIME types allowed for document uploads',
      description: 'List of allowed document formats. PDF recommended.',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },

    // ============================================
    // GENERAL UPLOAD SETTINGS
    // ============================================
    
    {
      category: 'media' as const,
      key: 'upload_total_size_limit_mb',
      value: 1000,
      defaultValue: 1000,
      maxValue: 5000,  // 5GB platform maximum
      minValue: 100,   // At least 100MB
      displayName: 'Total Upload Size Limit (MB)',
      helpText: 'Maximum total size of all uploads per user/tenant',
      description: 'Prevents excessive storage usage',
      level: 'global' as const,
      governance: 'super_admin_only' as const,  // Only super admin can change
      requiresApproval: true
    },
    {
      category: 'media' as const,
      key: 'upload_concurrent_limit',
      value: 3,
      defaultValue: 3,
      minValue: 1,
      maxValue: 10,
      displayName: 'Concurrent Upload Limit',
      helpText: 'Maximum number of files that can be uploaded simultaneously',
      description: 'Prevents server overload from too many concurrent uploads',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    },
    {
      category: 'media' as const,
      key: 'upload_chunk_size_mb',
      value: 5,
      defaultValue: 5,
      minValue: 1,
      maxValue: 25,
      displayName: 'Upload Chunk Size (MB)',
      helpText: 'Size of chunks for resumable uploads',
      description: 'Larger chunks are faster but less resilient to network issues',
      level: 'global' as const,
      governance: 'super_admin_only' as const
    },
    {
      category: 'media' as const,
      key: 'upload_require_virus_scan',
      value: false,
      defaultValue: false,
      displayName: 'Require Virus Scanning',
      helpText: 'Scan all uploads for malware (requires external service)',
      description: 'Enables virus/malware scanning for all file uploads',
      level: 'global' as const,
      governance: 'super_admin_only' as const
    },
    {
      category: 'media' as const,
      key: 'upload_allowed_contexts',
      value: ['profile_picture', 'portfolio_image', 'portfolio_video', 'comp_card', 'documents', 'media_assets'],
      defaultValue: ['profile_picture', 'portfolio_image', 'portfolio_video', 'comp_card', 'documents', 'media_assets'],
      allowedValues: ['profile_picture', 'portfolio_image', 'portfolio_video', 'comp_card', 'documents', 'media_assets', 'voice_portfolio', 'verification'],
      displayName: 'Allowed Upload Contexts',
      helpText: 'Types of uploads allowed on the platform',
      description: 'Controls which upload contexts are enabled',
      level: 'global' as const,
      governance: 'tenant_admin' as const
    }
  ];

  // Insert all settings
  for (const setting of pictureSettings) {
    try {
      const existing = await prisma.$queryRaw`
        SELECT * FROM site_settings 
        WHERE category = ${setting.category}::settings_category 
        AND key = ${setting.key} 
        AND tenant_id IS NULL 
        AND user_id IS NULL
        LIMIT 1
      ` as any[];

      if (existing.length > 0) {
        await prisma.$executeRaw`
          UPDATE site_settings SET
            value = ${JSON.stringify(setting.value)}::jsonb,
            default_value = ${JSON.stringify(setting.defaultValue)}::jsonb,
            max_value = ${setting.maxValue ? JSON.stringify(setting.maxValue) : null}::jsonb,
            min_value = ${setting.minValue ? JSON.stringify(setting.minValue) : null}::jsonb,
            allowed_values = ${setting.allowedValues ? JSON.stringify(setting.allowedValues) : null}::jsonb,
            allowed_formats = ${setting.allowedFormats ? JSON.stringify(setting.allowedFormats) : null}::jsonb,
            display_name = ${setting.displayName},
            help_text = ${setting.helpText},
            description = ${setting.description},
            governance = ${setting.governance}::settings_governance,
            requires_approval = ${setting.requiresApproval || false},
            validation_schema = ${setting.validationSchema ? JSON.stringify(setting.validationSchema) : null}::jsonb,
            updated_at = NOW()
          WHERE id = ${existing[0].id}
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO site_settings (
            category, key, level, governance, value, default_value, 
            max_value, min_value, allowed_values, allowed_formats,
            display_name, help_text, description, validation_schema,
            tenant_id, user_id, is_active, is_required, is_secret,
            requires_restart, is_readonly, overrides_global,
            last_modified_by, approved_by, approved_at, requires_approval
          ) VALUES (
            ${setting.category}::settings_category,
            ${setting.key},
            ${setting.level}::settings_level,
            ${setting.governance}::settings_governance,
            ${JSON.stringify(setting.value)}::jsonb,
            ${JSON.stringify(setting.defaultValue)}::jsonb,
            ${setting.maxValue ? JSON.stringify(setting.maxValue) : null}::jsonb,
            ${setting.minValue ? JSON.stringify(setting.minValue) : null}::jsonb,
            ${setting.allowedValues ? JSON.stringify(setting.allowedValues) : null}::jsonb,
            ${setting.allowedFormats ? JSON.stringify(setting.allowedFormats) : null}::jsonb,
            ${setting.displayName},
            ${setting.helpText},
            ${setting.description},
            ${setting.validationSchema ? JSON.stringify(setting.validationSchema) : null}::jsonb,
            NULL,
            NULL,
            true,
            false,
            false,
            false,
            false,
            false,
            NULL,
            NULL,
            NULL,
            ${setting.requiresApproval || false}
          )
        `;
      }

      console.log(`✅ Created/Updated setting: ${setting.category}.${setting.key}`);
    } catch (error) {
      console.error(`❌ Failed to create setting ${setting.category}.${setting.key}:`, error);
    }
  }

  console.log('✨ Upload settings seeded successfully!');
}

// Example: How tenant admins would override settings
export async function createTenantUploadOverrides(tenantId: number, modifiedBy: number) {
  console.log(`🏢 Creating tenant upload overrides for tenant ${tenantId}...`);

  // Example tenant overrides (within super admin constraints)
  const tenantOverrides = [
    {
      category: 'media' as const,
      key: 'picture_max_file_size_mb',
      value: 10,  // More restrictive than global (25MB)
      parentSettingId: null,  // Would be set to actual parent ID
      description: 'Tenant override: Reduced picture size limit'
    },
    {
      category: 'media' as const,
      key: 'picture_allowed_formats',
      value: ['image/jpeg', 'image/png'],  // Subset of global allowed formats
      parentSettingId: null,
      description: 'Tenant override: Only JPEG and PNG allowed'
    },
    {
      category: 'media' as const,
      key: 'video_max_duration_minutes',
      value: 5,  // More restrictive than global (15 minutes)
      parentSettingId: null,
      description: 'Tenant override: Shorter video duration limit'
    }
  ];

  for (const override of tenantOverrides) {
    try {
      const existing = await prisma.siteSettings.findFirst({
        where: {
          category: override.category,
          key: override.key,
          tenantId: tenantId,
          userId: null
        }
      });

      if (existing) {
        await prisma.siteSettings.update({
          where: { id: existing.id },
          data: {
            value: override.value,
            lastModifiedBy: modifiedBy,
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.siteSettings.create({
          data: {
            ...override,
            tenantId,
            userId: null,
            level: 'tenant' as const,
            governance: 'tenant_admin' as const,
            overridesGlobal: true,
            lastModifiedBy: modifiedBy,
            isActive: true,
            isRequired: false,
            isSecret: false,
            requiresRestart: false,
            isReadonly: false,
            requiresApproval: false,
            approvedBy: null,
            approvedAt: null
          }
        });
      }

      console.log(`✅ Created tenant override: ${override.category}.${override.key} for tenant ${tenantId}`);
    } catch (error) {
      console.error(`❌ Failed to create tenant override ${override.category}.${override.key}:`, error);
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedUploadSettings()
    .then(async () => {
      console.log('✅ Upload settings seed completed');
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('❌ Upload settings seed failed:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}