#!/bin/bash
# Clean all generated files and restart fresh
echo "🧹 Cleaning generated files..."
rm -rf node_modules dist .next db/sqlite.db
rm -rf src/__tests__/**/*.snapshot
echo "✓ Cleaned"
echo ""
echo "Now run: npm install && npm run dev"
