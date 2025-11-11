#!/bin/bash

# Check if test dependencies are installed

echo "🔍 Checking Test Setup"
echo "======================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

checks_passed=0
checks_failed=0

# Check if node_modules exists
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} node_modules directory exists"
  ((checks_passed++))
else
  echo -e "${RED}✗${NC} node_modules directory not found"
  echo "  Run: npm install"
  ((checks_failed++))
fi

# Check if Jest is installed
if [ -d "node_modules/jest" ]; then
  echo -e "${GREEN}✓${NC} Jest is installed"
  ((checks_passed++))
else
  echo -e "${RED}✗${NC} Jest is not installed"
  echo "  Run: npm install"
  ((checks_failed++))
fi

# Check if ts-jest is installed
if [ -d "node_modules/ts-jest" ]; then
  echo -e "${GREEN}✓${NC} ts-jest is installed"
  ((checks_passed++))
else
  echo -e "${RED}✗${NC} ts-jest is not installed"
  echo "  Run: npm install"
  ((checks_failed++))
fi

# Check if @types/jest is installed
if [ -d "node_modules/@types/jest" ]; then
  echo -e "${GREEN}✓${NC} @types/jest is installed"
  ((checks_passed++))
else
  echo -e "${RED}✗${NC} @types/jest is not installed"
  echo "  Run: npm install"
  ((checks_failed++))
fi

# Check if jest.config.js exists
if [ -f "jest.config.js" ]; then
  echo -e "${GREEN}✓${NC} jest.config.js exists"
  ((checks_passed++))
else
  echo -e "${RED}✗${NC} jest.config.js not found"
  ((checks_failed++))
fi

# Check if test files exist
if [ -f "__tests__/gem-balance-integration.test.ts" ]; then
  echo -e "${GREEN}✓${NC} Test files exist"
  ((checks_passed++))
else
  echo -e "${RED}✗${NC} Test files not found"
  ((checks_failed++))
fi

# Check if package.json has test scripts
if grep -q '"test":' package.json; then
  echo -e "${GREEN}✓${NC} Test scripts configured in package.json"
  ((checks_passed++))
else
  echo -e "${RED}✗${NC} Test scripts not found in package.json"
  ((checks_failed++))
fi

echo ""
echo "======================"
echo "Setup Summary"
echo "======================"
echo -e "${GREEN}Passed: $checks_passed${NC}"
echo -e "${RED}Failed: $checks_failed${NC}"
echo ""

if [ $checks_failed -eq 0 ]; then
  echo -e "${GREEN}✓ Test setup is complete!${NC}"
  echo ""
  echo "Available commands:"
  echo "  npm test              - Run all tests"
  echo "  npm run test:watch    - Run tests in watch mode"
  echo "  npm run test:coverage - Run tests with coverage"
  echo "  npm run test:browser  - Open browser tests"
  echo "  npm run verify        - Verify implementation"
  echo ""
  echo "To run tests:"
  echo "  1. Start dev server: npm run dev"
  echo "  2. Run tests: npm test"
  exit 0
else
  echo -e "${RED}✗ Test setup incomplete${NC}"
  echo ""
  echo "To complete setup:"
  echo "  npm install"
  echo ""
  exit 1
fi
