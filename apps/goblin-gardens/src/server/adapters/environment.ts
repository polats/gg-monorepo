export enum Environment {
  VERCEL = 'vercel',
  LOCAL = 'local',
  REDDIT = 'reddit',
}

export interface EnvironmentConfig {
  environment: Environment;
  isProduction: boolean;
  apiBaseUrl: string;
}

export function detectEnvironment(): Environment {
  // Check for Vercel environment
  if (process.env.VERCEL) {
    return Environment.VERCEL;
  }

  // Check for Devvit context (Reddit)
  // Devvit doesn't set a specific env var, but we can check for the presence of Devvit-specific behavior
  // In practice, if we're not on Vercel and not explicitly local, we're on Reddit
  if (process.env.NODE_ENV === 'production' && !process.env.LOCAL_DEV) {
    return Environment.REDDIT;
  }

  // Default to local
  return Environment.LOCAL;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = detectEnvironment();

  return {
    environment,
    isProduction: process.env.NODE_ENV === 'production',
    apiBaseUrl: getApiBaseUrl(environment),
  };
}

function getApiBaseUrl(env: Environment): string {
  switch (env) {
    case Environment.VERCEL:
      return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
    case Environment.LOCAL:
      return 'http://localhost:3000';
    case Environment.REDDIT:
      return ''; // Relative paths in Devvit
  }
}
