import type { LaunchConfiguration } from '@/types/minigame';

/**
 * Determines if the app is in launched mode based on environment variable
 * Defaults to false (minigame mode) unless explicitly set to 'true'
 */
export function isLaunched(): boolean {
  return process.env.NEXT_PUBLIC_APP_LAUNCHED === 'true';
}

/**
 * Gets the complete launch configuration with metadata
 */
export function getLaunchConfiguration(): LaunchConfiguration {
  const envValue = process.env.NEXT_PUBLIC_APP_LAUNCHED;

  return {
    isLaunched: envValue === 'true',
    configSource: envValue !== undefined ? 'env' : 'default',
    checkedAt: new Date(),
  };
}