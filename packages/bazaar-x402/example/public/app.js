/**
 * Bazaar x402 Example Client
 * Demonstrates marketplace interactions in mock mode
 */

const API_BASE = 'http://localhost:3001/api';

// Helper to show messages
function showMessage(elementId, message, type = 'success') {
  const el = document.getElementById(elementId);
  el.innerHTML = `<div class="message ${type}">${message}</div>`;
  setTimeout(() => {
    el.innerHTML = '';
  }, 5000);
}

// Create Listing
document.getElementById('createListingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const listing = {
    itemId: document.getElementById('itemId').value,
    itemType: document.getElementById('itemType').value,
    itemData: {
      description: document.getElementById('itemDescription').value,
    },
    sellerUsername: document.getElementById('sellerUsername').value,
    sellerWallet: document.getElementById('sellerWallet').value,
    priceUSDC: parseFloat(document.getElementById('price').value),
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

    const result = await response.json();
    showMessage('createMessage', `✅ Listing created! ID: ${result.id}`, 'success');
    loadListings();
  } catch (error) {
    showMessage('createMessage', `❌ Error: ${error.message}`, 'error');
  }
});

// Load Listings
async function loadListings() {
  try {
    const response = await fetch(`${API_BASE}/bazaar/listings`);
    const data = await response.json();
    
    const listEl = document.getElementById('listingsList');
    
    if (data.items.length === 0) {
      listEl.innerHTML = '<li style="color: #999;">No active listings</li>';
      return;
    }

    listEl.innerHTML = data.items.map(listing => `
      <li class="listing-item">
        <div class="listing-info">
          <strong>${listing.itemData?.description || listing.itemType}</strong><br>
          <small>Seller: ${listing.sellerUsername} | ID: ${listing.id.slice(0, 8)}...</small>
        </div>
        <span class="listing-price">$${listing.priceUSDC.toFixed(2)}</span>
        <button class="buy-btn" onclick="purchaseItem('${listing.id}')">Buy</button>
      </li>
    `).join('');
  } catch (error) {
    showMessage('listingsMessage', `❌ Error loading listings: ${error.message}`, 'error');
  }
}

// Purchase Item
window.purchaseItem = async function(listingId) {
  try {
    const response = await fetch(`${API_BASE}/bazaar/purchase/${listingId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Purchase failed');
    }

    const result = await response.json();
    showMessage('listingsMessage', `✅ Purchase successful! Item: ${result.item.id}`, 'success');
    loadListings();
  } catch (error) {
    showMessage('listingsMessage', `❌ Error: ${error.message}`, 'error');
  }
};

// Load Mystery Boxes
async function loadMysteryBoxes() {
  try {
    const response = await fetch(`${API_BASE}/bazaar/mystery-box/tiers`);
    const tiers = await response.json();
    
    const boxesEl = document.getElementById('mysteryBoxes');
    
    boxesEl.innerHTML = tiers.map(tier => `
      <div class="mystery-box">
        <h3>${tier.name}</h3>
        <p>${tier.description}</p>
        <p><strong>Price: $${tier.priceUSDC.toFixed(2)}</strong></p>
        <button onclick="purchaseMysteryBox('${tier.id}')">Open Box</button>
      </div>
    `).join('');
  } catch (error) {
    showMessage('mysteryMessage', `❌ Error loading mystery boxes: ${error.message}`, 'error');
  }
}

// Purchase Mystery Box
window.purchaseMysteryBox = async function(tierId) {
  try {
    const response = await fetch(`${API_BASE}/bazaar/mystery-box/${tierId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Purchase failed');
    }

    const result = await response.json();
    const item = result.item;
    showMessage('mysteryMessage', 
      `✅ You got a ${item.rarity} ${item.name}! 🎉`, 
      'success'
    );
  } catch (error) {
    showMessage('mysteryMessage', `❌ Error: ${error.message}`, 'error');
  }
};

// Refresh button
document.getElementById('refreshListings').addEventListener('click', loadListings);

// Initial load
loadListings();
loadMysteryBoxes();
