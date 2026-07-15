import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE env vars in .env.local')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

console.log('🌱 Starting seed with new room names: Bale, Serambi, Pendopo, Puri...\n')

// =======================================
// STEP 1: Seed Room Types
// =======================================
console.log('1️⃣  Cleaning old room data...')
try {
  await sb.from('housekeeping_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await sb.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await sb.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await sb.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await sb.from('room_types').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('✅ Old data cleared\n')
} catch (e) {
  console.log('⚠️ Cleanup warning (continuing):', e.message)
}

console.log('2️⃣  Inserting Room Types (Bale, Serambi, Pendopo, Puri)...')
const roomTypePayloads = [
  {
    name: 'Bale',
    description: 'Bale adalah kamar peristirahatan tradisional yang nyaman dengan sentuhan dekorasi khas Nusantara. Cocok untuk pasangan atau tamu solo yang mencari kehangatan budaya Indonesia.',
    base_price: 500000,
    max_occupancy: 2,
  },
  {
    name: 'Serambi',
    description: 'Serambi menawarkan kamar luas dengan beranda khas pedesaan Nusantara. Desain arsitektur klasik yang dipadukan dengan kemewahan modern memberikan suasana santai yang otentik.',
    base_price: 850000,
    max_occupancy: 3,
  },
  {
    name: 'Pendopo',
    description: 'Pendopo adalah akomodasi keluarga yang terinspirasi dari ruang pertemuan agung tradisional Jawa. Sangat lapang dengan area bermain anak dan dekorasi adat yang menawan.',
    base_price: 1200000,
    max_occupancy: 5,
  },
  {
    name: 'Puri',
    description: 'Puri menyajikan keagungan istana raja-raja Nusantara. Suite ultra-mewah dengan ruang tamu terpisah, fasilitas premium terlengkap, dan layanan personal kelas satu.',
    base_price: 1500000,
    max_occupancy: 4,
  },
]

let insertedRoomTypes
const { data: rtData, error: rtErr } = await sb.from('room_types').insert(roomTypePayloads).select()
if (rtErr) {
  console.error('❌ Room types insert failed:', rtErr.message)
  process.exit(1)
} else {
  insertedRoomTypes = rtData
  console.log(`✅ Inserted ${insertedRoomTypes.length} room types`)
}

// =======================================
// STEP 2: Update with extra fields
// =======================================
console.log('\n3️⃣  Updating room types with detailed specs...')

const extraDetails = {
  'Bale': {
    max_adults: 2,
    max_children: 1,
    bed_configuration: '1 King Bed atau 2 Single Bed',
    area_sqm: 28,
    view_type: 'Pemandangan Kota',
    room_size: 'Standard (28 m²)',
    facilities: ['AC', 'WiFi Gratis', 'TV LED 32 inch', 'Kamar Mandi Dalam', 'Air Panas', 'Telepon'],
    amenities: ['Sabun Premium', 'Shampoo', 'Sandal Hotel', 'Handuk Mewah']
  },
  'Serambi': {
    max_adults: 2,
    max_children: 2,
    bed_configuration: '1 King Bed + 1 Sofa Bed',
    area_sqm: 36,
    view_type: 'Taman Asri',
    room_size: 'Deluxe (36 m²)',
    facilities: ['AC', 'WiFi Gratis', 'TV LED 43 inch', 'Kamar Mandi Dalam', 'Bathtub', 'Mini Bar', 'Meja Kerja'],
    amenities: ['Sabun Premium', 'Shampoo', 'Body Lotion', 'Sandal Hotel', 'Jubah Mandi', 'Kopi & Teh']
  },
  'Pendopo': {
    max_adults: 3,
    max_children: 3,
    bed_configuration: '1 King Bed + 2 Single Bed',
    area_sqm: 48,
    view_type: 'Taman & Kolam Renang',
    room_size: 'Family (48 m²)',
    facilities: ['AC', 'WiFi Gratis', 'TV LED 50 inch', 'Area Bermain Anak', 'Kamar Mandi Dalam', 'Bathtub', 'Mini Bar', 'Kulkas'],
    amenities: ['Sabun Premium', 'Shampoo', 'Sandal Hotel', 'Jubah Mandi', 'Kopi & Teh', 'Susu UHT', 'Board Game Anak']
  },
  'Puri': {
    max_adults: 2,
    max_children: 2,
    bed_configuration: '1 King Bed + 1 Queen Sofa Bed',
    area_sqm: 56,
    view_type: 'Cakrawala Samudra',
    room_size: 'Suite (56 m²)',
    facilities: ['AC', 'WiFi Premium', 'TV LED 55 inch', 'Ruang Tamu Terpisah', 'Bathtub Mewah', 'Mini Bar Lengkap', 'Mesin Kopi Espresso', 'Ruang Kerja'],
    amenities: ['Sabun Mewah', 'Shampoo Premium', 'Body Lotion', 'Sandal Mewah', 'Jubah Mandi', 'Kopi Arabika', 'Buah Selamat Datang', 'Turndown Service']
  }
}

for (const rt of insertedRoomTypes) {
  const extra = extraDetails[rt.name]
  if (extra) {
    const { error: updateErr } = await sb
      .from('room_types')
      .update(extra)
      .eq('id', rt.id)
    if (updateErr) {
      console.log(`   ⚠️ Could not update extra fields for ${rt.name}: ${updateErr.message}`)
    } else {
      console.log(`   ✅ ${rt.name} — updated specs`)
    }
  }
}

// =======================================
// STEP 3: Seed Rooms
// =======================================
console.log('\n4️⃣  Inserting Rooms...')

const roomsToInsert = []
const floorAssignment = {
  'Bale': 1,
  'Serambi': 2,
  'Pendopo': 3,
  'Puri': 5,
}

for (const rt of insertedRoomTypes) {
  const floor = floorAssignment[rt.name] || 1
  const prefix = floor * 100
  for (let i = 1; i <= 3; i++) {
    roomsToInsert.push({
      room_type_id: rt.id,
      room_number: `${prefix + i}`,
      floor: floor.toString(),
      status: 'available',
    })
  }
}

const { data: insertedRooms, error: roomsErr } = await sb.from('rooms').insert(roomsToInsert).select()
if (roomsErr) {
  console.error('❌ Rooms insert failed:', roomsErr.message)
} else {
  console.log(`✅ Inserted ${insertedRooms.length} rooms`)
}

// =======================================
// STEP 4: Seed Restaurant Menus
// =======================================
console.log('\n5️⃣  Seeding Restaurant Menus...')

// Clean existing menus
await sb.from('restaurant_order_details').delete().neq('id', '00000000-0000-0000-0000-000000000000')
await sb.from('restaurant_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
await sb.from('restaurant_menus').delete().neq('id', '00000000-0000-0000-0000-000000000000')

const menusToInsert = [
  // Main Course
  { name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan telur, ayam suwir, udang, dan acar timun segar', price: 45000, category: 'Main Course', is_available: true, image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80' },
  { name: 'Mie Goreng Seafood', description: 'Mie goreng dengan udang segar, cumi-cumi, dan sayuran pilihan', price: 50000, category: 'Main Course', is_available: true, image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80' },
  { name: 'Ayam Bakar Madu', description: 'Ayam kampung pilihan dengan saus madu spesial dan lalapan segar', price: 65000, category: 'Main Course', is_available: true, image_url: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=500&auto=format&fit=crop&q=80' },
  { name: 'Soto Ayam Betawi', description: 'Soto kuah santan khas Betawi dengan irisan ayam, kentang, dan emping', price: 40000, category: 'Main Course', is_available: true, image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80' },
  { name: 'Rendang Sapi Premium', description: 'Rendang daging sapi pilihan dengan bumbu rempah khas Minang yang meresap sempurna', price: 75000, category: 'Main Course', is_available: true, image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80' },
  { name: 'Gado-Gado Nusantara', description: 'Sayuran segar rebus dengan saus kacang spesial, kerupuk, dan telur pindang', price: 35000, category: 'Main Course', is_available: true, image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99eb4b475?w=500&auto=format&fit=crop&q=80' },
  { name: 'Ikan Bakar Bumbu Bali', description: 'Ikan kakap bakar dengan bumbu Bali kaya rempah disajikan dengan nasi putih', price: 85000, category: 'Main Course', is_available: true, image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80' },
  // Appetizers
  { name: 'Lumpia Goreng Udang', description: 'Lumpia renyah berisi udang, bengkoang, dan wortel dengan saus asam manis', price: 28000, category: 'Appetizers', is_available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80' },
  { name: 'Perkedel Jagung', description: 'Perkedel jagung manis goreng renyah dengan saus sambal terasi', price: 22000, category: 'Appetizers', is_available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80' },
  { name: 'Tahu Isi Sayur', description: 'Tahu goreng berisi sayuran segar dengan saus kacang pedas', price: 20000, category: 'Appetizers', is_available: true, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80' },
  { name: 'Kerupuk Udang & Sambal', description: 'Kerupuk udang renyah disajikan dengan sambal merah dan hijau', price: 15000, category: 'Appetizers', is_available: true, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=80' },
  // Beverages
  { name: 'Es Teh Manis Segar', description: 'Teh hitam manis segar dengan es batu pilihan', price: 12000, category: 'Beverages', is_available: true, image_url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=500&auto=format&fit=crop&q=80' },
  { name: 'Jus Alpukat Susu', description: 'Alpukat segar diblender dengan susu kental manis dan es batu', price: 28000, category: 'Beverages', is_available: true, image_url: 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=500&auto=format&fit=crop&q=80' },
  { name: 'Es Kelapa Muda', description: 'Kelapa muda segar dengan air dan daging kelapa langsung dari buahnya', price: 25000, category: 'Beverages', is_available: true, image_url: 'https://images.unsplash.com/photo-1525385133336-25251042599c?w=500&auto=format&fit=crop&q=80' },
  { name: 'Kopi Tubruk ZZZ', description: 'Kopi robusta pilihan diseduh tradisional khas Indonesia', price: 18000, category: 'Beverages', is_available: true, image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80' },
  { name: 'Jus Mangga Alpukat', description: 'Perpaduan mangga harum manis dan alpukat creamy, segar dan menyehatkan', price: 30000, category: 'Beverages', is_available: true, image_url: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=500&auto=format&fit=crop&q=80' },
  { name: 'Es Cincau Hijau', description: 'Minuman tradisional cincau hijau dengan santan dan gula merah cair', price: 20000, category: 'Beverages', is_available: true, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80' },
  // Desserts
  { name: 'Klepon Isi Kelapa', description: 'Klepon hijau pandan berisi gula merah cair dengan taburan kelapa parut', price: 22000, category: 'Desserts', is_available: true, image_url: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=500&auto=format&fit=crop&q=80' },
  { name: 'Es Pisang Ijo Makassar', description: 'Pisang dibalut adonan pandan beku dengan saus santan dan sirup rose', price: 30000, category: 'Desserts', is_available: true, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80' },
  { name: 'Dadar Gulung Pandan', description: 'Crepe pandan isi kelapa muda parut dan gula merah, lembut dan harum', price: 20000, category: 'Desserts', is_available: true, image_url: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500&auto=format&fit=crop&q=80' },
  { name: 'Bubur Sumsum', description: 'Bubur tepung beras lembut dengan santan dan saus gula merah kental', price: 18000, category: 'Desserts', is_available: true, image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80' },
  { name: 'Pancake Blueberry', description: 'Pancake lembut dengan blueberry segar, maple syrup, dan whipped cream', price: 38000, category: 'Desserts', is_available: true, image_url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500&auto=format&fit=crop&q=80' }
]

const { data: insertedMenus, error: menusErr } = await sb.from('restaurant_menus').insert(menusToInsert).select()
if (menusErr) {
  console.error('❌ Menus insert failed:', menusErr.message)
} else {
  console.log(`✅ Inserted ${insertedMenus.length} restaurant menu items`)
}

console.log('\n🎉 Selesai re-seeding untuk Bale, Serambi, Pendopo, Puri, dan Restaurant Menu!')

