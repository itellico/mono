'use client';

import React from 'react';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Sparkles, ArrowRight, Clock, Mail, Camera } from 'lucide-react';
import { OnboardingData } from '../OnboardingFlow';
import { browserLogger } from '@/lib/browser-logger';

interface CompletionStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CompletionStep({ data }: CompletionStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isModelType = data.userType?.includes('model');
  const userTypeLabel = data.userType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  const handleFinish = async () => {
    setIsSubmitting(true);

    // Here you would submit all the onboarding data to your API
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirect to dashboard or appropriate page
      window.location.href = '/dashboard';
    } catch (error) {
              browserLogger.error('Error submitting onboarding data', { error: error.message });
      setIsSubmitting(false);
    }
  };

  const completedSteps = [
    { 
      step: 'User Type', 
      completed: !!data.userType,
      detail: userTypeLabel
    },
    { 
      step: 'Basic Information', 
      completed: !!(data.basicInfo.firstName && data.basicInfo.lastName),
      detail: `${data.basicInfo.firstName} ${data.basicInfo.lastName}`
    },
    { 
      step: 'Professional Info', 
      completed: !!(data.professionalInfo.experienceLevel),
      detail: data.professionalInfo.experienceLevel?.replace(/\b\w/g, l => l.toUpperCase())
    },
    ...(isModelType ? [
      { 
        step: 'Model Application', 
        completed: !!(
          data.modelApplication?.physicalAttributes?.height &&
          data.modelApplication?.physicalAttributes?.hairColor &&
          data.modelApplication?.physicalAttributes?.eyeColor
        ),
        detail: 'Application details provided'
      },
      { 
        step: 'Set Card Photos', 
        completed: data.setCardPhotos ? Object.values(data.setCardPhotos).filter(photo => photo !== null).length === 5 : false,
        detail: data.setCardPhotos ? `${Object.values(data.setCardPhotos).filter(photo => photo !== null).length}/5 photos uploaded` : '0/5 photos uploaded'
      }
    ] : [])
  ];

  const allStepsCompleted = completedSteps.every(step => step.completed);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {allStepsCompleted ? 'Congratulations!' : 'Almost There!'}
        </h2>
        <p className="text-lg text-gray-600">
          {allStepsCompleted 
            ? 'Your profile setup is complete'
            : 'Please complete all steps to finish your profile'
          }
        </p>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Profile Setup Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedSteps.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    ${item.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.step}</p>
                    {item.detail && (
                      <p className="text-sm text-gray-600">{item.detail}</p>
                    )}
                  </div>
                </div>
                <Badge variant={item.completed ? "default" : "secondary"}>
                  {item.completed ? 'Complete' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      {allStepsCompleted ? (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">What happens next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isModelType ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Application Review</h4>
                        <p className="text-sm text-gray-600">
                          Our team will review your application and set card photos within 2-5 business days.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                        <Mail className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notification</h4>
                        <p className="text-sm text-gray-600">
                          You&apos;ll receive an email once your application is approved and your profile goes live.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <Camera className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Start Modeling</h4>
                        <p className="text-sm text-gray-600">
                          Once approved, you can browse and apply for modeling jobs that match your profile.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Instant Access</h4>
                        <p className="text-sm text-gray-600">
                          Your account is ready! You can immediately start using the platform.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Explore Features</h4>
                        <p className="text-sm text-gray-600">
                          Browse the talent directory, post jobs, and connect with models.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
              onClick={handleFinish}
              disabled={isSubmitting}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Setting up your account...
                </>
              ) : (
                <>
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">
            Please go back and complete all required steps before finishing your profile setup.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};