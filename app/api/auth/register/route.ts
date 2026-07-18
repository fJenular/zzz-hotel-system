import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createOTP } from '@/lib/email/otp'
import { sendOTPEmail } from '@/lib/email/mailer'

// Service role untuk semua admin operations (bypass RLS, skip Supabase email)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    // Gunakan admin.createUser() dengan email_confirm:true agar Supabase
    // tidak mengirim email verifikasi sendiri — OTP kita yang menangani.
    console.log('🔐 Creating auth user via admin.createUser...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
      user_metadata: {
        full_name: validatedData.fullName,
        phone: validatedData.phone
      }
    })

    let finalAuthData = authData
    let finalAuthError = authError

    // Mekanisme self-healing jika user sudah ada di auth.users (Supabase Auth)
    // tetapi record-nya tidak ada di tabel public.users (orphan).
    if (authError && (authError.message.toLowerCase().includes('already exists') || authError.message.toLowerCase().includes('already registered'))) {
      console.log('⚠️ User terdaftar di Supabase Auth tapi tidak ada di tabel users (orphan). Menghapus & membuat ulang secara bersih...')
      
      const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (!listError && usersList?.users) {
        const orphan = usersList.users.find(u => u.email?.toLowerCase() === validatedData.email.toLowerCase())
        if (orphan) {
          console.log(`🗑️ Menghapus orphan user ID: ${orphan.id}`)
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(orphan.id)
          if (!deleteError) {
            console.log('🔄 Membuat ulang user setelah pembersihan...')
            const retry = await supabaseAdmin.auth.admin.createUser({
              email: validatedData.email,
              password: validatedData.password,
              email_confirm: true,
              user_metadata: {
                full_name: validatedData.fullName,
                phone: validatedData.phone
              }
            })
            finalAuthData = retry.data
            finalAuthError = retry.error
          } else {
            console.error('❌ Gagal menghapus orphan user:', deleteError.message)
          }
        }
      }
    }

    if (finalAuthError) {
      console.error('❌ Auth signUp error:', {
        message: finalAuthError.message,
        status: finalAuthError.status,
        code: finalAuthError.code
      })

      return NextResponse.json(
        {
          success: false,
          error: finalAuthError.message || 'Failed to create user',
          details: {
            status: finalAuthError.status,
            code: finalAuthError.code
          }
        },
        { status: finalAuthError.status || 500 }
      )
    }

    if (!finalAuthData.user) {
      console.error('❌ No user returned from signUp')
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    console.log('✅ Auth user created:', finalAuthData.user.id)

    // Buat record di tabel users menggunakan admin (bypass RLS)
    console.log('💾 Creating user record...')
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: finalAuthData.user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        role: 'guest',
        email_verified: false // Akan diubah ke true setelah user input OTP
      })

    if (insertError) {
      console.error('❌ User insert error:', insertError)

      // Cleanup: hapus auth user jika insert gagal
      await supabaseAdmin.auth.admin.deleteUser(finalAuthData.user.id)

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
        userId: finalAuthData.user.id,
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