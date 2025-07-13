import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { TimezonesService } from './timezones.service';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { TimezoneDto, TimezoneQueryDto, TimezonesResponseDto } from './dto/timezone.dto';

@Controller('public/timezones')
@ApiTags('Timezones')
@ApiBearerAuth('JWT-auth')
export class TimezonesController {
  constructor(private readonly timezonesService: TimezonesService) {}

  @Get()
  @Auth()
  @Permission('public.timezones.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'List all timezones with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'region', required: false, type: String, description: 'Filter by region' })
  @ApiQuery({ name: 'utc_offset', required: false, type: Number, description: 'Filter by UTC offset (minutes)' })
  @ApiQuery({ name: 'has_dst', required: false, type: Boolean, description: 'Filter by DST support' })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiOkResponse({ 
    description: 'Timezones retrieved successfully',
    type: TimezonesResponseDto
  })
  async findAll(@Query() query: TimezoneQueryDto): Promise<TimezonesResponseDto> {
    return this.timezonesService.findAll(query);
  }

  @Get(':id')
  @Auth()
  @Permission('public.timezones.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get timezone by ID' })
  @ApiParam({ name: 'id', type: 'integer', description: 'Timezone ID' })
  @ApiOkResponse({ 
    description: 'Timezone retrieved successfully',
    type: TimezoneDto
  })
  @ApiNotFoundResponse({ description: 'Timezone not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TimezoneDto> {
    return this.timezonesService.findOne(id);
  }

  @Get('name/:name')
  @Auth()
  @Permission('public.timezones.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get timezone by IANA name' })
  @ApiParam({ 
    name: 'name', 
    type: 'string', 
    description: 'IANA timezone name (e.g., Europe/Vienna, America/New_York)',
    example: 'Europe/Vienna'
  })
  @ApiOkResponse({ 
    description: 'Timezone retrieved successfully',
    type: TimezoneDto
  })
  @ApiNotFoundResponse({ description: 'Timezone not found' })
  async findByName(@Param('name') name: string): Promise<TimezoneDto> {
    // Replace URL encoded slashes
    const timezoneName = name.replace(/%2F/g, '/');
    return this.timezonesService.findByName(timezoneName);
  }

  @Get('regions/list')
  @Auth()
  @Permission('public.timezones.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of all timezone regions' })
  @ApiOkResponse({ 
    description: 'Timezone regions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { type: 'string' },
          example: ['Europe', 'America', 'Asia', 'Africa', 'Australia', 'Pacific']
        }
      }
    }
  })
  async getRegions(): Promise<{ success: boolean; data: string[] }> {
    const regions = await this.timezonesService.getRegions();
    return { success: true, data: regions };
  }

  @Get('offset/:offset')
  @Auth()
  @Permission('public.timezones.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get timezones by UTC offset' })
  @ApiParam({ 
    name: 'offset', 
    type: 'integer', 
    description: 'UTC offset in minutes (e.g., 60 for UTC+1, -300 for UTC-5)',
    example: 60
  })
  @ApiOkResponse({ 
    description: 'Timezones with specified offset retrieved successfully',
    type: [TimezoneDto]
  })
  async getByOffset(@Param('offset', ParseIntPipe) offset: number): Promise<TimezoneDto[]> {
    return this.timezonesService.getByOffset(offset);
  }

  @Get('popular/list')
  @Auth()
  @Permission('public.timezones.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of popular timezones (commonly used)' })
  @ApiOkResponse({ 
    description: 'Popular timezones retrieved successfully',
    type: [TimezoneDto]
  })
  async getPopularTimezones(): Promise<TimezoneDto[]> {
    return this.timezonesService.getPopularTimezones();
  }

  @Get('dst/list')
  @Auth()
  @Permission('public.timezones.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of timezones that observe Daylight Saving Time' })
  @ApiOkResponse({ 
    description: 'DST timezones retrieved successfully',
    type: [TimezoneDto]
  })
  async getDstTimezones(): Promise<TimezoneDto[]> {
    return this.timezonesService.getDstTimezones();
  }
}