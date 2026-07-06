'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

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
        // Error 500 biasanya berarti SMTP belum dikonfigurasi di Supabase
        if (error.status === 500 || error.message?.toLowerCase().includes('smtp') || error.message?.toLowerCase().includes('sending')) {
          setError('Email service is not configured yet. Please contact the administrator.')
        } else {
          setError(error.message)
        }
        return
      }

      setSent(true)
    } catch (err: unknown) {
      console.error('Reset password error:', err)
      setError(getErrorMessage(err, 'Failed to send reset email. Please try again later.'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        description="A password reset link has been sent to your email address."
        cardTitle="Email sent!"
        cardDescription="Click the link in the email to set a new password."
        icon={CheckCircle}
      >
        <div className="space-y-5 text-center">
          <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
            <p className="mb-1 text-sm font-medium text-green-800">Reset link sent to:</p>
            <p className="break-all text-sm font-semibold text-green-700">{email}</p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-left">
            <p className="text-xs font-semibold text-amber-800 mb-1">💡 Tips:</p>
            <ul className="space-y-1 text-xs text-amber-700">
              <li>• Check your spam / junk folder if you don&apos;t see it</li>
              <li>• The link expires in 1 hour</li>
              <li>• Use the most recent email if you requested multiple times</li>
            </ul>
          </div>

          <Button asChild variant="outline" className={authSecondaryButtonClass}>
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
      cardTitle="Reset password"
      cardDescription="Use the email connected to your ZZZ Hotel account."
      icon={Mail}
      footer={
        <Link href="/login" className={authLinkClass}>
          Back to login
        </Link>
      }
    >
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
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
