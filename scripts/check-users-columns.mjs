import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xjtxltveuhlkwqenxyes.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdHhsdHZldWhsa3dxZW54eWVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM2MDE0MSwiZXhwIjoyMDk3OTM2MTQxfQ.B59L5uI0JDEzfTPB4GMF_Fz6mkds2TjOFud28o7DuKc'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkColumns() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error fetching users:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log('✅ Columns in users table:', Object.keys(data[0]))
  } else {
    console.log('⚠️ No users found in database to inspect columns.')
    // Try to inspect columns by selecting schema info or inserting a dummy row
    const { data: cols, error: colError } = await supabase
      .from('users')
      .insert({ id: '00000000-0000-0000-0000-000000000000', email: 'test@test.com', role: 'guest' })
      .select('*')
    console.log('Cols from insert:', cols, colError)
  }
}

checkColumns()
