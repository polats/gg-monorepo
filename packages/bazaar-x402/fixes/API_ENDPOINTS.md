# Bazaar x402 API Endpoints

This document describes the available API endpoints in the example server.

## Balance Endpoints

### GET /api/balance/:userId

Get the current balance for a user.

**Parameters:**
- `userId` (path parameter): User identifier (username or wallet address)

**Response:**
```json
{
  "amount": 1000.00,
  "currency": "MOCK_USDC",
  "lastUpdated": 1699564800000
}
```

**Example:**
```bash
curl http://localhost:3001/api/balance/user123
```

### POST /api/balance/add

Add currency to a user's balance (for testing purposes).

**Request Body:**
```json
{
  "userId": "user123",
  "amount": 100.00
}
```

**Response:**
```json
{
  "success": true,
  "newBalance": 1100.00,
  "txId": "MOCK_1699564800000_ABC123"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/balance/add \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","amount":100}'
```

## Transaction History Endpoint

### GET /api/transactions/:userId

Get transaction history for a user with pagination support.

**Parameters:**
- `userId` (path parameter): User identifier
- `page` (query parameter, optional): Page number (default: 1)
- `limit` (query parameter, optional): Items per page (default: 20, max: 100)
- `sortOrder` (query parameter, optional): Sort order - 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "transactions": [
    {
      "id": "tx-1699564800000-abc123",
      "userId": "user123",
      "type": "listing_purchase",
      "amount": 25.00,
      "txId": "MOCK_1699564800000_ABC123",
      "networkId": "mock",
      "timestamp": 1699564800000,
      "listingId": "listing-001",
      "itemId": "legendary-sword-001"
    },
    {
      "id": "tx-1699564700000-def456",
      "userId": "user123",
      "type": "mystery_box_purchase",
      "amount": 10.00,
      "txId": "MOCK_1699564700000_DEF456",
      "networkId": "mock",
      "timestamp": 1699564700000,
      "boxId": "tier-common",
      "items": ["rare-potion-003"]
    }
  ],
  "page": 1,
  "limit": 20,
  "count": 2
}
```

**Transaction Types:**
- `mystery_box_purchase`: User purchased a mystery box
- `listing_purchase`: User purchased an item from marketplace
- `listing_sale`: User sold an item on marketplace
- `refund`: Currency was refunded to user
- `test_credit`: Test currency was added to user's balance

**Example:**
```bash
# Get first page with default settings
curl http://localhost:3001/api/transactions/user123

# Get second page with 10 items per page
curl http://localhost:3001/api/transactions/user123?page=2&limit=10

# Get transactions in ascending order (oldest first)
curl http://localhost:3001/api/transactions/user123?sortOrder=asc
```

## Marketplace Endpoints

### GET /api/bazaar/listings

Get all active marketplace listings.

### POST /api/bazaar/listings

Create a new marketplace listing.

### GET /api/bazaar/purchase-with-currency/:listingId

Purchase a listing using currency balance.

**Query Parameters:**
- `buyer`: Buyer's username
- `buyerWallet`: Buyer's wallet address

**Example:**
```bash
curl "http://localhost:3001/api/bazaar/purchase-with-currency/listing-001?buyer=user123&buyerWallet=wallet123"
```

### GET /api/bazaar/mystery-box/tiers

Get available mystery box tiers.

### GET /api/bazaar/mystery-box-with-currency/:tierId

Purchase and open a mystery box using currency balance.

**Query Parameters:**
- `buyer`: Buyer's username
- `buyerWallet`: Buyer's wallet address

**Example:**
```bash
curl "http://localhost:3001/api/bazaar/mystery-box-with-currency/tier-common?buyer=user123&buyerWallet=wallet123"
```

## Inventory Endpoint

### GET /api/inventory/:username

Get all items owned by a user.

**Example:**
```bash
curl http://localhost:3001/api/inventory/user123
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `400`: Bad request (invalid parameters)
- `404`: Resource not found
- `500`: Internal server error

## Testing the Endpoints

You can test these endpoints using:

1. **curl** (command line):
```bash
curl http://localhost:3001/api/balance/testuser
```

2. **Browser** (for GET requests):
```
http://localhost:3001/api/balance/testuser
http://localhost:3001/api/transactions/testuser
```

3. **Postman or similar API testing tools**

4. **The example web UI** at http://localhost:3001

## Notes

- All currency amounts are in USDC format with decimal precision
- Transaction IDs in mock mode have the format: `MOCK_{timestamp}_{random}`
- Timestamps are Unix timestamps in milliseconds
- The server runs in mock mode by default, so no real blockchain transactions occur
