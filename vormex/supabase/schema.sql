-- Vormex Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  college_name TEXT,
  state TEXT,
  district TEXT,
  city TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  show_in_people_list BOOLEAN DEFAULT TRUE,
  allow_direct_messages BOOLEAN DEFAULT TRUE,
  show_location_publicly BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'moderator', 'user')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_highlighted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.roles 
    WHERE roles.user_id = is_admin.user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Colleges policies (read for all authenticated)
CREATE POLICY "Colleges are viewable by authenticated users"
  ON public.colleges FOR SELECT
  TO authenticated
  USING (true);

-- Profiles policies
CREATE POLICY "Users can view profiles respecting privacy settings"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_settings us 
      WHERE us.user_id = profiles.id AND us.show_in_people_list = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- User settings policies
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Roles policies
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

-- Groups policies
CREATE POLICY "Public groups viewable by all authenticated"
  ON public.groups FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Group admins can update groups"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete groups"
  ON public.groups FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Group members policies
CREATE POLICY "Group members viewable by group members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id AND g.visibility = 'public'
    ) OR
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public groups"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id AND g.visibility = 'public'
    )
  );

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Announcements policies
CREATE POLICY "Announcements viewable by appropriate users"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    group_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = announcements.group_id AND g.visibility = 'public'
    ) OR
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = announcements.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can create announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Reports policies
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Only admins can update reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Blocked users policies
CREATE POLICY "Users can view own blocks"
  ON public.blocked_users FOR SELECT
  TO authenticated
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock others"
  ON public.blocked_users FOR DELETE
  TO authenticated
  USING (blocker_id = auth.uid());

-- Insert sample colleges
INSERT INTO public.colleges (name, location) VALUES
  ('NIAT Bangalore', 'Karnataka'),
  ('NIAT Chennai', 'Tamil Nadu'),
  ('NIAT Hyderabad', 'Telangana'),
  ('NIAT Mumbai', 'Maharashtra'),
  ('NIAT Delhi', 'Delhi'),
  ('NIAT Kolkata', 'West Bengal'),
  ('NIAT Pune', 'Maharashtra'),
  ('NIAT Ahmedabad', 'Gujarat')
ON CONFLICT (name) DO NOTHING;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
