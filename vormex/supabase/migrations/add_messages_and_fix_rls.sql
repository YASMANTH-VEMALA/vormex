-- ============================================
-- FIX RLS POLICIES AND ADD MESSAGES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop problematic policies first
DROP POLICY IF EXISTS "Users can view own role" ON public.roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.roles;
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
DROP POLICY IF EXISTS "Users can update own role or admins can update any" ON public.roles;

-- Create a simpler is_admin function that handles missing roles
-- Uses SECURITY DEFINER to bypass RLS when checking admin status
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This runs with elevated privileges, bypassing RLS
  SELECT role INTO user_role FROM public.roles WHERE user_id = check_user_id;
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate roles policies WITHOUT using is_admin() to avoid recursion
-- Simply allow all authenticated users to view all roles
CREATE POLICY "Anyone can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own role"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- For UPDATE, check directly in the policy without calling is_admin()
CREATE POLICY "Users can update own role or admins can update any"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  );

-- ============================================
-- MESSAGES TABLE FOR GROUP CHAT
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'file', 'system')) DEFAULT 'text',
  file_url TEXT,
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
DROP POLICY IF EXISTS "Group members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can edit own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

CREATE POLICY "Group members can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete own messages or admins"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() OR is_admin(auth.uid()));

-- ============================================
-- MESSAGE READ STATUS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.message_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_user ON public.message_reads(user_id);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view read status" ON public.message_reads;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_reads;

CREATE POLICY "Users can view read status"
  ON public.message_reads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can mark messages as read"
  ON public.message_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- TYPING INDICATORS TABLE (optional, for real-time typing)
-- ============================================

CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members can see typing" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can update typing" ON public.typing_indicators;

CREATE POLICY "Group members can see typing"
  ON public.typing_indicators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = typing_indicators.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update typing"
  ON public.typing_indicators FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- ENABLE REALTIME FOR MESSAGES
-- ============================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- ============================================
-- HELPER FUNCTION: Get unread count for user
-- ============================================

CREATE OR REPLACE FUNCTION public.get_unread_count(p_group_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM public.messages m
  WHERE m.group_id = p_group_id
    AND m.sender_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.message_reads mr 
      WHERE mr.message_id = m.id AND mr.user_id = p_user_id
    );
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
