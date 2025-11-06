'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LaunchModeContextType, LaunchConfiguration } from '@/types/minigame';
import { getLaunchConfiguration } from '@/lib/launch-config';

const LaunchModeContext = createContext<LaunchModeContextType | undefined>(undefined);

export function LaunchModeProvider({ children }: { children: React.ReactNode }) {
  const [configuration, setConfiguration] = useState<LaunchConfiguration>(() => {
    // Initialize with default configuration
    return {
      isLaunched: false,
      configSource: 'default',
      checkedAt: new Date(),
    };
  });

  useEffect(() => {
    // Update configuration on mount
    setConfiguration(getLaunchConfiguration());
  }, []);

  const refreshConfiguration = () => {
    setConfiguration(getLaunchConfiguration());
  };

  const value: LaunchModeContextType = {
    isLaunched: configuration.isLaunched,
    configuration,
    refreshConfiguration,
  };

  return (
    <LaunchModeContext.Provider value={value}>
      {children}
    </LaunchModeContext.Provider>
  );
}

export function useLaunchMode(): LaunchModeContextType {
  const context = useContext(LaunchModeContext);
  if (context === undefined) {
    throw new Error('useLaunchMode must be used within a LaunchModeProvider');
  }
  return context;
}