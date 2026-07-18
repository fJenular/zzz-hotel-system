import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xjtxltveuhlkwqenxyes.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdHhsdHZldWhsa3dxZW54eWVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM2MDE0MSwiZXhwIjoyMDk3OTM2MTQxfQ.B59L5uI0JDEzfTPB4GMF_Fz6mkds2TjOFud28o7DuKc'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function createProfilesBucket() {
  console.log('🔄 Checking profiles bucket...')
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('❌ Failed to list buckets:', listError.message)
    return
  }

  const profilesBucket = buckets.find(b => b.name === 'profiles')
  if (!profilesBucket) {
    console.log('⚠️ profiles bucket not found. Creating it now...')
    const { data, error } = await supabase.storage.createBucket('profiles', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
      fileSizeLimit: 2 * 1024 * 1024 // 2MB
    })

    if (error) {
      console.error('❌ Failed to create profiles bucket:', error.message)
    } else {
      console.log('✅ profiles bucket created successfully!')
    }
  } else {
    console.log('✅ profiles bucket already exists!')
  }
}

createProfilesBucket()
