import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

/**
 * Transaction History Component
 * 
 * Displays user's transaction history with pagination.
 * Shows transaction type, amount, timestamp, and blockchain explorer links.
 * 
 * @param {Object} props
 * @param {string} props.username - User's username
 * @param {boolean} props.connected - Whether wallet is connected
 */
export function TransactionHistory({ username, connected }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  
  /**
   * Load transactions from API
   */
  const loadTransactions = useCallback(async (pageNum = 1) => {
    if (!username) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE}/transactions/${username}?page=${pageNum}&limit=${limit}&sortOrder=desc`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }
      
      const data = await response.json();
      
      if (pageNum === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      
      setHasMore(data.transactions.length === limit);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);
  
  /**
   * Load more transactions (pagination)
   */
  const loadMore = () => {
    if (!loading && hasMore) {
      loadTransactions(page + 1);
    }
  };
  
  /**
   * Refresh transactions (reload from page 1)
   */
  const refresh = () => {
    setPage(1);
    loadTransactions(1);
  };
  
  /**
   * Format timestamp to readable date
   */
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  /**
   * Get transaction type display info
   */
  const getTransactionTypeInfo = (type) => {
    switch (type) {
      case 'mystery_box_purchase':
        return { icon: '🎁', label: 'Mystery Box', color: '#9333ea' };
      case 'listing_purchase':
        return { icon: '🛒', label: 'Purchase', color: '#3b82f6' };
      case 'listing_sale':
        return { icon: '💰', label: 'Sale', color: '#10b981' };
      default:
        return { icon: '📝', label: type, color: '#6b7280' };
    }
  };
  
  /**
   * Get Solana explorer URL for transaction
   */
  const getExplorerUrl = (txId, networkId) => {
    if (!txId || !networkId) return null;
    
    const baseUrl = networkId === 'solana-mainnet'
      ? 'https://explorer.solana.com/tx'
      : 'https://explorer.solana.com/tx';
    
    const cluster = networkId === 'solana-mainnet' ? '' : '?cluster=devnet';
    
    return `${baseUrl}/${txId}${cluster}`;
  };
  
  // Load transactions when component mounts or username changes
  useEffect(() => {
    if (connected && username) {
      loadTransactions(1);
    }
  }, [connected, username, loadTransactions]);
  
  if (!connected) {
    return (
      <div className="card full-width">
        <h2>📊 Transaction History</h2>
        <div style={{ color: '#999', textAlign: 'center', padding: '40px 20px' }}>
          Connect wallet to view transaction history
        </div>
      </div>
    );
  }
  
  return (
    <div className="card full-width">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>📊 Transaction History</h2>
        <button 
          onClick={refresh} 
          disabled={loading}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="message error" style={{ marginBottom: '16px' }}>
          ❌ {error}
        </div>
      )}
      
      {transactions.length === 0 && !loading ? (
        <div style={{ color: '#999', textAlign: 'center', padding: '40px 20px' }}>
          No transactions yet
        </div>
      ) : (
        <>
          <div className="transaction-list">
            {transactions.map((tx, index) => {
              const typeInfo = getTransactionTypeInfo(tx.type);
              const explorerUrl = getExplorerUrl(tx.txId, tx.networkId);
              const isIncome = tx.type === 'listing_sale';
              
              return (
                <div key={`${tx.id}-${index}`} className="transaction-item">
                  <div className="transaction-icon" style={{ background: typeInfo.color }}>
                    {typeInfo.icon}
                  </div>
                  
                  <div className="transaction-details">
                    <div className="transaction-header">
                      <strong>{typeInfo.label}</strong>
                      <span className={`transaction-amount ${isIncome ? 'income' : 'expense'}`}>
                        {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="transaction-meta">
                      <span className="transaction-date">{formatDate(tx.timestamp)}</span>
                      
                      {explorerUrl ? (
                        <a 
                          href={explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="transaction-link"
                        >
                          View on Explorer ↗
                        </a>
                      ) : (
                        <span className="transaction-id">
                          Tx: {tx.txId.substring(0, 12)}...
                        </span>
                      )}
                    </div>
                    
                    {tx.itemId && (
                      <div className="transaction-item-info">
                        Item: {tx.itemId}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {hasMore && (
            <button 
              onClick={loadMore} 
              disabled={loading}
              style={{ 
                width: '100%', 
                marginTop: '16px',
                padding: '12px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
      
      <style jsx>{`
        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .transaction-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }
        
        .transaction-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .transaction-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .transaction-details {
          flex: 1;
          min-width: 0;
        }
        
        .transaction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .transaction-header strong {
          font-size: 16px;
          color: white;
        }
        
        .transaction-amount {
          font-size: 18px;
          font-weight: bold;
        }
        
        .transaction-amount.income {
          color: #10b981;
        }
        
        .transaction-amount.expense {
          color: #ef4444;
        }
        
        .transaction-meta {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          font-size: 14px;
          color: #999;
        }
        
        .transaction-date {
          color: #999;
        }
        
        .transaction-link {
          color: #667eea;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .transaction-link:hover {
          color: #764ba2;
          text-decoration: underline;
        }
        
        .transaction-id {
          font-family: monospace;
          font-size: 12px;
          color: #666;
        }
        
        .transaction-item-info {
          margin-top: 8px;
          font-size: 13px;
          color: #999;
        }
        
        @media (max-width: 768px) {
          .transaction-item {
            flex-direction: column;
            gap: 12px;
          }
          
          .transaction-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
          
          .transaction-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .transaction-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}
