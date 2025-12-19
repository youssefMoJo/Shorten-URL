#!/bin/bash

API_URL="https://kb5qj23lyl.execute-api.ca-central-1.amazonaws.com/dev"
TEST_EMAIL="testuser$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

echo "========================================="
echo "Testing Authentication Endpoints"
echo "========================================="
echo ""
echo "API URL: $API_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

echo "1. Testing Signup Endpoint..."
echo "POST $API_URL/auth/signup"
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Response:"
echo "$SIGNUP_RESPONSE" | jq '.'
echo ""

# Extract tokens from signup response
ID_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.tokens.idToken // empty')
ACCESS_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.tokens.accessToken // empty')

if [ -n "$ID_TOKEN" ]; then
  echo "✓ Signup successful! Tokens received."
else
  echo "✗ Signup failed or no tokens returned."
fi
echo ""

echo "2. Testing Login Endpoint..."
echo "POST $API_URL/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Response:"
echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# Extract tokens from login response
LOGIN_ID_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.idToken // empty')
LOGIN_ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken // empty')

if [ -n "$LOGIN_ID_TOKEN" ]; then
  echo "✓ Login successful! Tokens received."
else
  echo "✗ Login failed or no tokens returned."
fi
echo ""

echo "3. Testing Authenticated Endpoint (GET /me/links)..."
echo "GET $API_URL/me/links"
if [ -n "$ID_TOKEN" ]; then
  ME_LINKS_RESPONSE=$(curl -s -X GET "$API_URL/me/links" \
    -H "Authorization: Bearer $ID_TOKEN")

  echo "Response:"
  echo "$ME_LINKS_RESPONSE" | jq '.'
  echo ""

  if echo "$ME_LINKS_RESPONSE" | jq -e '.links' > /dev/null 2>&1; then
    echo "✓ Authenticated request successful!"
  else
    echo "✗ Authenticated request failed."
  fi
else
  echo "Skipping - no auth token available"
fi
echo ""

echo "4. Testing URL Shortening with Authentication..."
echo "POST $API_URL/shorten"
if [ -n "$ID_TOKEN" ]; then
  SHORTEN_RESPONSE=$(curl -s -X POST "$API_URL/shorten" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -d '{"long_link":"https://example.com"}')

  echo "Response:"
  echo "$SHORTEN_RESPONSE" | jq '.'
  echo ""

  SHORT_CODE=$(echo "$SHORTEN_RESPONSE" | jq -r '.short_code // empty')
  if [ -n "$SHORT_CODE" ]; then
    echo "✓ URL shortened successfully: $SHORT_CODE"
  else
    echo "✗ URL shortening failed."
  fi
else
  echo "Skipping - no auth token available"
fi
echo ""

echo "========================================="
echo "Authentication Testing Complete"
echo "========================================="
