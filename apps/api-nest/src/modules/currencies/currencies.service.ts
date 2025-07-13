import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { LoggerService } from '@common/logging/logger.service';
import { RedisService } from '@common/redis/redis.service';
import { CurrencyDto, CurrencyQueryDto, CurrenciesResponseDto, CurrencyFormatDto } from './dto/currency.dto';

@Injectable()
export class CurrenciesService {
  private readonly CACHE_PREFIX = 'currencies:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get all currencies with pagination and filtering
   */
  async findAll(query: CurrencyQueryDto): Promise<CurrenciesResponseDto> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    this.logger.logBusiness('Fetching currencies', { 
      page, 
      limit, 
      search: query.search,
      symbol_position: query.symbol_position,
      decimal_places: query.decimal_places,
      is_active: query.is_active 
    });

    // Build cache key
    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(query)}`;
    
    try {
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Currencies retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      // Build where clause for filtering
      const where: any = {};
      
      if (query.is_active !== undefined) {
        where.is_active = query.is_active;
      }

      if (query.symbol_position) {
        where.symbol_position = query.symbol_position;
      }

      if (query.decimal_places !== undefined) {
        where.decimal_places = query.decimal_places;
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
            code: {
              contains: query.search.toUpperCase(),
              mode: 'insensitive'
            }
          },
          {
            symbol: {
              contains: query.search,
              mode: 'insensitive'
            }
          }
        ];
      }

      // Execute queries in parallel for better performance
      const [currencies, total] = await Promise.all([
        this.prisma.currency.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { display_order: 'asc' },
            { name: 'asc' }
          ]
        }),
        this.prisma.currency.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      const result: CurrenciesResponseDto = {
        data: currencies.map(this.mapCurrencyToDto),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Currencies fetched successfully', {
        count: currencies.length,
        total,
        page,
        cached: false
      });

      return result;

    } catch (error) {
      this.logger.error('Error fetching currencies', error, { query });
      throw new BadRequestException('Failed to fetch currencies');
    }
  }

  /**
   * Get a single currency by ID
   */
  async findOne(id: number): Promise<CurrencyDto> {
    this.logger.logBusiness('Fetching currency by ID', { id });

    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Currency retrieved from cache', { id, cacheKey });
        return JSON.parse(cached as string);
      }

      const currency = await this.prisma.currency.findUnique({
        where: { id }
      });

      if (!currency) {
        throw new NotFoundException(`Currency with ID ${id} not found`);
      }

      const result = this.mapCurrencyToDto(currency);

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Currency fetched successfully', { id, cached: false });

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching currency by ID', error, { id });
      throw new BadRequestException('Failed to fetch currency');
    }
  }

  /**
   * Get a single currency by ISO code
   */
  async findByCode(code: string): Promise<CurrencyDto> {
    this.logger.logBusiness('Fetching currency by code', { code });

    const cacheKey = `${this.CACHE_PREFIX}code:${code}`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Currency retrieved from cache', { code, cacheKey });
        return JSON.parse(cached as string);
      }

      const currency = await this.prisma.currency.findFirst({
        where: {
          OR: [
            { code: code },
            { numeric_code: code }
          ]
        }
      });

      if (!currency) {
        throw new NotFoundException(`Currency with code ${code} not found`);
      }

      const result = this.mapCurrencyToDto(currency);

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Currency fetched by code successfully', { code, cached: false });

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching currency by code', error, { code });
      throw new BadRequestException('Failed to fetch currency');
    }
  }

  /**
   * Format amount according to currency rules
   */
  async formatAmount(code: string, amount: number): Promise<CurrencyFormatDto> {
    this.logger.logBusiness('Formatting currency amount', { code, amount });

    try {
      const currency = await this.findByCode(code);

      // Round to appropriate decimal places
      const roundedAmount = Math.round(amount * Math.pow(10, currency.decimal_places)) / Math.pow(10, currency.decimal_places);

      // Format number with separators
      const parts = roundedAmount.toFixed(currency.decimal_places).split('.');
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousands_separator);
      const decimalPart = parts[1];

      let formatted = currency.decimal_places > 0 
        ? `${integerPart}${currency.decimal_separator}${decimalPart}`
        : integerPart;

      // Add currency symbol
      if (currency.symbol) {
        formatted = currency.symbol_position === 'before' 
          ? `${currency.symbol}${formatted}`
          : `${formatted}${currency.symbol}`;
      }

      const result: CurrencyFormatDto = {
        amount: roundedAmount,
        currency_code: currency.code,
        formatted: formatted,
        symbol: currency.symbol || currency.code,
        symbol_position: currency.symbol_position
      };

      this.logger.logBusiness('Currency amount formatted successfully', { 
        code, 
        amount, 
        formatted: result.formatted 
      });

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error formatting currency amount', error, { code, amount });
      throw new BadRequestException('Failed to format currency amount');
    }
  }

  /**
   * Get popular currencies (commonly used in applications)
   */
  async getPopularCurrencies(): Promise<CurrencyDto[]> {
    this.logger.logBusiness('Fetching popular currencies');

    const cacheKey = `${this.CACHE_PREFIX}popular`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Popular currencies retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      // List of commonly used currency codes
      const popularCodes = [
        'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
        'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'BRL',
        'MXN', 'INR', 'KRW', 'SGD', 'HKD', 'NZD', 'ZAR', 'TRY'
      ];

      const currencies = await this.prisma.currency.findMany({
        where: {
          code: { in: popularCodes },
          is_active: true
        },
        orderBy: { display_order: 'asc' }
      });

      const result = currencies.map(this.mapCurrencyToDto);

      // Cache for longer (popular currencies don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 12);

      this.logger.logBusiness('Popular currencies fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching popular currencies', error);
      throw new BadRequestException('Failed to fetch popular currencies');
    }
  }

  /**
   * Get supported cryptocurrencies
   */
  async getCryptocurrencies(): Promise<CurrencyDto[]> {
    this.logger.logBusiness('Fetching cryptocurrencies');

    const cacheKey = `${this.CACHE_PREFIX}crypto`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Cryptocurrencies retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      // Common cryptocurrency codes (if supported)
      const cryptoCodes = [
        'BTC', 'ETH', 'LTC', 'BCH', 'XRP', 'ADA', 'DOT', 'BNB',
        'SOL', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM'
      ];

      const currencies = await this.prisma.currency.findMany({
        where: {
          code: { in: cryptoCodes },
          is_active: true
        },
        orderBy: { name: 'asc' }
      });

      const result = currencies.map(this.mapCurrencyToDto);

      // Cache for longer (crypto list doesn't change often in our system)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 6);

      this.logger.logBusiness('Cryptocurrencies fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching cryptocurrencies', error);
      throw new BadRequestException('Failed to fetch cryptocurrencies');
    }
  }

  /**
   * Get currency symbols with their codes
   */
  async getCurrencySymbols(): Promise<Array<{ code: string; symbol: string; name: string }>> {
    this.logger.logBusiness('Fetching currency symbols');

    const cacheKey = `${this.CACHE_PREFIX}symbols`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Currency symbols retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      const currencies = await this.prisma.currency.findMany({
        where: {
          is_active: true,
          symbol: { not: null }
        },
        select: {
          code: true,
          symbol: true,
          name: true
        },
        orderBy: { code: 'asc' }
      });

      const result = currencies
        .filter(c => c.symbol)
        .map(c => ({
          code: c.code,
          symbol: c.symbol!,
          name: c.name
        }));

      // Cache for longer (symbols don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 12);

      this.logger.logBusiness('Currency symbols fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching currency symbols', error);
      throw new BadRequestException('Failed to fetch currency symbols');
    }
  }

  /**
   * Get zero-decimal currencies (currencies with no fractional units)
   */
  async getZeroDecimalCurrencies(): Promise<CurrencyDto[]> {
    this.logger.logBusiness('Fetching zero-decimal currencies');

    const cacheKey = `${this.CACHE_PREFIX}zero-decimal`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Zero-decimal currencies retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      const currencies = await this.prisma.currency.findMany({
        where: {
          decimal_places: 0,
          is_active: true
        },
        orderBy: { name: 'asc' }
      });

      const result = currencies.map(this.mapCurrencyToDto);

      // Cache for longer (zero-decimal list doesn't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 12);

      this.logger.logBusiness('Zero-decimal currencies fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching zero-decimal currencies', error);
      throw new BadRequestException('Failed to fetch zero-decimal currencies');
    }
  }

  /**
   * Map Prisma Currency model to DTO
   */
  private mapCurrencyToDto(currency: any): CurrencyDto {
    return {
      id: currency.id,
      code: currency.code,
      numeric_code: currency.numeric_code,
      name: currency.name,
      symbol: currency.symbol,
      symbol_position: currency.symbol_position,
      decimal_places: currency.decimal_places,
      decimal_separator: currency.decimal_separator,
      thousands_separator: currency.thousands_separator,
      is_active: currency.is_active,
      display_order: currency.display_order,
      created_at: currency.created_at,
      updated_at: currency.updated_at
    };
  }

  /**
   * Clear cache for all currencies (useful after data updates)
   */
  async clearCache(): Promise<void> {
    try {
      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await this.redis.getClient().keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.getClient().del(keys);
        this.logger.logBusiness('Currencies cache cleared', { keysCleared: keys.length });
      }
    } catch (error) {
      this.logger.error('Error clearing currencies cache', error);
    }
  }
}