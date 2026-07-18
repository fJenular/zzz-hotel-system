import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Service role admin client to bypass RLS policies
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // 1. Validasi sesi user yang sedang login
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Silakan login kembali.' },
        { status: 401 }
      )
    }

    // 2. Ambil file dari FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    // 3. Validasi tipe file & ukuran (maksimal 2MB)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Format file tidak didukung. Harap unggah PNG, JPG, WEBP, atau GIF.' },
        { status: 400 }
      )
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file terlalu besar. Maksimal 2MB.' },
        { status: 400 }
      )
    }

    // 4. Generate nama berkas unik
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // 5. Konversi file ke buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 6. Unggah ke Supabase Storage menggunakan admin client (RLS bypass)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('profiles')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Gagal mengunggah gambar ke storage.' },
        { status: 500 }
      )
    }

    // 7. Ambil URL Publik
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profiles')
      .getPublicUrl(filePath)

    // 8. Perbarui database users
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('DB update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui URL foto profil di database.' },
        { status: 500 }
      )
    }

    console.log(`✅ Avatar updated successfully for user ${user.id}: ${publicUrl}`)

    return NextResponse.json({
      success: true,
      publicUrl
    })
  } catch (error: any) {
    console.error('Upload avatar error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    )
  }
}
