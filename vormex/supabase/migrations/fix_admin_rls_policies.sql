-- Fix RLS policies for admin functionality
-- Run this in Supabase SQL Editor

-- First, drop existing roles policies and recreate with INSERT permission
DROP POLICY IF EXISTS "Users can view own role" ON public.roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.roles;

-- Recreate roles policies with INSERT permission
CREATE POLICY "Users can view own role"
  ON public.roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can insert own role"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Only admins can update roles"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()) OR user_id = auth.uid());

-- Also ensure the image_url column exists
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Make sure RLS is enabled on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Manually insert admin role for your email (replace USER_ID with your actual user ID)
-- You can find your user ID in Authentication > Users in Supabase dashboard
-- INSERT INTO public.roles (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
