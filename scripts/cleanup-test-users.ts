import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Gunakan service role key untuk admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Pastikan ada di .env.local
)

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...\n')

  // Delete users dengan pattern email test
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
  
  if (error) {
    console.error('❌ Failed to list users:', error.message)
    return
  }

  const testUsers = users.users.filter(u => 
    u.email?.includes('test') || 
    u.email?.includes('example.com')
  )

  console.log(`Found ${testUsers.length} test users to delete`)

  for (const user of testUsers) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error(`❌ Failed to delete ${user.email}:`, deleteError.message)
    } else {
      console.log(`✅ Deleted ${user.email}`)
    }
  }

  console.log('\n🎉 Cleanup completed!')
}

cleanupTestUsers().catch(console.error)