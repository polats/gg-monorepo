'use client';

import { useEffect, useState, useRef } from 'react';
import type { CircularCountdownProps } from '@/types/minigame';

export function CircularCountdown({
  duration,
  onComplete,
  isActive,
  size = 96,
  resetKey
}: CircularCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref current
  onCompleteRef.current = onComplete;

  // Effect to manage isActive changes
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isActive && !completedRef.current) {
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        if (completedRef.current) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        const elapsed = (Date.now() - startTimeRef.current!) / 1000;
        const remaining = Math.max(0, duration - elapsed);

        setTimeLeft(remaining);

        if (remaining <= 0) {
          completedRef.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onCompleteRef.current();
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, duration]);

  // Effect to handle resets only when not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      completedRef.current = false;
      startTimeRef.current = null;
    }
  }, [resetKey, duration, isActive]);

  const progress = (timeLeft / duration) * 100;
  const radius = (size - 12) / 2; // Account for stroke width
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        data-testid="countdown-svg"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-gray-300"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-red-500 stroke-red-500 transition-all duration-100 ease-linear"
          strokeLinecap="round"
          data-testid="countdown-progress"
          style={{
            transition: 'stroke-dashoffset 0.1s linear',
            strokeDashoffset
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-red-600">
          {Math.ceil(timeLeft)}
        </span>
      </div>
    </div>
  );
}