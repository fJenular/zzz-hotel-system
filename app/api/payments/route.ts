import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const paymentSchema = z.object({
  bookingId: z.string().uuid(),
  paymentMethod: z.enum(['qris', 'bank_transfer', 'credit_card', 'e_wallet']),
  bankName: z.string().optional() // For VA
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        users (email, full_name, phone),
        rooms (room_number, room_types (name))
      `)
      .eq('id', validatedData.bookingId)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if booking already paid
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('booking_id', validatedData.bookingId)
      .eq('status', 'paid')
      .single()

    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Booking already paid' },
        { status: 400 }
      )
    }

    // Generate unique order ID
    const orderId = `ZZZ-${booking.id.substring(0, 8)}-${Date.now()}`

    // For development/testing, create mock payment
    // In production, integrate with Midtrans Snap API
    const mockPaymentData = {
      token: `MOCK-${orderId}`,
      redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${orderId}`,
      payment_type: validatedData.paymentMethod
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: validatedData.bookingId,
        amount: booking.total_price,
        payment_method: validatedData.paymentMethod,
        status: 'pending',
        midtrans_order_id: orderId,
        payment_proof_url: null
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Log payment creation
    await supabase
      .from('payment_logs')
      .insert({
        payment_id: payment.id,
        action: 'created',
        details: {
          order_id: orderId,
          amount: booking.total_price,
          method: validatedData.paymentMethod
        }
      })

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: orderId,
        amount: booking.total_price,
        token: mockPaymentData.token,
        redirect_url: mockPaymentData.redirect_url,
        payment_type: mockPaymentData.payment_type,
        booking: {
          id: booking.id,
          check_in: booking.check_in,
          check_out: booking.check_out,
          room_number: booking.rooms.room_number,
          room_type: booking.rooms.room_types.name
        }
      }
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    let query = supabase
      .from('payments')
      .select(`
        *,
        bookings (
          check_in,
          check_out,
          total_price,
          rooms (
            room_number,
            room_types (name)
          )
        )
      `)

    if (bookingId) {
      query = query.eq('booking_id', bookingId)
    } else {
      // Get all payments for user's bookings
      const { data: userBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)

      const bookingIds = userBookings?.map(b => b.id) || []
      query = query.in('booking_id', bookingIds)
    }

    const { data: payments, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: payments,
      count: payments?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}