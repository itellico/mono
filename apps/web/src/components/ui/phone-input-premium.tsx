'use client';

import React from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PhoneInputPremiumProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  defaultCountry?: string;
  className?: string;
  error?: string;
}

export const PhoneInputPremium = function PhoneInputPremium({
  value,
  onChange,
  placeholder = "Enter phone number",
  label = "Phone Number",
  required = false,
  defaultCountry = 'AT',
  className,
  error
}) {
  // Use the package's built-in validation
  const isValid = value ? isValidPhoneNumber(value) : undefined;
  const showValidation = value && value.length > 4; // Only show validation after some input

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="phone-input">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry as any}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "phone-input-container",
            error && "border-red-500",
            showValidation && isValid && !error && "border-green-500",
            showValidation && !isValid && !error && "border-red-500"
          )}
        />

        {/* Validation indicator */}
        {showValidation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid && !error ? (
              <span className="text-green-500 text-sm">✓</span>
            ) : (
              <span className="text-red-500 text-sm">✗</span>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Validation feedback */}
      {showValidation && !error && (
        <div className={cn(
          "flex items-center gap-2 text-sm",
          isValid ? "text-green-600" : "text-red-500"
        )}>
          <span>{isValid ? "✓" : "⚠️"}</span>
          {isValid ? "Valid phone number" : "Invalid phone number"}
        </div>
      )}

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground">
        International format with country code
      </div>
    </div>
  );
} 