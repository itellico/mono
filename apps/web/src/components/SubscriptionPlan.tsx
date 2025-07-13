
'use client';

import { SubscriptionPlan } from '@/lib/subscription-schema';
import { CheckIcon } from '@heroicons/react/20/solid';
import { useSubscriptionLimits } from '@/lib/hooks/useSubscriptionLimits';

interface SubscriptionPlanProps {
  plan: SubscriptionPlan;
}

export default function SubscriptionPlanComponent({ plan }: SubscriptionPlanProps) {
  const { data: limits, isLoading, error } = useSubscriptionLimits(plan.id);

  return (
    <div className="flex flex-col rounded-3xl bg-white shadow-xl ring-1 ring-black/10">
      <div className="p-8 sm:p-10">
        <h3 className="text-lg font-semibold leading-8 tracking-tight text-indigo-600">
          {plan.name}
        </h3>
        <div className="mt-4 flex items-baseline text-5xl font-bold tracking-tight text-gray-900">
          ${plan.monthlyPrice}
          <span className="text-lg font-semibold leading-8 tracking-normal text-gray-500">
            /mo
          </span>
        </div>
        <p className="mt-6 text-base leading-7 text-gray-600">
          {plan.description}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-2">
        <div className="flex flex-1 flex-col justify-between rounded-2xl bg-gray-50 p-6 sm:p-8">
          <ul role="list" className="space-y-6">
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <CheckIcon
                  className="h-6 w-6 text-indigo-600"
                  aria-hidden="true"
                />
              </div>
              <p className="ml-3 text-sm leading-6 text-gray-600">
                {plan.planType} plan
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <CheckIcon
                  className="h-6 w-6 text-indigo-600"
                  aria-hidden="true"
                />
              </div>
              <p className="ml-3 text-sm leading-6 text-gray-600">
                {plan.trialDays} trial days
              </p>
            </li>
            {isLoading && <p>Loading limits...</p>}
            {error && <p>Error loading limits</p>}
            {limits && (
              <>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckIcon
                      className="h-6 w-6 text-indigo-600"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm leading-6 text-gray-600">
                    {limits.maxProjects} projects
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckIcon
                      className="h-6 w-6 text-indigo-600"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm leading-6 text-gray-600">
                    {limits.maxUsers} users
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckIcon
                      className="h-6 w-6 text-indigo-600"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm leading-6 text-gray-600">
                    {limits.storageLimit}GB storage
                  </p>
                </li>
              </>
            )}
          </ul>
          <div className="mt-8">
            <a
              href="#"
              className="inline-block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold leading-5 text-white shadow-md hover:bg-indigo-700"
            >
              Get started
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
