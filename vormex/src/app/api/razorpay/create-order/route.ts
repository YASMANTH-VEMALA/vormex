import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  
  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials not configured')
  }
  
  return new Razorpay({ key_id, key_secret })
}

export async function POST(request: NextRequest) {
  try {
    const razorpay = getRazorpay()
    const { amount, plan_type, user_id } = await request.json()

    if (!amount || !plan_type || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Razorpay order
    // Receipt must be max 40 characters
    const shortUserId = user_id.slice(0, 8)
    const timestamp = Date.now().toString().slice(-8)
    const receipt = `prm_${shortUserId}_${timestamp}`
    
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt,
      notes: {
        user_id,
        plan_type,
      },
    })

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
