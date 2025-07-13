'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, Globe, ArrowRightLeft } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';
import { generateConversionMatrix, convertValue } from '@/lib/conversions';

interface OptionSet {
  id: number;
  slug: string;
  label: string;
  values: OptionValue[];
}

interface OptionValue {
  id: number;
  label: string;
  value: string;
  order: number;
  regionalMappings: Record<string, string>;
}

export default function ConversionMatrixViewer() {
  const [optionSets, setOptionSets] = useState<OptionSet[]>([]);
  const [selectedOptionSet, setSelectedOptionSet] = useState<OptionSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingOptionSets, setFetchingOptionSets] = useState(true);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  // Fetch all option sets on component mount
  useEffect(() => {
    fetchOptionSets();
  }, []);

  const fetchOptionSets = async () => {
    try {
      setFetchingOptionSets(true);
      const response = await fetch('/api/v1/admin/option-sets');
      const data = await response.json();

      if (data.success) {
        setOptionSets(data.data || []);
        browserLogger.info('Option sets fetched successfully', { count: data.data?.length });
      } else {
        browserLogger.error('Failed to fetch option sets', { error: data.message });
      }
    } catch (error) {
      browserLogger.error('Error fetching option sets', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setFetchingOptionSets(false);
    }
  };

  const fetchOptionSetDetails = async (optionSetId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/option-sets/${optionSetId}`);
      const data = await response.json();

      if (data.success) {
        const optionSet = data.data;
        setSelectedOptionSet(optionSet);
        generateRegionList(optionSet);
        browserLogger.info('Option set details fetched', { optionSetId, valuesCount: optionSet.values?.length });
      } else {
        browserLogger.error('Failed to fetch option set details', { error: data.message });
      }
    } catch (error) {
      browserLogger.error('Error fetching option set details', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const generateRegionList = (optionSet: OptionSet) => {
    const regions = new Set<string>();

    // Always include standard regions for conversion display
    const standardRegions = ['Global', 'US', 'UK', 'EU', 'Asia'];
    standardRegions.forEach(region => regions.add(region));

    // Also include any additional regions from database mappings
    optionSet.values.forEach(value => {
      if (value.regionalMappings) {
        Object.keys(value.regionalMappings).forEach(region => {
          regions.add(region);
        });
      }
    });

    setAvailableRegions(Array.from(regions).sort());
  };

  const handleOptionSetChange = (value: string) => {
    fetchOptionSetDetails(value);
  };

  const getMatrixData = () => {
    if (!selectedOptionSet || availableRegions.length === 0) return [];

    // Use the conversion engine to generate actual converted values
    const conversions = generateConversionMatrix({
      slug: selectedOptionSet.slug,
      values: selectedOptionSet.values.map(v => ({ 
        value: v.value, 
        label: v.label || v.value 
      })),
      metadata: { type: selectedOptionSet.slug }
    });

    return conversions.map((conversion, index) => {
      const originalValue = selectedOptionSet.values[index];
      const row: any = {
        globalValue: conversion.global,
        originalValue: originalValue.label || originalValue.value
      };

      // Show actual converted values if available, fallback to regional mappings
      const regions = Object.keys(conversion.conversions.regions);
      if (regions.length > 0) {
        // Use conversion engine results
        Object.keys(conversion.conversions.regions).forEach(region => {
          row[region] = conversion.conversions.regions[region];
        });
        // Ensure we have all available regions
        ['US', 'UK', 'EU', 'Asia'].forEach(region => {
          if (!row[region] && conversion.conversions.regions[region]) {
            row[region] = conversion.conversions.regions[region];
          }
        });
      } else {
        // Fallback to database regional mappings
        availableRegions.forEach(region => {
          if (region === 'Global') {
            row[region] = originalValue.label || originalValue.value;
          } else {
            row[region] = originalValue.regionalMappings?.[region] || '-';
          }
        });
      }

      return row;
    });
  };

  const matrixData = getMatrixData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Conversion Matrix Viewer
          </CardTitle>
          <CardDescription>
            Select an option set to view all regional conversions in a matrix format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Option Set Selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Option Set</label>
              <Select onValueChange={handleOptionSetChange} disabled={fetchingOptionSets}>
                <SelectTrigger>
                  <SelectValue placeholder={fetchingOptionSets ? "Loading option sets..." : "Choose an option set to view conversions"} />
                </SelectTrigger>
                <SelectContent>
                  {optionSets.map(optionSet => (
                    <SelectItem key={optionSet.id} value={optionSet.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{optionSet.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {optionSet.values?.length || '?'} values
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading conversion data...
            </div>
          )}

          {selectedOptionSet && !loading && (
            <div className="space-y-4">
              {/* Option Set Info */}
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">{selectedOptionSet.label}</h3>
                  <p className="text-sm text-blue-700">
                    {selectedOptionSet.values?.length || 0} values • {availableRegions.length} regions
                  </p>
                </div>
                <div className="flex gap-2 ml-auto">
                  {availableRegions.map(region => (
                    <Badge key={region} variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Conversion Matrix */}
              {availableRegions.length > 1 && matrixData.length > 0 ? (
                <div className="space-y-2">
                  {/* Info about conversion types */}
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>Algorithmically converted values</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-400 rounded"></div>
                        <span>Database regional mappings</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Global Value</TableHead>
                          {availableRegions.filter(region => region !== 'Global').map(region => (
                            <TableHead key={region} className="text-center font-semibold">
                              <div className="flex items-center justify-center gap-1">
                                <Globe className="h-3 w-3" />
                                {region}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matrixData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.globalValue}</TableCell>
                            {availableRegions.filter(region => region !== 'Global').map(region => {
                              const value = row[region];
                              const isConverted = value !== '-' && value !== row.originalValue;
                              const isMapping = selectedOptionSet?.values[index]?.regionalMappings?.[region];

                              return (
                                <TableCell key={region} className="text-center">
                                  <span className={`${
                                    value !== '-' 
                                      ? isConverted 
                                        ? 'text-blue-600 font-medium' 
                                        : isMapping 
                                          ? 'text-gray-600 font-medium'
                                          : 'text-green-600 font-medium'
                                      : 'text-gray-400'
                                  }`}>
                                    {value}
                                  </span>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : availableRegions.length <= 1 ? (
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    This option set only has values for the Global region. Use the Conversion Mappings tab to generate regional conversions.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    No values found for this option set.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {!selectedOptionSet && !loading && !fetchingOptionSets && (
            <div className="text-center py-8 text-gray-500">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select an Option Set</h3>
              <p>Choose an option set from the dropdown above to view its conversion matrix.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 