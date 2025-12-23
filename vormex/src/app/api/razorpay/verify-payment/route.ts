import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured')
  }
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  }
  
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      subscription_id 
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !subscription_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify signature
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET
    if (!razorpaySecret) {
      console.error('RAZORPAY_KEY_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error: RAZORPAY_KEY_SECRET missing' },
        { status: 500 }
      )
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch:', { expected: expectedSignature, received: razorpay_signature })
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('premium_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('status', 'pending')
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or already processed' },
        { status: 400 }
      )
    }

    // Calculate expiry (50 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 50)

    // Update subscription status
    const { error: updateSubError } = await supabaseAdmin
      .from('premium_subscriptions')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'active',
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription_id)

    if (updateSubError) {
      console.error('Error updating subscription:', updateSubError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    // Update user profile with premium status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_premium: true,
        premium_type: subscription.plan_type,
        premium_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and premium activated',
      expires_at: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Payment verification failed'
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    )
  }
}
