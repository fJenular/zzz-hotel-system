import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createOTP } from '@/lib/email/otp'
import { sendPasswordResetOTPEmail } from '@/lib/email/mailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email wajib diisi' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Cek apakah email terdaftar di database 'users'
    const { data: userData, error: checkError } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Forgot password check error:', checkError)
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Alamat email tidak ditemukan' },
        { status: 404 }
      )
    }

    // 2. Generate and persist OTP
    const otp = await createOTP(normalizedEmail)

    // 3. Kirim email OTP reset password
    await sendPasswordResetOTPEmail(normalizedEmail, otp, userData.full_name || 'Pengguna')

    console.log(`✅ Password reset OTP sent to ${normalizedEmail}`)

    return NextResponse.json({
      success: true,
      message: 'Kode OTP reset kata sandi telah dikirim ke email Anda',
    })
  } catch (error: any) {
    console.error('forgot-password error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengirim OTP' },
      { status: 500 }
    )
  }
}
