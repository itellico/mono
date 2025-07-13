import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { FastifyRequest } from 'fastify';

@ApiTags('Tenant - Content')
@ApiBearerAuth('JWT-auth')
@Controller('tenant/media')
@Auth()
@Tier(UserTier.TENANT)
export class MediaController {
  @Get()
  @Permission('tenant.media.view')
  @ApiOperation({ summary: 'List media files' })
  async getMedia(@Query() query: any) {
    return {
      success: true,
      data: {
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      }
    };
  }

  @Post('upload')
  @Permission('tenant.media.upload')
  @ApiOperation({ summary: 'Upload media file' })
  @ApiConsumes('multipart/form-data')
  async uploadMedia(@Req() request: FastifyRequest, @Body() metadata: any) {
    // TODO: Implement file upload with @fastify/multipart
    // For now, return mock response
    return {
      success: true,
      data: {
        id: 'media_' + Date.now(),
        filename: 'uploaded_file',
        url: `/media/uploaded_file`,
        size: 0,
        type: 'application/octet-stream'
      }
    };
  }

  @Get(':id')
  @Permission('tenant.media.view')
  @ApiOperation({ summary: 'Get media file by ID' })
  async getMediaFile(@Param('id') id: string) {
    return {
      success: true,
      data: { id, url: `/media/${id}` }
    };
  }

  @Delete(':id')
  @Permission('tenant.media.delete')
  @ApiOperation({ summary: 'Delete media file' })
  async deleteMedia(@Param('id') id: string) {
    return {
      success: true,
      data: { id, deleted: true }
    };
  }
}