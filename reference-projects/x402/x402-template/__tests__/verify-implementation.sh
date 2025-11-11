#!/bin/bash

# Verification script for gem balance API integration
# This script checks that all required files and implementations are in place

echo "🔍 Verifying Gem Balance API Integration Implementation"
echo "========================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
checks_passed=0
checks_failed=0

# Function to check if file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} File exists: $1"
    ((checks_passed++))
    return 0
  else
    echo -e "${RED}✗${NC} File missing: $1"
    ((checks_failed++))
    return 1
  fi
}

# Function to check if string exists in file
check_content() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Found in $1: $3"
    ((checks_passed++))
    return 0
  else
    echo -e "${RED}✗${NC} Not found in $1: $3"
    ((checks_failed++))
    return 1
  fi
}

echo "1. Checking API Routes"
echo "----------------------"
check_file "app/api/gems/add/route.ts"
check_file "app/api/gems/spend/route.ts"
check_file "app/api/gems/balance/route.ts"
echo ""

echo "2. Checking Context Implementation"
echo "----------------------------------"
check_file "contexts/gem-balance-context.tsx"
check_content "contexts/gem-balance-context.tsx" "async (amount: number" "addGems is async"
check_content "contexts/gem-balance-context.tsx" "Promise<boolean>" "spendGems returns Promise"
check_content "contexts/gem-balance-context.tsx" "fetch('/api/gems/add'" "Calls add API"
check_content "contexts/gem-balance-context.tsx" "fetch('/api/gems/spend'" "Calls spend API"
check_content "contexts/gem-balance-context.tsx" "fetch('/api/gems/balance'" "Fetches balance from API"
check_content "contexts/gem-balance-context.tsx" "setGemBalance(previousBalance)" "Implements rollback"
echo ""

echo "3. Checking Purchase Page Integration"
echo "-------------------------------------"
check_file "app/purchase/[tier]/page.tsx"
check_content "app/purchase/[tier]/page.tsx" "fetch('/api/gems/add'" "Calls API to add gems"
check_content "app/purchase/[tier]/page.tsx" "data.success" "Checks API response"
echo ""

echo "4. Checking Header Component"
echo "----------------------------"
check_file "components/gem-balance-header.tsx"
check_content "components/gem-balance-header.tsx" "useGemBalance" "Uses gem balance context"
echo ""

echo "5. Checking Test Files"
echo "----------------------"
check_file "__tests__/gem-balance-integration.test.ts"
check_file "__tests__/browser-integration-test.html"
check_file "__tests__/MANUAL_TESTING_GUIDE.md"
check_file "__tests__/README.md"
echo ""

echo "6. Checking Storage Layer"
echo "-------------------------"
check_file "lib/storage.ts"
check_file "lib/session.ts"
echo ""

echo "7. Verifying API Route Features"
echo "--------------------------------"
check_content "app/api/gems/add/route.ts" "checkRateLimit" "Rate limiting implemented"
check_content "app/api/gems/add/route.ts" "logTransaction" "Transaction logging implemented"
check_content "app/api/gems/spend/route.ts" "balance.current < amount" "Insufficient gems validation"
check_content "app/api/gems/balance/route.ts" "getSession" "Session validation"
echo ""

echo "8. Checking TypeScript Compilation"
echo "-----------------------------------"
if command -v tsc &> /dev/null; then
  if tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${RED}✗${NC} TypeScript compilation errors found"
    ((checks_failed++))
  else
    echo -e "${GREEN}✓${NC} TypeScript compilation successful"
    ((checks_passed++))
  fi
else
  echo -e "${YELLOW}⚠${NC} TypeScript compiler not found, skipping compilation check"
fi
echo ""

echo "========================================================"
echo "Verification Summary"
echo "========================================================"
echo -e "${GREEN}Passed: $checks_passed${NC}"
echo -e "${RED}Failed: $checks_failed${NC}"
echo ""

if [ $checks_failed -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed! Implementation is complete.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Start the dev server: npm run dev"
  echo "2. Open __tests__/browser-integration-test.html in your browser"
  echo "3. Run the tests to verify functionality"
  echo "4. Follow __tests__/MANUAL_TESTING_GUIDE.md for comprehensive testing"
  exit 0
else
  echo -e "${RED}✗ Some checks failed. Please review the implementation.${NC}"
  exit 1
fi
