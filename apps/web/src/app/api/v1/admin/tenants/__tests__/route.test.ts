import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { TenantsService } from '@/lib/services/tenants.service';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/services/tenants.service');
jest.mock('@/lib/logger');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockTenantsService = TenantsService as jest.MockedClass<typeof TenantsService>;

describe('/api/v1/admin/tenants', () => {
  let mockTenantsServiceInstance: jest.Mocked<TenantsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated session
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'admin@example.com',
        adminRole: 'super_admin',
        tenantId: null,
        permissions: ['read:tenants', 'write:tenants']
      }
    });

    // Mock service instance
    mockTenantsServiceInstance = {
      getAll: jest.fn(),
      getTenantByUuid: jest.fn(),
      createTenant: jest.fn(),
      updateTenantByUuid: jest.fn(),
      deleteTenantByUuid: jest.fn(),
    } as any;

    mockTenantsService.mockImplementation(() => mockTenantsServiceInstance);
  });

  describe('GET', () => {
    it('should call service.getAll with no parameters by default', async () => {
      const mockResponse = {
        tenants: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false }
      };
      
      mockTenantsServiceInstance.getAll.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants');
      const response = await GET(request);
      const data = await response.json();

      expect(mockTenantsServiceInstance.getAll).toHaveBeenCalledWith({
        search: '',
        status: 'all',
        page: 1,
        limit: 20,
        currency: undefined,
        userCountRange: undefined
      });
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should pass currency parameter to service', async () => {
      // This test would have caught the missing currency parameter handling
      const mockResponse = {
        tenants: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false }
      };
      
      mockTenantsServiceInstance.getAll.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants?currency=USD,GBP');
      const response = await GET(request);

      expect(mockTenantsServiceInstance.getAll).toHaveBeenCalledWith({
        search: '',
        status: 'all',
        page: 1,
        limit: 20,
        currency: 'USD,GBP',
        userCountRange: undefined
      });
    });

    it('should pass userCountRange parameter to service', async () => {
      // This test would have caught the missing userCountRange parameter handling
      const mockResponse = {
        tenants: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false }
      };
      
      mockTenantsServiceInstance.getAll.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants?userCountRange=1-10,11-50');
      const response = await GET(request);

      expect(mockTenantsServiceInstance.getAll).toHaveBeenCalledWith({
        search: '',
        status: 'all',
        page: 1,
        limit: 20,
        currency: undefined,
        userCountRange: '1-10,11-50'
      });
    });

    it('should handle all parameters together', async () => {
      const mockResponse = {
        tenants: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0, hasMore: false }
      };
      
      mockTenantsServiceInstance.getAll.mockResolvedValue(mockResponse);

      const url = 'http://localhost:3000/api/v1/admin/tenants?page=2&limit=10&search=test&status=active&currency=USD&userCountRange=1-10';
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(mockTenantsServiceInstance.getAll).toHaveBeenCalledWith({
        search: 'test',
        status: 'active',
        page: 2,
        limit: 10,
        currency: 'USD',
        userCountRange: '1-10'
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for unauthorized users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@example.com',
          adminRole: 'user', // Not admin
          tenantId: 'tenant-123',
          permissions: []
        }
      });

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should handle service errors gracefully', async () => {
      mockTenantsServiceInstance.getAll.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to retrieve tenants');
    });
  });

  describe('POST', () => {
    it('should create a new tenant', async () => {
      const mockTenant = {
        id: '1',
        uuid: 'new-tenant-uuid',
        name: 'New Tenant',
        email: 'new@example.com',
        status: 'active'
      };

      mockTenantsServiceInstance.createTenant.mockResolvedValue(mockTenant);

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Tenant',
          email: 'new@example.com',
          primaryCurrency: 'USD'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTenant);
    });

    it('should return 400 for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
}); 