import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testWebhook() {
  console.log('💳 Testing Payment Webhook...\n')

  // First, create a test booking and payment
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get test user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('❌ No user logged in')
    return
  }

  // Get available room
  const { data: room } = await supabase
    .from('rooms')
    .select('id')
    .eq('status', 'available')
    .limit(1)
    .single()

  if (!room) {
    console.error('❌ No available rooms')
    return
  }

  // Create booking
  const { data: booking } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      room_id: room.id,
      check_in: new Date().toISOString().split('T')[0],
      check_out: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total_price: 1000000,
      status: 'pending',
      guests_count: 2
    })
    .select()
    .single()

  if (!booking) {
    console.error('❌ Failed to create booking')
    return
  }

  console.log(`✅ Booking created: ${booking.id}`)

  // Create payment
  const orderId = `ZZZ-${booking.id}-${Date.now()}`
  const { data: payment } = await supabase
    .from('payments')
    .insert({
      booking_id: booking.id,
      amount: 1000000,
      payment_method: 'qris',
      status: 'pending',
      midtrans_order_id: orderId
    })
    .select()
    .single()

  console.log(`✅ Payment created: ${payment.id}`)
  console.log(`Order ID: ${orderId}`)
  console.log('')

  // Simulate webhook notification
  console.log('📤 Sending webhook notification...')
  
  const webhookData = {
    order_id: orderId,
    transaction_status: 'settlement',
    fraud_status: 'accept',
    payment_type: 'qris',
    gross_amount: '1000000.00'
  }

  try {
    const response = await axios.post(
      'http://localhost:3000/api/payments/webhook',
      webhookData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('✅ Webhook response:', response.data)
  } catch (error: any) {
    console.error('❌ Webhook failed:', error.message)
    if (error.response) {
      console.error('Response:', error.response.data)
    }
  }

  // Verify payment status updated
  console.log('\n🔍 Verifying payment status...')
  const { data: updatedPayment } = await supabase
    .from('payments')
    .select('status, paid_at')
    .eq('id', payment.id)
    .single()

  console.log(`Payment status: ${updatedPayment?.status}`)
  console.log(`Paid at: ${updatedPayment?.paid_at || 'Not paid'}`)

  // Verify booking status updated
  const { data: updatedBooking } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', booking.id)
    .single()

  console.log(`Booking status: ${updatedBooking?.status}`)

  console.log('\n🎉 Webhook test completed!')
}

testWebhook().catch(error => {
  console.error('\n💥 Test failed:', error)
  console.error('Stack trace:', error.stack)
})