import React from 'react';

export const Placeholder = ({ text, className = '' }: { text: string; className?: string }) => (
  <div
    className={`w-full h-full min-h-96 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex items-center justify-center ${className}`}
  >
    <div className="text-center">
      <h3 className="text-lg font-medium text-gray-500">{text}</h3>
      <p className="text-sm text-gray-400 mt-1">This is a placeholder for page content.</p>
    </div>
  </div>
); 