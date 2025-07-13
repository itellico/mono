/**
 * Tenants Filter Configuration
 * 
 * Defines the filter fields for the admin tenants list
 * matching the design shown in the screenshot
 */

import { FilterField } from '@/components/admin/common/AdminFilterBar';

export const tenantsFilterFields: FilterField[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search by name...'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active', count: 45 },
      { value: 'inactive', label: 'Inactive', count: 12 },
      { value: 'suspended', label: 'Suspended', count: 3 }
    ]
  },
  {
    key: 'currency',
    label: 'Currency',
    type: 'select',
    options: [
      { value: 'EUR', label: 'EUR', count: 28 },
      { value: 'USD', label: 'USD', count: 15 },
      { value: 'GBP', label: 'GBP', count: 8 },
      { value: 'CAD', label: 'CAD', count: 4 }
    ]
  },
  {
    key: 'userCount',
    label: 'User Count',
    type: 'select',
    options: [
      { value: '1-10', label: '1-10 users', count: 15 },
      { value: '11-50', label: '11-50 users', count: 25 },
      { value: '51-100', label: '51-100 users', count: 12 },
      { value: '100+', label: '100+ users', count: 8 }
    ]
  }
]; 