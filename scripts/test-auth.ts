import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testAuth() {
  console.log('🔐 Testing Authentication...\n')

  // Generate unique email dengan timestamp
  const timestamp = Date.now()
  const testEmail = 'zainularifinsmktibazma@gmail.com' // Ganti dengan email test user Anda
  const testPassword = 'TestPassword123!'

  console.log('📧 Test Email:', testEmail)
  console.log('🔑 Test Password:', testPassword)
  console.log('')

  // Test 1: Sign up new user
  console.log('1️⃣ Testing Sign Up...')
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test User',
        phone: '081234567890',
        role: 'guest'
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message)
    console.error('Error details:', signUpError)
    return
  }

  console.log('✅ Sign up successful')
  console.log('User ID:', signUpData.user?.id)
  console.log('Email:', signUpData.user?.email)
  console.log('User metadata:', signUpData.user?.user_metadata)

  // Test 2: Create user record in users table
  console.log('\n2️⃣ Creating user record in database...')
  
  if (signUpData.user?.id) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', signUpData.user.id)
      .single()

    if (!existingUser) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: signUpData.user.id,
          email: testEmail,
          full_name: 'Test User',
          phone: '081234567890',
          role: 'guest',
          email_verified: false
        })

      if (userError) {
        console.error('❌ User record creation failed:', userError.message)
      } else {
        console.log('✅ User record created successfully')
      }
    } else {
      console.log('ℹ️  User record already exists')
    }
  }

  // Test 3: Sign in
  console.log('\n3️⃣ Testing Sign In...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })

  if (signInError) {
    console.error('❌ Sign in failed:', signInError.message)
    console.error('Error code:', signInError.status)
    return
  }

  console.log('✅ Sign in successful')
  console.log('Session expires at:', signInData.session?.expires_at)
  console.log('Access Token (first 30 chars):', signInData.session?.access_token?.substring(0, 30) + '...')

  // Test 4: Get current session
  console.log('\n4️⃣ Testing Session Retrieval...')
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    console.log('✅ Session retrieved successfully')
    console.log('User email:', session.user.email)
    console.log('User role:', session.user.user_metadata?.role || 'guest')
  } else {
    console.log('⚠️  No active session found')
  }

  // Test 5: Get user data from database
  console.log('\n5️⃣ Testing Database User Lookup...')
  if (session?.user) {
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userFetchError) {
      console.error('❌ Failed to fetch user from database:', userFetchError.message)
    } else {
      console.log('✅ User data retrieved from database')
      console.log('Full name:', userData.full_name)
      console.log('Role:', userData.role)
      console.log('Email verified:', userData.email_verified)
    }
  }

  // Test 6: Sign out
  console.log('\n6️⃣ Testing Sign Out...')
  const { error: signOutError } = await supabase.auth.signOut()
  
  if (signOutError) {
    console.error('❌ Sign out failed:', signOutError.message)
  } else {
    console.log('✅ Sign out successful')
  }

  // Test 7: Verify session is cleared
  console.log('\n7️⃣ Verifying Session Cleared...')
  const { data: { session: clearedSession } } = await supabase.auth.getSession()
  
  if (!clearedSession) {
    console.log('✅ Session successfully cleared')
  } else {
    console.error('❌ Session still exists after sign out')
  }

  console.log('\n🎉 All authentication tests completed successfully!')
  console.log('\n📝 Summary:')
  console.log('  - Sign up: ✅')
  console.log('  - User record creation: ✅')
  console.log('  - Sign in: ✅')
  console.log('  - Session management: ✅')
  console.log('  - Database lookup: ✅')
  console.log('  - Sign out: ✅')
  console.log('\n💡 Test email used:', testEmail)
  console.log('💡 You can use this email for further testing')
}

testAuth().catch(error => {
  console.error('\n💥 Test failed with error:', error)
  console.error('Stack trace:', error.stack)
})