'use client';

import { useEffect, useState } from 'react';

export default function FontTestPage() {
  const [fontFamily, setFontFamily] = useState('');

  useEffect(() => {
    const computedStyle = window.getComputedStyle(document.body);
    setFontFamily(computedStyle.fontFamily);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 space-y-4">
        <h1 className="text-4xl font-bold">Font Test</h1>
        <p className="text-lg">Current font family: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{fontFamily}</code></p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Font Samples</h2>
        
        <div className="space-y-3">
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg">
            This text is explicitly using Inter font - Modern and clean
          </p>
          
          <p style={{ fontFamily: 'Times New Roman, serif' }} className="text-lg">
            This text is using Times New Roman - Old style
          </p>
          
          <p className="text-lg">
            This text uses default styling - should be Inter
          </p>

          <p className="font-sans text-lg">
            This text uses font-sans class - should be Inter
          </p>

          <p className="font-mono text-lg">
            This text uses font-mono class - should be JetBrains Mono
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">All Font Weights</h2>
        <div className="space-y-2">
          <p className="font-thin text-lg">Thin (100) - The quick brown fox jumps over the lazy dog</p>
          <p className="font-extralight text-lg">Extra Light (200) - The quick brown fox jumps over the lazy dog</p>
          <p className="font-light text-lg">Light (300) - The quick brown fox jumps over the lazy dog</p>
          <p className="font-normal text-lg">Normal (400) - The quick brown fox jumps over the lazy dog</p>
          <p className="font-medium text-lg">Medium (500) - The quick brown fox jumps over the lazy dog</p>
          <p className="font-semibold text-lg">Semibold (600) - The quick brown fox jumps over the lazy dog</p>
          <p className="font-bold text-lg">Bold (700) - The quick brown fox jumps over the lazy dog</p>
          <p className="font-extrabold text-lg">Extra Bold (800) - The quick brown fox jumps over the lazy dog</p>
          <p className="font-black text-lg">Black (900) - The quick brown fox jumps over the lazy dog</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">CSS Variables</h2>
        <div className="space-y-2 font-mono text-sm">
          <p>--font-sans: {typeof window !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue('--font-sans')}</p>
          <p>--font-mono: {typeof window !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue('--font-mono')}</p>
        </div>
      </div>
    </div>
  );
}