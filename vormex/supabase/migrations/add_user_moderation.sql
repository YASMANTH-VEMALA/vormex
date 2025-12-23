-- ============================================
-- USER MODERATION SYSTEM
-- Delete, Suspend, and Ban Features
-- Run this in Supabase SQL Editor
-- ============================================

-- Add moderation columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);
CREATE INDEX IF NOT EXISTS idx_profiles_suspension_end ON public.profiles(suspension_end_date);

-- Create function to auto-restore suspended users
CREATE OR REPLACE FUNCTION auto_restore_suspended_users()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_suspended = false,
    suspension_end_date = NULL,
    suspension_reason = NULL,
    updated_at = NOW()
  WHERE 
    is_suspended = true 
    AND suspension_end_date IS NOT NULL 
    AND suspension_end_date <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run auto-restore (if pg_cron is available)
-- Note: This requires pg_cron extension. If not available, check in app code instead.
-- SELECT cron.schedule('auto-restore-suspended', '*/5 * * * *', 'SELECT auto_restore_suspended_users()');

-- ============================================
-- APPEAL MESSAGES TABLE
-- For suspended/banned users to send ONE appeal
-- ============================================

CREATE TABLE IF NOT EXISTS public.moderation_appeals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appeal_type TEXT NOT NULL CHECK (appeal_type IN ('suspension', 'ban')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'denied')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appeals_user ON public.moderation_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.moderation_appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_type ON public.moderation_appeals(appeal_type);

-- Enable RLS
ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;

-- Users can view their own appeals
CREATE POLICY "Users can view own appeals"
  ON public.moderation_appeals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create ONE appeal (check handled in app code)
CREATE POLICY "Users can create appeals"
  ON public.moderation_appeals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin can view all appeals
CREATE POLICY "Admin can view all appeals"
  ON public.moderation_appeals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update appeals
CREATE POLICY "Admin can update appeals"
  ON public.moderation_appeals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.moderation_appeals;

-- ============================================
-- MODERATION LOG TABLE
-- Track all moderation actions
-- ============================================

CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('delete', 'suspend', 'unsuspend', 'ban', 'unban')),
  reason TEXT,
  duration_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mod_logs_admin ON public.moderation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_target ON public.moderation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_action ON public.moderation_logs(action);

-- Enable RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and create logs
CREATE POLICY "Admin can manage mod logs"
  ON public.moderation_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
