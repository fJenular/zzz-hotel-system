import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xjtxltveuhlkwqenxyes.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdHhsdHZldWhsa3dxZW54eWVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM2MDE0MSwiZXhwIjoyMDk3OTM2MTQxfQ.B59L5uI0JDEzfTPB4GMF_Fz6mkds2TjOFud28o7DuKc'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('🔄 Testing Supabase connection...')
console.log(`📡 URL: ${SUPABASE_URL}`)
console.log('')

try {
  // 1. Test basic connection - query a simple system table
  const start = Date.now()
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .limit(5)
  const elapsed = Date.now() - start

  if (error) {
    // Table might not exist, try auth users instead
    console.log(`⚠️  Table 'users' error: ${error.message}`)
    console.log('🔄 Trying auth.users via admin API...')

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 5 })
    if (authError) {
      console.error('❌ Connection FAILED:', authError.message)
      process.exit(1)
    }

    console.log('✅ Koneksi ke Supabase BERHASIL!')
    console.log(`⏱️  Response time: ${elapsed}ms`)
    console.log(`👥 Total users di auth: ${authData.users.length} user(s) ditemukan`)
    authData.users.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} | role: ${u.role} | confirmed: ${!!u.email_confirmed_at}`)
    })
  } else {
    console.log('✅ Koneksi ke Supabase BERHASIL!')
    console.log(`⏱️  Response time: ${elapsed}ms`)
    console.log(`👥 Data dari tabel 'users': ${data.length} row(s)`)
    data.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} | role: ${u.role}`)
    })
  }

  // 2. Test auth.admin untuk list users
  console.log('')
  console.log('🔄 Checking auth users...')
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 10 })
  if (!authErr) {
    console.log(`✅ Auth service OK — ${authUsers.users.length} user(s) terdaftar:`)
    authUsers.users.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} | confirmed: ${!!u.email_confirmed_at} | created: ${new Date(u.created_at).toLocaleDateString('id-ID')}`)
    })
  }

  // 3. Query room types and rooms
  console.log('\n🏠 Checking Room Types and Rooms in Database...')
  const { data: dbRoomTypes, error: rtError } = await supabase.from('room_types').select('*')
  if (rtError) {
    console.error('❌ Failed to fetch room types:', rtError.message)
  } else {
    console.log(`✅ Room Types (${dbRoomTypes.length}):`)
    if (dbRoomTypes.length > 0) {
      console.log('Room Type Keys:', Object.keys(dbRoomTypes[0]))
    }
    dbRoomTypes.forEach((rt) => {
      console.log(`   - ID: ${rt.id} | Name: "${rt.name}" | Price: Rp ${rt.base_price} | Max Occupancy: ${rt.max_occupancy} (Adults: ${rt.max_adults}, Children: ${rt.max_children})`)
    })
  }

  const { data: dbRooms, error: rError } = await supabase.from('rooms').select('*, room_types(name)')
  if (rError) {
    console.error('❌ Failed to fetch rooms:', rError.message)
  } else {
    console.log(`✅ Rooms (${dbRooms.length}):`)
    dbRooms.forEach((r) => {
      console.log(`   - Room: ${r.room_number} | Floor: ${r.floor} | Status: ${r.status} | Type: "${r.room_types?.name}"`)
    })
  }

} catch (err) {
  console.error('❌ Unexpected error:', err.message)
  process.exit(1)
}
