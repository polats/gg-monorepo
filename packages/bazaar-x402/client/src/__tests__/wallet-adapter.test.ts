/**
 * Tests for wallet adapter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockWalletAdapter } from '../wallet-adapter';

describe('MockWalletAdapter', () => {
  let adapter: MockWalletAdapter;
  
  beforeEach(() => {
    adapter = new MockWalletAdapter();
  });
  
  describe('initialization', () => {
    it('should start disconnected', () => {
      expect(adapter.connected).toBe(false);
      expect(adapter.publicKey).toBeNull();
    });
    
    it('should accept custom public key', () => {
      const customKey = 'CustomMockPublicKey123456789';
      const customAdapter = new MockWalletAdapter(customKey);
      expect(customAdapter.publicKey).toBeNull(); // Not connected yet
    });
  });
  
  describe('connect', () => {
    it('should connect and generate public key', async () => {
      await adapter.connect();
      
      expect(adapter.connected).toBe(true);
      expect(adapter.publicKey).toBeTruthy();
      expect(typeof adapter.publicKey).toBe('string');
      expect(adapter.publicKey?.length).toBe(44); // Base58 public key length
    });
    
    it('should use custom public key when provided', async () => {
      const customKey = 'CustomMockPublicKey123456789';
      const customAdapter = new MockWalletAdapter(customKey);
      
      await customAdapter.connect();
      
      expect(customAdapter.publicKey).toBe(customKey);
    });
    
    it('should generate different keys for different instances', async () => {
      const adapter1 = new MockWalletAdapter();
      const adapter2 = new MockWalletAdapter();
      
      await adapter1.connect();
      await adapter2.connect();
      
      expect(adapter1.publicKey).not.toBe(adapter2.publicKey);
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect and clear public key', async () => {
      await adapter.connect();
      expect(adapter.connected).toBe(true);
      
      await adapter.disconnect();
      
      expect(adapter.connected).toBe(false);
      expect(adapter.publicKey).toBeNull();
    });
    
    it('should be safe to disconnect when not connected', async () => {
      await adapter.disconnect();
      
      expect(adapter.connected).toBe(false);
      expect(adapter.publicKey).toBeNull();
    });
  });
  
  describe('signAndSendTransaction', () => {
    it('should throw error when not connected', async () => {
      await expect(
        adapter.signAndSendTransaction({ mock: 'transaction' })
      ).rejects.toThrow('Wallet not connected');
    });
    
    it('should return transaction signature when connected', async () => {
      await adapter.connect();
      
      const signature = await adapter.signAndSendTransaction({
        mock: 'transaction',
      });
      
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(88); // Base58 signature length
    });
    
    it('should generate different signatures for different transactions', async () => {
      await adapter.connect();
      
      const sig1 = await adapter.signAndSendTransaction({ tx: 1 });
      const sig2 = await adapter.signAndSendTransaction({ tx: 2 });
      
      expect(sig1).not.toBe(sig2);
    });
  });
  
  describe('signTransaction', () => {
    it('should throw error when not connected', async () => {
      await expect(
        adapter.signTransaction({ mock: 'transaction' })
      ).rejects.toThrow('Wallet not connected');
    });
    
    it('should return transaction when connected', async () => {
      await adapter.connect();
      
      const transaction = { mock: 'transaction', data: 'test' };
      const signed = await adapter.signTransaction(transaction);
      
      expect(signed).toEqual(transaction);
    });
  });
});
