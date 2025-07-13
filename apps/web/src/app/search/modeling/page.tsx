import React from 'react';
import { SearchPageLayout } from '@/components/search/SearchPageLayout';
import { redirect } from 'next/navigation';

/**
 * 🎭 Modeling Search Page - Example Implementation
 * 
 * This demonstrates how SearchPageLayout integrates with your itellico Mono:
 * - Uses your existing model schemas
 * - Integrates with your option sets
 * - Lives within your standard layout framework
 * - Connects to your API endpoints
 */

// This would come from your model schemas database
const MODELING_SEARCH_CONFIG = {
  schemaId: 'modeling_profile_schema',
  industryType: 'Modeling',
  title: 'Find Models',
  description: 'Search through our database of professional models',
  
  // These fields come from your model schemas
  searchFields: [
    {
      id: 'name',
      label: 'Name',
      type: 'text' as const,
      placeholder: 'Search by name...',
    },
    {
      id: 'location',
      label: 'Location',
      type: 'select' as const,
      placeholder: 'Select location',
      // This would come from your option sets
      options: [
        { value: 'new-york', label: 'New York' },
        { value: 'los-angeles', label: 'Los Angeles' },
        { value: 'miami', label: 'Miami' },
        { value: 'chicago', label: 'Chicago' },
      ],
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select' as const,
      placeholder: 'Select category',
      // This would come from your option sets
      options: [
        { value: 'fashion', label: 'Fashion' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'fitness', label: 'Fitness' },
        { value: 'glamour', label: 'Glamour' },
      ],
    },
    // Advanced filters
    {
      id: 'height_min',
      label: 'Min Height (cm)',
      type: 'number' as const,
      placeholder: '160',
    },
    {
      id: 'height_max',
      label: 'Max Height (cm)',
      type: 'number' as const,
      placeholder: '200',
    },
    {
      id: 'experience',
      label: 'Experience Level',
      type: 'select' as const,
      placeholder: 'Select experience',
      options: [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'professional', label: 'Professional' },
      ],
    },
  ],
  
  // These define how results are displayed
  resultFields: [
    {
      id: 'name',
      label: 'Name',
      type: 'text' as const,
      primary: true, // Show prominently
    },
    {
      id: 'profile_image',
      label: 'Photo',
      type: 'image' as const,
    },
    {
      id: 'location',
      label: 'Location',
      type: 'text' as const,
    },
    {
      id: 'category',
      label: 'Category',
      type: 'badge' as const,
    },
    {
      id: 'height',
      label: 'Height',
      type: 'text' as const,
    },
    {
      id: 'experience',
      label: 'Experience',
      type: 'badge' as const,
    },
  ],
};

// This would integrate with your existing API
async function searchModels(filters: Record<string, any>, page = 1) {
  'use server';
  
  // In real implementation, this would:
  // 1. Connect to your database using your existing service layer
  // 2. Apply tenant isolation (tenantId filtering)
  // 3. Use your Redis caching system
  // 4. Apply your permission system
  // 5. Log the search with your audit system
  
  // Mock implementation for demonstration
  const mockResults = [
    {
      id: '1',
      name: 'Sarah Johnson',
      profile_image: '/api/placeholder/150/200',
      location: 'New York',
      category: 'Fashion',
      height: '175 cm',
      experience: 'Professional',
    },
    {
      id: '2',
      name: 'Mike Chen',
      profile_image: '/api/placeholder/150/200',
      location: 'Los Angeles',
      category: 'Commercial',
      height: '182 cm',
      experience: 'Intermediate',
    },
    // ... more results
  ];

  // Apply filters (in real implementation, this would be SQL queries)
  let filteredResults = mockResults;
  
  if (filters.name) {
    filteredResults = filteredResults.filter(r => 
      r.name.toLowerCase().includes(filters.name.toLowerCase())
    );
  }
  
  if (filters.location) {
    filteredResults = filteredResults.filter(r => 
      r.location.toLowerCase().includes(filters.location.toLowerCase())
    );
  }
  
  if (filters.category) {
    filteredResults = filteredResults.filter(r => 
      r.category.toLowerCase() === filters.category.toLowerCase()
    );
  }

  // Pagination
  const limit = 12;
  const offset = (page - 1) * limit;
  const paginatedResults = filteredResults.slice(offset, offset + limit);

  return {
    results: paginatedResults,
    pagination: {
      page,
      limit,
      total: filteredResults.length,
      totalPages: Math.ceil(filteredResults.length / limit),
    },
  };
}

export default function ModelingSearchPage() {
  const handleViewResult = (id: string) => {
    // Navigate to model profile
    redirect(`/profiles/models/${id}`);
  };

  const handleEditResult = (id: string) => {
    // Navigate to edit model profile (if user has permission)
    redirect(`/admin/profiles/models/${id}/edit`);
  };

  const handleDeleteResult = (id: string) => {
    // Handle delete with confirmation
    console.log('Delete model:', id);
  };

  const handleBulkAction = (action: string, ids: string[]) => {
    // Handle bulk actions
    console.log('Bulk action:', action, 'on:', ids);
    
    switch (action) {
      case 'export':
        // Export selected models
        break;
      case 'email':
        // Send email to selected models
        break;
      case 'delete':
        // Bulk delete with confirmation
        break;
    }
  };

  return (
    <SearchPageLayout
      config={MODELING_SEARCH_CONFIG}
      onSearch={searchModels}
      onViewResult={handleViewResult}
      onEditResult={handleEditResult}
      onDeleteResult={handleDeleteResult}
      onBulkAction={handleBulkAction}
      defaultViewMode="grid"
      allowBulkActions={true}
      showFiltersInSidebar={false} // or true for sidebar layout
    />
  );
} 