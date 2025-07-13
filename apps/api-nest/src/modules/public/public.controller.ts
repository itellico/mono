import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Public - Health')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('status')
  @ApiOperation({ summary: 'System status overview' })
  getStatus() {
    return this.publicService.getStatus();
  }
}