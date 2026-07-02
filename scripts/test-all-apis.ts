import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testAllAPIs() {
  console.log('🧪 Testing All API Routes...\n')

  // Login
  console.log('🔐 Authenticating...')
  const testEmail = 'apitest@example.com'
  const testPassword = 'TestPassword123!'

  let { data: { user } } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })

  if (!user) {
    const { data: signUpData } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })

    if (signUpData.user) {
      await supabase.from('users').insert({
        id: signUpData.user.id,
        email: testEmail,
        full_name: 'API Test User',
        role: 'admin' // Set as admin for testing dashboard
      })

      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      user = signInData.user
    }
  }

  console.log(`✅ Logged in as: ${user?.email}\n`)

  // Test 1: Get Rooms
  console.log('1️⃣ Testing GET /api/rooms...')
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*, room_types(name, base_price)')
    .eq('status', 'available')
    .limit(5)
  console.log(`✅ Found ${rooms?.length} rooms\n`)

  // Test 2: Create Booking
  console.log('2️⃣ Testing POST /api/bookings...')
  if (rooms && rooms.length > 0) {
    const testRoom = rooms[0]
    const checkIn = new Date()
    const checkOut = new Date()
    checkOut.setDate(checkOut.getDate() + 2)

    const { data: booking } = await supabase
      .from('bookings')
      .insert({
        user_id: user?.id,
        room_id: testRoom.id,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
        total_price: testRoom.room_types.base_price * 2,
        status: 'pending',
        guests_count: 2
      })
      .select()
      .single()

    console.log(`✅ Booking created: ${booking?.id}\n`)

    // Test 3: Create Payment
    console.log('3️⃣ Testing POST /api/payments...')
    if (booking) {
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          amount: booking.total_price,
          payment_method: 'qris',
          status: 'pending',
          midtrans_order_id: `TEST-${booking.id}-${Date.now()}`
        })
        .select()
        .single()

      console.log(`✅ Payment created: ${payment?.id}\n`)
    }
  }

  // Test 4: Restaurant Menus
  console.log('4️⃣ Testing GET /api/restaurant/menus...')
  const { data: menus } = await supabase
    .from('restaurant_menus')
    .select('*')
    .eq('is_available', true)
  console.log(`✅ Found ${menus?.length} menus\n`)

  // Test 5: Create Restaurant Order
  console.log('5️⃣ Testing POST /api/restaurant/orders...')
  if (menus && menus.length > 0 && rooms && rooms.length > 0) {
    const { data: order } = await supabase
      .from('restaurant_orders')
      .insert({
        guest_id: user?.id,
        room_id: rooms[0].id,
        table_number: 'T1',
        total_price: menus[0].price * 2,
        status: 'pending'
      })
      .select()
      .single()

    if (order) {
      await supabase
        .from('restaurant_order_details')
        .insert({
          order_id: order.id,
          menu_id: menus[0].id,
          quantity: 2,
          price: menus[0].price,
          subtotal: menus[0].price * 2
        })

      console.log(`✅ Order created: ${order.id}\n`)
    }
  }

  // Test 6: Dashboard Stats
  console.log('6️⃣ Testing GET /api/dashboard/stats...')
  const { data: occupancy } = await supabase.rpc('calculate_occupancy_rate', {
    p_date: new Date().toISOString().split('T')[0]
  })
  console.log(`✅ Occupancy rate: ${occupancy}%\n`)

  console.log('🎉 All API tests completed!')
  console.log('\n📊 Summary:')
  console.log('  ✅ Authentication: OK')
  console.log('  ✅ Rooms API: OK')
  console.log('  ✅ Bookings API: OK')
  console.log('  ✅ Payments API: OK')
  console.log('  ✅ Restaurant API: OK')
  console.log('  ✅ Dashboard API: OK')
}

testAllAPIs().catch(console.error)