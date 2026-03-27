#!/bin/bash

echo "Testing rate limiting on /api/auth/login"
echo "Making 12 consecutive requests with wrong credentials..."

for i in {1..12}; do
    response=$(curl -X POST "https://band-invites-hub.preview.emergentagent.com/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@invalid.com","password":"wrong"}' \
        -w "Status: %{http_code}" \
        -s)
    
    status=$(echo "$response" | tail -c 4)
    echo "Request $i: HTTP $status"
    
    # Check if we got rate limited
    if [[ "$status" == "429" ]]; then
        echo "✅ Rate limiting working - Got 429 on request $i"
        break
    fi
    
    sleep 0.2
done