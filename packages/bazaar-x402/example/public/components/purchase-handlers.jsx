/**
 * Purchase handler functions with x402 support
 * 
 * These functions handle both mock mode and x402 payment flow
 */

import { handleX402Purchase } from './x402-payment-handler.jsx';

/**
 * Purchase an item from marketplace
 * 
 * Handles both mock mode and x402 payment flow:
 * - Mock mode: Direct purchase with currency deduction
 * - x402 mode: 402 response → sign transaction → retry with X-Payment header
 * 
 * @param {string} listingId - The listing ID to purchase
 * @param {string} username - Buyer's username
 * @param {string} walletAddress - Buyer's wallet address
 * @param {Object} wallet - Solana wallet adapter instance
 * @param {Function} onStatusUpdate - Callback for status updates
 * @returns {Promise<Object>} Purchase result
 */
export async function purchaseListingWithX402(
  listingId,
  username,
  walletAddress,
  wallet,
  onStatusUpdate = () => {}
) {
  const url = `http://localhost:3001/api/bazaar/purchase-with-currency/${listingId}?buyer=${username}&buyerWallet=${walletAddress}`;
  
  try {
    // Try x402 purchase flow (handles both mock and production modes)
    const result = await handleX402Purchase(url, wallet, onStatusUpdate);
    return result;
  } catch (error) {
    // If x402 flow fails, try simple fetch (mock mode fallback)
    onStatusUpdate('Attempting direct purchase...');
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Purchase failed');
    }
    
    return await response.json();
  }
}

/**
 * Purchase a mystery box
 * 
 * Handles both mock mode and x402 payment flow:
 * - Mock mode: Direct purchase with currency deduction
 * - x402 mode: 402 response → sign transaction → retry with X-Payment header
 * 
 * @param {string} tierId - The mystery box tier ID
 * @param {string} username - Buyer's username
 * @param {string} walletAddress - Buyer's wallet address
 * @param {Object} wallet - Solana wallet adapter instance
 * @param {Function} onStatusUpdate - Callback for status updates
 * @returns {Promise<Object>} Purchase result
 */
export async function purchaseMysteryBoxWithX402(
  tierId,
  username,
  walletAddress,
  wallet,
  onStatusUpdate = () => {}
) {
  const url = `http://localhost:3001/api/bazaar/mystery-box-with-currency/${tierId}?buyer=${username}&buyerWallet=${walletAddress}`;
  
  try {
    // Try x402 purchase flow (handles both mock and production modes)
    const result = await handleX402Purchase(url, wallet, onStatusUpdate);
    return result;
  } catch (error) {
    // If x402 flow fails, try simple fetch (mock mode fallback)
    onStatusUpdate('Attempting direct purchase...');
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Purchase failed');
    }
    
    return await response.json();
  }
}
