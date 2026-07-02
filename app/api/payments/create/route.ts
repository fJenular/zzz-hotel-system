import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get booking with user and room details
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

    // Create mock payment token (for testing)
    const mockToken = `SNAP-${Date.now()}-${bookingId}`
    const mockRedirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${mockToken}`

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: booking.total_price,
        payment_method: 'qris',
        status: 'pending',
        midtrans_order_id: `ZZZ-${bookingId}-${Date.now()}`
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    return NextResponse.json({
      success: true,
      data: {
        token: mockToken,
        redirect_url: mockRedirectUrl,
        paymentId: payment.id,
        amount: payment.amount
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}