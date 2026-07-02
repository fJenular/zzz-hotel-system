#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "🧪 Testing Complete API Routes...\n"

# Test 1: Health Check
echo "1️⃣ Health Check..."
curl -s "$BASE_URL/health" | jq .
echo -e "\n"

# Test 2: Get Available Rooms
echo "2️⃣ Get Available Rooms..."
curl -s "$BASE_URL/rooms" | jq .
echo -e "\n"

# Test 3: Get Room Detail
echo "3️⃣ Get Room Detail..."
ROOM_ID=$(curl -s "$BASE_URL/rooms" | jq -r '.data[0].id')
curl -s "$BASE_URL/rooms/$ROOM_ID" | jq .
echo -e "\n"

# Test 4: Check Room Availability
echo "4️⃣ Check Room Availability..."
CHECK_IN=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
CHECK_OUT=$(date -v+3d +%Y-%m-%d 2>/dev/null || date -d "+3 days" +%Y-%m-%d)
curl -s -X POST "$BASE_URL/rooms/check-availability" \
  -H "Content-Type: application/json" \
  -d "{\"checkIn\":\"$CHECK_IN\",\"checkOut\":\"$CHECK_OUT\"}" | jq .
echo -e "\n"

echo "✅ All API tests completed!"