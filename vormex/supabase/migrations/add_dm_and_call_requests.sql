-- ============================================
-- DIRECT MESSAGES ENHANCEMENT & CALL REQUESTS
-- Run this in Supabase SQL Editor
-- ============================================

-- Add message_type to direct_messages table
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'direct_message' 
CHECK (message_type IN ('admin_message', 'direct_message'));

-- Add conversation_id for grouping messages between two users
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- Create function to generate consistent conversation_id
CREATE OR REPLACE FUNCTION generate_conversation_id(user1 UUID, user2 UUID)
RETURNS TEXT AS $$
BEGIN
  IF user1 < user2 THEN
    RETURN user1::TEXT || '_' || user2::TEXT;
  ELSE
    RETURN user2::TEXT || '_' || user1::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update existing messages with conversation_id
UPDATE public.direct_messages
SET conversation_id = generate_conversation_id(sender_id, receiver_id)
WHERE conversation_id IS NULL;

-- Create index for conversation_id
CREATE INDEX IF NOT EXISTS idx_dm_conversation_id ON public.direct_messages(conversation_id);

-- ============================================
-- CALL REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.call_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  requester_name TEXT,
  requester_avatar TEXT,
  admin_response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_requests_requester ON public.call_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_call_requests_admin ON public.call_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_call_requests_status ON public.call_requests(status);

-- Enable RLS
ALTER TABLE public.call_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own call requests
CREATE POLICY "Users can view own call requests"
  ON public.call_requests FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid() OR admin_id = auth.uid());

-- Users can create call requests (only Super Supporters)
CREATE POLICY "Users can create call requests"
  ON public.call_requests FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

-- Admin can update call request status
CREATE POLICY "Admin can update call requests"
  ON public.call_requests FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid());

-- Enable realtime for call_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_requests;

-- ============================================
-- UPDATED CONVERSATIONS VIEW
-- ============================================

DROP VIEW IF EXISTS public.dm_conversations;

CREATE OR REPLACE VIEW public.dm_conversations AS
SELECT DISTINCT ON (conversation_id)
  id,
  sender_id,
  receiver_id,
  content,
  is_read,
  created_at,
  message_type,
  conversation_id,
  CASE 
    WHEN sender_id < receiver_id THEN sender_id 
    ELSE receiver_id 
  END as user_a,
  CASE 
    WHEN sender_id < receiver_id THEN receiver_id 
    ELSE sender_id 
  END as user_b
FROM public.direct_messages
ORDER BY conversation_id, created_at DESC;

-- ============================================
-- TRIGGER TO AUTO-SET CONVERSATION_ID
-- ============================================

CREATE OR REPLACE FUNCTION set_conversation_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.conversation_id := generate_conversation_id(NEW.sender_id, NEW.receiver_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_conversation_id ON public.direct_messages;

CREATE TRIGGER trigger_set_conversation_id
  BEFORE INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_conversation_id();
