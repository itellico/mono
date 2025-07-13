'use client';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// TODO: Import these when components are created
// import { StringScannerPanel } from './components/StringScannerPanel';
// import type { StringScanResult, CursorRulesScanResult } from './types';
/**
 * Development Menu Component
 * 
 * Provides development tools for Super Admins including:
 * - React string scanning for hardcoded strings and missing translation keys
 * - Translation validation and best practices checking
 * - Development utilities and debugging tools
 * 
 * @component
 * @example
 * <DevMenu />
 */
export const DevMenu: React.FC = () => {
  const { user } = useAuth();
  
  // Check user role
  const userRole = (user as any)?.adminRole?.roleType;
  
  // Early return for non-super admins
  if (userRole !== 'super_admin') {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Development Tools</h1>
          <p className="text-gray-600 mt-2">
            Advanced development utilities for itellico Mono optimization and debugging
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="string-scanner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="string-scanner">String Scanner</TabsTrigger>
          <TabsTrigger value="cursor-rules">Cursor Rules</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="string-scanner" className="space-y-6">
          <div className="text-center text-gray-600 p-8">
            String Scanner panel would go here...
          </div>
        </TabsContent>
        
        <TabsContent value="cursor-rules" className="space-y-6">
          <div className="text-center text-gray-600 p-8">
            Cursor Rules Scanner panel would go here...
          </div>
        </TabsContent>
        
        <TabsContent value="utilities" className="space-y-6">
          <div className="text-center text-gray-600 p-8">
            Additional development utilities would go here...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 