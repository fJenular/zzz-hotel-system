'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TurnstileCaptcha } from '@/components/auth/turnstile-captcha'
import {
  AuthShell,
  authIconClass,
  authInputClass,
  authLinkClass,
  authPasswordInputClass,
  authPrimaryButtonClass,
} from '@/components/auth/auth-shell'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, LogIn, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserSupabaseClient()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Get redirect param from URL
  const redirectTo = searchParams.get('redirect') || '/'
  const justVerified = searchParams.get('verified') === '1'
  const googleVerified = searchParams.get('google_verified') === '1'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Login dengan Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email atau password salah')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Login gagal. Silakan coba lagi.')
        setLoading(false)
        return
      }

      // 2. Cek apakah user record ada di tabel 'users'
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, phone, role, email_verified')
        .eq('id', data.user.id)
        .maybeSingle()

      // 3. Jika user record TIDAK ada, buat sekarang (fallback)
      if (userError || !userData) {
        console.log('⚠️ User record tidak ada, membuat sekarang...')
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
            phone: data.user.user_metadata?.phone || '',
            role: 'guest',
            email_verified: true,
            provider: data.user.app_metadata?.provider || 'email',
          })

        if (insertError) {
          console.error('Failed to create user record:', insertError)
          setError('Login berhasil tapi gagal memuat data profil. Silakan coba lagi.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        router.push('/dashboard')
        return
      }

      // 4. Cek email verification (skip untuk OAuth users)
      const isOAuth = data.user.app_metadata?.provider !== 'email'
      if (!isOAuth && !userData.email_verified) {
        await supabase.auth.signOut()
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
        return
      }

      // 5. Redirect berdasarkan role
      const role = userData.role || 'guest'
      const roleRedirects: Record<string, string> = {
        super_admin: '/admin/dashboard',
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        receptionist: '/receptionist/dashboard',
        rest_staff: '/restaurant/dashboard',
        housekeeping: '/housekeeping/dashboard',
        guest: '/dashboard',
      }

      router.push(roleRedirects[role] || '/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Selamat Datang Kembali"
      description="Masuk untuk mengelola reservasi, pemesanan, dan layanan hotel Anda."
      icon={LogIn}
      footer={
        <>
          Belum punya akun?{' '}
          <Link href="/register" className={authLinkClass}>
            Daftar sekarang
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {justVerified && (
          <Alert className="rounded-2xl border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700 font-medium">
              Email berhasil diverifikasi! Silakan login untuk melanjutkan.
            </AlertDescription>
          </Alert>
        )}

        {googleVerified && (
          <Alert className="rounded-2xl border-blue-200 bg-blue-50">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 font-medium">
              Akun Google Anda berhasil diverifikasi! Klik <strong>"Masuk dengan Google"</strong> di bawah untuk masuk.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="animate-shake rounded-2xl border-red-200 bg-red-50 text-red-700">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}


        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className={authIconClass} />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={authInputClass}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className={authIconClass} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={authPasswordInputClass}
              disabled={loading}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-red-500 p-1"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors underline-offset-4 hover:underline"
            >
              Lupa kata sandi?
            </Link>
          </div>
        </div>

        {/* Captcha — tampil jika site key terkonfigurasi */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div className="flex justify-center py-1">
            <TurnstileCaptcha
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
            />
          </div>
        )}

        {/* Primary CTA */}
        <Button
          type="submit"
          className={authPrimaryButtonClass}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sedang masuk...
            </>
          ) : (
            'Masuk'
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <span className="bg-white/80 px-3 backdrop-blur-sm">Atau masuk dengan</span>
          </div>
        </div>

        {/* Social Sign-in Row */}
        <div className="grid grid-cols-1 gap-3">
          {/* Google */}
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/callback`,
                  queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                  },
                },
              })
              if (error) setError('Google login failed: ' + error.message)
            }}
            className="flex h-11 items-center justify-center rounded-2xl border border-slate-100 bg-white/95 hover:bg-slate-50 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Sign in with Google"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <p className='ml-2'>Masuk dengan Google</p>
          </button>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 w-full rounded-2xl border border-red-100 bg-red-50/50 p-4 text-xs text-slate-500">
          <p className="mb-2 font-mono font-bold text-red-600 uppercase tracking-wider text-[10px]">Akun Demo</p>
          <div className="space-y-1 font-mono text-[11px]">
            <p><span className="font-semibold text-slate-700">Guest:</span> guest@example.com / Guest123!</p>
            <p><span className="font-semibold text-slate-700">Admin:</span> admin@zzzhotel.com / Admin123!</p>
          </div>
        </div>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-mono">Memuat halaman...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
