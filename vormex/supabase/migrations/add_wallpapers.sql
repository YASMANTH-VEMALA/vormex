-- ============================================
-- WALLPAPERS FEATURE
-- Run this in Supabase SQL Editor
-- ============================================

-- Wallpapers table (admin uploads)
CREATE TABLE IF NOT EXISTS public.wallpapers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT, -- Optional smaller preview
  is_default BOOLEAN DEFAULT FALSE, -- Pre-loaded wallpapers
  is_active BOOLEAN DEFAULT TRUE, -- Admin can disable without deleting
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add chat_wallpaper_id to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS chat_wallpaper_id UUID REFERENCES public.wallpapers(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.wallpapers ENABLE ROW LEVEL SECURITY;

-- Wallpapers policies
-- Everyone can view active wallpapers
CREATE POLICY "Anyone can view active wallpapers"
  ON public.wallpapers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can manage wallpapers
CREATE POLICY "Admins can manage wallpapers"
  ON public.wallpapers FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  );

-- Insert some default wallpapers (gradients as data URLs or you can upload actual images)
-- These are placeholder names - admin will upload actual images
INSERT INTO public.wallpapers (name, image_url, is_default, is_active) VALUES
  ('Dark Pattern', 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80', true, true),
  ('Night Sky', 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&q=80', true, true),
  ('Abstract Dark', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80', true, true)
ON CONFLICT DO NOTHING;
