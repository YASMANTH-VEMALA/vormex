-- Add Admin Premium Type Migration
-- Run this in your Supabase SQL Editor

-- Update the check constraint on premium_subscriptions table to include 'admin'
ALTER TABLE premium_subscriptions 
DROP CONSTRAINT IF EXISTS premium_subscriptions_plan_type_check;

ALTER TABLE premium_subscriptions 
ADD CONSTRAINT premium_subscriptions_plan_type_check 
CHECK (plan_type IN ('basic', 'super', 'admin'));

-- Update the check constraint on profiles table to include 'admin'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_premium_type_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_premium_type_check 
CHECK (premium_type IN ('basic', 'super', 'admin', NULL));
