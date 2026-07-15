-- Migration: Add Midtrans payment columns to restaurant_orders
-- Run in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/xjtxltveuhlkwqenxyes/sql/new

ALTER TABLE restaurant_orders
  ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT,
  ADD COLUMN IF NOT EXISTS midtrans_token     TEXT,
  ADD COLUMN IF NOT EXISTS payment_status     TEXT NOT NULL DEFAULT 'unpaid';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'restaurant_orders'
ORDER BY ordinal_position;
