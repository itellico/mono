/**
 * Simple Service Unit Test
 * Basic test to verify Jest infrastructure works
 */

// Simple service with no dependencies
class SimpleService {
  getName(): string {
    return 'Simple Service';
  }

  add(a: number, b: number): number {
    return a + b;
  }

  async fetchData(): Promise<{ id: number; name: string }> {
    return Promise.resolve({ id: 1, name: 'Test Data' });
  }

  processArray(items: string[]): string[] {
    return items.map(item => item.toUpperCase());
  }
}

describe('SimpleService', () => {
  let service: SimpleService;

  beforeEach(() => {
    service = new SimpleService();
  });

  describe('getName', () => {
    it('should return service name', () => {
      const result = service.getName();
      expect(result).toBe('Simple Service');
    });
  });

  describe('add', () => {
    it('should add two numbers correctly', () => {
      expect(service.add(2, 3)).toBe(5);
      expect(service.add(-1, 1)).toBe(0);
      expect(service.add(0, 0)).toBe(0);
    });
  });

  describe('fetchData', () => {
    it('should return async data', async () => {
      const result = await service.fetchData();
      
      expect(result).toEqual({
        id: 1,
        name: 'Test Data',
      });
    });
  });

  describe('processArray', () => {
    it('should convert array items to uppercase', () => {
      const input = ['hello', 'world', 'test'];
      const expected = ['HELLO', 'WORLD', 'TEST'];
      
      const result = service.processArray(input);
      
      expect(result).toEqual(expected);
    });

    it('should handle empty array', () => {
      const result = service.processArray([]);
      expect(result).toEqual([]);
    });
  });
});