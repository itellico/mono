'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Users, Building, Sparkles, Baby, Heart, Hand, ShoppingBag } from 'lucide-react';
import { UserType, OnboardingData } from '../OnboardingFlow';

interface UserTypeSelectionProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const userTypes = [
  {
    type: 'fashion_model' as UserType,
    title: 'Fashion Model',
    description: 'High fashion, runway, editorial, and commercial fashion modeling',
    icon: Sparkles,
    badge: 'Most Popular',
    badgeVariant: 'default' as const,
    requirements: ['Ages 18+', 'Standard measurements', 'Set card photos'],
    color: 'from-pink-500 to-violet-500'
  },
  {
    type: 'commercial_model' as UserType,
    title: 'Commercial Model',
    description: 'Diverse ages and looks for advertising, lifestyle, and brand campaigns',
    icon: ShoppingBag,
    requirements: ['All ages welcome', 'Diverse looks', 'Natural expressions'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    type: 'plus_size_model' as UserType,
    title: 'Plus Size Model',
    description: 'Specialized modeling for plus-size fashion and body-positive campaigns',
    icon: Heart,
    requirements: ['Size 12+ (UK)', 'Body positivity', 'Fashion experience'],
    color: 'from-rose-500 to-pink-500'
  },
  {
    type: 'child_model' as UserType,
    title: 'Child Model',
    description: 'Young talent for child-focused campaigns and products',
    icon: Baby,
    badge: 'Parental Consent Required',
    badgeVariant: 'secondary' as const,
    requirements: ['Ages 0-17', 'Parental consent', 'School schedule'],
    color: 'from-yellow-500 to-orange-500'
  },
  {
    type: 'hand_model' as UserType,
    title: 'Hand Model',
    description: 'Specialized hand and nail modeling for jewelry, cosmetics, and products',
    icon: Hand,
    requirements: ['Perfect hands', 'Detail-oriented', 'Product experience'],
    color: 'from-emerald-500 to-teal-500'
  },
  {
    type: 'pet_model' as UserType,
    title: 'Pet Model',
    description: 'Animal models for commercials, photography, and entertainment',
    icon: Heart,
    requirements: ['Well-trained pets', 'Handler experience', 'Health certificates'],
    color: 'from-amber-500 to-yellow-500'
  },
  {
    type: 'photographer' as UserType,
    title: 'Photographer',
    description: 'Professional photographers seeking talent and posting jobs',
    icon: Camera,
    requirements: ['Portfolio required', 'Professional equipment', 'Industry experience'],
    color: 'from-gray-600 to-gray-800'
  },
  {
    type: 'agency' as UserType,
    title: 'Modeling Agency',
    description: 'Agencies representing multiple talents and managing bookings',
    icon: Users,
    requirements: ['Agency license', 'Talent roster', 'Industry credentials'],
    color: 'from-purple-600 to-indigo-600'
  },
  {
    type: 'brand' as UserType,
    title: 'Brand/Company',
    description: 'Brands and companies looking to hire models for campaigns',
    icon: Building,
    requirements: ['Business registration', 'Marketing budget', 'Campaign goals'],
    color: 'from-slate-600 to-slate-800'
  }
];

export default function UserTypeSelection({ data, onUpdate, onNext }: UserTypeSelectionProps) {
  const handleTypeSelect = (userType: UserType) => {
    onUpdate({ userType });
    // Auto-advance after selection
    setTimeout(() => {
      onNext();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What best describes you?
        </h2>
        <p className="text-gray-600">
          Choose your account type to customize your experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = data.userType === type.type;

          return (
            <Card
              key={type.type}
              className={`
                cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]
                ${isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
                }
              `}
              onClick={() => handleTypeSelect(type.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`
                    w-12 h-12 rounded-lg bg-gradient-to-br ${type.color} 
                    flex items-center justify-center mb-3
                  `}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {type.badge && (
                    <Badge variant={type.badgeVariant} className="text-xs">
                      {type.badge}
                    </Badge>
                  )}
                </div>

                <CardTitle className="text-lg leading-tight">
                  {type.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {type.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Requirements:
                  </p>
                  <div className="space-y-1">
                    {type.requirements.map((req, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                        {req}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.userType && (
        <div className="text-center">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center text-green-700">
                <Sparkles className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  Great choice! You selected {userTypes.find(t => t.type === data.userType)?.title}
                </span>
              </div>
              <p className="text-sm text-green-600 mt-2">
                Proceeding to the next step...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};