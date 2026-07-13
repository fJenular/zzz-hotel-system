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

console.log('\n🎉 Selesai re-seeding untuk Bale, Serambi, Pendopo, Puri!')
