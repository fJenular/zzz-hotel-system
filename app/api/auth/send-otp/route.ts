import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createOTP } from '@/lib/email/otp'
import { sendOTPEmail } from '@/lib/email/mailer'

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

    // Get user's full name from database for personalised email
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('full_name, email_verified')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Email tidak ditemukan' },
        { status: 404 }
      )
    }

    if (userData.email_verified) {
      return NextResponse.json(
        { success: false, error: 'Email sudah terverifikasi' },
        { status: 400 }
      )
    }

    // Generate and persist OTP
    const otp = await createOTP(normalizedEmail)

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp, userData.full_name || 'Pengguna')

    console.log(`✅ OTP sent to ${normalizedEmail}`)

    return NextResponse.json({
      success: true,
      message: 'Kode OTP telah dikirim ke email Anda',
    })
  } catch (error: any) {
    console.error('send-otp error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengirim OTP' },
      { status: 500 }
    )
  }
}
