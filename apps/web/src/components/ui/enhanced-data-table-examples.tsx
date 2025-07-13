/**
 * Enhanced Data Table Usage Examples
 * 
 * This file demonstrates how to use the EnhancedDataTable component
 * with different column configurations and data types.
 */

import { EnhancedDataTable, type ColumnConfig } from './enhanced-data-table';
import { Badge } from './badge';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

// Example 1: User Management Table
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: Date;
  avatar?: string;
}

export const userColumns: ColumnConfig<User>[] = [
  {
    key: 'name',
    title: 'User',
    sortable: true,
    filterable: true,
    filterConfig: {
      type: 'text',
      placeholder: 'Search users...'
    },
    render: (value, row) => (
      <div className="table-cell-flex">
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.avatar} />
          <AvatarFallback>{value.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm table-text-muted">{row.email}</p>
        </div>
      </div>
    ),
    width: '250px'
  },
  {
    key: 'role',
    title: 'Role',
    sortable: true,
    filterable: true,
    filterConfig: {
      type: 'select',
      placeholder: 'All roles',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
        { value: 'moderator', label: 'Moderator' }
      ]
    },
    render: (value) => (
      <Badge variant={value === 'admin' ? 'default' : 'secondary'}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    ),
    width: '120px'
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    filterable: true,
    filterConfig: {
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' }
      ]
    },
    render: (value) => (
      <Badge 
        variant={value === 'active' ? 'default' : value === 'suspended' ? 'destructive' : 'secondary'}
        className={
          value === 'active' ? 'badge-active' : 
          value === 'suspended' ? 'bg-red-100 text-red-700' : 
          'badge-inactive'
        }
      >
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    ),
    width: '120px'
  }
];

// Example 2: Financial Data Table
interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

export const transactionColumns: ColumnConfig<Transaction>[] = [
  {
    key: 'id',
    title: 'Transaction ID',
    sortable: true,
    filterable: true,
    filterConfig: {
      type: 'text',
      placeholder: 'Search by ID...'
    },
    render: (value) => (
      <span className="font-mono text-sm table-text-secondary">{value}</span>
    ),
    width: '150px'
  },
  {
    key: 'amount',
    title: 'Amount',
    sortable: true,
    filterable: true,
    filterConfig: {
      type: 'number',
      placeholder: 'Min amount...'
    },
    render: (value, row) => (
      <div className="table-cell-flex-end">
        <span className={`font-medium ${row.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
          {row.type === 'credit' ? '+' : '-'}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: row.currency
          }).format(Math.abs(value))}
        </span>
      </div>
    ),
    width: '120px'
  },
  {
    key: 'type',
    title: 'Type',
    sortable: true,
    filterable: true,
    filterConfig: {
      type: 'select',
      options: [
        { value: 'credit', label: 'Credit' },
        { value: 'debit', label: 'Debit' }
      ]
    },
    render: (value) => (
      <Badge variant={value === 'credit' ? 'default' : 'secondary'}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    ),
    width: '100px'
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    filterable: true,
    filterConfig: {
      type: 'select',
      options: [
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' }
      ]
    },
    render: (value) => (
      <Badge 
        variant={
          value === 'completed' ? 'default' : 
          value === 'pending' ? 'secondary' : 
          'destructive'
        }
      >
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    ),
    width: '120px'
  }
];

// Example 3: Content/Media Table
interface MediaItem {
  id: number;
  title: string;
  type: 'image' | 'video' | 'document';
  size: number;
  uploadedBy: string;
  uploadDate: Date;
  status: 'approved' | 'pending' | 'rejected';
  tags: string[];
}

export const mediaColumns: ColumnConfig<MediaItem>[] = [
  {
    key: 'title',
    title: 'Media',
    sortable: true,
    filterable: true,
    filterConfig: {
      type: 'text',
      placeholder: 'Search media...'
    },
    render: (value, row) => (
      <div className="table-cell-flex">
        <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
          row.type === 'image' ? 'bg-blue-100 text-blue-700' :
          row.type === 'video' ? 'bg-purple-100 text-purple-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {row.type === 'image' ? '📷' : row.type === 'video' ? '🎥' : '📄'}
        </div>
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm table-text-muted">
            {(row.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    ),
    width: '250px'
  },
  {
    key: 'type',
    title: 'Type',
    sortable: true,
    filterable: true,
    filterConfig: {
      type: 'select',
      options: [
        { value: 'image', label: 'Image' },
        { value: 'video', label: 'Video' },
        { value: 'document', label: 'Document' }
      ]
    },
    render: (value) => (
      <Badge variant="outline">
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    ),
    width: '100px'
  },
  {
    key: 'tags',
    title: 'Tags',
    sortable: false,
    filterable: true,
    filterConfig: {
      type: 'text',
      placeholder: 'Search tags...'
    },
    render: (value) => (
      <div className="flex flex-wrap gap-1">
        {value.slice(0, 3).map((tag: string, index: number) => (
          <Badge key={index} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
        {value.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{value.length - 3}
          </Badge>
        )}
      </div>
    ),
    width: '200px'
  }
];

/**
 * Usage Examples:
 * 
 * // Basic Usage
 * <EnhancedDataTable
 *   data={users}
 *   columns={userColumns}
 *   isLoading={isLoading}
 *   emptyMessage="No users found"
 * />
 * 
 * // With Custom Configuration
 * <EnhancedDataTable
 *   data={transactions}
 *   columns={transactionColumns}
 *   isLoading={isLoading}
 *   searchPlaceholder="Search transactions..."
 *   enableGlobalSearch={true}
 *   onRowClick={(transaction) => handleViewTransaction(transaction)}
 *   rowClassName={(transaction) => 
 *     transaction.status === 'failed' ? 'opacity-60' : ''
 *   }
 * />
 * 
 * // With Custom Actions
 * const columnsWithActions = [
 *   ...userColumns,
 *   {
 *     key: 'actions',
 *     title: 'Actions',
 *     sortable: false,
 *     filterable: false,
 *     render: (_, user) => (
 *       <DropdownMenu>
 *         <DropdownMenuTrigger asChild>
 *           <Button variant="ghost" size="sm">
 *             <MoreHorizontal className="h-4 w-4" />
 *           </Button>
 *         </DropdownMenuTrigger>
 *         <DropdownMenuContent>
 *           <DropdownMenuItem onClick={() => editUser(user)}>
 *             Edit
 *           </DropdownMenuItem>
 *           <DropdownMenuItem onClick={() => deleteUser(user)}>
 *             Delete
 *           </DropdownMenuItem>
 *         </DropdownMenuContent>
 *       </DropdownMenu>
 *     ),
 *     width: '80px'
 *   }
 * ];
 */ 