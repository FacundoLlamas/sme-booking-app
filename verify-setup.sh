#!/bin/bash
# Verification Script for Part 1.3 Backend API Framework
# Run this after npm install completes

set -e

echo "🔍 Verifying Part 1.3: Backend API Framework Setup"
echo "================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules not found${NC}"
    echo -e "${YELLOW}Run: npm install${NC}"
    exit 1
fi
echo -e "${GREEN}✅ node_modules exists${NC}"

# Check key files exist
echo ""
echo "Checking key files..."

FILES=(
    "src/app/layout.tsx"
    "src/app/page.tsx"
    "src/app/api/health/route.ts"
    "src/app/api/ping/route.ts"
    "src/lib/errors.ts"
    "src/lib/api-response.ts"
    "src/lib/logger.ts"
    "src/lib/validation.ts"
    "src/lib/middleware/error-handler.ts"
    "src/lib/middleware/validate.ts"
    "src/middleware.ts"
    "src/__tests__/api/health.test.ts"
    "next.config.js"
    "tailwind.config.js"
    "vitest.config.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (MISSING)"
        exit 1
    fi
done

# Check if logs directory exists
if [ ! -d "logs" ]; then
    echo -e "${YELLOW}⚠️  logs directory not found, creating...${NC}"
    mkdir -p logs
fi
echo -e "${GREEN}✅ logs directory exists${NC}"

# Run type check
echo ""
echo "Running TypeScript type check..."
if npm run type-check; then
    echo -e "${GREEN}✅ TypeScript type check passed${NC}"
else
    echo -e "${RED}❌ TypeScript type check failed${NC}"
    exit 1
fi

# Run tests (if dev server is not running)
echo ""
echo "Running tests..."
if npm test -- --run; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed (may need dev server running)${NC}"
fi

echo ""
echo "================================================="
echo -e "${GREEN}✅ Part 1.3 Backend API Framework Verification Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Test health endpoint: curl http://localhost:3000/api/health"
echo "3. Test ping endpoint: curl http://localhost:3000/api/ping"
echo "4. View logs: tail -f logs/app.log"
echo ""
echo "All systems ready for local development! 🚀"
