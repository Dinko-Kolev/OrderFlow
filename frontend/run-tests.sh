#!/bin/bash

echo "🍕 Running Checkout Page Tests for OrderFlow"
echo "============================================="

# Run tests with coverage
echo "Running tests with coverage..."
npm run test:coverage

echo ""
echo "✅ Tests completed!"
echo ""
echo "To run tests in watch mode: npm run test:watch"
echo "To run tests once: npm run test"
echo ""
echo "Test files are in: __tests__/"
echo "Coverage report is in: coverage/"
