-- ============================================
-- ENHANCED CHAT FEATURES
-- Run this in Supabase SQL Editor
-- ============================================

-- Message Reactions Table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Reactions policies
CREATE POLICY "Group members can view reactions"
  ON public.message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.group_members gm ON gm.group_id = m.group_id
      WHERE m.id = message_reactions.message_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.group_members gm ON gm.group_id = m.group_id
      WHERE m.id = message_reactions.message_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove own reactions"
  ON public.message_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add reply_to column if not exists (for reply feature)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add deleted_for_user column for "delete for me" feature
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS deleted_for JSONB DEFAULT '[]'::jsonb;

-- Add image_url column for image messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add mentioned_users column for @mentions
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS mentioned_users JSONB DEFAULT '[]'::jsonb;

-- Add is_pinned column
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Pinned Messages Table
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id)
);

ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view pinned messages"
  ON public.pinned_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = pinned_messages.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can pin messages"
  ON public.pinned_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = pinned_messages.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
    )
    OR EXISTS (SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  );

CREATE POLICY "Group admins can unpin messages"
  ON public.pinned_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = pinned_messages.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
    )
    OR EXISTS (SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  );

-- Message Reports Table (for reporting messages)
CREATE TABLE IF NOT EXISTS public.message_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report messages"
  ON public.message_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
  ON public.message_reports FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  );

CREATE POLICY "Admins can update reports"
  ON public.message_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  );

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_messages;

-- Create storage bucket for chat attachments if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
