'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AuthShell,
  authIconClass,
  authInputClass,
  authLinkClass,
  authPasswordInputClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/components/auth/auth-shell'
import { AlertCircle, CheckCircle, KeyRound, Loader2, Lock, Eye, EyeOff, ShieldCheck, Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'

// ─── OTP Input Component ──────────────────────────────────────────────────────
function OTPInput({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = [...value]
      if (next[i]) {
        next[i] = ''
        onChange(next)
      } else if (i > 0) {
        refs[i - 1].current?.focus()
      }
    }
  }

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[i] = digit
    onChange(next)
    if (digit && i < 5) refs[i + 1].current?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = Array(6).fill('')
    text.split('').forEach((c, i) => { next[i] = c })
    onChange(next)
    const last = Math.min(text.length, 5)
    refs[last].current?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          onKeyDown={(e) => handleKey(i, e)}
          onChange={(e) => handleChange(i, e.target.value)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`
            w-12 h-14 rounded-2xl border-2 text-center text-2xl font-bold
            transition-all duration-200 outline-none
            ${value[i]
              ? 'border-red-500 bg-red-50 text-red-700 shadow-md shadow-red-100'
              : 'border-slate-200 bg-slate-50 text-slate-900'}
            focus:border-red-500 focus:ring-4 focus:ring-red-500/10 focus:bg-white
            disabled:opacity-50 disabled:cursor-not-allowed
            sm:w-14 sm:h-16
          `}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  )
}

// ─── Reset Password Main Content ──────────────────────────────────────────────
function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Redirect ke forgot-password jika email kosong di URL
  useEffect(() => {
    if (!email) {
      router.push('/forgot-password')
    }
  }, [email, router])

  // Cooldown timer untuk tombol Kirim Ulang OTP
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      setError('Masukkan 6 digit kode OTP terlebih dahulu.')
      return
    }

    if (password !== confirmPassword) {
      setError('Kata sandi baru dan konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode, password }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal mereset kata sandi. Periksa kembali kode OTP Anda.')
        setOtp(Array(6).fill(''))
        setLoading(false)
        return
      }

      setMessage('Kata sandi berhasil diperbarui! Mengarahkan ke halaman login...')
      setTimeout(() => {
        router.push('/login?verified=1')
      }, 2500)
    } catch (err: any) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal mengirim ulang kode OTP.')
      } else {
        setMessage('Kode OTP baru telah dikirim ke email Anda.')
        setOtp(Array(6).fill(''))
        setCooldown(60)
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Atur Ulang Kata Sandi"
      description={`Masukkan kode OTP 6-digit yang dikirim ke ${email ? `${email.slice(0, 4)}***@${email.split('@')[1]}` : 'email Anda'} beserta kata sandi baru.`}
      icon={KeyRound}
      footer={
        <Link href="/login" className={authLinkClass}>
          Kembali ke halaman masuk
        </Link>
      }
    >
      <form onSubmit={handleResetPassword} className="space-y-5">
        {error && (
          <Alert variant="destructive" className="animate-shake rounded-2xl border-red-200 bg-red-50 text-red-700">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="rounded-2xl border-green-100 bg-green-50/50 text-green-700">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 font-medium">{message}</AlertDescription>
          </Alert>
        )}

        {/* Email Indicator */}
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Reset password untuk</p>
            <p className="text-sm text-slate-700 font-semibold truncate">{email}</p>
          </div>
        </div>

        {/* OTP Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-center">
            Masukkan Kode OTP
          </label>
          <OTPInput value={otp} onChange={setOtp} disabled={loading} />
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Kata Sandi Baru
          </label>
          <div className="relative">
            <Lock className={authIconClass} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authPasswordInputClass}
              required
              minLength={8}
              disabled={loading}
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
          <p className="text-[10px] text-slate-400 font-medium">Minimal 8 karakter</p>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Konfirmasi Kata Sandi Baru
          </label>
          <div className="relative">
            <Lock className={authIconClass} />
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={authPasswordInputClass}
              required
              minLength={8}
              disabled={loading}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" className={authPrimaryButtonClass} disabled={loading || otp.filter((d) => d !== '').length < 6}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses…
            </>
          ) : (
            'Atur Ulang Kata Sandi'
          )}
        </Button>

        {/* Resend Button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0 || loading}
          className={authSecondaryButtonClass}
        >
          {resending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengirim ulang…
            </>
          ) : cooldown > 0 ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Kirim ulang dalam {cooldown}d
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Kirim Ulang Kode OTP
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}

// ─── Main Export Page ──────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Atur Ulang Kata Sandi"
          description="Memuat halaman reset kata sandi…"
          icon={KeyRound}
        >
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        </AuthShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
