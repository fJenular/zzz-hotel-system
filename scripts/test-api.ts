import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ⬇️ GUNAKAN SERVICE ROLE KEY UNTUK BYPASS RLS SAAT TESTING
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

async function testAPIs() {
  console.log('🔌 Testing API Endpoints (Admin Mode - Bypass RLS)...\n')

  // Setup: Create test user and login
  const testEmail = `apitest_${Date.now()}@example.com`
  
  // Gunakan supabaseAdmin untuk semua operasi di bawah ini
  await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'Test123!',
    email_confirm: true // Langsung konfirmasi email
  })

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
  const user = users?.find(u => u.email === testEmail)

  await supabaseAdmin.from('users').insert({
    id: user?.id,
    email: testEmail,
    full_name: 'API Test User',
    role: 'guest'
  })

  // Test 1: Room Availability
  console.log('1️⃣ Testing Room Availability...')
  const { data: rooms, error: roomError } = await supabaseAdmin
    .from('rooms')
    .select(`
      *,
      room_types (*)
    `)
    .eq('status', 'available')
    .limit(5)

  if (roomError) {
    console.error('❌ Room availability failed:', roomError.message)
  } else {
    console.log(`✅ Found ${rooms?.length} available rooms`)
  }

  // Test 2: Create Booking
  console.log('\n2️⃣ Testing Booking Creation...')
  const checkIn = new Date()
  const checkOut = new Date()
  checkOut.setDate(checkOut.getDate() + 2)

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert({
      user_id: user?.id,
      room_id: rooms?.[0]?.id,
      check_in: checkIn.toISOString().split('T')[0],
      check_out: checkOut.toISOString().split('T')[0],
      total_price: 1000000,
      status: 'pending',
      guests_count: 2
    })
    .select()
    .single()

  if (bookingError) {
    console.error('❌ Booking creation failed:', bookingError.message)
  } else {
    console.log('✅ Booking created:', booking.id)
  }

  // Test 3: Create Payment
  console.log('\n3️⃣ Testing Payment Creation...')
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      booking_id: booking?.id,
      amount: 1000000,
      payment_method: 'qris',
      status: 'pending'
    })
    .select()
    .single()

  if (paymentError) {
    console.error('❌ Payment creation failed:', paymentError.message)
  } else {
    console.log('✅ Payment created:', payment.id)
  }

  // Test 4: Restaurant Order
  console.log('\n4️⃣ Testing Restaurant Order...')
  
  // Create sample menu first
  const { data: menu } = await supabaseAdmin
    .from('restaurant_menus')
    .insert({
      name: 'Test Menu',
      price: 50000,
      category: 'Main Course',
      is_available: true
    })
    .select()
    .single()

  const { data: order, error: orderError } = await supabaseAdmin
    .from('restaurant_orders')
    .insert({
      guest_id: user?.id,
      room_id: rooms?.[0]?.id,
      table_number: 'T1',
      total_price: 100000,
      status: 'pending'
    })
    .select()
    .single()

  if (orderError) {
    console.error('❌ Order creation failed:', orderError.message)
  } else {
    console.log('✅ Order created:', order.id)

    // Create order details
    const { error: detailError } = await supabaseAdmin
      .from('restaurant_order_details')
      .insert({
        order_id: order.id,
        menu_id: menu?.id,
        quantity: 2,
        price: 50000,
        subtotal: 100000
      })

    if (detailError) {
      console.error('❌ Order detail failed:', detailError.message)
    } else {
      console.log('✅ Order details created')
    }
  }

  // Test 5: Housekeeping Task
  console.log('\n5️⃣ Testing Housekeeping Task...')
  const { data: task, error: taskError } = await supabaseAdmin
    .from('housekeeping_tasks')
    .insert({
      room_id: rooms?.[0]?.id,
      task_type: 'cleaning',
      status: 'pending',
      priority: 'normal'
    })
    .select()
    .single()

  if (taskError) {
    console.error('❌ Task creation failed:', taskError.message)
  } else {
    console.log('✅ Task created:', task.id)
  }

  console.log('\n🎉 All API tests completed!')
}

testAPIs().catch(console.error)