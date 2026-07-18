'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthShell, authLinkClass, authPrimaryButtonClass, authSecondaryButtonClass } from '@/components/auth/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, RefreshCw, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

// ─── OTP Input ───────────────────────────────────────────────────────────────
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

// ─── Main Content ─────────────────────────────────────────────────────────────
function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const provider = searchParams.get('provider') || 'email' // 'google' untuk Google OAuth
  const type = searchParams.get('type') || 'register' // 'register' atau 'login'

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Auto-redirect if no email in URL
  useEffect(() => {
    if (!email) router.push('/login')
  }, [email, router])

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (otp.every((d) => d !== '') && !loading && !success) {
      handleVerify()
    }
  }, [otp])

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) {
      setError('Masukkan 6 digit kode OTP terlebih dahulu.')
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error || 'Verifikasi gagal. Coba lagi.')
        setOtp(Array(6).fill(''))
      } else {
        setSuccess(true)
        if (provider === 'google') {
          // Redirect langsung ke dashboard karena sesi Google sudah aktif
          const role = json.role || 'guest'
          const roleRedirects: Record<string, string> = {
            super_admin: '/admin/dashboard',
            admin: '/admin/dashboard',
            manager: '/manager/dashboard',
            receptionist: '/receptionist/dashboard',
            rest_staff: '/restaurant/dashboard',
            housekeeping: '/housekeeping/dashboard',
            guest: '/dashboard',
          }
          const redirectUrl = roleRedirects[role] || '/dashboard'
          setTimeout(() => router.push(redirectUrl), 2500)
        } else {
          // Email biasa diarahkan ke login
          setTimeout(() => router.push('/login?verified=1'), 2500)
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setError(null)
    setInfo(null)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal mengirim ulang OTP.')
      } else {
        setInfo('Kode OTP baru telah dikirim ke email Anda.')
        setOtp(Array(6).fill(''))
        setCooldown(60)
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setResending(false)
    }
  }

  if (success) {
    const successTitle = provider === 'google'
      ? (type === 'register' ? 'Registrasi Berhasil!' : 'Verifikasi Berhasil!')
      : 'Email Terverifikasi!'

    const successDesc = provider === 'google'
      ? (type === 'register' ? 'Akun Google Anda berhasil diaktifkan. Mengarahkan ke dashboard…' : 'Selamat datang kembali! Mengarahkan ke dashboard…')
      : 'Akun Anda berhasil diaktifkan. Mengarahkan ke halaman login…'

    return (
      <AuthShell
        title={successTitle}
        description={successDesc}
        icon={CheckCircle2}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
          </div>
          <div>
            <p className="text-slate-700 font-semibold">Selamat!</p>
            <p className="text-sm text-slate-400 mt-1">Mengarahkan…</p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full animate-[progress_2.5s_linear_forwards]" />
          </div>
        </div>
      </AuthShell>
    )
  }

  const maskedEmail = email
    ? `${email.slice(0, 4)}***@${email.split('@')[1]}`
    : 'email Anda'

  const titleText = provider === 'google'
    ? (type === 'register' ? 'Verifikasi Pendaftaran' : 'Verifikasi Masuk')
    : 'Verifikasi Email'

  const descriptionText = provider === 'google'
    ? (type === 'register'
      ? `Terima kasih telah mendaftar dengan Google. Untuk keamanan akun Anda, kami telah mengirimkan kode verifikasi 6 digit ke email Google Anda (${maskedEmail}).`
      : `Untuk memverifikasi identitas Anda saat masuk dengan Google, kami telah mengirimkan kode verifikasi 6 digit ke email Google Anda (${maskedEmail}).`)
    : `Kami telah mengirimkan kode 6 digit ke ${maskedEmail}.`

  return (
    <AuthShell
      title={titleText}
      description={descriptionText}
      icon={ShieldCheck}
      footer={
        <>
          Kembali ke{' '}
          <Link href="/login" className={authLinkClass}>
            Halaman Login
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Email indicator */}
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Dikirim ke</p>
            <p className="text-sm text-slate-700 font-semibold truncate">{email}</p>
          </div>
        </div>

        {/* Error / Info alerts */}
        {error && (
          <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 text-red-700">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        {info && (
          <Alert className="rounded-2xl border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">{info}</AlertDescription>
          </Alert>
        )}

        {/* OTP boxes */}
        <div className="space-y-3">
          <p className="text-xs text-center text-slate-400 font-semibold uppercase tracking-wider">
            Masukkan Kode OTP
          </p>
          <OTPInput value={otp} onChange={setOtp} disabled={loading} />
          {otp.some((d) => d !== '') && (
            <p className="text-xs text-center text-slate-400">
              {otp.filter((d) => d !== '').length}/6 digit dimasukkan
            </p>
          )}
        </div>

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.filter((d) => d !== '').length < 6}
          className={authPrimaryButtonClass}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memverifikasi…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Verifikasi Sekarang
            </>
          )}
        </button>

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={resending || cooldown > 0}
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
              Kirim Ulang Kode
            </>
          )}
        </button>

        {/* Tip */}
        <p className="text-xs text-center text-slate-400 leading-relaxed">
          Cek folder <strong>Spam</strong> jika email tidak masuk dalam 1 menit.
          Kode berlaku selama <strong>10 menit</strong>.
        </p>
      </div>
    </AuthShell>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Verifikasi Email"
          description="Memuat halaman verifikasi…"
          icon={Mail}
        >
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        </AuthShell>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
