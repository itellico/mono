import React from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Users, MapPin, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Find Professional Models | mono Model Search',
  description: 'Discover and connect with professional models, actors, and talent. Advanced search with filters for location, experience, specialties, and more.',
  keywords: 'model search, casting, talent discovery, professional models, fashion models, commercial models',
  openGraph: {
    title: 'Professional Model Search | mono',
    description: 'Discover and connect with professional models worldwide',
    type: 'website'
  }
};

export default function ModelSearchPage() {
  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Find Professional Models</h1>
        <p className="text-xl text-muted-foreground">
          Discover and connect with talented models for your next project
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Model Search (Demo)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This is a demonstration page. In the full implementation, this would include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Advanced search filters (location, experience, specialties)</li>
              <li>Dynamic search results with pagination</li>
              <li>Model profile cards with photos and details</li>
              <li>Integration with the itellico Mono schema system</li>
              <li>Proper authentication and permission checking</li>
              <li>Audit tracking for search activities</li>
            </ul>
            
            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Browse Models
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Search by Location
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Top Rated
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-lg">Model Profile {i}</CardTitle>
              <p className="text-sm text-muted-foreground">Professional Model</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                  <Users className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Location:</span>
                    <Badge variant="secondary">New York</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Experience:</span>
                    <Badge variant="secondary">Professional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-500" />
                      <span className="text-sm">4.9</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 