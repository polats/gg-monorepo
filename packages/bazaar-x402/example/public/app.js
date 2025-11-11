/**
 * Bazaar x402 Example Client
 * Demonstrates marketplace interactions in mock mode
 */

const API_BASE = 'http://localhost:3001/api';

// Current user state
let currentUser = 'player1';
let currentWallet = 'wallet-player1';

// Helper to show messages
function showMessage(elementId, message, type = 'success') {
  const el = document.getElementById(elementId);
  el.innerHTML = `<div class="message ${type}">${message}</div>`;
  setTimeout(() => {
    el.innerHTML = '';
  }, 5000);
}

// User switching
document.getElementById('userSelect').addEventListener('change', (e) => {
  currentUser = e.target.value;
  currentWallet = `wallet-${currentUser}`;
  document.getElementById('currentUser').textContent = currentUser;
  document.getElementById('sellerUsername').value = currentUser;
  document.getElementById('sellerWallet').value = currentWallet;
  loadInventory();
  loadListings();
});

// Load Inventory
async function loadInventory() {
  try {
    const response = await fetch(`${API_BASE}/inventory/${currentUser}`);
    
    if (!response.ok) {
      throw new Error('Failed to load inventory');
    }
    
    const items = await response.json();
    const listEl = document.getElementById('inventoryList');
    
    if (items.length === 0) {
      listEl.innerHTML = '<li style="color: #999;">No items in inventory</li>';
      return;
    }

    listEl.innerHTML = items.map(item => `
      <li class="listing-item">
        <div class="listing-info">
          <strong>${item.name}</strong><br>
          <small>${item.description} | Rarity: ${item.rarity}</small>
        </div>
        <button class="buy-btn" onclick="selectItemForListing('${item.id}', '${item.name}', '${item.description}')">List</button>
      </li>
    `).join('');
  } catch (error) {
    showMessage('inventoryMessage', `❌ Error loading inventory: ${error.message}`, 'error');
  }
}

// Select item for listing
window.selectItemForListing = function(itemId, name, description) {
  document.getElementById('itemId').value = itemId;
  document.getElementById('itemDescription').value = description;
  showMessage('createMessage', `✅ Selected ${name} for listing`, 'success');
};

// Create Listing
document.getElementById('createListingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const listing = {
    itemId: document.getElementById('itemId').value,
    itemType: document.getElementById('itemType').value,
    itemData: {
      description: document.getElementById('itemDescription').value,
    },
    sellerUsername: currentUser,
    sellerWallet: currentWallet,
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
    loadInventory();
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

    listEl.innerHTML = data.items.map(listing => {
      const isOwnListing = listing.sellerUsername === currentUser;
      return `
        <li class="listing-item">
          <div class="listing-info">
            <strong>${listing.itemData?.description || listing.itemType}</strong><br>
            <small>Seller: ${listing.sellerUsername} | ID: ${listing.id.slice(0, 8)}...</small>
          </div>
          <span class="listing-price">$${listing.priceUSDC.toFixed(2)}</span>
          ${isOwnListing 
            ? '<button class="buy-btn" style="background: #999;" disabled>Your Item</button>'
            : `<button class="buy-btn" onclick="purchaseItem('${listing.id}')">Buy</button>`
          }
        </li>
      `;
    }).join('');
  } catch (error) {
    showMessage('listingsMessage', `❌ Error loading listings: ${error.message}`, 'error');
  }
}

// Purchase Item
window.purchaseItem = async function(listingId) {
  try {
    const response = await fetch(`${API_BASE}/bazaar/purchase/${listingId}?buyer=${currentUser}&buyerWallet=${currentWallet}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Purchase failed');
    }

    const result = await response.json();
    showMessage('listingsMessage', `✅ Purchase successful! Got ${result.item.name || result.item.id}`, 'success');
    loadInventory();
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

// Refresh buttons
document.getElementById('refreshListings').addEventListener('click', loadListings);
document.getElementById('refreshInventory').addEventListener('click', loadInventory);

// Initial load
loadInventory();
loadListings();
loadMysteryBoxes();
