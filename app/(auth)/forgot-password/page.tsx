'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
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
  const supabase = createBrowserSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSent(true)
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
        title="Check your inbox"
        description="A password reset link has been sent to your email address."
        icon={CheckCircle}
      >
        <div className="space-y-5 text-center">
          <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4">
            <p className="mb-1 text-xs font-semibold text-green-800 uppercase tracking-wider">Reset link sent to:</p>
            <p className="break-all text-sm font-semibold text-green-700">{email}</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-left">
            <p className="text-xs font-semibold text-slate-700 mb-1">💡 Tips:</p>
            <ul className="space-y-1 text-xs text-slate-500">
              <li>• Check your spam / junk folder if you don&apos;t see it</li>
              <li>• The link expires in 1 hour</li>
              <li>• Use the most recent email if you requested multiple times</li>
            </ul>
          </div>

          <Button asChild className={authSecondaryButtonClass}>
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Forgot password?"
      description="Enter your email and we will send a reset link to your inbox."
      icon={Mail}
      footer={
        <Link href="/login" className={authLinkClass}>
          Back to login
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
            Email Address
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
              Sending reset link...
            </>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
