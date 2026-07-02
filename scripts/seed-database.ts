import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedDatabase() {
  console.log('🌱 Seeding Database with Sample Data...\n')

  // ============================================
  // CLEANUP
  // ============================================
  console.log('🧹 Cleaning up old data...')
  
  try {
    // Child tables first
    await supabaseAdmin.from('restaurant_order_details').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('restaurant_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('housekeeping_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Parent tables
    await supabaseAdmin.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('room_types').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('restaurant_menus').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('restaurant_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('cms_sections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('✅ Old data cleaned\n')
  } catch (error: any) {
    console.error('⚠️  Cleanup warning:', error.message)
    console.log('   Continuing...\n')
  }

  // ============================================
  // 1. ROOM TYPES
  // ============================================
  console.log('1️⃣ Seeding Room Types...')
  
  const roomTypes = [
    { name: 'Standard Room', description: 'Comfortable room with basic amenities', base_price: 500000, max_occupancy: 2 },
    { name: 'Deluxe Room', description: 'Spacious room with city view', base_price: 850000, max_occupancy: 3 },
    { name: 'Suite Room', description: 'Luxury suite with living room', base_price: 1500000, max_occupancy: 4 },
    { name: 'Family Room', description: 'Perfect for families with kids', base_price: 1200000, max_occupancy: 5 }
  ]

  const { data: insertedRoomTypes, error: rtError } = await supabaseAdmin
    .from('room_types')
    .insert(roomTypes)
    .select()

  if (rtError) {
    console.error('❌ Room types failed:', rtError.message)
    return
  }
  console.log(`✅ Inserted ${insertedRoomTypes?.length} room types\n`)

  // ============================================
  // 2. ROOMS
  // ============================================
  console.log('2️⃣ Seeding Rooms...')

  if (insertedRoomTypes && insertedRoomTypes.length > 0) {
    const rooms = []
    let roomCounter = 101
    
    for (const rt of insertedRoomTypes) {
      for (let i = 0; i < 3; i++) {
        rooms.push({
          room_type_id: rt.id,
          room_number: roomCounter.toString(),
          floor: Math.floor(roomCounter / 100).toString(),
          status: 'available'
        })
        roomCounter++
      }
    }

    const { data: insertedRooms, error: roomError } = await supabaseAdmin
      .from('rooms')
      .insert(rooms)
      .select()

    if (roomError) {
      console.error('❌ Rooms failed:', roomError.message)
      console.error('   Details:', JSON.stringify(roomError, null, 2))
    } else {
      console.log(`✅ Inserted ${insertedRooms?.length} rooms`)
      console.log(`   Numbers: ${insertedRooms?.map(r => r.room_number).join(', ')}\n`)
    }
  }

  // ============================================
  // 3. RESTAURANT CATEGORIES
  // ============================================
  console.log('3️⃣ Seeding Restaurant Categories...')

  const categories = [
    { name: 'Main Course', description: 'Main dishes' },
    { name: 'Beverages', description: 'Drinks and beverages' },
    { name: 'Desserts', description: 'Sweet treats' },
    { name: 'Appetizers', description: 'Starters and snacks' }
  ]

  const { data: insertedCategories, error: catError } = await supabaseAdmin
    .from('restaurant_categories')
    .insert(categories)
    .select()

  if (catError) {
    console.error('❌ Categories failed:', catError.message)
    console.log('   ⚠️  Table might not exist. Run the SQL fix first.\n')
  } else {
    console.log(`✅ Inserted ${insertedCategories?.length} categories\n`)
  }

  // ============================================
  // 4. RESTAURANT MENUS
  // ============================================
  console.log('4️⃣ Seeding Restaurant Menus...')

  const menus = [
    { name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan telur, ayam, dan udang', price: 45000, category: 'Main Course', is_available: true },
    { name: 'Mie Goreng Seafood', description: 'Mie goreng dengan udang, cumi, dan sayuran', price: 50000, category: 'Main Course', is_available: true },
    { name: 'Ayam Bakar Madu', description: 'Ayam bakar dengan saus madu spesial', price: 65000, category: 'Main Course', is_available: true },
    { name: 'Es Teh Manis', description: 'Teh manis segar dengan es batu', price: 15000, category: 'Beverages', is_available: true },
    { name: 'Jus Alpukat', description: 'Jus alpukat segar dengan susu', price: 25000, category: 'Beverages', is_available: true },
    { name: 'Pancake Blueberry', description: 'Pancake dengan blueberry dan maple syrup', price: 35000, category: 'Desserts', is_available: true }
  ]

  const { data: insertedMenus, error: menuError } = await supabaseAdmin
    .from('restaurant_menus')
    .insert(menus)
    .select()

  if (menuError) {
    console.error('❌ Menus failed:', menuError.message)
  } else {
    console.log(`✅ Inserted ${insertedMenus?.length} menus\n`)
  }

  // ============================================
  // 5. CMS SECTIONS
  // ============================================
  console.log('5️⃣ Seeding CMS Sections...')

  const cmsSections = [
    {
      section_name: 'hero',
      content: { title: 'Welcome to ZZZ Hotel', subtitle: 'Experience luxury and comfort', cta_text: 'Book Now' },
      is_active: true
    },
    {
      section_name: 'about',
      content: { title: 'About Us', description: 'ZZZ Hotel offers premium accommodation' },
      is_active: true
    },
    {
      section_name: 'facilities',
      content: { title: 'Our Facilities', items: ['Pool', 'Restaurant', 'Spa', 'Gym'] },
      is_active: true
    }
  ]

  const { data: insertedCms, error: cmsError } = await supabaseAdmin
    .from('cms_sections')
    .insert(cmsSections)
    .select()

  if (cmsError) {
    console.error('❌ CMS failed:', cmsError.message)
  } else {
    console.log(`✅ Inserted ${insertedCms?.length} CMS sections\n`)
  }

  // ============================================
  // 6. VERIFY
  // ============================================
  console.log('6️⃣ Verifying Data...')

  const tables = ['room_types', 'rooms', 'restaurant_menus', 'cms_sections']
  console.log('\n📊 Database Summary:')
  
  for (const table of tables) {
    const { count } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
    console.log(`  ${table}: ${count || 0}`)
  }

  console.log('\n🎉 Database seeding completed!')
}

seedDatabase().catch(error => {
  console.error('\n💥 Seeding failed:', error)
})