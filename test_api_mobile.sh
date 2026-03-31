#!/bin/bash

# 🧪 Script de Test API - Jam Connexion Mobile
# Ce script teste tous les endpoints critiques pour l'Agent Mobile

echo "========================================"
echo "🧪 TEST API JAM CONNEXION - MOBILE"
echo "========================================"
echo ""

API_URL="https://jamconnexion.com/api"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASSED=0
FAILED=0

# Fonction de test
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $description... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    if [ "$response" == "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $response)"
        ((FAILED++))
    fi
}

echo "📋 PHASE 1: Endpoints Publics (Sans Auth)"
echo "----------------------------------------"

# Test 1: Config endpoint (NOUVEAU - critique pour mobile)
test_endpoint "GET" "/config" "GET /api/config" "" "200"

# Test 2: Stats (landing page)
test_endpoint "GET" "/stats/counts" "GET /api/stats/counts" "" "200"

# Test 3: Venues list
test_endpoint "GET" "/venues" "GET /api/venues" "" "200"

# Test 4: Planning search
test_endpoint "GET" "/planning/search?is_open=true" "GET /api/planning/search" "" "200"

echo ""
echo "📋 PHASE 2: Authentification"
echo "----------------------------------------"

# Test 5: Login (récupérer token pour tests suivants)
echo -n "Testing: POST /api/auth/login... "
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@gmail.com","password":"test"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ PASS${NC} (Token récupéré)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (Login échoué)"
    ((FAILED++))
    TOKEN=""
fi

echo ""
echo "📋 PHASE 3: Endpoints Authentifiés (Avec Token)"
echo "----------------------------------------"

if [ -n "$TOKEN" ]; then
    # Test 6: GET /musicians/me
    echo -n "Testing: GET /api/musicians/me... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/musicians/me" \
        -H "Authorization: Bearer $TOKEN")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected 200, got $response)"
        ((FAILED++))
    fi
    
    # Test 7: PUT /musicians/me
    echo -n "Testing: PUT /api/musicians/me... "
    response=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API_URL/musicians/me" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"first_name":"Test","last_name":"User"}')
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected 200, got $response)"
        ((FAILED++))
    fi
    
    # Test 8: GET /venues/me (peut échouer si compte n'est pas venue, OK)
    echo -n "Testing: GET /api/venues/me... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/venues/me" \
        -H "Authorization: Bearer $TOKEN")
    
    if [ "$response" == "200" ] || [ "$response" == "404" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response - OK si 404 car test@gmail.com est musicien)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected 200 or 404, got $response)"
        ((FAILED++))
    fi
    
    # Test 9: GET /melomanes/me (peut échouer si compte n'est pas melomane, OK)
    echo -n "Testing: GET /api/melomanes/me... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/melomanes/me" \
        -H "Authorization: Bearer $TOKEN")
    
    if [ "$response" == "200" ] || [ "$response" == "404" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response - OK si 404 car test@gmail.com est musicien)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected 200 or 404, got $response)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  Skipping authenticated tests (no token)${NC}"
fi

echo ""
echo "========================================"
echo "📊 RÉSULTATS DES TESTS"
echo "========================================"
echo ""
echo -e "Tests réussis  : ${GREEN}$PASSED${NC}"
echo -e "Tests échoués  : ${RED}$FAILED${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS ONT RÉUSSI !${NC}"
    echo "L'API est prête pour l'intégration mobile."
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  LA PLUPART DES TESTS ONT RÉUSSI ($SUCCESS_RATE%)${NC}"
    echo "L'API est utilisable mais certains endpoints ont des problèmes."
    exit 1
else
    echo -e "${RED}❌ PLUSIEURS TESTS ONT ÉCHOUÉ ($SUCCESS_RATE%)${NC}"
    echo "L'API nécessite des corrections avant l'intégration mobile."
    exit 2
fi
