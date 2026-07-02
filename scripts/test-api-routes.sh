#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "🧪 Testing Next.js API Routes...\n"

# Start dev server in background
echo "🚀 Starting Next.js dev server..."
npm run dev > /dev/null 2>&1 &
DEV_PID=$!
sleep 5

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
curl -s "$BASE_URL/health" | jq .
echo -e "\n"

# Test 2: Get Available Rooms
echo "2️⃣ Testing Get Available Rooms..."
curl -s "$BASE_URL/rooms" | jq .
echo -e "\n"

# Test 3: Get Rooms with Date Filter
echo "3️⃣ Testing Get Rooms with Date Filter..."
CHECK_IN=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
CHECK_OUT=$(date -v+3d +%Y-%m-%d 2>/dev/null || date -d "+3 days" +%Y-%m-%d)
curl -s "$BASE_URL/rooms?checkIn=$CHECK_IN&checkOut=$CHECK_OUT" | jq .
echo -e "\n"

# Stop dev server
echo "🛑 Stopping dev server..."
kill $DEV_PID 2>/dev/null

echo "✅ All API route tests completed!"