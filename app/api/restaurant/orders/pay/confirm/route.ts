import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Verify order belongs to the user
    const { data: order, error: orderErr } = await supabase
      .from('restaurant_orders')
      .select('id')
      .eq('id', orderId)
      .eq('guest_id', user.id)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Directly update status to paid (useful for local development where webhooks can't reach)
    const { error: updateErr } = await supabase
      .from('restaurant_orders')
      .update({ payment_status: 'paid' })
      .eq('id', orderId)

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true, message: 'Payment status updated successfully' })
  } catch (error: any) {
    console.error('[restaurant/orders/pay/confirm] error:', error)
    return NextResponse.json(
      { success: false, error: error.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}
