import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { register } from 'prom-client';
import { Public } from '@common/decorators/public.decorator';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Prometheus metrics in text format',
    headers: {
      'Content-Type': {
        description: 'Content type',
        schema: { type: 'string', example: 'text/plain; version=0.0.4; charset=utf-8' },
      },
    },
  })
  async getMetrics(@Res() response: FastifyReply) {
    const metrics = await register.metrics();
    response.header('Content-Type', register.contentType);
    response.send(metrics);
  }

  @Public()
  @Get('summary')
  @ApiOperation({ summary: 'Get metrics summary in JSON format' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics summary with key performance indicators',
    schema: {
      type: 'object',
      properties: {
        totalMetrics: { type: 'number' },
        httpRequests: { type: 'object' },
        authAttempts: { type: 'object' },
        permissionChecks: { type: 'object' },
        databaseQueries: { type: 'object' },
        cacheOperations: { type: 'object' },
        activeUsers: { type: 'object' },
      },
    },
  })
  async getMetricsSummary() {
    return {
      success: true,
      data: await this.metricsService.getMetricsSummary(),
    };
  }
}