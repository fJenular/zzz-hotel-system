-- Migration: Add 'notes' column to restaurant_order_details
-- Run this SQL in Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/xjtxltveuhlkwqenxyes/sql/new

ALTER TABLE restaurant_order_details 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurant_order_details'
ORDER BY ordinal_position;
