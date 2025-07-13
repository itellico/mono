'use client';

import React from 'react';

import { TenantForm } from '@/components/reusable/TenantForm';
import { OnboardingData } from '../OnboardingFlow';
import { MapPin, Globe, CalendarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BasicInfoFormProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Mock data - in real app, fetch from database
const countries = [
  { value: '1', label: 'United States' },
  { value: '2', label: 'United Kingdom' },
  { value: '3', label: 'Canada' },
  { value: '4', label: 'Australia' },
  { value: '5', label: 'Germany' },
  { value: '6', label: 'France' },
  { value: '7', label: 'Italy' },
  { value: '8', label: 'Spain' },
  { value: '9', label: 'Netherlands' },
  { value: '10', label: 'Sweden' },
];

const languages = [
  { value: '1', label: 'English' },
  { value: '2', label: 'Spanish' },
  { value: '3', label: 'French' },
  { value: '4', label: 'German' },
  { value: '5', label: 'Italian' },
  { value: '6', label: 'Dutch' },
  { value: '7', label: 'Swedish' },
  { value: '8', label: 'Portuguese' },
  { value: '9', label: 'Japanese' },
  { value: '10', label: 'Korean' },
];

export default function BasicInfoForm({ data, onUpdate, onNext }: BasicInfoFormProps) {
  const t = useTranslations('common');
  const isModelType = data.userType?.includes('model');

  // Custom validation function for complex age verification
  const validateDateOfBirth = (value: string) => {
    if (!isModelType || !value) return '';

    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (data.userType === 'child_model' && age >= 18) {
      return 'Child models must be under 18 years old';
    } else if (data.userType !== 'child_model' && age < 18) {
      return 'Models must be 18 or older (or select Child Model category)';
    }

    return '';
  };

  const handleSubmit = async (formData: any) => {
    onUpdate({ basicInfo: formData });
    onNext();
  };

  const handleChange = (formData: any) => {
    onUpdate({ basicInfo: formData });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('basicInfo.title')}
        </h2>
        <p className="text-gray-600">
          {t('basicInfo.subtitle')}
        </p>
      </div>

      <TenantForm
        resource="user"
        action="create"
        sections={[
          {
            key: 'personal',
            title: t('basicInfo.personalDetails.title'),
            description: t('basicInfo.personalDetails.description')
          },
          {
            key: 'location',
            title: t('basicInfo.location.title'),
            description: t('basicInfo.location.description')
          },
          {
            key: 'language',
            title: t('basicInfo.language.title'),
            description: t('basicInfo.language.description')
          },
          ...(isModelType ? [{
            key: 'dateOfBirth',
            title: t('basicInfo.dateOfBirth.title'),
            description: data.userType === 'child_model' 
              ? t('basicInfo.dateOfBirth.childModelDescription')
              : t('basicInfo.dateOfBirth.adultModelDescription')
          }] : [])
        ]}
        fields={[
          // Personal Details Fields
          {
            key: 'firstName',
            type: 'text',
            label: t('basicInfo.personalDetails.firstName'),
            placeholder: t('basicInfo.personalDetails.firstNamePlaceholder'),
            validation: { 
              min: 2,
              max: 50
            },
            required: true,
            width: 'half',
            section: 'personal'
          },
          {
            key: 'lastName',
            type: 'text',
            label: t('basicInfo.personalDetails.lastName'),
            placeholder: t('basicInfo.personalDetails.lastNamePlaceholder'),
            validation: { 
              min: 2,
              max: 50
            },
            required: true,
            width: 'half',
            section: 'personal'
          },
          {
            key: 'phone',
            type: 'text',
            label: t('basicInfo.personalDetails.phone'),
            placeholder: '+1 (555) 123-4567',
            validation: { 
              pattern: /^\+?[\d\s\-\(\)]{10 }$/ },
            required: true,
            section: 'personal'
          },

          // Location Fields
          {
            key: 'countryId',
            type: 'select',
            label: t('basicInfo.location.country'),
            placeholder: t('basicInfo.location.countryPlaceholder'),
            options: countries,
            required: true,
            width: 'half',
            section: 'location'
          },
          {
            key: 'city',
            type: 'text',
            label: t('basicInfo.location.city'),
            placeholder: t('basicInfo.location.cityPlaceholder'),
            validation: { 
              min: 2,
              max: 100
            },
            required: true,
            width: 'half',
            section: 'location'
          },

          // Language Field
          {
            key: 'languageId',
            type: 'select',
            label: t('basicInfo.language.primaryLanguage'),
            placeholder: t('basicInfo.language.primaryLanguagePlaceholder'),
            options: languages,
            required: true,
            section: 'language'
          },

          // Conditional Date of Birth for Models
          ...(isModelType ? [{
            key: 'dateOfBirth',
            type: 'date' as const,
            label: t('basicInfo.dateOfBirth.label'),
            validation: { 
              custom: validateDateOfBirth
            },
            required: true,
            section: 'dateOfBirth'
          }] : [])
        ]}
        labels={{
          title: t('basicInfo.title'),
          description: t('basicInfo.subtitle'),
          submitButton: t('common.continue') }}
        layout="sections"
        initialValues={data.basicInfo || {}}
        onSubmit={handleSubmit}
      />
    </div>
  );
};