// World Wallet types for MiniKit integration

export interface WalletConnection {
  address: string;
  isConnected: boolean;
  connectionTimestamp: number;
  lastRefreshTimestamp: number;
}

export interface WalletBalance {
  amount: number;
  formatted: string;
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
}

export interface UserSession {
  walletAddress: string | null;
  sessionId: string;
  autoConnect: boolean;
  mockUserId: string | null;
}

export interface WalletConnectionState {
  connection: WalletConnection;
  balance: WalletBalance;
  showConnectModal: boolean;
  showDisconnectConfirm: boolean;
  session: UserSession;
}

export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type WalletBalanceStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface WalletError {
  code: 'MINIKIT_NOT_INSTALLED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'INVALID_REQUEST' | 'WALLET_NOT_FOUND';
  message: string;
  details?: Record<string, unknown>;
}

export interface WalletAuthInput {
  nonce: string;
  requestId: string;
  expirationTime: Date;
  notBefore: Date;
  statement?: string;
}

export interface WalletUser {
  address: string;
  username?: string;
  profilePicture?: string;
  balance?: number;
}