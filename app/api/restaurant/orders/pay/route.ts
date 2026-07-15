import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { snap } from '@/lib/midtrans'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 })
    }

    // Fetch the restaurant order
    const { data: order, error: orderErr } = await supabase
      .from('restaurant_orders')
      .select(`
        *,
        rooms (room_number),
        restaurant_order_details (
          quantity,
          price,
          subtotal,
          restaurant_menus (name)
        )
      `)
      .eq('id', orderId)
      .eq('guest_id', user.id)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Fetch user details for Midtrans
    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name, phone')
      .eq('id', user.id)
      .single()

    // Build unique Midtrans order ID
    const midtransOrderId = `REST-${orderId.substring(0, 8)}-${Date.now()}`

    // Build item details for Midtrans
    const itemDetails = order.restaurant_order_details?.map((detail: any) => ({
      id: detail.restaurant_menus?.name?.substring(0, 50) ?? 'MENU',
      price: Math.round(detail.price),
      quantity: detail.quantity,
      name: detail.restaurant_menus?.name ?? 'Menu Item',
    })) ?? []

    // Midtrans Snap parameter
    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(order.total_price),
      },
      customer_details: {
        email: userData?.email ?? user.email ?? '',
        first_name: userData?.full_name ?? 'Guest',
        phone: userData?.phone ?? '',
      },
      item_details: itemDetails,
      enabled_payments: [
        'credit_card', 'gopay', 'shopeepay', 'dana',
        'bca_va', 'bni_va', 'bri_va', 'permata_va', 'other_va',
        'qris',
      ],
      credit_card: { secure: true },
      expiry: {
        start_time: new Date()
          .toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' })
          .replace('T', ' ') + ' +0700',
        unit: 'hours',
        duration: 2,
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/order?payment=success`,
      },
    }

    const transaction = await snap.createTransaction(parameter)

    // Save Midtrans token to restaurant_orders (if columns exist)
    const { error: updateErr } = await supabase
      .from('restaurant_orders')
      .update({
        midtrans_order_id: midtransOrderId,
        midtrans_token: transaction.token,
        payment_status: 'pending',
      })
      .eq('id', orderId)

    if (updateErr) {
      console.warn('Could not update restaurant_orders with midtrans details (database columns might be missing):', updateErr.message)
    }

    return NextResponse.json({
      success: true,
      data: {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        orderId: midtransOrderId,
        amount: order.total_price,
      },
    })
  } catch (error: any) {
    console.error('[restaurant/orders/pay] error:', error)
    return NextResponse.json(
      { success: false, error: error.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}
