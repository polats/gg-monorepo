import { WalletUser, WalletBalance, WalletError, WalletConnectionStatus } from '@/types/wallet';

// Format wallet address for display (short version)
export function formatWalletAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Format wallet address for display (medium version)
export function formatWalletAddressMedium(address: string): string {
  return formatWalletAddress(address, 8, 6);
}

// Format wallet address for display (long version)
export function formatWalletAddressLong(address: string): string {
  return formatWalletAddress(address, 12, 8);
}

// Format balance amount with proper decimal places
export function formatBalance(amount: number, decimals = 2, symbol = 'WLD'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `0.00 ${symbol}`;
  }

  // Handle very small amounts
  if (amount < 0.01 && amount > 0) {
    return `< 0.01 ${symbol}`;
  }

  // Handle very large amounts
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M ${symbol}`;
  }

  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K ${symbol}`;
  }

  return `${amount.toFixed(decimals)} ${symbol}`;
}

// Format balance for compact display
export function formatBalanceCompact(amount: number): string {
  return formatBalance(amount, 1);
}

// Validate wallet address format
export function isValidWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Basic ethereum address validation (0x followed by 40 hex characters)
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
}

// Get user display name (username or formatted address)
export function getUserDisplayName(user: WalletUser): string {
  if (user.username) {
    return user.username;
  }
  return formatWalletAddress(user.address);
}

// Get connection status display text
export function getConnectionStatusText(status: WalletConnectionStatus): string {
  switch (status) {
    case 'disconnected':
      return 'Disconnected';
    case 'connecting':
      return 'Connecting...';
    case 'connected':
      return 'Connected';
    case 'error':
      return 'Connection Error';
    default:
      return 'Unknown';
  }
}

// Get connection status color class
export function getConnectionStatusColor(status: WalletConnectionStatus): string {
  switch (status) {
    case 'disconnected':
      return 'text-gray-500';
    case 'connecting':
      return 'text-yellow-600';
    case 'connected':
      return 'text-green-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}

// Get user-friendly error message
export function getWalletErrorMessage(error: WalletError): string {
  switch (error.code) {
    case 'MINIKIT_NOT_INSTALLED':
      return 'World App is required to connect your wallet. Please download and install it.';
    case 'AUTH_FAILED':
      return 'Authentication failed. Please try connecting again.';
    case 'NETWORK_ERROR':
      return 'Network error occurred. Please check your connection and try again.';
    case 'INVALID_REQUEST':
      return 'Invalid request. Please refresh the page and try again.';
    case 'WALLET_NOT_FOUND':
      return 'Wallet not found. Please ensure your wallet is properly set up.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}

// Check if error is retryable
export function isRetryableError(error: WalletError): boolean {
  return ['NETWORK_ERROR', 'AUTH_FAILED'].includes(error.code);
}

// Generate mock wallet address for testing
export function generateMockWalletAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// Check if balance is sufficient for an amount
export function hasSufficientBalance(balance: WalletBalance | null, requiredAmount: number): boolean {
  if (!balance || balance.error || balance.isLoading) {
    return false;
  }
  return balance.amount >= requiredAmount;
}

// Calculate time since last balance update
export function getBalanceAge(balance: WalletBalance | null): number {
  if (!balance || !balance.lastUpdated) {
    return Infinity;
  }
  return Date.now() - balance.lastUpdated.getTime();
}

// Check if balance needs refresh based on age
export function shouldRefreshBalance(balance: WalletBalance | null, maxAge = 30000): boolean {
  return getBalanceAge(balance) > maxAge;
}

// Format time ago for balance display
export function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) { // Less than 1 minute
    return 'just now';
  }

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Safely parse balance from string
export function parseBalance(balanceStr: string): number {
  const cleaned = balanceStr.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Check if two wallet addresses are the same
export function isSameAddress(address1: string, address2: string): boolean {
  if (!address1 || !address2) {
    return false;
  }
  return address1.toLowerCase() === address2.toLowerCase();
}

// Get balance status badge props
export function getBalanceStatusBadge(balance: WalletBalance | null): {
  text: string;
  color: string;
  showPulse: boolean;
} {
  if (!balance) {
    return { text: 'Not loaded', color: 'gray', showPulse: false };
  }

  if (balance.isLoading) {
    return { text: 'Loading...', color: 'yellow', showPulse: true };
  }

  if (balance.error) {
    return { text: 'Error', color: 'red', showPulse: false };
  }

  const age = getBalanceAge(balance);
  if (age > 300000) { // More than 5 minutes old
    return { text: 'Stale', color: 'orange', showPulse: false };
  }

  return { text: 'Live', color: 'green', showPulse: false };
}

// Copy text to clipboard with fallback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Checks if MiniKit is properly installed and commands are available
 */
export const checkMiniKitCommands = async (): Promise<{
  isInstalled: boolean;
  hasWalletAuth: boolean;
  hasPay: boolean;
  hasVerify: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];

  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      errors.push('Not in browser environment');
      return {
        isInstalled: false,
        hasWalletAuth: false,
        hasPay: false,
        hasVerify: false,
        errors
      };
    }

    // Check if MiniKit is available on window
    const MiniKit = (window as any).MiniKit;

    if (!MiniKit) {
      errors.push('MiniKit not found on window object');
      return {
        isInstalled: false,
        hasWalletAuth: false,
        hasPay: false,
        hasVerify: false,
        errors
      };
    }

    // Check if MiniKit is installed
    const isInstalled = typeof MiniKit.isInstalled === 'function' && MiniKit.isInstalled();

    if (!isInstalled) {
      errors.push('MiniKit.isInstalled() returned false');

      // Try to install if possible
      if (typeof MiniKit.install === 'function') {
        try {
          MiniKit.install();
          // Wait for installation
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (MiniKit.isInstalled()) {
            errors.pop(); // Remove the error since we fixed it
          } else {
            errors.push('MiniKit.install() did not complete successfully');
          }
        } catch (installError) {
          errors.push(`Failed to install MiniKit: ${installError}`);
        }
      } else {
        errors.push('MiniKit.install() method not available');
      }
    }

    // Check for command availability
    const hasWalletAuth = !!(MiniKit.commandsAsync && typeof MiniKit.commandsAsync.walletAuth === 'function');
    const hasPay = !!(MiniKit.commandsAsync && typeof MiniKit.commandsAsync.pay === 'function');
    const hasVerify = !!(MiniKit.commandsAsync && typeof MiniKit.commandsAsync.verify === 'function');

    if (!hasWalletAuth) {
      errors.push('walletAuth command not available');
    }
    if (!hasPay) {
      errors.push('pay command not available');
    }
    if (!hasVerify) {
      errors.push('verify command not available');
    }

    return {
      isInstalled: MiniKit.isInstalled(),
      hasWalletAuth,
      hasPay,
      hasVerify,
      errors
    };

  } catch (error) {
    errors.push(`Error checking MiniKit: ${error}`);
    return {
      isInstalled: false,
      hasWalletAuth: false,
      hasPay: false,
      hasVerify: false,
      errors
    };
  }
};

/**
 * Debug helper for MiniKit troubleshooting
 */
export const debugMiniKit = (): void => {
  console.group('🔍 MiniKit Debug Information');

  try {
    const MiniKit = (window as any).MiniKit;

    console.log('Window MiniKit:', MiniKit);
    console.log('Is function isInstalled:', typeof MiniKit?.isInstalled);
    console.log('Is installed:', MiniKit?.isInstalled());
    console.log('Commands object:', MiniKit?.commandsAsync);
    console.log('User object:', MiniKit?.user);

    if (MiniKit?.commandsAsync) {
      console.log('Available commands:', Object.keys(MiniKit.commandsAsync));
      console.log('walletAuth available:', typeof MiniKit.commandsAsync.walletAuth);
      console.log('pay available:', typeof MiniKit.commandsAsync.pay);
      console.log('verify available:', typeof MiniKit.commandsAsync.verify);
    }

    // Check environment
    console.log('User Agent:', navigator.userAgent);
    console.log('Is World App:', navigator.userAgent.includes('Worldcoin'));
    console.log('Environment:', {
      isMockMode: process.env.NEXT_PUBLIC_MOCK_MODE,
      appLaunched: process.env.NEXT_PUBLIC_APP_LAUNCHED
    });

  } catch (error) {
    console.error('Error during debug:', error);
  }

  console.groupEnd();
};