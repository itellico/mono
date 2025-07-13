import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { HealthService } from '../services/health.service';

@ApiTags('Public - Health')
@Public()
@Controller('public/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Basic health check',
    description: 'Simple health check endpoint for load balancers and monitoring systems'
  })
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @ApiOperation({ 
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe - checks if app is ready to serve requests (database, Redis)'
  })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @ApiOperation({ 
    summary: 'Liveness probe',
    description: 'Kubernetes liveness probe - checks if app process is alive and responsive'
  })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('info')
  @ApiOperation({ 
    summary: 'Application information',
    description: 'Returns app version, environment, and system information'
  })
  getInfo() {
    return this.healthService.getInfo();
  }
}