-- ============================================
-- DIRECT MESSAGES (User-Admin Chat)
-- Run this in Supabase SQL Editor
-- ============================================

-- Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_dm_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created_at ON public.direct_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
  ON public.direct_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON public.direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Users can update messages they received (for marking as read)
CREATE POLICY "Users can update received messages"
  ON public.direct_messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- ============================================
-- CONVERSATIONS VIEW (for admin inbox)
-- ============================================

-- Create a view to get latest message per conversation
CREATE OR REPLACE VIEW public.dm_conversations AS
SELECT DISTINCT ON (
  CASE 
    WHEN sender_id < receiver_id THEN sender_id 
    ELSE receiver_id 
  END,
  CASE 
    WHEN sender_id < receiver_id THEN receiver_id 
    ELSE sender_id 
  END
)
  id,
  sender_id,
  receiver_id,
  content,
  is_read,
  created_at,
  CASE 
    WHEN sender_id < receiver_id THEN sender_id 
    ELSE receiver_id 
  END as user_a,
  CASE 
    WHEN sender_id < receiver_id THEN receiver_id 
    ELSE sender_id 
  END as user_b
FROM public.direct_messages
ORDER BY 
  CASE 
    WHEN sender_id < receiver_id THEN sender_id 
    ELSE receiver_id 
  END,
  CASE 
    WHEN sender_id < receiver_id THEN receiver_id 
    ELSE sender_id 
  END,
  created_at DESC;
