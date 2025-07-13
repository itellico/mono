'use client';
import React from 'react';
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import UserTypeSelection from './steps/UserTypeSelection';
import BasicInfoForm from './steps/BasicInfoForm';
import ProfessionalInfoForm from './steps/ProfessionalInfoForm';
import ModelApplicationForm from './steps/ModelApplicationForm';
import SetCardUpload from './steps/SetCardUpload';
import CompletionStep from './steps/CompletionStep';
export type UserType = 
  | 'fashion_model'
  | 'child_model' 
  | 'pet_model'
  | 'hand_model'
  | 'commercial_model'
  | 'plus_size_model'
  | 'photographer'
  | 'agency'
  | 'brand';
export interface OnboardingData {
  userType?: string;
  basicInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    phone: string;
    countryId: number;
    city: string;
    timezoneId: number;
    languageId: number;
  };
  professionalInfo?: {
    experienceLevel: string;
    specialties: string[];
    portfolio?: string;
    workAvailability: string;
    hourlyRate?: string;
  };
  modelApplication?: {
    height?: string;
    weight?: string;
    hairColor?: string;
    eyeColor?: string;
    ethnicities?: string[];
    specialties?: string[];
    experience?: string;
    portfolio?: string;
    workTypes?: string[];
    categoryId?: number | null;
    physicalAttributes?: {
      height?: string;
      weight?: string;
      hairColor?: string;
      eyeColor?: string;
    };
         availability?: {
       willingToTravel?: boolean;
       availableWeekends?: boolean;
       availableEvenings?: boolean;
     };
    careerGoals?: string;
    previousWork?: string;
  };
  setCardPhotos?: File[] | {
    bodyShot?: File | null;
    portrait?: File | null;
    actionShot?: File | null;
    lifestyle?: File | null;
    professional?: File | null;
  };
}
interface OnboardingFlowProps {
  user: {
    id?: string;
    email?: string | null;
    name?: string | null;
  };
}
export default function OnboardingFlow({ user }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    userType: null,
    basicInfo: {
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ')[1] || '',
      email: user?.email || '',
      dateOfBirth: '',
      phone: '',
      countryId: 1, // Default to first country
      city: '',
      timezoneId: 1, // Default timezone
      languageId: 1, // Default language (English US)
    },
    professionalInfo: {
      experienceLevel: '',
      specialties: [],
      workAvailability: '' 
    },
  });

  // Step validation functions
  const validateStep = (stepId: number): boolean => {
    switch (stepId) {
      case 1: // User Type
        return !!onboardingData.userType;
      case 2: // Basic Info
        return !!(
          onboardingData.basicInfo?.firstName &&
          onboardingData.basicInfo?.lastName &&
          onboardingData.basicInfo?.phone &&
          onboardingData.basicInfo?.city &&
          (!isModelType || onboardingData.basicInfo?.dateOfBirth) // Date required for models
        );
      case 3: // Professional Info
        return !!(
          onboardingData.professionalInfo?.experienceLevel &&
          onboardingData.professionalInfo?.specialties?.length > 0
        );
      case 4: // Model Application (only for models) OR Completion (for non-models)
        if (!isModelType) {
          // This is the completion step for non-models: steps 1, 2, 3 must be valid
          return validateStep(1) && validateStep(2) && validateStep(3);
        } else {
          // This is the Model Application step for models
          return !!(
            onboardingData.modelApplication?.physicalAttributes?.height &&
            onboardingData.modelApplication?.physicalAttributes?.hairColor &&
            onboardingData.modelApplication?.physicalAttributes?.eyeColor
          );
        }
      case 5: // Set Card Photos (only for models)
        if (!isModelType) return true; // Not applicable for non-models
        return !!(onboardingData.setCardPhotos && Object.values(onboardingData.setCardPhotos).filter(photo => photo !== null).length >= 3);
      case 6: // Completion
        if (!isModelType) {
          // For non-models: steps 1, 2, 3 must be valid
          return validateStep(1) && validateStep(2) && validateStep(3);
        } else {
          // For models: steps 1, 2, 3, 4, 5 must be valid
          return validateStep(1) && validateStep(2) && validateStep(3) && validateStep(4) && validateStep(5);
        }
      default:
        return false;
    }
  };
  // Get highest valid step (for click navigation)
  const getHighestValidStep = (): number => {
    let highest = 1;
    for (let i = 1; i <= totalSteps; i++) {
      if (validateStep(i)) {
        highest = i + 1; // Can go to next step if current is valid
      } else {
        break;
      }
    }
    return Math.min(highest, totalSteps);
  };
  // Get validation message for current step
  const getValidationMessage = (stepId: number): string => {
    if (validateStep(stepId)) return '';
    switch (stepId) {
      case 1:
        return 'Please select your user type';
      case 2:
        return `Please complete: ${[
          !onboardingData.basicInfo?.firstName && 'First Name',
          !onboardingData.basicInfo?.lastName && 'Last Name', 
          !onboardingData.basicInfo?.phone && 'Phone Number',
          !onboardingData.basicInfo?.city && 'City',
          isModelType && !onboardingData.basicInfo?.dateOfBirth && 'Date of Birth'
        ].filter(Boolean).join(', ')}`;
      case 3:
        return `Please complete: ${[
          !onboardingData.professionalInfo?.experienceLevel && 'Experience Level',
          (!onboardingData.professionalInfo?.specialties?.length) && 'Specialties (at least one)'
        ].filter(Boolean).join(', ')}`;
      case 4:
        if (!isModelType) return '';
        return `Please complete: ${[
          !onboardingData.modelApplication?.physicalAttributes?.height && 'Height',
          !onboardingData.modelApplication?.physicalAttributes?.hairColor && 'Hair Color',
          !onboardingData.modelApplication?.physicalAttributes?.eyeColor && 'Eye Color'
        ].filter(Boolean).join(', ')}`;
      case 5:
        if (!isModelType) return '';
        const photoCount = onboardingData.setCardPhotos ? Object.values(onboardingData.setCardPhotos).length : 0;
        return photoCount < 3 ? `Please upload at least 3 photos (currently ${photoCount}/5)` : '';
      default:
        return '';
    }
  };
  const isModelType = onboardingData.userType?.includes('model');
  const totalSteps = isModelType ? 6 : 4;
  const steps = [
    { id: 1, title: 'User Type', component: UserTypeSelection },
    { id: 2, title: 'Basic Info', component: BasicInfoForm },
    { id: 3, title: 'Professional Info', component: ProfessionalInfoForm },
    ...(isModelType ? [
      { id: 4, title: 'Model Application', component: ModelApplicationForm },
      { id: 5, title: 'Set Card Photos', component: SetCardUpload },
      { id: 6, title: 'Complete', component: CompletionStep },
    ] : [
      { id: 4, title: 'Complete', component: CompletionStep },
    ]),
  ];
  const progress = (currentStep / totalSteps) * 100;
  const handleNext = () => {
    if (currentStep < totalSteps && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleStepClick = (stepId: number) => {
    // Can only navigate to steps that are accessible
    const highestValid = getHighestValidStep();
    if (stepId <= highestValid) {
      setCurrentStep(stepId);
    }
  };
  const handleStepData = useCallback((stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
  }, []);
  const CurrentStepComponent = steps.find(step => step.id === currentStep)?.component;
  // These functions are kept for future use when implementing direct step completion
  // const handleStepComplete = (stepData: Partial<OnboardingData>) => {
  //   setOnboardingData(prev => ({ ...prev, ...stepData }));
  //   
  //   if (currentStep < totalSteps) {
  //     setCurrentStep(prev => prev + 1);
  //   }
  // };
  // const handleStepBack = () => {
  //   if (currentStep > 1) {
  //     setCurrentStep(prev => prev - 1);
  //   }
  // };
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl">
            Setup Your Profile
          </CardTitle>
          <Badge variant="outline" className="px-3 py-1">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        {/* Step Indicators */}
        <div className="flex items-center justify-between mt-6">
          {steps.map((step, index) => {
            const isCompleted = validateStep(step.id) && currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isAccessible = step.id <= getHighestValidStep();
            const isValid = validateStep(step.id);
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isAccessible}
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${isCompleted
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : isCurrent 
                      ? `${isValid ? 'bg-blue-500' : 'bg-red-500'} text-white` 
                      : isAccessible
                      ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                  title={!isAccessible ? 'Complete previous steps first' : `Go to ${step.title}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </button>
                <span className={`ml-2 text-sm font-medium ${
                  isCompleted || isCurrent ? 'text-gray-900' : isAccessible ? 'text-gray-700' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {CurrentStepComponent && (
          <CurrentStepComponent
            data={onboardingData}
            onUpdate={handleStepData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex flex-col items-end gap-2">
            {!validateStep(currentStep) && currentStep < totalSteps && (
              <p className="text-sm text-red-600 max-w-md text-right">
                {getValidationMessage(currentStep)}
              </p>
            )}
            <Button
              onClick={handleNext}
              disabled={currentStep === totalSteps || !validateStep(currentStep)}
              className="flex items-center gap-2"
            >
              {currentStep === totalSteps ? 'Complete' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}