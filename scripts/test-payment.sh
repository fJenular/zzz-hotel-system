#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "💳 Testing Payment Flow...\n"

# Step 1: Login and get token
echo "1️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}')

echo "$LOGIN_RESPONSE" | jq .
echo -e "\n"

# Step 2: Create booking (assume booking ID exists)
echo "2️⃣ Creating payment for booking..."
BOOKING_ID="your-booking-id-here"
PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/payments/create" \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\":\"$BOOKING_ID\"}")

echo "$PAYMENT_RESPONSE" | jq .
echo -e "\n"

# Step 3: Simulate webhook
echo "3️⃣ Simulating payment webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/payments/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ZZZ-'"$BOOKING_ID"'-123456",
    "transaction_status": "settlement",
    "fraud_status": "accept"
  }')

echo "$WEBHOOK_RESPONSE" | jq .
echo -e "\n"

echo "✅ Payment flow test completed!"