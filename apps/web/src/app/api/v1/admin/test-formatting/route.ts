/**
 * Test endpoint to demonstrate automatic date/time/number formatting
 * 
 * GET /api/v1/admin/test-formatting
 */

import { withMiddleware, successResponse } from '@/lib/api-middleware';

export default withMiddleware({
  GET: async (req) => {
    // Sample data with various date, number, and currency fields
    const testData = {
      message: 'User preference formatting test',
      
      // Date/time fields (automatically detected and formatted)
      currentTime: new Date(),
      createdAt: new Date('2024-01-01T10:30:00Z'),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      lastLoginAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      scheduledDate: new Date('2024-12-25T00:00:00Z'),
      
      // Number fields (automatically formatted)
      viewCount: 1234567,
      rating: 4.567,
      percentage: 0.8534,
      
      // Currency fields (automatically detected by field name)
      price: 1234.56,
      totalAmount: 9876.54,
      serviceFee: 123.45,
      accountBalance: 50000.00,
      
      // Nested data
      orders: [
        {
          id: 1,
          orderDate: new Date('2024-01-15T14:20:00Z'),
          totalCost: 299.99,
          itemCount: 3
        },
        {
          id: 2,
          orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          totalCost: 149.50,
          itemCount: 1
        }
      ],
      
      // User preferences (for reference)
      userPreferences: {
        timezone: req.headers.get('X-User-Timezone') || 'Not set',
        locale: req.headers.get('X-User-Locale') || 'Not set',
        dateFormat: req.headers.get('X-User-DateFormat') || 'Not set',
        timeFormat: req.headers.get('X-User-TimeFormat') || 'Not set',
        currency: req.headers.get('X-User-Currency') || 'Not set'
      }
    };
    
    return successResponse(testData);
  }
}, {
  requireAdmin: true, // Admin only for testing
  transformResponse: true // Explicitly enable (though it's on by default)
});