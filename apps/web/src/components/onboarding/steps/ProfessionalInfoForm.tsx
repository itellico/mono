'use client';

import { TenantForm } from '@/components/reusable/TenantForm';
import { OnboardingData } from '../OnboardingFlow';
import { Briefcase } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { 
  useExperienceLevelOptions, 
  useSpecialtyOptions,
  getSpecialtyCategory 
} from '@/lib/translations-utils';

interface ProfessionalInfoFormProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ProfessionalInfoForm({ data, onUpdate }: ProfessionalInfoFormProps) {
  const t = useTranslations('common');

  const userType = data.userType || 'commercial_model';
  const experienceLevelOptions = useExperienceLevelOptions();
  const specialtyOptions = useSpecialtyOptions(userType);
  const specialtyCategory = getSpecialtyCategory(userType);

  const handleSubmit = async (formData: any) => {
    onUpdate({ professionalInfo: formData });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('professionalInfo.title')}
        </h2>
        <p className="text-gray-600">
          {t('professionalInfo.subtitle')}
        </p>
      </div>

      <TenantForm
        resource="professional-info"
        action="create"
        sections={[
          {
            key: 'experience',
            title: t('professionalInfo.experienceLevel.title'),
            description: t('professionalInfo.experienceLevel.description')
          },
          {
            key: 'specialties',
            title: t('professionalInfo.specialties.title'),
            description: t('professionalInfo.specialties.description')
          }
        ]}
        fields={[
          // Experience Level Field
          {
            key: 'experienceLevel',
            type: 'select',
            label: t('professionalInfo.experienceLevel.label'),
            placeholder: t('professionalInfo.experienceLevel.placeholder'),
            options: experienceLevelOptions.map(option => ({
              value: option.key,
              label: option.label
            })),
            required: true,
            section: 'experience'
          },

          // Specialties Field
          {
            key: 'specialties',
            type: 'multiselect',
            label: t('professionalInfo.specialties.label'),
            options: specialtyOptions.map(option => ({
              value: option.key,
              label: option.label
            })),
            section: 'specialties'
          }
        ]}
        labels={{
          title: t('professionalInfo.title'),
          description: t('professionalInfo.subtitle'),
        }}
        layout="sections"
        initialValues={data.professionalInfo || {}}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 