import { Platform, type PlatformType, type EnvironmentConfig } from '@gg/types';
import { isDefined } from '@gg/utils';

// Type definitions for import.meta.env
declare global {
  interface ImportMeta {
    env?: {
      VITE_PLATFORM?: string;
      VITE_MOCK_MODE?: string;
      VITE_DEBUG_MODE?: string;
      VITE_API_URL?: string;
    };
  }
}

/**
 * Platform detection utilities
 */
export class PlatformDetector {
  private static detectedPlatform: PlatformType | null = null;

  /**
   * Detect the current platform based on environment and available SDKs
   */
  static detect(): PlatformType {
    if (this.detectedPlatform) {
      return this.detectedPlatform;
    }

    // Check for World MiniKit
    if (this.isWorldPlatform()) {
      this.detectedPlatform = Platform.World;
      return this.detectedPlatform;
    }

    // Check for Reddit Devvit
    if (this.isRedditPlatform()) {
      this.detectedPlatform = Platform.Reddit;
      return this.detectedPlatform;
    }

    // Default to local development
    this.detectedPlatform = Platform.Local;
    return this.detectedPlatform;
  }

  /**
   * Check if running in World MiniKit environment
   */
  private static isWorldPlatform(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for MiniKit object
    if (isDefined((window as any).MiniKit)) {
      return true;
    }

    // Check for World-specific environment variables
    if (process.env.NEXT_PUBLIC_PLATFORM === 'world') {
      return true;
    }

    return false;
  }

  /**
   * Check if running in Reddit Devvit environment
   */
  private static isRedditPlatform(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for Devvit context
    if (isDefined((window as any).__DEVVIT__)) {
      return true;
    }

    // Check for Reddit-specific environment variables
    if (import.meta.env?.VITE_PLATFORM === 'reddit') {
      return true;
    }

    return false;
  }

  /**
   * Check if running in local development mode
   */
  static isLocal(): boolean {
    return this.detect() === Platform.Local;
  }

  /**
   * Check if running on World platform
   */
  static isWorld(): boolean {
    return this.detect() === Platform.World;
  }

  /**
   * Check if running on Reddit platform
   */
  static isReddit(): boolean {
    return this.detect() === Platform.Reddit;
  }

  /**
   * Reset cached platform detection (useful for testing)
   */
  static reset(): void {
    this.detectedPlatform = null;
  }
}

/**
 * Get the current platform
 */
export const getCurrentPlatform = (): PlatformType => {
  return PlatformDetector.detect();
};

/**
 * Platform-specific configuration
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const platform = getCurrentPlatform();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Check for mock mode (from either Next.js or Vite env vars)
  const mockMode =
    process.env.NEXT_PUBLIC_MOCK_MODE === 'true' ||
    import.meta.env?.VITE_MOCK_MODE === 'true' ||
    false;

  // Check for debug mode
  const debugMode =
    process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' ||
    import.meta.env?.VITE_DEBUG_MODE === 'true' ||
    isDevelopment;

  return {
    platform,
    isDevelopment,
    isProduction,
    apiBaseUrl: getApiBaseUrl(platform),
    features: {
      mockMode,
      debugMode,
    },
  };
};

/**
 * Get the API base URL based on platform and environment
 */
const getApiBaseUrl = (platform: PlatformType): string => {
  // Check for explicit API URL in environment
  const explicitUrl =
    process.env.NEXT_PUBLIC_API_URL || import.meta.env?.VITE_API_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  // Platform-specific defaults
  switch (platform) {
    case Platform.World:
      return '/api';
    case Platform.Reddit:
      return '/api';
    case Platform.Local:
      return 'http://localhost:3000/api';
    default:
      return '/api';
  }
};

/**
 * Platform initialization
 */
export interface PlatformInitOptions {
  onPlatformDetected?: (platform: PlatformType) => void;
  onInitialized?: () => void;
  onError?: (error: Error) => void;
}

export const initializePlatform = async (
  options: PlatformInitOptions = {}
): Promise<PlatformType> => {
  try {
    const platform = getCurrentPlatform();

    // Notify about detected platform
    if (options.onPlatformDetected) {
      options.onPlatformDetected(platform);
    }

    // Platform-specific initialization
    switch (platform) {
      case Platform.World:
        await initializeWorld();
        break;
      case Platform.Reddit:
        await initializeReddit();
        break;
      case Platform.Local:
        await initializeLocal();
        break;
    }

    // Notify initialization complete
    if (options.onInitialized) {
      options.onInitialized();
    }

    return platform;
  } catch (error) {
    if (options.onError) {
      options.onError(error as Error);
    }
    throw error;
  }
};

/**
 * Initialize World platform
 */
const initializeWorld = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  // MiniKit initialization will be handled by the app
  // This is just a placeholder for any World-specific setup
  console.log('[Platform] World platform initialized');
};

/**
 * Initialize Reddit platform
 */
const initializeReddit = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  // Devvit initialization will be handled by the app
  // This is just a placeholder for any Reddit-specific setup
  console.log('[Platform] Reddit platform initialized');
};

/**
 * Initialize local development platform
 */
const initializeLocal = async (): Promise<void> => {
  console.log('[Platform] Local development platform initialized');
};

/**
 * Platform feature detection
 */
export const platformFeatures = {
  /**
   * Check if the platform supports wallet connections
   */
  supportsWallet: (): boolean => {
    const platform = getCurrentPlatform();
    return platform === Platform.World || platform === Platform.Local;
  },

  /**
   * Check if the platform supports WorldID verification
   */
  supportsWorldID: (): boolean => {
    const platform = getCurrentPlatform();
    return platform === Platform.World || platform === Platform.Local;
  },

  /**
   * Check if the platform supports Reddit authentication
   */
  supportsRedditAuth: (): boolean => {
    const platform = getCurrentPlatform();
    return platform === Platform.Reddit || platform === Platform.Local;
  },

  /**
   * Check if the platform supports payments
   */
  supportsPayments: (): boolean => {
    const platform = getCurrentPlatform();
    return platform === Platform.World || platform === Platform.Local;
  },

  /**
   * Check if the platform has persistent storage
   */
  hasPersistentStorage: (): boolean => {
    // All platforms have some form of storage
    return true;
  },

  /**
   * Check if the platform supports 3D rendering
   */
  supports3D: (): boolean => {
    // Check for WebGL support
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  },
};

/**
 * Export platform utilities
 */
export { Platform, type PlatformType };

/**
 * Convenience exports
 */
export const isWorld = () => PlatformDetector.isWorld();
export const isReddit = () => PlatformDetector.isReddit();
export const isLocal = () => PlatformDetector.isLocal();
