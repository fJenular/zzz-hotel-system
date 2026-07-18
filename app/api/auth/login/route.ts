import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    // Get user data from database (role + email_verified)
    const { data: userData } = await supabase
      .from('users')
      .select('role, full_name, phone, email_verified')
      .eq('id', data.user.id)
      .single()

    // Blokir login jika email belum diverifikasi via OTP
    if (!userData?.email_verified) {
      // Sign out dulu supaya session tidak tersimpan
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          success: false,
          error: 'Email belum diverifikasi. Silakan cek email Anda untuk kode OTP.',
          requiresVerification: true,
          email: validatedData.email,
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: userData?.full_name,
          role: userData?.role || 'guest',
          phone: userData?.phone
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        }
      }
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}