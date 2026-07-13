import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('âŒ SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedDatabase() {
  console.log('ðŸŒ± Seeding Database with Sample Data...\n')

  // ============================================
  // CLEANUP
  // ============================================
  console.log('ðŸ§¹ Cleaning up old data...')
  
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
    
    console.log('âœ… Old data cleaned\n')
  } catch (error: any) {
    console.error('âš ï¸  Cleanup warning:', error.message)
    console.log('   Continuing...\n')
  }

  // ============================================
  // 1. ROOM TYPES
  // ============================================
  console.log('1ï¸âƒ£ Seeding Room Types...')
  
  const roomTypes = [
    { name: 'Nusa Indah',
      description: 'Kamar nyaman dengan sentuhan dekorasi khas Nusantara.',
      base_price: 500000,
      max_occupancy: 2,
      max_adults: 2,
      max_children: 1,
      bed_configuration: '1 King Bed atau 2 Single Bed',
      area_sqm: 28,
      view_type: 'Kota',
      facilities: ['AC', 'WiFi Gratis', 'TV LED 32"', 'Kamar Mandi Dalam', 'Air Panas']
    },
    {
      name: 'Candi Biru',
      description: 'Kamar elegan dengan interior terinspirasi keindahan candi-candi Nusantara. Pemandangan kota yang indah, ruangan lebih luas, dan fasilitas premium.',
      base_price: 850000,
      max_occupancy: 3,
      max_adults: 2,
      max_children: 2,
      bed_configuration: '1 King Bed + 1 Sofa Bed',
      area_sqm: 36,
      view_type: 'Kota & Kolam Renang',
      facilities: ['AC', 'WiFi Gratis', 'TV LED 43"', 'Kamar Mandi Dalam', 'Bathtub', 'Mini Bar']
    },
    {
      name: 'Suite Samudra',
      description: 'Suite mewah dengan nuansa bahari Nusantara. Ruang tamu terpisah, pemandangan laut menakjubkan, dan layanan butler 24 jam.',
      base_price: 1500000,
      max_occupancy: 4,
      max_adults: 2,
      max_children: 2,
      bed_configuration: '1 King Bed + 1 Queen Sofa Bed',
      area_sqm: 56,
      view_type: 'Samudra & Cakrawala',
      facilities: ['AC', 'WiFi Premium', 'TV LED 55"', 'Ruang Tamu Terpisah', 'Bathtub Mewah', 'Mini Bar Lengkap', 'Mesin Kopi Espresso']
    },
    {
      name: 'Keluarga Nusantara',
      description: 'Kamar luas dirancang khusus untuk keluarga dengan area bermain anak dan dekorasi ceria bernuansa budaya Indonesia.',
      base_price: 1200000,
      max_occupancy: 5,
      max_adults: 3,
      max_children: 3,
      bed_configuration: '1 King Bed + 2 Single Bed',
      area_sqm: 48,
      view_type: 'Taman & Kolam Renang',
      facilities: ['AC', 'WiFi Gratis', 'TV LED 50"', 'Area Bermain Anak', 'Kamar Mandi Dalam', 'Bathtub', 'Mini Bar']
    }
  ]

  const { data: insertedRoomTypes, error: rtError } = await supabaseAdmin
    .from('room_types')
    .insert(roomTypes)
    .select()

  if (rtError) {
    console.error('âŒ Room types failed:', rtError.message)
    return
  }
  console.log(`âœ… Inserted ${insertedRoomTypes?.length} room types\n`)

  // ============================================
  // 2. ROOMS
  // ============================================
  console.log('2ï¸âƒ£ Seeding Rooms...')

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
      console.error('âŒ Rooms failed:', roomError.message)
      console.error('   Details:', JSON.stringify(roomError, null, 2))
    } else {
      console.log(`âœ… Inserted ${insertedRooms?.length} rooms`)
      console.log(`   Numbers: ${insertedRooms?.map(r => r.room_number).join(', ')}\n`)
    }
  }

  // ============================================
  // 3. RESTAURANT CATEGORIES
  // ============================================
  console.log('3ï¸âƒ£ Seeding Restaurant Categories...')

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
    console.error('âŒ Categories failed:', catError.message)
    console.log('   âš ï¸  Table might not exist. Run the SQL fix first.\n')
  } else {
    console.log(`âœ… Inserted ${insertedCategories?.length} categories\n`)
  }

  // ============================================
  // 4. RESTAURANT MENUS
  // ============================================
  console.log('4ï¸âƒ£ Seeding Restaurant Menus...')

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
    console.error('âŒ Menus failed:', menuError.message)
  } else {
    console.log(`âœ… Inserted ${insertedMenus?.length} menus\n`)
  }

  // ============================================
  // 5. CMS SECTIONS
  // ============================================
  console.log('5ï¸âƒ£ Seeding CMS Sections...')

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
    console.error('âŒ CMS failed:', cmsError.message)
  } else {
    console.log(`âœ… Inserted ${insertedCms?.length} CMS sections\n`)
  }

  // ============================================
  // 6. VERIFY
  // ============================================
  console.log('6ï¸âƒ£ Verifying Data...')

  const tables = ['room_types', 'rooms', 'restaurant_menus', 'cms_sections']
  console.log('\nðŸ“Š Database Summary:')
  
  for (const table of tables) {
    const { count } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
    console.log(`  ${table}: ${count || 0}`)
  }

  console.log('\nðŸŽ‰ Database seeding completed!')
}

seedDatabase().catch(error => {
  console.error('\nðŸ’¥ Seeding failed:', error)
})





