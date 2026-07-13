'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  User, Camera, Save, ArrowLeft, Loader2, Mail, Phone, 
  Shield, CheckCircle2, AlertCircle, Sparkles, Edit3
} from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/login?redirect=/profile')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          setUser(userData)
          setFullName(userData.full_name || '')
          setPhone(userData.phone || '')
          setAvatarUrl(userData.avatar_url || null)
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router, supabase])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: 'Foto profil berhasil diupdate!' })
    } catch (err: any) {
      console.error('Upload error:', err)
      setMessage({ type: 'error', text: err.message || 'Gagal upload foto' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' })
    } catch (err: any) {
      console.error('Save error:', err)
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan profil' })
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    switch(role) {
      case 'admin':
      case 'super_admin':
        return 'bg-rose-50 text-rose-600 border-rose-200'
      case 'manager':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200'
      case 'receptionist':
        return 'bg-amber-50 text-amber-600 border-amber-200'
      case 'housekeeping':
        return 'bg-sky-50 text-sky-600 border-sky-200'
      case 'rest_staff':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'manager': return 'Manajer'
      case 'receptionist': return 'Resepsionis'
      case 'housekeeping': return 'Housekeeping'
      case 'rest_staff': return 'Staf Dapur'
      default: return 'Tamu'
    }
  }

  const getInitials = (name: string) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50/30">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-rose-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-rose-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-rose-50 flex items-center justify-center">
              <User className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Memuat profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/20 font-sans antialiased">
      {/* Decorative bg shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-10">
        {/* Back button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-rose-500 mb-8 transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm group-hover:border-rose-200 group-hover:bg-rose-50 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Kembali ke Beranda
        </Link>

        {/* MAIN CARD */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[32px] border border-slate-100/80 shadow-xl shadow-slate-200/50 overflow-hidden">
          
          {/* HERO HEADER */}
          <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-rose-900 px-8 pt-10 pb-20 overflow-hidden">
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}></div>
            <div className="absolute top-4 right-6 opacity-10">
              <Sparkles className="w-24 h-24 text-white" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">Akun Saya</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Profil Saya</h1>
              <p className="text-slate-400 text-sm mt-1">Kelola informasi pribadi dan pengaturan akun kamu</p>
            </div>
          </div>

          {/* AVATAR — floats between header and body */}
          <div className="relative flex justify-center -mt-12 mb-4 z-10">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl ring-4 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Foto Profil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-slate-500">
                    {getInitials(fullName)}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 flex items-center justify-center w-8 h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                title="Ubah foto profil"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          {/* NAME & ROLE badge centered */}
          <div className="text-center pb-6 px-8">
            <h2 className="text-xl font-black text-slate-800">{fullName || 'Nama Belum Diisi'}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeStyle(user?.role)}`}>
                <Shield className="w-3 h-3" />
                {getRoleLabel(user?.role)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Klik ikon kamera untuk mengganti foto profil</p>
          </div>

          {/* DIVIDER */}
          <div className="mx-8 border-t border-slate-100"></div>

          {/* FORM BODY */}
          <div className="px-8 py-8 space-y-6">

            {/* Alert message */}
            {message && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl text-sm border transition-all animate-slide-up ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {message.type === 'success' 
                  ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                }
                <span className="font-medium">{message.text}</span>
              </div>
            )}

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5" />
                Email
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-sm text-slate-500 font-medium flex-1">{user?.email || '-'}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Tidak Bisa Diubah</span>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                Nama Lengkap
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap kamu"
                  className="w-full px-4 py-3.5 text-sm bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all"
                />
                <Edit3 className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label htmlFor="phone" className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Phone className="w-3.5 h-3.5" />
                Nomor Telepon
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon kamu"
                  className="w-full px-4 py-3.5 text-sm bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all"
                />
                <Edit3 className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>

            {/* Role (read-only, styled) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                Role Akun
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeStyle(user?.role)}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  {getRoleLabel(user?.role)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 ml-auto bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Tidak Bisa Diubah</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="relative w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
                {/* Shine effect */}
                {!saving && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/20 to-transparent rotate-12 transform translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-medium">
              Data kamu aman & terenkripsi
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              <span className="text-[10px] font-bold text-emerald-600">Akun Aktif</span>
            </div>
          </div>
        </div>

        {/* Info card below */}
        <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl shrink-0">
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Keamanan Akun</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Untuk mengubah email atau password, silakan hubungi admin hotel.</p>
          </div>
        </div>
      </div>
    </div>
  )
}