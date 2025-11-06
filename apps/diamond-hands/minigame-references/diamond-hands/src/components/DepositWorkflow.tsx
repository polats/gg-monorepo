import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { Check } from 'lucide-react';

interface DepositWorkflowProps {
  onComplete: (amount: number) => void;
  onBack: () => void;
}

export function DepositWorkflow({ onComplete, onBack }: DepositWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState('1.0000');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleSignIn = () => {
    // Mock World ID sign-in
    setIsSignedIn(true);
    setCurrentStep(2);
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (amount >= 0.0001) {
      setCurrentStep(3);
    }
  };

  const handleReady = () => {
    const amount = parseFloat(depositAmount);
    onComplete(amount);
  };

  const progressValue = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-[#f5f5dc] flex flex-col p-6">
      {/* Header with progress */}
      <div className="w-full max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <span className="text-sm text-gray-600">Step {currentStep} of 3</span>
        </div>
        <Progress value={progressValue} className="w-full" />
      </div>

      <div className="flex-1 flex items-start justify-center pt-8 lg:pt-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          {currentStep === 1 && (
            <div className="text-center">
              <h2 className="text-4xl mb-6" style={{ fontFamily: "'Aubrey', cursive" }}>Sign in to Diamond Hands</h2>
              <p className="text-gray-600 mb-4">
                Confirm wallet ownership and authenticate to Diamond Hands.
              </p>
              <p className="text-gray-600 mb-6">
                This app will see:
              </p>
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Your wallet</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Your verification level</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-lg">
                <Label htmlFor="keep-signed-in">Keep me signed for future sessions</Label>
                <Switch
                  id="keep-signed-in"
                  checked={keepSignedIn}
                  onCheckedChange={setKeepSignedIn}
                />
              </div>
              <Button onClick={handleSignIn} className="w-full py-3">
                SIGN IN
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center">
              <h2 className="text-4xl mb-6" style={{ fontFamily: "'Aubrey', cursive" }}>Deposit WLD</h2>
              <p className="text-gray-600 mb-8">
                Enter the amount of WLD tokens you want to deposit to start playing.
              </p>
              <div className="text-left mb-8">
                <Label htmlFor="deposit-amount" className="mb-2 block">
                  Amount (WLD)
                </Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0.0001"
                  step="0.0001"
                  className="text-center text-lg py-3"
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Minimum: 0.0001 WLD
                </p>
              </div>
              <Button 
                onClick={handleDeposit} 
                className="w-full py-3"
                disabled={parseFloat(depositAmount) < 0.0001}
              >
                DEPOSIT
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center">
              <h2 className="text-4xl mb-6" style={{ fontFamily: "'Aubrey', cursive" }}>Ready to Play!</h2>
              <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-gray-800 mb-2">
                  <strong>Remember!</strong>
                </p>
                <p className="text-gray-700">
                  The price of your diamond will change every 5 seconds! You need to tap at least once in order to keep holding on to it!
                </p>
              </div>
              <Button onClick={handleReady} className="w-full py-3">
                I'm Ready
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}