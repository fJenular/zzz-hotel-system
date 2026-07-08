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
          if (emailFromUrl) {
            setLoading(false)
            return
          }
          router.push('/login')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('email_verified')
          .eq('id', user.id)
          .maybeSingle()

        if (userData?.email_verified) {
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
        icon={Mail}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center text-slate-500">
          <Loader2 className="h-9 w-9 animate-spin text-red-600" />
          <p className="text-xs font-mono">Loading...</p>
        </div>
      </AuthShell>
    )
  }

  const displayEmail = user?.email || emailFromUrl || 'your email'

  return (
    <AuthShell
      title="Verify your email"
      description="We've sent a verification link to activate your ZZZ Hotel account."
      icon={Mail}
    >
      <div className="space-y-6 text-center">
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
          <p className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-1">Verification email sent to:</p>
          <p className="break-all text-sm font-semibold text-red-700">
            {displayEmail}
          </p>
        </div>

        <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
          <p>
            Please check your inbox and click the verification link to activate your account.
          </p>
          <p>
            Did not receive the email? Check your spam folder or click resend below.
          </p>
        </div>

        {message && (
          <Alert className="rounded-2xl border-green-100 bg-green-50/50 text-green-700">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 text-left">{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="animate-shake rounded-2xl border-red-200 bg-red-50 text-red-700">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 text-left">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 pt-2">
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
        icon={Mail}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center text-slate-500">
          <Loader2 className="h-9 w-9 animate-spin text-red-600" />
          <p className="text-xs font-mono">Loading...</p>
        </div>
      </AuthShell>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
