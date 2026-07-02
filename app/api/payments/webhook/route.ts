import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Use service role key for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    // Verify Midtrans signature (in production)
    // const serverKey = process.env.MIDTRANS_SERVER_KEY
    // const expectedSignature = crypto
    //   .createHash('sha512')
    //   .update(body + serverKey)
    //   .digest('hex')
    
    // if (signature !== expectedSignature) {
    //   console.error('Invalid webhook signature')
    //   return NextResponse.json(
    //     { error: 'Invalid signature' },
    //     { status: 401 }
    //   )
    // }

    const notification = JSON.parse(body)
    
    console.log('📥 Webhook received:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      fraud_status: notification.fraud_status
    })

    const orderId = notification.order_id
    const transactionStatus = notification.transaction_status
    const fraudStatus = notification.fraud_status
    const paymentType = notification.payment_type

    // Determine payment status
    let paymentStatus = 'pending'
    let paidAt = null

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        paymentStatus = 'paid'
        paidAt = new Date().toISOString()
      }
    } else if (transactionStatus === 'settlement') {
      paymentStatus = 'paid'
      paidAt = new Date().toISOString()
    } else if (transactionStatus === 'deny' || 
               transactionStatus === 'expire' || 
               transactionStatus === 'cancel') {
      paymentStatus = 'failed'
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('midtrans_order_id', orderId)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found for order:', orderId)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment record
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: paymentStatus,
        paid_at: paidAt
      })
      .eq('id', payment.id)

    if (updateError) throw updateError

    // Log payment update
    await supabaseAdmin
      .from('payment_logs')
      .insert({
        payment_id: payment.id,
        action: 'status_updated',
        details: {
          order_id: orderId,
          old_status: payment.status,
          new_status: paymentStatus,
          transaction_status: transactionStatus,
          fraud_status: fraudStatus
        }
      })

    // If paid, update booking status
    if (paymentStatus === 'paid') {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', payment.booking_id)

      console.log('✅ Booking confirmed:', payment.booking_id)
    }

    return NextResponse.json({ 
      success: true, 
      status: 'ok',
      payment_status: paymentStatus
    })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}