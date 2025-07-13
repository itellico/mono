/**
 * Castings Client Page Component
 * 
 * Main interface for casting management with full CRUD operations.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminListPage } from '@/components/admin/AdminListPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Users, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface Casting {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'open' | 'closed' | 'completed';
  location: string;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  applicationsCount: number;
  requirements: {
    ageRange: { min: number; max: number };
    gender: string[];
    height: { min: number; max: number };
    experience: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function CastingsClientPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCastings, setSelectedCastings] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    dateRange: '',
  });

  // Mock data - replace with actual API call
  const { data: castings = [], isLoading } = useQuery({
    queryKey: ['tenant-castings', filters, searchTerm],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockCastings: Casting[] = [
        {
          id: '1',
          title: 'Fashion Week Runway Models',
          description: 'Looking for professional runway models for Paris Fashion Week 2024',
          category: 'Fashion Show',
          status: 'open',
          location: 'Paris, France',
          budget: 5000,
          currency: 'EUR',
          startDate: '2024-03-15',
          endDate: '2024-03-25',
          applicationsCount: 45,
          requirements: {
            ageRange: { min: 18, max: 30 },
            gender: ['female'],
            height: { min: 175, max: 185 },
            experience: 'professional'
          },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z'
        },
        {
          id: '2',
          title: 'Commercial Photography Models',
          description: 'Commercial shoot for luxury watch brand',
          category: 'Photo Shoot',
          status: 'open',
          location: 'Milan, Italy',
          budget: 2500,
          currency: 'EUR',
          startDate: '2024-02-10',
          endDate: '2024-02-12',
          applicationsCount: 23,
          requirements: {
            ageRange: { min: 25, max: 40 },
            gender: ['male', 'female'],
            height: { min: 170, max: 190 },
            experience: 'intermediate'
          },
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-18T16:45:00Z'
        },
        {
          id: '3',
          title: 'Music Video Background Dancers',
          description: 'Background dancers needed for pop music video',
          category: 'Music Video',
          status: 'closed',
          location: 'London, UK',
          budget: 800,
          currency: 'GBP',
          startDate: '2024-01-25',
          endDate: '2024-01-26',
          applicationsCount: 67,
          requirements: {
            ageRange: { min: 20, max: 35 },
            gender: ['male', 'female'],
            height: { min: 160, max: 185 },
            experience: 'beginner'
          },
          createdAt: '2024-01-05T11:00:00Z',
          updatedAt: '2024-01-22T10:15:00Z'
        }
      ];

      return mockCastings.filter(casting => 
        casting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        casting.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'draft', label: 'Draft' },
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'completed', label: 'Completed' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      options: [
        { value: '', label: 'All Categories' },
        { value: 'fashion-show', label: 'Fashion Show' },
        { value: 'photo-shoot', label: 'Photo Shoot' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'music-video', label: 'Music Video' }
      ]
    }
  ];

  const bulkActions = [
    { label: 'Publish', value: 'publish' },
    { label: 'Close', value: 'close' },
    { label: 'Archive', value: 'archive' },
    { label: 'Delete', value: 'delete' }
  ];

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    console.log(`Performing ${action} on castings:`, selectedIds);
    // Implement bulk actions
  };

  const renderCastingCard = (casting: Casting) => (
    <Card key={casting.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              <Link 
                href={`/tenant/castings/${casting.id}`}
                className="hover:text-primary transition-colors"
              >
                {casting.title}
              </Link>
            </CardTitle>
            <CardDescription>{casting.category}</CardDescription>
          </div>
          <Badge className={getStatusColor(casting.status)}>
            {casting.status.charAt(0).toUpperCase() + casting.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {casting.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{casting.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{casting.budget} {casting.currency}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(casting.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{casting.applicationsCount} applications</span>
          </div>
        </div>

        <div className="text-sm">
          <span className="font-medium">Requirements:</span>
          <div className="mt-1 text-muted-foreground">
            Ages {casting.requirements.ageRange.min}-{casting.requirements.ageRange.max} • 
            Height {casting.requirements.height.min}-{casting.requirements.height.max}cm • 
            {casting.requirements.experience}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Link href={`/tenant/castings/${casting.id}`}>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
          <Link href={`/tenant/castings/${casting.id}/applications`}>
            <Button variant="outline" size="sm">
              Applications ({casting.applicationsCount})
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const headerActions = (
    <Link href="/tenant/castings/create">
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Casting
      </Button>
    </Link>
  );

  return (
    <AdminListPage
      title="Casting Management"
      description="Manage casting calls and review applications"
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filters}
      onFiltersChange={setFilters}
      filterOptions={filterOptions}
      selectedItems={selectedCastings}
      onSelectionChange={setSelectedCastings}
      bulkActions={bulkActions}
      onBulkAction={handleBulkAction}
      headerActions={headerActions}
      isLoading={isLoading}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {castings.map(renderCastingCard)}
      </div>
      
      {castings.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No castings found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first casting call to get started.
          </p>
          <Link href="/tenant/castings/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Casting
            </Button>
          </Link>
        </div>
      )}
    </AdminListPage>
  );
}