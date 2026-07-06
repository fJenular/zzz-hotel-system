'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import {
  AuthShell,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/components/auth/auth-shell'
import { Mail, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const emailFromUrl = searchParams.get('email')

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          // Tidak ada session — user baru daftar dan belum konfirmasi email
          // Tampilkan halaman verifikasi menggunakan email dari URL param
          if (emailFromUrl) {
            setLoading(false)
            return
          }
          // Tidak ada email dan tidak ada session — redirect ke login
          router.push('/login')
          return
        }

        // User sudah login — cek apakah sudah verifikasi
        const { data: userData } = await supabase
          .from('users')
          .select('email_verified')
          .eq('id', user.id)
          .maybeSingle()

        if (userData?.email_verified) {
          // Sudah terverifikasi — redirect ke home
          router.push('/')
          return
        }

        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('Error checking user:', err)
        setLoading(false)
      }
    }

    checkUser()
  }, [router, supabase, emailFromUrl])

  const handleResendEmail = async () => {
    const email = user?.email || emailFromUrl
    
    if (!email) {
      setError('Email address not found')
      return
    }

    setResending(true)
    setError(null)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      setMessage('Verification email has been resent. Please check your inbox.')
    } catch (err: unknown) {
      console.error('Resend error:', err)
      setError(getErrorMessage(err, 'Failed to resend verification email'))
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <AuthShell
        title="Checking email"
        description="We are checking your account verification status."
        cardTitle="Please wait"
        cardDescription="This only takes a moment."
        icon={Mail}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center text-slate-600">
          <Loader2 className="h-9 w-9 animate-spin text-red-600" />
          <p className="text-sm">Loading...</p>
        </div>
      </AuthShell>
    )
  }

  const displayEmail = user?.email || emailFromUrl || 'your email'

  return (
    <AuthShell
      title="Verify your email"
      description="We've sent a verification link to activate your ZZZ Hotel account."
      cardTitle="Check your inbox"
      cardDescription="The verification email was sent to"
      icon={Mail}
    >
            <div className="space-y-6 text-center">
            <div className="rounded-xl border border-red-100 bg-white/60 p-4">
              <p className="break-all text-lg font-semibold text-red-700">
                {displayEmail}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Please check your inbox and click the verification link to activate your account.
              </p>
              <p className="text-xs text-slate-500">
                Did not receive the email? Check your spam folder or click resend below.
              </p>
            </div>

            {message && (
              <Alert className="rounded-xl border-red-100 bg-white/70">
                <CheckCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-slate-700">{message}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button 
                onClick={handleResendEmail} 
                variant="outline" 
                className={authSecondaryButtonClass}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => router.push('/login')}
                className={authPrimaryButtonClass}
              >
                Back to login
              </Button>
            </div>
            </div>
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <AuthShell
        title="Checking email"
        description="We are checking your account verification status."
        cardTitle="Please wait"
        cardDescription="This only takes a moment."
        icon={Mail}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center text-slate-600">
          <Loader2 className="h-9 w-9 animate-spin text-amber-600" />
          <p className="text-sm">Loading...</p>
        </div>
      </AuthShell>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
