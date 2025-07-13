'use client';

import React, { useState } from 'react';
import { TestFormForm } from '@/components/forms/TestFormForm';
import { TestForm } from '@/types/forms/test-form.types';
import { useToast } from '@/hooks/use-toast';

/**
 * 📄 Test Form Page - Generated from form definition
 * 
 * This page demonstrates the Form-to-React bridge in action.
 * Your form JSON has been converted to a type-safe React component!
 */

export default function TestFormPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: TestForm) => {
    setLoading(true);
    
    try {
      console.log('🎉 Form submitted with type-safe data:', data);
      console.log('🏷️ TypeScript knows test1 is:', typeof data.test1);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success!",
        description: "Form submitted successfully!",
      });
      console.log('✅ Form data:', data);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
      console.error('❌ Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">🔗 Form-to-React Bridge Demo</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              🎯 What You&apos;re Seeing
            </h2>
            <ul className="text-blue-700 space-y-1">
              <li>✅ <strong>Form JSON</strong> from your database</li>
              <li>✅ <strong>TypeScript interface</strong> automatically generated</li>
              <li>✅ <strong>React Hook Form component</strong> with ShadCN UI</li>
              <li>✅ <strong>Zod validation</strong> for type safety</li>
              <li>✅ <strong>itellico Mono integration</strong> (browserLogger)</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Test Form</h2>
          <p className="text-gray-600 mb-6">
            This form was generated from your database form definition. 
            Try submitting it and check the browser console!
          </p>
          
          <TestFormForm
            onSubmit={handleSubmit}
            loading={loading}
            defaultValues={{
              test1: ""
            }}
          />
        </div>
        
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">🔍 Technical Details</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>Form ID:</strong> 09b8c54a-4658-46be-a29c-fe97748db5bd</li>
            <li><strong>Generated Interface:</strong> TestForm</li>
            <li><strong>Component:</strong> TestFormForm</li>
            <li><strong>Validation:</strong> testFormSchema (Zod)</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 