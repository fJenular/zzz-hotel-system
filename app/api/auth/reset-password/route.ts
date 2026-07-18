import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyOTP } from '@/lib/email/otp'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, otp, password } = await request.json()

    if (!email || !otp || !password) {
      return NextResponse.json(
        { success: false, error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi minimal 8 karakter' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const cleanOTP = String(otp).trim()

    // 1. Verify OTP
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

    // 2. Get user's ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    // 3. Update password in Supabase Auth via admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      { password: password }
    )

    if (updateError) {
      console.error('reset-password update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Gagal mengubah kata sandi: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Password reset successfully for: ${normalizedEmail}`)

    return NextResponse.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui! Silakan login dengan kata sandi baru Anda.',
    })
  } catch (error: any) {
    console.error('reset-password error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengubah kata sandi' },
      { status: 500 }
    )
  }
}
