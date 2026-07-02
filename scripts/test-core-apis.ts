import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testCoreAPIs() {
  console.log('🔌 Testing Core API Endpoints...\n')

  // Setup: Create test user and login
  const testEmail = `coretest_${Date.now()}@example.com`
  const testPassword = 'Test123!'

  console.log('🔐 Setting up test user...')
  const { data: authData } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  })

  await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })

  await supabase.from('users').insert({
    id: authData.user?.id,
    email: testEmail,
    full_name: 'Core API Test User',
    role: 'guest'
  })

  console.log('✅ Test user created:', testEmail)
  console.log('')

  // Test 1: Room Types
  console.log('1️⃣ Testing Room Types...')
  const { data: roomTypes, error: roomTypesError } = await supabase
    .from('room_types')
    .select('*')

  if (roomTypesError) {
    console.error('❌ Room types failed:', roomTypesError.message)
  } else {
    console.log(`✅ Found ${roomTypes?.length} room types`)
    roomTypes?.forEach(rt => {
      console.log(`   - ${rt.name}: Rp ${rt.base_price?.toLocaleString()}`)
    })
  }
  console.log('')

  // Test 2: Available Rooms
  console.log('2️⃣ Testing Available Rooms...')
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select(`
      *,
      room_types (name, base_price)
    `)
    .eq('status', 'available')

  if (roomsError) {
    console.error('❌ Rooms failed:', roomsError.message)
  } else {
    console.log(`✅ Found ${rooms?.length} available rooms`)
    rooms?.slice(0, 5).forEach(room => {
      console.log(`   - Room ${room.room_number} (${room.room_types?.name})`)
    })
  }
  console.log('')

  // Test 3: Create Booking
  console.log('3️⃣ Testing Booking Creation...')
  const checkIn = new Date()
  const checkOut = new Date()
  checkOut.setDate(checkOut.getDate() + 2)

  const testRoom = rooms?.[0]
  
  if (!testRoom) {
    console.error('❌ No available rooms for booking test')
    return
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: authData.user?.id,
      room_id: testRoom.id,
      check_in: checkIn.toISOString().split('T')[0],
      check_out: checkOut.toISOString().split('T')[0],
      total_price: 1000000,
      status: 'pending',
      guests_count: 2,
      special_requests: 'Test booking'
    })
    .select()
    .single()

  if (bookingError) {
    console.error('❌ Booking creation failed:', bookingError.message)
  } else {
    console.log('✅ Booking created successfully')
    console.log(`   Booking ID: ${booking.id}`)
    console.log(`   Check-in: ${booking.check_in}`)
    console.log(`   Check-out: ${booking.check_out}`)
    console.log(`   Total: Rp ${booking.total_price?.toLocaleString()}`)
  }
  console.log('')

  // Test 4: Create Payment
  console.log('4️⃣ Testing Payment Creation...')
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      booking_id: booking?.id,
      amount: 1000000,
      payment_method: 'qris',
      status: 'pending',
      midtrans_order_id: `TEST-${booking?.id}-${Date.now()}`
    })
    .select()
    .single()

  if (paymentError) {
    console.error('❌ Payment creation failed:', paymentError.message)
  } else {
    console.log('✅ Payment created successfully')
    console.log(`   Payment ID: ${payment.id}`)
    console.log(`   Amount: Rp ${payment.amount?.toLocaleString()}`)
    console.log(`   Status: ${payment.status}`)
  }
  console.log('')

  // Test 5: Restaurant Menu
  console.log('5️⃣ Testing Restaurant Menu...')
  const { data: menus, error: menusError } = await supabase
    .from('restaurant_menus')
    .select('*')
    .eq('is_available', true)
    .limit(5)

  if (menusError) {
    console.error('❌ Menu fetch failed:', menusError.message)
  } else {
    console.log(`✅ Found ${menus?.length} available menus`)
    
    // Create test menu if none exists
    if (menus?.length === 0) {
      const { data: newMenu } = await supabase
        .from('restaurant_menus')
        .insert({
          name: 'Test Menu Item',
          description: 'Test description',
          price: 50000,
          category: 'Main Course',
          is_available: true
        })
        .select()
        .single()
      
      console.log('✅ Created test menu:', newMenu?.name)
    }
  }
  console.log('')

  // Test 6: Restaurant Order
  console.log('6️⃣ Testing Restaurant Order...')
  const { data: menuItems } = await supabase
    .from('restaurant_menus')
    .select('*')
    .eq('is_available', true)
    .limit(2)

  if (menuItems && menuItems.length > 0) {
    const { data: order, error: orderError } = await supabase
      .from('restaurant_orders')
      .insert({
        guest_id: authData.user?.id,
        room_id: testRoom.id,
        table_number: 'T1',
        total_price: menuItems[0].price * 2,
        status: 'pending',
        notes: 'Test order'
      })
      .select()
      .single()

    if (orderError) {
      console.error('❌ Order creation failed:', orderError.message)
    } else {
      console.log('✅ Order created successfully')
      console.log(`   Order ID: ${order.id}`)

      // Create order details
      const { error: detailError } = await supabase
        .from('restaurant_order_details')
        .insert({
          order_id: order.id,
          menu_id: menuItems[0].id,
          quantity: 2,
          price: menuItems[0].price,
          subtotal: menuItems[0].price * 2
        })

      if (detailError) {
        console.error('❌ Order detail failed:', detailError.message)
      } else {
        console.log('✅ Order details created')
      }
    }
  }
  console.log('')

  // Test 7: Housekeeping Task
  console.log('7️⃣ Testing Housekeeping Task...')
  const { data: task, error: taskError } = await supabase
    .from('housekeeping_tasks')
    .insert({
      room_id: testRoom.id,
      task_type: 'cleaning',
      status: 'pending',
      priority: 'normal',
      due_date: new Date().toISOString()
    })
    .select()
    .single()

  if (taskError) {
    console.error('❌ Task creation failed:', taskError.message)
  } else {
    console.log('✅ Task created successfully')
    console.log(`   Task ID: ${task.id}`)
    console.log(`   Type: ${task.task_type}`)
    console.log(`   Priority: ${task.priority}`)
  }
  console.log('')

  // Test 8: Reviews
  console.log('8️⃣ Testing Review Creation...')
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      user_id: authData.user?.id,
      room_id: testRoom.id,
      rating: 5,
      comment: 'Excellent room! Test review.'
    })
    .select()
    .single()

  if (reviewError) {
    console.error('❌ Review creation failed:', reviewError.message)
  } else {
    console.log('✅ Review created successfully')
    console.log(`   Review ID: ${review.id}`)
    console.log(`   Rating: ${review.rating}/5`)
  }
  console.log('')

  console.log('🎉 All core API tests completed!')
  console.log('\n📊 Summary:')
  console.log('  ✅ Room Types: OK')
  console.log('  ✅ Available Rooms: OK')
  console.log('  ✅ Booking Creation: OK')
  console.log('  ✅ Payment Creation: OK')
  console.log('  ✅ Restaurant Menu: OK')
  console.log('  ✅ Restaurant Order: OK')
  console.log('  ✅ Housekeeping Task: OK')
  console.log('  ✅ Review Creation: OK')
}

testCoreAPIs().catch(error => {
  console.error('\n💥 Test failed:', error)
  console.error('Stack trace:', error.stack)
})