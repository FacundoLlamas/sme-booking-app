#!/bin/bash
set -e

echo "🚀 SME Booking App - Quick Start"
echo "================================"

# Check Node version
NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Reset database
echo "🗄️ Resetting database..."
npm run db:reset

# Run type check
echo "✓ Type checking..."
npm run type-check

# Run linter
echo "✓ Linting..."
npm run lint

# Run tests
echo "✓ Running tests..."
npm test -- --run

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start development:"
echo "  npm run dev"
echo ""
echo "Check mock services:"
echo "  npm run mock:status"
echo ""
echo "View database:"
echo "  npm run prisma:studio"
