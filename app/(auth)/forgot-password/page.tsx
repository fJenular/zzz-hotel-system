'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AuthShell,
  authIconClass,
  authInputClass,
  authLinkClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/components/auth/auth-shell'
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal memproses permintaan. Silakan coba lagi.')
        return
      }

      setSent(true)
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
      }, 2500)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError('Gagal memproses permintaan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Kode OTP Dikirim!"
        description="Kode OTP 6-digit telah dikirim ke alamat email Anda."
        icon={CheckCircle}
      >
        <div className="space-y-5 text-center">
          <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4">
            <p className="mb-1 text-xs font-semibold text-green-800 uppercase tracking-wider">Kode dikirim ke:</p>
            <p className="break-all text-sm font-semibold text-green-700">{email}</p>
          </div>

          <div className="py-2">
            <p className="text-xs text-slate-400">Mengarahkan ke halaman reset password…</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-red-500 rounded-full animate-[progress_2.5s_linear_forwards]" />
            </div>
          </div>

          <Button asChild className={authSecondaryButtonClass}>
            <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
              Buka Halaman Reset Sekarang
            </Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Lupa Kata Sandi?"
      description="Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi."
      icon={Mail}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <Button
          type="submit"
          className={authPrimaryButtonClass}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim tautan...
            </>
          ) : (
            'Kirim Tautan Reset'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
