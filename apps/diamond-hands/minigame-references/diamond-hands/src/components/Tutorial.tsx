import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import zoomBackground from 'figma:asset/71d26293384019ea8972e81dbd49570330ebb3fb.png';
import depositGraphic from 'figma:asset/96f2c276abc9cffa7797c77a494d2b969a0da31d.png';
import tapDiamondGraphic from 'figma:asset/a20b9a535e70512dcf440d0a77c32ec560460364.png';
import eyePriceGraphic from 'figma:asset/30c1cfd52bebb09d48f744b9932fb9a131e67bac.png';

interface TutorialProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    title: "DEPOSIT WLD",
    content: "Deposit any amount of WLD tokens to receive your diamond 💎",
    graphic: depositGraphic
  },
  {
    title: "WATCH THE PRICE CHANGE",
    content: "⏱️ The price of your diamond changes every 5 seconds, so keep an eye on it!",
    graphic: eyePriceGraphic
  },
  {
    title: "HOLD OR LET GO?",
    content: "Tap the diamond to keep holding, or do nothing to sell your diamond 💰",
    graphic: tapDiamondGraphic
  }
];

export function Tutorial({ onComplete }: TutorialProps) {
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
        backgroundImage: `url(${zoomBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Graphic */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#edaa38] to-[#d4941f] p-1">
            <div className="w-full h-full rounded-lg overflow-hidden">
              <img
                src={tutorialSteps[currentStep].graphic}
                alt={tutorialSteps[currentStep].title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl mb-4" style={{ fontFamily: 'Aubrey, cursive' }}>
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
              className={`w-3 h-3 rounded-full ${
                index === currentStep ? 'bg-primary' : 'bg-gray-300'
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
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {tutorialSteps.length}
          </span>
          
          <Button
            onClick={nextStep}
            className="flex items-center gap-2"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-4 h-4" />
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
          Skip Tutorial
        </Button>
      </div>
    </div>
  );
}