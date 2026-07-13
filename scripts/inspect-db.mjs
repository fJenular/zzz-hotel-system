import * as dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

async function inspect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/'
  const response = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  })
  const schema = await response.json()
  fs.writeFileSync('schema-spec.json', JSON.stringify(schema, null, 2))
  console.log('✅ Wrote schema spec to schema-spec.json')

  // Check paths for RPCs
  const paths = Object.keys(schema.paths || {})
  console.log('Available RPCs / Paths:')
  paths.filter(p => p.startsWith('/rpc/')).forEach(p => console.log('  -', p))
}

inspect().catch(console.error)
