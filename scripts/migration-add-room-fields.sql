-- Migration: Add additional fields to room_types table
-- This adds facilities, max_adults, max_children, bed_configuration, area_sqm, view_type columns

ALTER TABLE room_types ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS max_adults INTEGER DEFAULT 2;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS max_children INTEGER DEFAULT 1;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS bed_configuration TEXT DEFAULT '';
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS area_sqm INTEGER DEFAULT 0;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS view_type TEXT DEFAULT '';
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS room_size TEXT DEFAULT '';
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Add description column to rooms table for room-specific descriptions
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
