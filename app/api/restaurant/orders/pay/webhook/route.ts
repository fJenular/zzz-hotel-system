import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Verify Midtrans signature
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body

    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    const expectedSig = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    if (signature_key !== expectedSig) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 403 })
    }

    // Determine payment status
    let paymentStatus: string
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      paymentStatus = fraud_status === 'accept' || !fraud_status ? 'paid' : 'failed'
    } else if (['cancel', 'deny', 'expire', 'failure'].includes(transaction_status)) {
      paymentStatus = 'failed'
    } else {
      paymentStatus = 'pending'
    }

    // Find the restaurant order by midtrans_order_id
    const { data: orders } = await supabase
      .from('restaurant_orders')
      .select('id')
      .eq('midtrans_order_id', order_id)
      .limit(1)

    if (orders && orders.length > 0) {
      await supabase
        .from('restaurant_orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orders[0].id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[restaurant/orders/pay/webhook] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
