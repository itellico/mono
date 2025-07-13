import React from 'react';

export interface FieldRendererProps {
  field: any;
  value?: any;
  onChange?: (value: any) => void;
  error?: string;
}

export function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  // Basic stub implementation
  return (
    <div className="field-renderer">
      <label className="block text-sm font-medium mb-1">
        {field.label || field.name}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export default FieldRenderer;
