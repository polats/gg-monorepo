'use client';

import { useState, memo } from 'react';
import { Button } from './ui/button';
import type { TutorialProps } from '@/types/minigame';

const tutorialSteps = [
  {
    title: "DEPOSIT WLD",
    content: "Deposit any amount of WLD tokens to receive your diamond 💎",
    backgroundImage: "/minigame-assets/background-1.png"
  },
  {
    title: "WATCH THE PRICE CHANGE",
    content: "⏱️ The price of your diamond changes every 5 seconds, so keep an eye on it!",
    backgroundImage: "/minigame-assets/background-3.png"
  },
  {
    title: "HOLD OR LET GO?",
    content: "Tap the diamond to keep holding, or do nothing to sell your diamond 💰",
    backgroundImage: "/minigame-assets/background-4.png"
  }
];

export const Tutorial = memo(function Tutorial({ onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        backgroundImage: `url(/minigame-assets/zoom-background.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Guide image for current step */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#edaa38] to-[#d4941f] p-1">
            <div className="w-full h-full rounded-lg overflow-hidden">
              <img
                src={tutorialSteps[currentStep].backgroundImage}
                alt={tutorialSteps[currentStep].title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl mb-4 text-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {tutorialSteps[currentStep].title}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            {tutorialSteps[currentStep].content}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center space-x-2 mb-8">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              data-testid={`progress-dot-${index}`}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep ? 'bg-red-600 active' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>

          <Button
            onClick={nextStep}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Skip Tutorial button */}
      <div className="mt-6">
        <Button
          variant="ghost"
          onClick={onComplete}
          className="text-white hover:text-gray-200"
        >
          Skip
        </Button>
      </div>
    </div>
  );
});