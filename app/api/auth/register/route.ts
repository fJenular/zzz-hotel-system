import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createOTP } from '@/lib/email/otp'
import { sendOTPEmail } from '@/lib/email/mailer'

// Service role untuk admin operations (cek existing user, insert ke users table)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Regular client (anon key) — digunakan untuk signUp agar Supabase kirim email otomatis
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits')
})

export async function POST(request: Request) {
  try {
    console.log('📝 Registration attempt started')

    const body = await request.json()
    console.log('Request body:', { email: body.email, fullName: body.fullName })

    // Validate input
    const validatedData = registerSchema.parse(body)
    console.log('✅ Validation passed')

    // Cek apakah email sudah terdaftar di tabel users
    console.log('🔍 Checking if email exists...')
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', validatedData.email)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Email check error:', checkError)
    }

    if (existingUser) {
      console.log('⚠️ Email already registered')
      return NextResponse.json(
        { success: false, error: 'Email is already registered. Please login or use forgot password.' },
        { status: 400 }
      )
    }

    console.log('✅ Email is available')

    // Gunakan signUp() — verifikasi ditangani via OTP kita sendiri
    console.log('🔐 Creating auth user via signUp...')
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.fullName,
          phone: validatedData.phone
        }
      }
    })

    if (authError) {
      console.error('❌ Auth signUp error:', {
        message: authError.message,
        status: authError.status,
        code: authError.code
      })

      return NextResponse.json(
        {
          success: false,
          error: authError.message || 'Failed to create user',
          details: {
            status: authError.status,
            code: authError.code
          }
        },
        { status: authError.status || 500 }
      )
    }

    if (!authData.user) {
      console.error('❌ No user returned from signUp')
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Buat record di tabel users menggunakan admin (bypass RLS)
    console.log('💾 Creating user record...')
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        role: 'guest',
        email_verified: false // Akan diubah ke true setelah user input OTP
      })

    if (insertError) {
      console.error('❌ User insert error:', insertError)

      // Cleanup: hapus auth user jika insert gagal
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { success: false, error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    console.log('✅ User record created')

    // Kirim OTP verifikasi via Gmail SMTP
    console.log('📧 Sending OTP email via Gmail...')
    try {
      const otp = await createOTP(validatedData.email)
      await sendOTPEmail(validatedData.email, otp, validatedData.fullName)
      console.log('✅ OTP email sent successfully')
    } catch (emailErr: any) {
      console.error('❌ OTP send error:', emailErr.message)
      // Jangan gagalkan pendaftaran jika email gagal — user bisa minta kirim ulang
    }

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil. Kode OTP telah dikirim ke email Anda.',
      data: {
        userId: authData.user.id,
        email: validatedData.email,
        fullName: validatedData.fullName
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Registration error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Registration failed',
        details: {
          name: error.name,
          status: error.status
        }
      },
      { status: 500 }
    )
  }
}