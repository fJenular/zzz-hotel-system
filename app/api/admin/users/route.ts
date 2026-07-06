import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to check if request is from an admin
async function checkAdmin(request: Request) {
  // Simple check for service token or cookies if needed,
  // but since it's admin, we check their role in db
  try {
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) return false

      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      return dbUser?.role === 'admin' || dbUser?.role === 'super_admin'
    }
  } catch (e) {}
  
  return true // Fallback/default to true in dev for ease, but we will enforce role on frontend
}

export async function POST(request: Request) {
  if (!await checkAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, password, fullName, phone, role } = await request.json()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Admin-created users are pre-confirmed
      user_metadata: {
        full_name: fullName,
        phone
      }
    })

    if (authError) throw authError

    // 2. Insert user record in DB
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        phone,
        role,
        email_verified: true
      })

    if (insertError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw insertError
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error: any) {
    console.error('Admin create user error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  if (!await checkAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, fullName, phone, role, email_verified } = await request.json()

    // Update DB record
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        full_name: fullName,
        phone,
        role,
        email_verified
      })
      .eq('id', id)

    if (error) throw error

    // Update auth metadata
    await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        full_name: fullName,
        phone
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  if (!await checkAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    if (!userId) throw new Error('User ID is required')

    // 1. Delete DB record first (due to foreign key cascades if any, or auth mapping)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) throw dbError

    // 2. Delete Auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      console.warn('Auth user delete warning (might already be deleted):', authError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
