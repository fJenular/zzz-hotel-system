'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, Lock, Mail } from 'lucide-react'
import { Suspense } from 'react'
import {
  AuthShell,
  adminInputClass,
  adminPasswordInputClass,
  adminIconClass,
  adminPrimaryButtonClass,
  adminLinkClass,
} from '@/components/auth/auth-shell'
import Link from 'next/link'

// Roles yang boleh login di portal admin
const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'receptionist', 'rest_staff', 'housekeeping']

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  receptionist: '/receptionist/dashboard',
  rest_staff: '/restaurant/dashboard',
  housekeeping: '/housekeeping/dashboard',
}

function AdminLoginForm() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: '', password: '' })

  useEffect(() => {
    // Jika sudah login sebagai staff, redirect langsung
    supabase.auth.getSession().then(async ({ data }: { data: any }) => {
      if (data.session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.session.user.id)
          .single()
        const role = userData?.role
        if (role && ADMIN_ROLES.includes(role)) {
          router.replace(ROLE_REDIRECTS[role] || '/admin/dashboard')
        }
      }
    })
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        setError(
          authError.message.includes('Invalid login credentials')
            ? 'Email atau password salah.'
            : authError.message
        )
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Login gagal. Silakan coba lagi.')
        setLoading(false)
        return
      }

      // Ambil role dari tabel users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (userError || !userData) {
        await supabase.auth.signOut()
        setError('Akun tidak ditemukan di sistem.')
        setLoading(false)
        return
      }

      // Tolak jika role bukan staff/admin
      if (!ADMIN_ROLES.includes(userData.role)) {
        await supabase.auth.signOut()
        setError('Akses ditolak. Portal ini hanya untuk staff hotel.')
        setLoading(false)
        return
      }

      // Redirect sesuai role
      router.push(ROLE_REDIRECTS[userData.role] || '/admin/dashboard')

    } catch (err: any) {
      console.error('Admin login error:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Staff Sign In"
      description="Portal khusus untuk karyawan dan administrator ZZZ Hotel."
      icon={ShieldCheck}
      isAdmin={true}
      footer={
        <p className="text-slate-500">
          Bukan staf hotel?{' '}
          <Link href="/login" className={adminLinkClass}>
            Login sebagai tamu →
          </Link>
        </p>
      }
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {/* Error alert */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-2xl p-4 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="admin-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Email Address
          </label>
          <div className="relative">
            <Mail className={adminIconClass} />
            <input
              id="admin-email"
              type="email"
              placeholder="staff@zzzhotel.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              required
              autoComplete="email"
              className={adminInputClass}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="admin-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Password
          </label>
          <div className="relative">
            <Lock className={adminIconClass} />
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
              required
              autoComplete="current-password"
              className={adminPasswordInputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          id="admin-login-submit"
          type="submit"
          disabled={loading}
          className={adminPrimaryButtonClass}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Sign In to Portal
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-slate-950 px-3 font-mono text-[10px] text-slate-500 uppercase tracking-wider">Credentials</span>
        </div>
      </div>

      {/* Demo credentials */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
        <p className="font-mono text-[10px] font-bold text-indigo-400 tracking-wider uppercase mb-3">
          Demo Accounts
        </p>
        <div className="space-y-2">
          {[
            { label: 'Admin', value: 'admin@zzzhotel.com / Admin123!' },
            { label: 'Manager', value: 'manager@zzzhotel.com / Manager123!' },
            { label: 'Receptionist', value: 'receptionist@zzzhotel.com / Recep123!' },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-2 text-[11px] leading-relaxed">
              <span className="font-mono font-bold text-slate-400 w-24 flex-shrink-0">{label}:</span>
              <span className="font-mono text-slate-500 break-all">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </AuthShell>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="color-slate-400 text-xs font-mono">Loading portal...</p>
        </div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  )
}
