-- Premium Subscriptions Migration
-- Run this in your Supabase SQL Editor

-- Create premium_subscriptions table
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'super')),
  amount INTEGER NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'failed')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_expires_at ON premium_subscriptions(expires_at);

-- Add premium columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_type TEXT CHECK (premium_type IN ('basic', 'super', NULL)),
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for premium_subscriptions

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON premium_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions (for creating orders)
CREATE POLICY "Users can create own subscriptions"
  ON premium_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending subscriptions (for payment verification)
CREATE POLICY "Users can update own pending subscriptions"
  ON premium_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON premium_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    auth.jwt() ->> 'email' = 'yasmanthvemala007@gmail.com'
  );

-- Create function to check and update expired subscriptions
CREATE OR REPLACE FUNCTION check_premium_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if premium has expired
  IF NEW.premium_expires_at IS NOT NULL AND NEW.premium_expires_at < NOW() THEN
    NEW.is_premium := FALSE;
    NEW.premium_type := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check premium expiry on profile access
DROP TRIGGER IF EXISTS check_premium_expiry_trigger ON profiles;
CREATE TRIGGER check_premium_expiry_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_premium_expiry();

-- Function to activate premium subscription
CREATE OR REPLACE FUNCTION activate_premium_subscription(
  p_subscription_id UUID,
  p_razorpay_payment_id TEXT,
  p_razorpay_signature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_plan_type TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get subscription details
  SELECT user_id, plan_type INTO v_user_id, v_plan_type
  FROM premium_subscriptions
  WHERE id = p_subscription_id AND status = 'pending';
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate expiry (50 days from now)
  v_expires_at := NOW() + INTERVAL '50 days';
  
  -- Update subscription
  UPDATE premium_subscriptions
  SET 
    razorpay_payment_id = p_razorpay_payment_id,
    razorpay_signature = p_razorpay_signature,
    status = 'active',
    starts_at = NOW(),
    expires_at = v_expires_at,
    updated_at = NOW()
  WHERE id = p_subscription_id;
  
  -- Update user profile
  UPDATE profiles
  SET 
    is_premium = TRUE,
    premium_type = v_plan_type,
    premium_expires_at = v_expires_at,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for premium_subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE premium_subscriptions;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION activate_premium_subscription TO authenticated;
