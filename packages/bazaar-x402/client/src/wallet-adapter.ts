/**
 * Wallet adapter interface and mock implementation
 */

/**
 * Wallet adapter interface for Solana wallet integration
 */
export interface WalletAdapter {
  /** Public key of the connected wallet */
  publicKey: string | null;
  
  /** Whether wallet is connected */
  connected: boolean;
  
  /** Connect to wallet */
  connect(): Promise<void>;
  
  /** Disconnect from wallet */
  disconnect(): Promise<void>;
  
  /** Sign and send a transaction */
  signAndSendTransaction(transaction: any): Promise<string>;
  
  /** Sign a transaction without sending */
  signTransaction(transaction: any): Promise<any>;
}

/**
 * Mock wallet adapter for development and testing
 * Simulates wallet functionality without requiring real Solana wallet
 */
export class MockWalletAdapter implements WalletAdapter {
  private _publicKey: string | null = null;
  private _connected: boolean = false;
  
  constructor(private mockPublicKey?: string) {
    console.log('[MockWalletAdapter] Initialized');
  }
  
  get publicKey(): string | null {
    return this._publicKey;
  }
  
  get connected(): boolean {
    return this._connected;
  }
  
  /**
   * Mock connect - generates a fake public key
   */
  async connect(): Promise<void> {
    console.log('[MockWalletAdapter] Connecting...');
    
    // Generate or use provided mock public key
    this._publicKey = this.mockPublicKey ?? this.generateMockPublicKey();
    this._connected = true;
    
    console.log('[MockWalletAdapter] Connected with public key:', this._publicKey);
  }
  
  /**
   * Mock disconnect
   */
  async disconnect(): Promise<void> {
    console.log('[MockWalletAdapter] Disconnecting...');
    this._publicKey = null;
    this._connected = false;
    console.log('[MockWalletAdapter] Disconnected');
  }
  
  /**
   * Mock sign and send transaction
   * Returns a fake transaction signature
   */
  async signAndSendTransaction(transaction: any): Promise<string> {
    if (!this._connected) {
      throw new Error('Wallet not connected');
    }
    
    console.log('[MockWalletAdapter] Signing and sending transaction:', transaction);
    
    // Generate mock transaction signature
    const signature = this.generateMockSignature();
    
    console.log('[MockWalletAdapter] Transaction sent with signature:', signature);
    
    return signature;
  }
  
  /**
   * Mock sign transaction
   * Returns the transaction unchanged (in real implementation, would add signature)
   */
  async signTransaction(transaction: any): Promise<any> {
    if (!this._connected) {
      throw new Error('Wallet not connected');
    }
    
    console.log('[MockWalletAdapter] Signing transaction:', transaction);
    
    // In mock mode, just return the transaction
    return transaction;
  }
  
  /**
   * Generate a mock Solana public key (base58 format)
   */
  private generateMockPublicKey(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Generate a mock transaction signature (base58 format)
   */
  private generateMockSignature(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
