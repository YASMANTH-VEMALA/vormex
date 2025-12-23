-- ============================================
-- GROUP UNREAD MESSAGES TRACKING
-- Add last_read_at column to track read status
-- Run this in Supabase SQL Editor
-- ============================================

-- Add last_read_at column to group_members
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_group_members_last_read 
ON public.group_members(group_id, user_id, last_read_at);

-- Function to mark messages as read when user opens a group chat
CREATE OR REPLACE FUNCTION public.mark_group_messages_read(p_group_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.group_members
  SET last_read_at = NOW()
  WHERE group_id = p_group_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_group_messages_read(UUID, UUID) TO authenticated;

-- Update existing group members to have current timestamp as last_read_at
UPDATE public.group_members 
SET last_read_at = NOW() 
WHERE last_read_at IS NULL;
