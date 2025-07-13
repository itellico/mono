'use client';

import React from 'react';

import { TenantForm } from '@/components/reusable/TenantForm';
import { OnboardingData } from '../OnboardingFlow';
import { User, Ruler, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ModelApplicationFormProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Mock model categories - in real app, fetch from database
const modelCategories = [
  { value: '1', label: 'Fashion Model (Ages 18-35)' },
  { value: '2', label: 'Commercial Model (Ages 18-65)' },
  { value: '3', label: 'Plus Size Model (Ages 18-45)' },
  { value: '4', label: 'Child Model (Ages 0-17)' },
  { value: '5', label: 'Hand Model (Ages 18-50)' },
  { value: '6', label: 'Pet Model (Ages 0-20)' },
];

const eyeColorOptions = [
  { value: 'brown', label: 'Brown' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'hazel', label: 'Hazel' },
  { value: 'gray', label: 'Gray' },
  { value: 'amber', label: 'Amber' },
];

const hairColorOptions = [
  { value: 'black', label: 'Black' },
  { value: 'brown', label: 'Brown' },
  { value: 'blonde', label: 'Blonde' },
  { value: 'red', label: 'Red' },
  { value: 'gray', label: 'Gray' },
  { value: 'white', label: 'White' },
  { value: 'other', label: 'Other' },
];

export default function ModelApplicationForm({ data, onUpdate }: ModelApplicationFormProps) {
  const t = useTranslations('common');

  const isModelType = data.userType?.includes('model');

  if (!isModelType) {
    return (
      <div className="text-center">
        <p className="text-gray-600">{t('modelApplication.onlyForModels')}</p>
      </div>
    );
  }

  const handleSubmit = async (formData: any) => {
    onUpdate({ modelApplication: formData });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('modelApplication.title')}
        </h2>
        <p className="text-gray-600">
          {t('modelApplication.subtitle')}
        </p>
      </div>

      <TenantForm
        resource="model-application"
        action="create"
        sections={[
          {
            key: 'category',
            title: t('modelApplication.category.title'),
            description: t('modelApplication.category.description')
          },
          {
            key: 'physical',
            title: t('modelApplication.physicalAttributes.title'),
            description: t('modelApplication.physicalAttributes.description')
          },
          {
            key: 'availability',
            title: t('modelApplication.availability.title'),
            description: t('modelApplication.availability.description')
          },
          {
            key: 'career',
            title: t('modelApplication.careerGoals.title')
          }
        ]}
        fields={[
          // Model Category Field
          {
            key: 'categoryId',
            type: 'select',
            label: t('modelApplication.category.label'),
            placeholder: t('modelApplication.category.placeholder'),
            options: modelCategories,
            required: true,
            section: 'category'
          },

          // Physical Attributes Fields
          {
            key: 'height',
            type: 'number',
            label: t('modelApplication.physicalAttributes.height'),
            placeholder: '170',
            validation: { 
              min: 50,
              max: 250
            },
            required: true,
            section: 'physical'
          },
          {
            key: 'weight',
            type: 'number',
            label: t('modelApplication.physicalAttributes.weight'),
            placeholder: '65',
            section: 'physical'
          },
          {
            key: 'eyeColor',
            type: 'select',
            label: t('modelApplication.physicalAttributes.eyeColor'),
            placeholder: t('modelApplication.physicalAttributes.eyeColorPlaceholder'),
            options: eyeColorOptions,
            required: true,
            section: 'physical'
          },
          {
            key: 'hairColor',
            type: 'select',
            label: t('modelApplication.physicalAttributes.hairColor'),
            placeholder: t('modelApplication.physicalAttributes.hairColorPlaceholder'),
            options: hairColorOptions,
            required: true,
            section: 'physical'
          },

          // Availability Fields
          {
            key: 'willingToTravel',
            type: 'checkbox',
            label: t('modelApplication.availability.willingToTravel'),
            section: 'availability'
          },
          {
            key: 'availableWeekends',
            type: 'checkbox',
            label: t('modelApplication.availability.availableWeekends'),
            section: 'availability'
          },
          {
            key: 'availableEvenings',
            type: 'checkbox',
            label: t('modelApplication.availability.availableEvenings'),
            section: 'availability'
          },

          // Career Goals Fields
          {
            key: 'careerGoals',
            type: 'textarea',
            label: t('modelApplication.careerGoals.label'),
            placeholder: t('modelApplication.careerGoals.placeholder'),
            validation: { 
              maxLength: 300 
            },
            section: 'career'
          },
          {
            key: 'previousWork',
            type: 'textarea',
            label: t('modelApplication.careerGoals.previousWork'),
            placeholder: t('modelApplication.careerGoals.previousWorkPlaceholder'),
            validation: { 
              maxLength: 300 
            },
            section: 'career'
          }
        ]}
        labels={{
          title: t('modelApplication.title'),
          description: t('modelApplication.subtitle') }}
        layout="sections"
        initialValues={data.modelApplication || {}}
        onSubmit={handleSubmit}
      />
    </div>
  );
};