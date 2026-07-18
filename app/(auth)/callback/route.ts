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
      const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''

      // Check if user exists in users table
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, email_verified, role, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingUser) {
        // ── User BARU via Google OAuth ──────────────────────────────────────
        // Buat record dengan email_verified: true langsung (karena Google sudah terverifikasi)
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Pengguna'
        const email = user.email!

        const { error: insertError } = await supabaseAdmin.from('users').insert({
          id: user.id,
          email,
          full_name: fullName,
          phone: user.user_metadata?.phone || '',
          role: 'guest',
          email_verified: true, // OAuth Google langsung verified
          avatar_url: googleAvatarUrl
        })

        if (insertError) {
          console.error('Callback insert error:', insertError.message)
          return NextResponse.redirect(`${origin}/auth/auth-code-error`)
        }

        console.log('✅ New Google user created in users table (verified):', email)
      } else {
        // ── User SUDAH ADA ──────────────────────────────────────────────────
        // Pastikan email_verified ter-update ke true jika mereka login via Google
        // Dan isi avatar_url jika belum ada di database
        const updateData: Record<string, any> = { email_verified: true }
        if (!existingUser.avatar_url && googleAvatarUrl) {
          updateData.avatar_url = googleAvatarUrl
        }

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', user.id)

        if (updateError) {
          console.error('Callback update error:', updateError.message)
        }
      }

      // Ambil role terbaru dari database untuk penentuan halaman redirect
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const role = userData?.role || 'guest'
      const roleRedirects: Record<string, string> = {
        super_admin: '/admin/dashboard',
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        receptionist: '/receptionist/dashboard',
        rest_staff: '/restaurant/dashboard',
        housekeeping: '/housekeeping/dashboard',
        guest: '/dashboard',
      }

      let redirectPath = roleRedirects[role] || '/dashboard'
      if (!isOAuthUser && next !== '/') {
        redirectPath = next
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Error — redirect ke halaman error
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}