#!/bin/bash

# Test script for balance and transaction endpoints
# Make sure the server is running on http://localhost:3001

BASE_URL="http://localhost:3001/api"
USER_ID="testuser123"

echo "🧪 Testing Bazaar x402 API Endpoints"
echo "===================================="
echo ""

# Test 1: Get initial balance
echo "📊 Test 1: Get initial balance"
echo "GET $BASE_URL/balance/$USER_ID"
curl -s "$BASE_URL/balance/$USER_ID" | jq '.'
echo ""
echo ""

# Test 2: Add balance
echo "💰 Test 2: Add 500 USDC to balance"
echo "POST $BASE_URL/balance/add"
curl -s -X POST "$BASE_URL/balance/add" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"amount\":500}" | jq '.'
echo ""
echo ""

# Test 3: Get updated balance
echo "📊 Test 3: Get updated balance"
echo "GET $BASE_URL/balance/$USER_ID"
curl -s "$BASE_URL/balance/$USER_ID" | jq '.'
echo ""
echo ""

# Test 4: Get transactions (should be empty initially)
echo "📜 Test 4: Get transaction history (page 1, limit 10)"
echo "GET $BASE_URL/transactions/$USER_ID?page=1&limit=10"
curl -s "$BASE_URL/transactions/$USER_ID?page=1&limit=10" | jq '.'
echo ""
echo ""

# Test 5: Purchase a mystery box to create a transaction
echo "🎁 Test 5: Purchase a mystery box"
echo "GET $BASE_URL/bazaar/mystery-box-with-currency/tier-common?buyer=$USER_ID&buyerWallet=wallet-$USER_ID"
curl -s "$BASE_URL/bazaar/mystery-box-with-currency/tier-common?buyer=$USER_ID&buyerWallet=wallet-$USER_ID" | jq '.'
echo ""
echo ""

# Test 6: Get transactions again (should have the mystery box purchase)
echo "📜 Test 6: Get transaction history after purchase"
echo "GET $BASE_URL/transactions/$USER_ID?page=1&limit=10"
curl -s "$BASE_URL/transactions/$USER_ID?page=1&limit=10" | jq '.'
echo ""
echo ""

# Test 7: Test pagination with limit
echo "📜 Test 7: Get transaction history with limit 5"
echo "GET $BASE_URL/transactions/$USER_ID?page=1&limit=5"
curl -s "$BASE_URL/transactions/$USER_ID?page=1&limit=5" | jq '.'
echo ""
echo ""

# Test 8: Test ascending sort order
echo "📜 Test 8: Get transaction history in ascending order"
echo "GET $BASE_URL/transactions/$USER_ID?sortOrder=asc"
curl -s "$BASE_URL/transactions/$USER_ID?sortOrder=asc" | jq '.'
echo ""
echo ""

# Test 9: Test error handling - invalid page
echo "❌ Test 9: Test error handling - invalid page (should fail)"
echo "GET $BASE_URL/transactions/$USER_ID?page=0"
curl -s "$BASE_URL/transactions/$USER_ID?page=0" | jq '.'
echo ""
echo ""

# Test 10: Test error handling - invalid limit
echo "❌ Test 10: Test error handling - invalid limit (should fail)"
echo "GET $BASE_URL/transactions/$USER_ID?limit=200"
curl -s "$BASE_URL/transactions/$USER_ID?limit=200" | jq '.'
echo ""
echo ""

echo "✅ All tests completed!"
echo ""
echo "Note: Make sure the server is running with 'pnpm dev' before running this script"
echo "Install jq for pretty JSON output: brew install jq (macOS) or apt-get install jq (Linux)"
