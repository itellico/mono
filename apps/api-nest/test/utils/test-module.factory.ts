/**
 * Test Module Factory
 * Factory for creating test modules with mocked dependencies
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import { MetricsService } from '@common/metrics/metrics.service';
import { mockPrismaService } from '../mocks/prisma.mock';
import { mockRedisService } from '../mocks/redis.mock';
import { mockConfigService } from '../mocks/config.mock';
import { mockMetricsService } from '../mocks/metrics.mock';

export interface TestModuleOptions {
  providers?: any[];
  imports?: any[];
  controllers?: any[];
  exports?: any[];
  useMocks?: {
    prisma?: boolean;
    redis?: boolean;
    config?: boolean;
    metrics?: boolean;
    jwt?: boolean;
  };
}

export class TestModuleFactory {
  /**
   * Create a test module with common mocks
   */
  static async createTestModule(options: TestModuleOptions = {}): Promise<TestingModule> {
    const {
      providers = [],
      imports = [],
      controllers = [],
      exports = [],
      useMocks = {},
    } = options;

    const defaultMocks = {
      prisma: true,
      redis: true,
      config: true,
      metrics: true,
      jwt: true,
      ...useMocks,
    };

    const moduleBuilder = Test.createTestingModule({
      imports,
      controllers,
      providers: [
        ...providers,
        ...(defaultMocks.prisma ? [{ provide: PrismaService, useValue: mockPrismaService }] : []),
        ...(defaultMocks.redis ? [{ provide: RedisService, useValue: mockRedisService }] : []),
        ...(defaultMocks.config ? [{ provide: ConfigService, useValue: mockConfigService }] : []),
        ...(defaultMocks.metrics ? [{ provide: MetricsService, useValue: mockMetricsService }] : []),
        ...(defaultMocks.jwt ? [{ 
          provide: JwtService, 
          useValue: {
            sign: jest.fn(() => 'mock.jwt.token'),
            verify: jest.fn(() => ({ id: '1', email: 'test@example.com' })),
            decode: jest.fn(() => ({ id: '1', email: 'test@example.com' })),
          }
        }] : []),
      ],
      exports,
    });

    return await moduleBuilder.compile();
  }

  /**
   * Create a service test module
   */
  static async createServiceTestModule(
    serviceClass: any,
    additionalProviders: any[] = [],
    mockOverrides: any = {}
  ): Promise<TestingModule> {
    return this.createTestModule({
      providers: [serviceClass, ...additionalProviders],
      useMocks: mockOverrides,
    });
  }

  /**
   * Create a controller test module
   */
  static async createControllerTestModule(
    controllerClass: any,
    serviceProviders: any[] = [],
    mockOverrides: any = {}
  ): Promise<TestingModule> {
    return this.createTestModule({
      controllers: [controllerClass],
      providers: serviceProviders,
      useMocks: mockOverrides,
    });
  }

  /**
   * Create a module test with real dependencies
   */
  static async createIntegrationTestModule(
    moduleClass: any,
    additionalImports: any[] = []
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [moduleClass, ...additionalImports],
    }).compile();
  }

  /**
   * Create a guard test module
   */
  static async createGuardTestModule(
    guardClass: any,
    mockOverrides: any = {}
  ): Promise<TestingModule> {
    return this.createTestModule({
      providers: [
        guardClass,
        {
          provide: 'Reflector',
          useValue: {
            getAllAndOverride: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
      useMocks: mockOverrides,
    });
  }

  /**
   * Create an interceptor test module
   */
  static async createInterceptorTestModule(
    interceptorClass: any,
    mockOverrides: any = {}
  ): Promise<TestingModule> {
    return this.createTestModule({
      providers: [interceptorClass],
      useMocks: mockOverrides,
    });
  }

  /**
   * Create a pipe test module
   */
  static async createPipeTestModule(
    pipeClass: any,
    mockOverrides: any = {}
  ): Promise<TestingModule> {
    return this.createTestModule({
      providers: [pipeClass],
      useMocks: mockOverrides,
    });
  }

  /**
   * Create a minimal test module for unit testing
   */
  static async createUnitTestModule(
    targetClass: any,
    dependencies: any[] = []
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        targetClass,
        ...dependencies.map(dep => ({
          provide: dep,
          useValue: this.createMockProvider(dep),
        })),
      ],
    }).compile();
  }

  /**
   * Create a mock provider for a given class
   */
  private static createMockProvider(providerClass: any): any {
    const mock: any = {};
    
    // Get all methods from the prototype
    const prototype = providerClass.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype)
      .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');
    
    // Create jest mocks for all methods
    methodNames.forEach(methodName => {
      mock[methodName] = jest.fn();
    });
    
    return mock;
  }
}