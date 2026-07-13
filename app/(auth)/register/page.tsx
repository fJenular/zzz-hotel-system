'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

type FieldErrors = Partial<Record<'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword', string>>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const validateForm = () => {
    const errors: FieldErrors = {}

    if (!formData.fullName.trim()) {
      errors.fullName = 'Nama lengkap wajib diisi'
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      errors.email = 'Format email tidak valid'
    }

    if (!formData.phone.trim() || formData.phone.length < 10) {
      errors.phone = 'Nomor telepon minimal 10 angka'
    }

    if (formData.password.length < 8) {
      errors.password = 'Kata sandi minimal 8 karakter'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Kata sandi tidak cocok'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!validateForm()) return

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json?.error && json.error.toLowerCase().includes('already')) {
          setFieldErrors({ email: 'Email sudah terdaftar. Silakan login atau gunakan lupa password.' })
        } else if (json?.details) {
          setError(json.error || JSON.stringify(json.details))
        } else {
          setError(json.error || 'Terjadi kesalahan saat mendaftar')
        }
        setLoading(false)
        return
      }

      if (json?.success) {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        setError(json?.message || 'Pendaftaran gagal')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Daftar Akun"
      description="Bergabung dengan ZZZ Hotel untuk pemesanan lebih cepat dan kelola reservasi Anda dalam satu tempat."
      icon={UserPlus}
      footer={
        <>
          Sudah punya akun?{' '}
          <Link href="/login" className={authLinkClass}>
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="animate-shake rounded-2xl border-red-200 bg-red-50 text-red-700">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="fullName" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Nama Lengkap
          </label>
          <div className="relative">
            <User className={authIconClass} />
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={authInputClass}
              disabled={loading}
              required
            />
          </div>
          {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.fullName}</p>}
        </div>

        {/* Email Address */}
        <div className="space-y-1">
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
              autoComplete="email"
              required
            />
          </div>
          {fieldErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.email}</p>}
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label htmlFor="phone" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Nomor Telepon
          </label>
          <div className="relative">
            <Phone className={authIconClass} />
            <Input
              id="phone"
              type="tel"
              placeholder="081234567890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={authInputClass}
              disabled={loading}
              required
            />
          </div>
          {fieldErrors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.phone}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
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
              autoComplete="new-password"
              required
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
          {fieldErrors.password && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.password}</p>}
          {!fieldErrors.password && <p className="text-[10px] text-slate-400 font-medium">Minimal 8 karakter</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Konfirmasi Kata Sandi
          </label>
          <div className="relative">
            <Lock className={authIconClass} />
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={authPasswordInputClass}
              disabled={loading}
              autoComplete="new-password"
              required
            />
          </div>
          {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.confirmPassword}</p>}
        </div>

        {/* Captcha */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div className="flex justify-center py-1">
            <TurnstileCaptcha
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
            />
          </div>
        )}

        <Button
          type="submit"
          className={authPrimaryButtonClass}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mendaftar...
            </>
          ) : (
            'Buat Akun'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}