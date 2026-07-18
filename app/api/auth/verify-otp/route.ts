import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyOTP } from '@/lib/email/otp'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email dan kode OTP wajib diisi' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const cleanOTP = String(otp).trim()

    // Verify OTP
    const result = await verifyOTP(normalizedEmail, cleanOTP)

    if (!result.success) {
      const messages: Record<string, string> = {
        not_found: 'Kode OTP tidak ditemukan. Mohon minta kode baru.',
        expired: 'Kode OTP sudah kadaluarsa. Mohon minta kode baru.',
        used: 'Kode OTP sudah digunakan. Mohon minta kode baru.',
        invalid: 'Kode OTP tidak valid. Periksa kembali kode yang Anda masukkan.',
      }
      return NextResponse.json(
        { success: false, error: messages[result.reason] || 'Verifikasi gagal' },
        { status: 400 }
      )
    }

    // Mark email as verified in users table
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ email_verified: true })
      .eq('email', normalizedEmail)
      .select('role')
      .maybeSingle()

    if (updateError) {
      console.error('verify-otp update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui status verifikasi' },
        { status: 500 }
      )
    }

    console.log(`✅ Email verified for: ${normalizedEmail}`)

    return NextResponse.json({
      success: true,
      message: 'Email berhasil diverifikasi!',
      role: updatedUser?.role || 'guest',
    })
  } catch (error: any) {
    console.error('verify-otp error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Verifikasi gagal' },
      { status: 500 }
    )
  }
}
