import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n')

  // Test 1: Check connection
  const { data: testData, error: testError } = await supabase
    .from('users')
    .select('count')
    .limit(1)
  
  if (testError) {
    console.error('❌ Connection failed:', testError.message)
    return
  }
  console.log('✅ Database connection successful\n')

  // Test 2: Check all tables exist
  const tables = [
    'users', 'room_types', 'rooms', 'bookings', 'payments',
    'restaurant_menus', 'restaurant_orders', 'housekeeping_tasks',
    'cms_sections', 'reviews', 'audit_logs'
  ]

  console.log('📊 Checking tables...')
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1)
    if (error) {
      console.error(`❌ Table ${table} not found or error:`, error.message)
    } else {
      console.log(`✅ Table ${table} exists`)
    }
  }

  // Test 3: Check sample data
  console.log('\n📝 Checking sample data...')
  const { data: roomTypes } = await supabase.from('room_types').select('*')
  console.log(`Room Types: ${roomTypes?.length || 0} records`)

  const { data: rooms } = await supabase.from('rooms').select('*')
  console.log(`Rooms: ${rooms?.length || 0} records`)
}

testDatabase().catch(console.error)