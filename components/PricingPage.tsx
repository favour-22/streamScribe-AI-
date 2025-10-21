import React from 'react';
import { CheckIcon } from './icons/Icons';

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    features: [
      '5 video analyses per month',
      '10 minutes of live transcription',
      'Community support',
    ],
    cta: 'Get Started',
    isFeatured: false,
  },
  {
    name: 'Pro',
    price: '$49/mo',
    features: [
      '100 video analyses per month',
      'Unlimited live transcription',
      'Advanced analysis models',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
    isFeatured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Unlimited video analyses',
      'Dedicated infrastructure',
      'Custom model training',
      '24/7 priority support',
    ],
    cta: 'Contact Sales',
    isFeatured: false,
  },
];

export const PricingPage: React.FC = () => {
  return (
    <div className="container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Flexible Plans for Every Need
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Choose the plan that's right for you and unlock the full power of AI media analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col rounded-lg shadow-xl overflow-hidden border ${
              tier.isFeatured ? 'border-blue-500' : 'border-gray-700'
            } bg-gray-800`}
          >
            {tier.isFeatured && (
              <div className="bg-blue-600 text-center py-1 text-sm font-semibold text-white">
                Most Popular
              </div>
            )}
            <div className="p-8 flex-grow">
              <h3 className="text-2xl font-semibold text-white">{tier.name}</h3>
              <div className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-extrabold tracking-tight">
                  {tier.price}
                </span>
              </div>
              <p className="mt-6 text-gray-400">
                Perfect for individuals and teams getting started with AI.
              </p>

              <ul role="list" className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex space-x-3">
                    <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-400" />
                    <span className="text-base text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 bg-gray-800">
              <button
                className={`w-full py-3 px-6 border border-transparent rounded-md text-base font-medium transition-colors ${
                  tier.isFeatured
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
