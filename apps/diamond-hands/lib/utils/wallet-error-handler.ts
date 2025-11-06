import { WalletError } from '@/types/wallet';

export class WalletErrorHandler {
  private static retryQueue: Map<string, number> = new Map();
  private static maxRetries = 3;
  private static baseDelay = 1000; // 1 second

  /**
   * Converts any error to a standardized WalletError
   */
  static normalizeError(error: any, context?: string): WalletError {
    if (error instanceof Error) {
      return this.categorizeError(error, context);
    }

    if (typeof error === 'string') {
      return {
        code: 'INVALID_REQUEST',
        message: error,
        details: { context }
      };
    }

    if (error && typeof error === 'object' && error.code) {
      return error as WalletError;
    }

    return {
      code: 'INVALID_REQUEST',
      message: 'An unknown error occurred',
      details: {
        originalError: error,
        context
      }
    };
  }

  /**
   * Categorizes error by type and provides appropriate error code
   */
  private static categorizeError(error: Error, context?: string): WalletError {
    const message = error.message.toLowerCase();

    // MiniKit not available
    if (message.includes('minikit') && (message.includes('not') || message.includes('unavailable'))) {
      return {
        code: 'MINIKIT_NOT_INSTALLED',
        message: 'World App is required to connect your wallet',
        details: {
          helpUrl: 'https://worldcoin.org/download',
          context
        }
      };
    }

    // Authentication failures
    if (message.includes('auth') || message.includes('denied') || message.includes('cancelled')) {
      return {
        code: 'AUTH_FAILED',
        message: message.includes('cancelled') || message.includes('denied')
          ? 'Connection was cancelled by user'
          : 'Failed to authenticate with World Wallet',
        details: {
          retry: !message.includes('cancelled'),
          context
        }
      };
    }

    // Network/timeout errors
    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred. Please check your connection',
        details: {
          retry: true,
          context
        }
      };
    }

    // Balance/insufficient funds
    if (message.includes('insufficient') || message.includes('balance')) {
      return {
        code: 'INVALID_REQUEST',
        message: 'Insufficient balance for this operation',
        details: {
          retry: false,
          context
        }
      };
    }

    // Wallet not found
    if (message.includes('not found') || message.includes('invalid wallet')) {
      return {
        code: 'WALLET_NOT_FOUND',
        message: 'Wallet not found or invalid',
        details: {
          retry: false,
          context
        }
      };
    }

    // Generic error fallback
    return {
      code: 'INVALID_REQUEST',
      message: error.message || 'An error occurred',
      details: {
        retry: true,
        context,
        stack: error.stack
      }
    };
  }

  /**
   * Determines if an error is retryable
   */
  static isRetryable(error: WalletError): boolean {
    // Never retry user cancellations
    if (error.code === 'AUTH_FAILED' && error.message.includes('cancelled')) {
      return false;
    }

    // Never retry MiniKit not installed
    if (error.code === 'MINIKIT_NOT_INSTALLED') {
      return false;
    }

    // Check details for explicit retry flag
    if (error.details && typeof error.details.retry === 'boolean') {
      return error.details.retry;
    }

    // Default retry for network errors
    return error.code === 'NETWORK_ERROR';
  }

  /**
   * Implements exponential backoff retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    const currentRetries = this.retryQueue.get(operationId) || 0;

    try {
      const result = await operation();
      // Success, clear retry count
      this.retryQueue.delete(operationId);
      return result;
    } catch (error) {
      const walletError = this.normalizeError(error, operationId);

      // Check if we should retry
      if (!this.isRetryable(walletError) || currentRetries >= maxRetries) {
        this.retryQueue.delete(operationId);
        throw walletError;
      }

      // Increment retry count
      this.retryQueue.set(operationId, currentRetries + 1);

      // Calculate delay with exponential backoff
      const delay = this.baseDelay * Math.pow(2, currentRetries);

      console.warn(`Retrying ${operationId} in ${delay}ms (attempt ${currentRetries + 1}/${maxRetries})`);

      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(operation, operationId, maxRetries);
    }
  }

  /**
   * Clears retry state for a specific operation
   */
  static clearRetries(operationId: string): void {
    this.retryQueue.delete(operationId);
  }

  /**
   * Gets current retry count for an operation
   */
  static getRetryCount(operationId: string): number {
    return this.retryQueue.get(operationId) || 0;
  }

  /**
   * Creates a user-friendly error message for display
   */
  static getUserMessage(error: WalletError): string {
    switch (error.code) {
      case 'MINIKIT_NOT_INSTALLED':
        return 'Please install the World App to connect your wallet.';

      case 'AUTH_FAILED':
        if (error.message.includes('cancelled')) {
          return 'Connection was cancelled. Please try again.';
        }
        return 'Failed to connect to your wallet. Please try again.';

      case 'NETWORK_ERROR':
        return 'Network connection issue. Please check your internet and try again.';

      case 'WALLET_NOT_FOUND':
        return 'Wallet not found. Please check your account.';

      case 'INVALID_REQUEST':
        if (error.message.includes('balance')) {
          return 'Insufficient balance for this operation.';
        }
        return error.message || 'Something went wrong. Please try again.';

      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Logs errors with proper context for debugging
   */
  static logError(error: WalletError, context?: string): void {
    const logData = {
      code: error.code,
      message: error.message,
      context: context || error.details?.context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      details: error.details
    };

    console.error('Wallet Error:', logData);

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorTracking(logData);
    }
  }

  /**
   * Creates a recovery suggestion for users
   */
  static getRecoverySuggestion(error: WalletError): string | null {
    switch (error.code) {
      case 'MINIKIT_NOT_INSTALLED':
        return 'Download the World App from the App Store or Google Play Store.';

      case 'AUTH_FAILED':
        return 'Make sure you have the World App installed and try connecting again.';

      case 'NETWORK_ERROR':
        return 'Check your internet connection and try again in a moment.';

      case 'WALLET_NOT_FOUND':
        return 'Verify your wallet is properly set up in the World App.';

      case 'INVALID_REQUEST':
        if (error.message.includes('balance')) {
          return 'Add more WLD to your wallet or try a smaller amount.';
        }
        return 'Please try again or contact support if the problem persists.';

      default:
        return null;
    }
  }
}

// Convenience functions for common error handling patterns
export const handleWalletError = (error: any, context?: string): WalletError => {
  const walletError = WalletErrorHandler.normalizeError(error, context);
  WalletErrorHandler.logError(walletError, context);
  return walletError;
};

export const withWalletRetry = <T>(
  operation: () => Promise<T>,
  operationId: string
): Promise<T> => {
  return WalletErrorHandler.withRetry(operation, operationId);
};

export const getUserFriendlyMessage = (error: WalletError): string => {
  return WalletErrorHandler.getUserMessage(error);
};

export const getErrorRecovery = (error: WalletError): string | null => {
  return WalletErrorHandler.getRecoverySuggestion(error);
};