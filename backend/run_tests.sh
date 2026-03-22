#!/bin/bash
# Script to run backend tests with testing mode enabled

echo "🧪 Running backend tests with TESTING_MODE enabled..."
echo "⚠️  Rate limiting will be disabled for tests"
echo ""

# Set testing mode environment variable
export TESTING_MODE=true

# Run the test suite
cd /app/backend
python tests/backend_test.py

# Capture exit code
EXIT_CODE=$?

echo ""
echo "✅ Tests completed with exit code: $EXIT_CODE"

exit $EXIT_CODE
