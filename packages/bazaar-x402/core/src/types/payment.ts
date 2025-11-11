/**
 * x402 payment protocol types
 */

/**
 * Solana network identifier
 */
export type SolanaNetwork = 'solana-devnet' | 'solana-mainnet';

/**
 * Payment scheme (currently only 'exact' is supported)
 */
export type PaymentScheme = 'exact';

/**
 * Payment requirements returned in 402 response
 */
export interface PaymentRequirements {
  /** Payment scheme - must be 'exact' */
  scheme: PaymentScheme;
  
  /** Solana network to use */
  network: SolanaNetwork;
  
  /** Maximum amount required in smallest unit (e.g., lamports for USDC) */
  maxAmountRequired: string;
  
  /** Resource being purchased */
  resource: string;
  
  /** Human-readable description */
  description: string;
  
  /** MIME type of the resource */
  mimeType: string;
  
  /** Recipient wallet address */
  payTo: string;
  
  /** Maximum time to complete payment in seconds */
  maxTimeoutSeconds: number;
  
  /** Token mint address (USDC mint) */
  asset: string;
}

/**
 * 402 Payment Required response
 */
export interface PaymentRequiredResponse {
  /** x402 protocol version */
  x402Version: number;
  
  /** Array of accepted payment methods */
  accepts: PaymentRequirements[];
}

/**
 * Payment payload sent in X-Payment header
 */
export interface PaymentPayload {
  /** x402 protocol version */
  x402Version: number;
  
  /** Payment scheme used */
  scheme: PaymentScheme;
  
  /** Solana network used */
  network: SolanaNetwork;
  
  /** Payment details */
  payload: {
    /** Solana transaction signature */
    signature: string;
    
    /** Buyer's wallet address */
    from: string;
    
    /** Seller's wallet address */
    to: string;
    
    /** Amount transferred in smallest unit */
    amount: string;
    
    /** Token mint address used */
    mint: string;
  };
}

/**
 * Result of payment verification
 */
export interface VerificationResult {
  /** Whether payment was verified successfully */
  success: boolean;
  
  /** Transaction hash/signature */
  txHash: string;
  
  /** Network where transaction was verified */
  networkId: string;
  
  /** Optional error message if verification failed */
  error?: string;
}

/**
 * Parameters for creating payment requirements
 */
export interface CreatePaymentParams {
  /** Price in USDC (with decimals) */
  priceUSDC: number;
  
  /** Seller's wallet address */
  sellerWallet: string;
  
  /** Resource identifier */
  resource: string;
  
  /** Description of what's being purchased */
  description: string;
}

/**
 * Parameters for verifying payment
 */
export interface VerifyPaymentParams {
  /** Base64-encoded payment payload from X-Payment header */
  paymentHeader: string;
  
  /** Expected payment amount in USDC */
  expectedAmount: number;
  
  /** Expected recipient wallet address */
  expectedRecipient: string;
}
