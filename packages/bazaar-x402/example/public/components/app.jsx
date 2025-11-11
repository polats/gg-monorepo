import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from './wallet-button.jsx';
import { TransactionHistory } from './transaction-history.jsx';
import { handleX402Purchase } from './x402-payment-handler.jsx';

const API_BASE = 'http://localhost:3001/api';

/**
 * Main Bazaar Application Component
 * 
 * Provides the complete marketplace interface with wallet integration.
 * Includes inventory management, listing creation, marketplace browsing,
 * and mystery box purchases.
 */
export function App() {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  
  // Derive username from wallet address
  const username = publicKey ? publicKey.toBase58() : null;
  const walletAddress = username;
  
  // State management
  const [inventory, setInventory] = useState([]);
  const [listings, setListings] = useState([]);
  const [mysteryBoxes, setMysteryBoxes] = useState([]);
  const [itemPrices, setItemPrices] = useState({}); // Track price for each item
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [config, setConfig] = useState(null); // Server configuration
  
  // Message states
  const [inventoryMessage, setInventoryMessage] = useState(null);
  const [listingsMessage, setListingsMessage] = useState(null);
  const [mysteryMessage, setMysteryMessage] = useState(null);
  
  // Payment status
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  /**
   * Show temporary message
   */
  const showMessage = useCallback((setter, message, type = 'success') => {
    setter({ message, type });
    setTimeout(() => setter(null), 5000);
  }, []);
  
  /**
   * Load server configuration
   */
  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/config`);
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, []);
  
  /**
   * Load user balance
   */
  const loadBalance = useCallback(async () => {
    if (!username) return;
    
    setBalanceLoading(true);
    try {
      const response = await fetch(`${API_BASE}/balance/${username}`);
      
      if (!response.ok) {
        throw new Error('Failed to load balance');
      }
      
      const balanceData = await response.json();
      setBalance(balanceData);
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [username]);
  
  /**
   * Load user inventory
   */
  const loadInventory = useCallback(async () => {
    if (!username) return;
    
    try {
      const response = await fetch(`${API_BASE}/inventory/${username}`);
      
      if (!response.ok) {
        throw new Error('Failed to load inventory');
      }
      
      const items = await response.json();
      setInventory(items);
    } catch (error) {
      showMessage(setInventoryMessage, `❌ Error loading inventory: ${error.message}`, 'error');
    }
  }, [username, showMessage]);
  
  /**
   * Load marketplace listings
   */
  const loadListings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/bazaar/listings`);
      const data = await response.json();
      setListings(data.items || []);
    } catch (error) {
      showMessage(setListingsMessage, `❌ Error loading listings: ${error.message}`, 'error');
    }
  }, [showMessage]);
  
  /**
   * Load mystery box tiers
   */
  const loadMysteryBoxes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/bazaar/mystery-box/tiers`);
      const tiers = await response.json();
      setMysteryBoxes(tiers);
    } catch (error) {
      showMessage(setMysteryMessage, `❌ Error loading mystery boxes: ${error.message}`, 'error');
    }
  }, [showMessage]);
  
  /**
   * Create a new listing for an item
   */
  const createListingForItem = async (item) => {
    if (!connected || !username) {
      showMessage(setInventoryMessage, '❌ Please connect your wallet first', 'error');
      return;
    }
    
    const price = itemPrices[item.id] || '5.00';
    const priceNum = parseFloat(price);
    
    if (isNaN(priceNum) || priceNum <= 0) {
      showMessage(setInventoryMessage, '❌ Please enter a valid price', 'error');
      return;
    }
    
    const listing = {
      itemId: item.id,
      itemType: 'item', // Generic type
      itemData: {
        description: item.description,
      },
      sellerUsername: username,
      sellerWallet: walletAddress,
      priceUSDC: priceNum,
    };

    try {
      const response = await fetch(`${API_BASE}/bazaar/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create listing');
      }

      showMessage(setInventoryMessage, `✅ Listed ${item.name} for ${priceNum}!`, 'success');
      
      // Clear the price for this item
      setItemPrices(prev => {
        const newPrices = { ...prev };
        delete newPrices[item.id];
        return newPrices;
      });
      
      loadInventory();
      loadListings();
    } catch (error) {
      showMessage(setInventoryMessage, `❌ Error: ${error.message}`, 'error');
    }
  };
  
  /**
   * Purchase an item from marketplace
   */
  const purchaseItem = async (listingId) => {
    if (!connected || !username) {
      showMessage(setListingsMessage, '❌ Please connect your wallet first', 'error');
      return;
    }
    
    try {
      const url = `${API_BASE}/bazaar/purchase-with-currency/${listingId}?buyer=${username}&buyerWallet=${walletAddress}`;
      
      // Use x402 payment handler which handles both mock and production modes
      const result = await handleX402Purchase(url, wallet, (status) => {
        setPaymentStatus(status);
      });
      
      console.log('📦 Purchase result:', result);
      console.log('📦 Item data:', result.item);
      
      const itemName = result.item?.name || result.item?.id || result.item?.itemId || 'item';
      const balanceText = result.newBalance !== undefined 
        ? ` New balance: ${result.newBalance.toFixed(2)}` 
        : '';
      
      const txSignature = result.txId || result.txHash;
      let txText = '';
      if (txSignature) {
        // Determine network for explorer link (devnet or mainnet)
        const network = window.location.hostname === 'localhost' ? 'devnet' : 'mainnet-beta';
        const explorerUrl = `https://solscan.io/tx/${txSignature}?cluster=${network}`;
        txText = ` <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" style="color: #4CAF50; text-decoration: underline;">View on Solscan</a>`;
      }
      
      showMessage(
        setListingsMessage, 
        `✅ Purchase successful! Got ${itemName}.${balanceText}${txText}`, 
        'success'
      );
      setPaymentStatus(null);
      loadInventory();
      loadListings();
      loadBalance(); // Update balance after purchase
    } catch (error) {
      setPaymentStatus(null);
      showMessage(setListingsMessage, `❌ Error: ${error.message}`, 'error');
    }
  };
  
  /**
   * Purchase and open a mystery box
   */
  const purchaseMysteryBox = async (tierId) => {
    if (!connected || !username) {
      showMessage(setMysteryMessage, '❌ Please connect your wallet first', 'error');
      return;
    }
    
    try {
      const url = `${API_BASE}/bazaar/mystery-box-with-currency/${tierId}?buyer=${username}&buyerWallet=${walletAddress}`;
      
      // Use x402 payment handler which handles both mock and production modes
      const result = await handleX402Purchase(url, wallet, (status) => {
        setPaymentStatus(status);
      });
      
      const item = result.item;
      const itemName = item?.name || item?.id || item?.itemId || 'item';
      const itemRarity = item?.rarity || 'mystery';
      const balanceText = result.newBalance !== undefined 
        ? ` New balance: ${result.newBalance.toFixed(2)}` 
        : '';
      
      const txSignature = result.txId || result.txHash;
      let txText = '';
      if (txSignature) {
        // Determine network for explorer link (devnet or mainnet)
        const network = window.location.hostname === 'localhost' ? 'devnet' : 'mainnet-beta';
        const explorerUrl = `https://solscan.io/tx/${txSignature}?cluster=${network}`;
        txText = ` <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" style="color: #4CAF50; text-decoration: underline;">View on Solscan</a>`;
      }
      
      showMessage(
        setMysteryMessage,
        `✅ You got a ${itemRarity} ${itemName}!${balanceText}${txText} 🎉`, 
        'success'
      );
      setPaymentStatus(null);
      loadBalance(); // Update balance after purchase
    } catch (error) {
      setPaymentStatus(null);
      showMessage(setMysteryMessage, `❌ Error: ${error.message}`, 'error');
    }
  };
  
  /**
   * Update price for an item
   */
  const updateItemPrice = (itemId, price) => {
    setItemPrices(prev => ({
      ...prev,
      [itemId]: price
    }));
  };
  
  // Load data when wallet connects
  useEffect(() => {
    if (connected && username) {
      loadBalance();
      loadInventory();
      loadListings();
      loadMysteryBoxes();
    }
  }, [connected, username, loadBalance, loadInventory, loadListings, loadMysteryBoxes]);
  
  // Initial load of public data
  useEffect(() => {
    loadConfig();
    loadListings();
    loadMysteryBoxes();
  }, [loadConfig, loadListings, loadMysteryBoxes]);
  
  return (
    <div className="container">
      {/* Header */}
      <header>
        <h1>🎪 Bazaar x402 Marketplace</h1>
        {config && (
          <p className="badge">
            {config.mode === 'mock' ? (
              <>🔧 Mock Mode - No Real Payments Required</>
            ) : (
              <>⚡ Production Mode - {config.network === 'solana-mainnet' ? 'Mainnet' : 'Devnet'}</>
            )}
          </p>
        )}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
          {connected && balance && (
            <div style={{ 
              padding: '8px 16px', 
              background: '#2a2a2a', 
              borderRadius: '8px',
              border: '1px solid #444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>💰</span>
              <div>
                <div style={{ fontSize: '12px', color: '#999' }}>Balance</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {balanceLoading ? '...' : `${balance.amount.toFixed(2)}`}
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>{balance.currency}</div>
              </div>
            </div>
          )}
          <WalletButton />
        </div>
        {paymentStatus && (
          <div style={{ 
            marginTop: '12px', 
            padding: '8px 16px', 
            background: '#1a4d2e', 
            borderRadius: '8px',
            color: '#4CAF50',
            fontSize: '14px'
          }}>
            {paymentStatus}
          </div>
        )}
      </header>

      {/* Main Content Grid - Two Columns */}
      <div className="grid two-column">
        {/* My Inventory Card - Left Column */}
        <div className="card">
          <h2>🎒 My Inventory</h2>
          {inventoryMessage && (
            <div className={`message ${inventoryMessage.type}`}>
              {inventoryMessage.message}
            </div>
          )}
          {!connected ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              Connect wallet to view inventory
            </div>
          ) : (
            <>
              <button onClick={loadInventory} style={{ marginBottom: '16px' }}>
                Refresh Inventory
              </button>
              <ul className="listings">
                {inventory.length === 0 ? (
                  <li style={{ color: '#999' }}>No items in inventory</li>
                ) : (
                  inventory.map(item => (
                    <li key={item.id} className="inventory-item">
                      <div className="item-details">
                        <div className="item-header">
                          <strong>{item.name}</strong>
                          <span className={`rarity-badge rarity-${item.rarity}`}>{item.rarity}</span>
                        </div>
                        <small>{item.description}</small>
                      </div>
                      <div className="item-actions">
                        <input 
                          type="number"
                          className="price-input"
                          placeholder="Price"
                          value={itemPrices[item.id] || ''}
                          onChange={(e) => updateItemPrice(item.id, e.target.value)}
                          step="0.01"
                          min="0.01"
                        />
                        <button 
                          className="list-btn"
                          onClick={() => createListingForItem(item)}
                          disabled={!itemPrices[item.id] || parseFloat(itemPrices[item.id]) <= 0}
                        >
                          List
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>

        {/* Active Listings Card - Right Column */}
        <div className="card">
          <h2>🛍️ Active Marketplace</h2>
          {listingsMessage && (
            <div 
              className={`message ${listingsMessage.type}`}
              dangerouslySetInnerHTML={{ __html: listingsMessage.message }}
            />
          )}
          <button onClick={loadListings} style={{ marginBottom: '16px' }}>
            Refresh Listings
          </button>
          <ul className="listings">
            {listings.length === 0 ? (
              <li style={{ color: '#999' }}>No active listings</li>
            ) : (
              listings.map(listing => {
                const isOwnListing = listing.sellerUsername === username;
                return (
                  <li key={listing.id} className="listing-item">
                    <div className="listing-info">
                      <strong>{listing.itemData?.description || listing.itemType}</strong><br />
                      <small>Seller: {listing.sellerUsername.slice(0, 8)}...</small>
                    </div>
                    <span className="listing-price">${listing.priceUSDC.toFixed(2)}</span>
                    {isOwnListing ? (
                      <button className="buy-btn" style={{ background: '#999' }} disabled>
                        Your Item
                      </button>
                    ) : (
                      <button 
                        className="buy-btn"
                        onClick={() => purchaseItem(listing.id)}
                        disabled={!connected}
                      >
                        Buy
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      {/* Mystery Boxes Card */}
      <div className="card full-width">
        <h2>🎁 Mystery Boxes</h2>
        {mysteryMessage && (
          <div 
            className={`message ${mysteryMessage.type}`}
            dangerouslySetInnerHTML={{ __html: mysteryMessage.message }}
          />
        )}
        {!connected ? (
          <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
            Connect wallet to open mystery boxes
          </div>
        ) : (
          <div className="mystery-grid">
            {mysteryBoxes.map(tier => (
              <div key={tier.id} className="mystery-box">
                <h3>{tier.name}</h3>
                <p>{tier.description}</p>
                <p><strong>Price: ${tier.priceUSDC.toFixed(2)}</strong></p>
                <button onClick={() => purchaseMysteryBox(tier.id)}>
                  Open Box
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <TransactionHistory username={username} connected={connected} />
    </div>
  );
}
