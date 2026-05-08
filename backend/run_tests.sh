#!/bin/bash
# Script to run backend tests with testing mode enabled

echo "🧪 Running backend tests with TESTING_MODE enabled..."
echo "⚠️  Rate limiting will be disabled for tests"
echo ""

# Set testing mode environment variable
export TESTING_MODE=true

# Clean test data first
echo "🧹 Cleaning old test data..."
cd /app/backend
python tests/clean_test_data.py

echo ""
echo "▶️  Starting tests..."
echo ""

# Run the test suite
python tests/backend_test.py

# Capture exit code
EXIT_CODE=$?

echo ""
echo "✅ Tests completed with exit code: $EXIT_CODE"

exit $EXIT_CODE
