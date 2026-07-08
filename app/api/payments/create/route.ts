import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { snap } from '@/lib/midtrans'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId } = body

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        users (email, full_name, phone),
        rooms (room_number, room_types (name))
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Generate unique order ID
    const orderId = `ZZZ-${bookingId.substring(0, 8)}-${Date.now()}`

    // Create Midtrans Snap transaction
    let parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: parseInt(booking.total_price.toString())
      },
      customer_details: {
        email: booking.users.email,
        first_name: booking.users.full_name,
        phone: booking.users.phone || ''
      },
      enabled_payments: [
        'credit_card',
        'mandiri_clickpay',
        'cimb_clicks',
        'danamon_online',
        'bca_klikbca',
        'bca_klikpay',
        'bri_epay',
        'echannel',
        'permata_va',
        'bca_va',
        'bni_va',
        'other_va',
        'gopay',
        'shopeepay'
      ],
      credit_card: {
        secure: true
      },
      expiry: {
        // Midtrans requires format: yyyy-MM-dd hh:mm:ss Z
        start_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace('T', ' ') + ' +0700',
        unit: 'hours',
        duration: 24
      }
    }

    const transaction = await snap.createTransaction(parameter)

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: booking.total_price,
        payment_method: 'midtrans',
        status: 'pending',
        midtrans_order_id: orderId,
        midtrans_token: transaction.token,
        midtrans_redirect_url: transaction.redirect_url
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: orderId,
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        amount: booking.total_price
      }
    })
  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}