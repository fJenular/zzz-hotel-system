import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role admin client to bypass RLS policies
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user

      // Tentukan apakah ini flow OAuth (Google) atau email confirmation
      const isOAuthUser = user.app_metadata?.provider === 'google'

      // Check if user exists in users table
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email_verified, role')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingUser) {
        // User baru — buat record (biasanya untuk Google OAuth)
        const { error: insertError } = await supabaseAdmin.from('users').insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          phone: user.user_metadata?.phone || '',
          role: 'guest',
          email_verified: true // Google sudah verifikasi; email/password akan di-verify via link
        })
        if (insertError) {
          console.error('Callback insert error:', insertError.message)
        } else {
          console.log('✅ New user created in users table:', user.email)
        }
      } else {
        // User sudah ada — update email_verified ke true
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ email_verified: true })
          .eq('id', user.id)
        if (updateError) {
          console.error('Callback update error:', updateError.message)
        } else {
          console.log('✅ Email verified for user:', user.email)
        }
      }

      // Ambil role terbaru dari database
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = userData?.role || 'guest'

      // Redirect berdasarkan provider dan role
      let redirectPath: string

      if (isOAuthUser) {
        // Google OAuth — redirect berdasarkan role seperti biasa
        if (role === 'admin' || role === 'super_admin') {
          redirectPath = '/admin/dashboard'
        } else if (role === 'manager') {
          redirectPath = '/manager/dashboard'
        } else if (role === 'receptionist') {
          redirectPath = '/receptionist/dashboard'
        } else if (role === 'rest_staff') {
          redirectPath = '/restaurant/dashboard'
        } else if (role === 'housekeeping') {
          redirectPath = '/housekeeping/dashboard'
        } else {
          // Guest redirect ke home
          redirectPath = '/'
        }
      } else {
        // Email confirmation — redirect ke halaman sukses verifikasi atau home
        if (next !== '/') {
          redirectPath = next
        } else if (role === 'admin' || role === 'super_admin') {
          redirectPath = '/admin/dashboard'
        } else if (role === 'manager') {
          redirectPath = '/manager/dashboard'
        } else if (role === 'receptionist') {
          redirectPath = '/receptionist/dashboard'
        } else if (role === 'rest_staff') {
          redirectPath = '/restaurant/dashboard'
        } else if (role === 'housekeeping') {
          redirectPath = '/housekeeping/dashboard'
        } else {
          // Guest redirect ke home
          redirectPath = '/'
        }
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Error — redirect ke halaman error
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}