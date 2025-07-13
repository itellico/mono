'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { browserLogger } from '@/lib/browser-logger';

export default function TestRedisPage() {
  const [tenantId, setTenantId] = useState('1');
  const [optionSetId, setOptionSetId] = useState('test-option-set');
  const [testData, setTestData] = useState('{"name": "Test Option Set", "description": "Testing Redis cache"}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const performAction = async (action: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/v1/admin/option-sets/test-redis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          tenantId: tenantId || null,
          optionSetId: optionSetId || null,
          data: action === 'set' ? JSON.parse(testData) : undefined,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        browserLogger.info(`Redis ${action} operation successful`, data);
      } else {
        browserLogger.error(`Redis ${action} operation failed`, data);
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: 'Request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      setResult(errorResult);
      browserLogger.error(`Redis ${action} operation failed`, errorResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Redis Cache Test</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tenantId">Tenant ID (optional)</Label>
              <Input
                id="tenantId"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Enter tenant ID or leave empty"
              />
            </div>

            <div>
              <Label htmlFor="optionSetId">Option Set ID (optional)</Label>
              <Input
                id="optionSetId"
                value={optionSetId}
                onChange={(e) => setOptionSetId(e.target.value)}
                placeholder="Enter option set ID or leave empty"
              />
            </div>

            <div>
              <Label htmlFor="testData">Test Data (JSON for SET operation)</Label>
              <Textarea
                id="testData"
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder="Enter JSON data to cache"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redis Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => performAction('set')} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'SET (Cache Data)'}
            </Button>

            <Button 
              onClick={() => performAction('get')} 
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? 'Processing...' : 'GET (Retrieve Data)'}
            </Button>

            <Button 
              onClick={() => performAction('invalidate')} 
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? 'Processing...' : 'INVALIDATE (Clear Cache)'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 