'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { browserLogger } from '@/lib/browser-logger';
import { 
  useExperienceLevelOptions, 
  useSpecialtyOptions, 
  SearchCriteria,
  buildSearchFilters,
  ExperienceLevelKey 
} from '@/lib/translations-utils';

interface ModelSearchExampleProps {
  onSearch: (criteria: SearchCriteria) => void;
}

export default function ModelSearchExample({ onSearch }: ModelSearchExampleProps) {
  const t = useTranslations('common');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [selectedUserType, setSelectedUserType] = useState<string>('commercial_model');

  const experienceLevelOptions = useExperienceLevelOptions();
  const specialtyOptions = useSpecialtyOptions(selectedUserType);

  const handleExperienceLevelChange = (value: string) => {
    setSearchCriteria(prev => ({
      ...prev,
      experienceLevel: value === 'any' ? undefined : value as ExperienceLevelKey
    }));
  };

  const handleSpecialtyToggle = (specialtyKey: string) => {
    const currentSpecialties = searchCriteria.specialties || [];
    const updatedSpecialties = currentSpecialties.includes(specialtyKey)
      ? currentSpecialties.filter(s => s !== specialtyKey)
      : [...currentSpecialties, specialtyKey];

    setSearchCriteria(prev => ({
      ...prev,
      specialties: updatedSpecialties
    }));
  };

  const handleSearch = () => {
    // This is where you&apos;d build actual Drizzle queries using the keys
    const filters = buildSearchFilters(searchCriteria);
      browserLogger.debug('Model search criteria', { searchCriteria, filters });

    // Example Drizzle query structure:
    // const results = await db.query.users.findMany({
    //   where: and(
    //     searchCriteria.experienceLevel ? eq(users.experienceLevel, searchCriteria.experienceLevel) : undefined,
    //     searchCriteria.specialties?.length ? 
    //       jsonb_path_exists(users.specialties, `$.${searchCriteria.specialties.join(' || $.')}`) : undefined
    //   ),
    //   with: {
    //     account: true,
    //     modelProfile: true
    //   }
    // });

    onSearch(searchCriteria);
  };

  const clearFilters = () => {
    setSearchCriteria({});
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Model Search Filters
        </CardTitle>
        <p className="text-sm text-gray-600">
          Search for models using translated but database-consistent criteria
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Type Selection */}
        <div>
          <Label htmlFor="userType">User Type</Label>
          <Select value={selectedUserType} onValueChange={setSelectedUserType}>
            <SelectTrigger>
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commercial_model">Commercial Model</SelectItem>
              <SelectItem value="fashion_model">Fashion Model</SelectItem>
              <SelectItem value="plus_size_model">Plus Size Model</SelectItem>
              <SelectItem value="photographer">Photographer</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level Filter */}
        <div>
          <Label htmlFor="experienceLevel">Experience Level</Label>
          <Select
            value={searchCriteria.experienceLevel || 'any'}
            onValueChange={handleExperienceLevelChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any experience level</SelectItem>
              {experienceLevelOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-sm text-gray-500">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Specialties Filter */}
        <div>
          <Label>Specialties</Label>
          <p className="text-sm text-gray-600 mb-3">
            Filter by specific areas of expertise
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {specialtyOptions.map((option) => (
              <div key={option.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`search-${option.key}`}
                  checked={searchCriteria.specialties?.includes(option.key) || false}
                  onCheckedChange={() => handleSpecialtyToggle(option.key)}
                />
                <Label
                  htmlFor={`search-${option.key}`}
                  className="text-sm font-medium"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Filters Display */}
        {(searchCriteria.experienceLevel || searchCriteria.specialties?.length) && (
          <div>
            <Label>Active Filters</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {searchCriteria.experienceLevel && (
                <Badge variant="secondary">
                  Experience: {t(`experienceLevel.${searchCriteria.experienceLevel}`)}
                </Badge>
              )}
              {searchCriteria.specialties?.map((specialtyKey) => {
                const option = specialtyOptions.find(opt => opt.key === specialtyKey);
                return option ? (
                  <Badge key={specialtyKey} variant="secondary">
                    {option.label}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleSearch} className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            Search Models
          </Button>
          <Button onClick={clearFilters} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {/* Developer Info */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <p className="font-medium mb-2">🔧 Developer Info:</p>
          <p><strong>Database stores keys:</strong> {JSON.stringify(searchCriteria)}</p>
          <p><strong>UI shows translations:</strong> Experience levels and specialties are translated</p>
          <p><strong>Search consistency:</strong> Keys ensure reliable filtering across languages</p>
        </div>
      </CardContent>
    </Card>
  );
} 