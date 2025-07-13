import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { LoggerService } from '@common/logging/logger.service';
import { RedisService } from '@common/redis/redis.service';
import { TimezoneDto, TimezoneQueryDto, TimezonesResponseDto } from './dto/timezone.dto';

@Injectable()
export class TimezonesService {
  private readonly CACHE_PREFIX = 'timezones:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get all timezones with pagination and filtering
   */
  async findAll(query: TimezoneQueryDto): Promise<TimezonesResponseDto> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    this.logger.logBusiness('Fetching timezones', { 
      page, 
      limit, 
      search: query.search,
      region: query.region,
      utc_offset: query.utc_offset,
      has_dst: query.has_dst,
      is_active: query.is_active 
    });

    // Build cache key
    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(query)}`;
    
    try {
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Timezones retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      // Build where clause for filtering
      const where: any = {};
      
      if (query.is_active !== undefined) {
        where.is_active = query.is_active;
      }

      if (query.region) {
        where.region = {
          contains: query.region,
          mode: 'insensitive'
        };
      }

      if (query.utc_offset !== undefined) {
        where.utc_offset = query.utc_offset;
      }

      if (query.has_dst !== undefined) {
        where.has_dst = query.has_dst;
      }

      if (query.search) {
        where.OR = [
          {
            name: {
              contains: query.search,
              mode: 'insensitive'
            }
          },
          {
            label: {
              contains: query.search,
              mode: 'insensitive'
            }
          },
          {
            city: {
              contains: query.search,
              mode: 'insensitive'
            }
          },
          {
            abbreviation: {
              contains: query.search.toUpperCase(),
              mode: 'insensitive'
            }
          }
        ];
      }

      // Execute queries in parallel for better performance
      const [timezones, total] = await Promise.all([
        this.prisma.timezone.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { utc_offset: 'asc' },
            { display_order: 'asc' },
            { name: 'asc' }
          ]
        }),
        this.prisma.timezone.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      const result: TimezonesResponseDto = {
        data: timezones.map(this.mapTimezoneToDto),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Timezones fetched successfully', {
        count: timezones.length,
        total,
        page,
        cached: false
      });

      return result;

    } catch (error) {
      this.logger.error('Error fetching timezones', error, { query });
      throw new BadRequestException('Failed to fetch timezones');
    }
  }

  /**
   * Get a single timezone by ID
   */
  async findOne(id: number): Promise<TimezoneDto> {
    this.logger.logBusiness('Fetching timezone by ID', { id });

    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Timezone retrieved from cache', { id, cacheKey });
        return JSON.parse(cached as string);
      }

      const timezone = await this.prisma.timezone.findUnique({
        where: { id }
      });

      if (!timezone) {
        throw new NotFoundException(`Timezone with ID ${id} not found`);
      }

      const result = this.mapTimezoneToDto(timezone);

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Timezone fetched successfully', { id, cached: false });

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching timezone by ID', error, { id });
      throw new BadRequestException('Failed to fetch timezone');
    }
  }

  /**
   * Get a single timezone by IANA name
   */
  async findByName(name: string): Promise<TimezoneDto> {
    this.logger.logBusiness('Fetching timezone by name', { name });

    const cacheKey = `${this.CACHE_PREFIX}name:${name}`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Timezone retrieved from cache', { name, cacheKey });
        return JSON.parse(cached as string);
      }

      const timezone = await this.prisma.timezone.findFirst({
        where: { name: name }
      });

      if (!timezone) {
        throw new NotFoundException(`Timezone with name ${name} not found`);
      }

      const result = this.mapTimezoneToDto(timezone);

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Timezone fetched by name successfully', { name, cached: false });

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching timezone by name', error, { name });
      throw new BadRequestException('Failed to fetch timezone');
    }
  }

  /**
   * Get list of all timezone regions
   */
  async getRegions(): Promise<string[]> {
    this.logger.logBusiness('Fetching timezone regions');

    const cacheKey = `${this.CACHE_PREFIX}regions`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Timezone regions retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      const regions = await this.prisma.timezone.findMany({
        where: { 
          is_active: true,
          region: { not: null }
        },
        select: { region: true },
        distinct: ['region']
      });

      const result = regions
        .map(r => r.region)
        .filter(Boolean)
        .sort();

      // Cache the result for longer (regions don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 6);

      this.logger.logBusiness('Timezone regions fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching timezone regions', error);
      throw new BadRequestException('Failed to fetch timezone regions');
    }
  }

  /**
   * Get timezones by UTC offset
   */
  async getByOffset(offset: number): Promise<TimezoneDto[]> {
    this.logger.logBusiness('Fetching timezones by offset', { offset });

    const cacheKey = `${this.CACHE_PREFIX}offset:${offset}`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Timezones by offset retrieved from cache', { offset, cacheKey });
        return JSON.parse(cached as string);
      }

      const timezones = await this.prisma.timezone.findMany({
        where: {
          utc_offset: offset,
          is_active: true
        },
        orderBy: { name: 'asc' }
      });

      const result = timezones.map(this.mapTimezoneToDto);

      // Cache for longer (timezone offsets don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 12);

      this.logger.logBusiness('Timezones by offset fetched successfully', { 
        offset, 
        count: result.length 
      });

      return result;

    } catch (error) {
      this.logger.error('Error fetching timezones by offset', error, { offset });
      throw new BadRequestException('Failed to fetch timezones by offset');
    }
  }

  /**
   * Get popular timezones (commonly used in applications)
   */
  async getPopularTimezones(): Promise<TimezoneDto[]> {
    this.logger.logBusiness('Fetching popular timezones');

    const cacheKey = `${this.CACHE_PREFIX}popular`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Popular timezones retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      // List of commonly used timezone names
      const popularTimezones = [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Rome',
        'Europe/Vienna',
        'Europe/Madrid',
        'Europe/Amsterdam',
        'Europe/Stockholm',
        'Europe/Moscow',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Kolkata',
        'Asia/Singapore',
        'Asia/Dubai',
        'Asia/Hong_Kong',
        'Australia/Sydney',
        'Australia/Melbourne',
        'Pacific/Auckland',
        'America/Toronto',
        'America/Sao_Paulo',
        'America/Mexico_City'
      ];

      const timezones = await this.prisma.timezone.findMany({
        where: {
          name: { in: popularTimezones },
          is_active: true
        },
        orderBy: { utc_offset: 'asc' }
      });

      const result = timezones.map(this.mapTimezoneToDto);

      // Cache for longer (popular timezones don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 12);

      this.logger.logBusiness('Popular timezones fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching popular timezones', error);
      throw new BadRequestException('Failed to fetch popular timezones');
    }
  }

  /**
   * Get timezones that observe Daylight Saving Time
   */
  async getDstTimezones(): Promise<TimezoneDto[]> {
    this.logger.logBusiness('Fetching DST timezones');

    const cacheKey = `${this.CACHE_PREFIX}dst`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('DST timezones retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      const timezones = await this.prisma.timezone.findMany({
        where: {
          has_dst: true,
          is_active: true
        },
        orderBy: [
          { utc_offset: 'asc' },
          { name: 'asc' }
        ]
      });

      const result = timezones.map(this.mapTimezoneToDto);

      // Cache for longer (DST timezones don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 12);

      this.logger.logBusiness('DST timezones fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching DST timezones', error);
      throw new BadRequestException('Failed to fetch DST timezones');
    }
  }

  /**
   * Map Prisma Timezone model to DTO
   */
  private mapTimezoneToDto(timezone: any): TimezoneDto {
    return {
      id: timezone.id,
      name: timezone.name,
      label: timezone.label,
      region: timezone.region,
      city: timezone.city,
      utc_offset: timezone.utc_offset,
      dst_offset: timezone.dst_offset,
      has_dst: timezone.has_dst,
      abbreviation: timezone.abbreviation,
      is_active: timezone.is_active,
      display_order: timezone.display_order,
      created_at: timezone.created_at,
      updated_at: timezone.updated_at
    };
  }

  /**
   * Clear cache for all timezones (useful after data updates)
   */
  async clearCache(): Promise<void> {
    try {
      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await this.redis.getClient().keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.getClient().del(keys);
        this.logger.logBusiness('Timezones cache cleared', { keysCleared: keys.length });
      }
    } catch (error) {
      this.logger.error('Error clearing timezones cache', error);
    }
  }
}