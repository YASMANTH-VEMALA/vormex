-- Add image_url column to announcements table
-- Run this in Supabase SQL Editor if your table already exists

ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS image_url TEXT;
