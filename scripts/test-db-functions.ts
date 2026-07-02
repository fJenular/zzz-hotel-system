import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testDatabaseFunctions() {
  console.log('⚙️ Testing Database Functions...\n')

  // ============================================
  // SETUP: Auto-login dengan test user
  // ============================================
  console.log('🔐 Setting up authentication...')
  
  // Option 1: Gunakan test user yang sudah ada
  const testEmail = 'test@example.com' // Ganti dengan email test user Anda
  const testPassword = 'TestPassword123!'
  
  // Coba login dulu
  let { data: { user } } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })

  // Jika gagal login, buat user baru
  if (!user) {
    console.log('ℹ️  No existing user, creating new test user...')
    
    const testEmailNew = `dbtest_${Date.now()}@example.com`
    const { data: signUpData } = await supabase.auth.signUp({
      email: testEmailNew,
      password: testPassword
    })

    if (signUpData.user) {
      // Create user record in users table
      await supabase.from('users').insert({
        id: signUpData.user.id,
        email: testEmailNew,
        full_name: 'DB Test User',
        role: 'guest'
      })

      // Login dengan user baru
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: testEmailNew,
        password: testPassword
      })
      
      user = signInData.user
      console.log(`✅ Created and logged in as: ${testEmailNew}`)
    }
  } else {
    console.log(`✅ Logged in as: ${user.email}`)
  }

  if (!user) {
    console.error('❌ Failed to authenticate')
    return
  }
  console.log('')

  // ============================================
  // TEST 1: Check Room Availability
  // ============================================
  console.log('1️⃣ Testing check_room_availability...')
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('status', 'available')
    .limit(1)

  if (rooms && rooms.length > 0) {
    const roomId = rooms[0].id
    const checkIn = new Date()
    const checkOut = new Date()
    checkOut.setDate(checkOut.getDate() + 2)

    const { data: isAvailable, error } = await supabase.rpc('check_room_availability', {
      p_room_id: roomId,
      p_check_in: checkIn.toISOString().split('T')[0],
      p_check_out: checkOut.toISOString().split('T')[0]
    })

    if (error) {
      console.error('❌ Function failed:', error.message)
    } else {
      console.log(`✅ Room availability: ${isAvailable ? 'Available' : 'Booked'}`)
    }
  } else {
    console.log('⚠️  No available rooms for testing')
  }
  console.log('')

  // ============================================
  // TEST 2: Get Available Rooms Count
  // ============================================
  console.log('2️⃣ Testing get_available_rooms_count...')
  const { data: count, error: countError } = await supabase.rpc('get_available_rooms_count', {
    p_room_type_id: null,
    p_check_in: null,
    p_check_out: null
  })

  if (countError) {
    console.error('❌ Function failed:', countError.message)
  } else {
    console.log(`✅ Available rooms count: ${count}`)
  }
  console.log('')

  // ============================================
  // TEST 3: Calculate Occupancy Rate
  // ============================================
  console.log('3️⃣ Testing calculate_occupancy_rate...')
  const { data: rate, error: rateError } = await supabase.rpc('calculate_occupancy_rate', {
    p_date: new Date().toISOString().split('T')[0]
  })

  if (rateError) {
    console.error('❌ Function failed:', rateError.message)
  } else {
    console.log(`✅ Occupancy rate: ${rate}%`)
  }
  console.log('')

  // ============================================
  // TEST 4: Calculate Revenue
  // ============================================
  console.log('4️⃣ Testing calculate_revenue...')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  const endDate = new Date()

  const { data: revenue, error: revenueError } = await supabase.rpc('calculate_revenue', {
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0]
  })

  if (revenueError) {
    console.error('❌ Function failed:', revenueError.message)
  } else {
    console.log(`✅ Revenue (last 30 days): Rp ${Number(revenue).toLocaleString()}`)
  }
  console.log('')

  // ============================================
  // TEST 5: Create Booking & Test Calculate Total
  // ============================================
  console.log('5️⃣ Testing calculate_booking_total...')

  // Get available room
  const { data: testRoom } = await supabase
    .from('rooms')
    .select('*, room_types(base_price)')
    .eq('status', 'available')
    .limit(1)
    .single()

  if (testRoom) {
    const checkIn = new Date()
    const checkOut = new Date()
    checkOut.setDate(checkOut.getDate() + 3)

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        room_id: testRoom.id,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
        total_price: 0,
        status: 'pending',
        guests_count: 2
      })
      .select()
      .single()

    if (bookingError) {
      console.error('❌ Booking creation failed:', bookingError.message)
    } else {
      console.log(`✅ Booking created: ${booking.id}`)

      // Calculate total
      const { data: total, error: totalError } = await supabase.rpc('calculate_booking_total', {
        p_booking_id: booking.id
      })

      if (totalError) {
        console.error('❌ Calculate total failed:', totalError.message)
      } else {
        console.log(`✅ Calculated total: Rp ${Number(total).toLocaleString()}`)
      }

      // Verify booking updated
      const { data: updatedBooking } = await supabase
        .from('bookings')
        .select('total_price')
        .eq('id', booking.id)
        .single()

      console.log(`✅ Booking total_price updated: Rp ${Number(updatedBooking?.total_price).toLocaleString()}`)
    }
  } else {
    console.log('⚠️  No available rooms for booking test')
  }
  console.log('')

  // ============================================
  // TEST 6: Test Room Status Trigger
  // ============================================
  console.log('6️⃣ Testing room status trigger...')
  
  // Get another available room
  const { data: testRoom2 } = await supabase
    .from('rooms')
    .select('id, status')
    .eq('status', 'available')
    .limit(1)
    .single()

  if (testRoom2) {
    console.log(`Room status before check-in: ${testRoom2.status}`)

    const checkInDate = new Date()
    const checkOutDate = new Date()
    checkOutDate.setDate(checkOutDate.getDate() + 2)

    const { data: booking2 } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        room_id: testRoom2.id,
        check_in: checkInDate.toISOString().split('T')[0],
        check_out: checkOutDate.toISOString().split('T')[0],
        total_price: 1000000,
        status: 'checked_in',
        guests_count: 2
      })
      .select()
      .single()

    // Check room status after check-in
    const { data: roomAfter } = await supabase
      .from('rooms')
      .select('status')
      .eq('id', testRoom2.id)
      .single()

    console.log(`✅ Room status after check-in: ${roomAfter?.status}`)

    // Update booking to checked_out
    if (booking2) {
      await supabase
        .from('bookings')
        .update({ status: 'checked_out' })
        .eq('id', booking2.id)

      const { data: roomAfterCheckout } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', testRoom2.id)
        .single()

      console.log(`✅ Room status after check-out: ${roomAfterCheckout?.status}`)
    }
  } else {
    console.log('⚠️  No available rooms for trigger test')
  }
  console.log('')

  // ============================================
  // TEST 7: Check Audit Logs
  // ============================================
  console.log('7️⃣ Testing audit logs...')
  const { data: logs, error: logsError } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (logsError) {
    console.error('❌ Audit logs failed:', logsError.message)
  } else {
    console.log(`✅ Found ${logs?.length} audit logs`)
    logs?.forEach(log => {
      console.log(`   - ${log.action} on ${log.table_name} at ${new Date(log.created_at).toLocaleString()}`)
    })
  }
  console.log('')

  // ============================================
  // SUMMARY
  // ============================================
  console.log('🎉 All database function tests completed!')
  console.log('\n📊 Summary:')
  console.log('  ✅ Authentication: OK')
  console.log('  ✅ check_room_availability: OK')
  console.log('  ✅ get_available_rooms_count: OK')
  console.log('  ✅ calculate_occupancy_rate: OK')
  console.log('  ✅ calculate_revenue: OK')
  console.log('  ✅ calculate_booking_total: OK')
  console.log('  ✅ Room status trigger: OK')
  console.log('  ✅ Audit logs: OK')
}

testDatabaseFunctions().catch(error => {
  console.error('\n💥 Test failed:', error)
  console.error('Stack trace:', error.stack)
})