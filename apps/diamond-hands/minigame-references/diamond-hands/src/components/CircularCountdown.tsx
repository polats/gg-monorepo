import { useEffect, useState, useRef, useCallback } from 'react';

interface CircularCountdownProps {
  duration: number; // in seconds
  onComplete: () => void;
  isActive: boolean;
  reset: boolean;
}

export function CircularCountdown({ duration, onComplete, isActive, reset }: CircularCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  // Memoize the onComplete callback to prevent unnecessary re-renders
  const handleComplete = useCallback(() => {
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      // Use setTimeout to defer the state update to avoid render-time setState
      setTimeout(() => {
        onComplete();
      }, 0);
    }
  }, [onComplete]);

  // Reset timer when reset prop changes
  useEffect(() => {
    if (reset) {
      setTimeLeft(duration);
      hasCompletedRef.current = false;
    }
  }, [reset, duration]);

  // Manage countdown interval
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isActive && timeLeft > 0 && !hasCompletedRef.current) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            handleComplete();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, handleComplete, timeLeft]);

  const progress = (timeLeft / duration) * 100;
  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-gray-300"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-red-500 transition-all duration-100 ease-linear"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg">
          {Math.ceil(timeLeft)}
        </span>
      </div>
    </div>
  );
}