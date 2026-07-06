'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!captchaToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setError('Please complete the captcha verification')
      return
    }

    setLoading(true)

    try {
      // Verify captcha (skip in development if not configured)
      if (process.env.NODE_ENV === 'production' || process.env.TURNSTILE_SECRET_KEY) {
        const verifyResponse = await fetch('/api/auth/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: captchaToken })
        })

        const contentType = verifyResponse.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server error. Please try again later.')
        }

        const verifyData = await verifyResponse.json()

        if (!verifyData.success) {
          setError(verifyData.error || 'Captcha verification failed')
          setLoading(false)
          return
        }
      }

      // Login user
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please verify your email address. Check your inbox.')
          router.push('/verify-email')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, email_verified')
        .eq('id', data.user.id)
        .single()

      if (userError) {
        console.error('User fetch error:', userError)
        setError('Failed to load user data')
        setLoading(false)
        return
      }

      // Check email verification
      if (!userData?.email_verified) {
        setError('Please verify your email address.')
        router.push('/verify-email')
        setLoading(false)
        return
      }

      // Redirect based on role
      const role = userData?.role || 'guest'

      // If there's a redirect param and user is guest, honor it
      if (redirectTo && redirectTo !== '/' && (role === 'guest' || !role)) {
        router.push(redirectTo)
        return
      }

      let redirectPath = '/'
      if (role === 'admin' || role === 'super_admin') {
        redirectPath = '/admin/dashboard'
      } else if (role === 'manager') {
        redirectPath = '/manager/dashboard'
      } else if (role === 'receptionist') {
        redirectPath = '/receptionist/dashboard'
      } else if (role === 'rest_staff') {
        redirectPath = '/restaurant/dashboard'
      } else if (role === 'housekeeping') {
        redirectPath = '/housekeeping/dashboard'
      }

      router.push(redirectPath)
    } catch (err: unknown) {
      console.error('Login error:', err)
      setError(getErrorMessage(err, 'An unexpected error occurred. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue managing stays, bookings, and hotel operations."
      cardTitle=""
      icon={LogIn}
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={authLinkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <Alert variant="destructive" className="animate-shake rounded-xl border-rose-200 bg-rose-50 text-rose-700">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <AlertDescription className="text-rose-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-rose-500 underline-offset-4 hover:text-rose-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-rose-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Captcha — tampil jika site key terkonfigurasi */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div className="flex justify-center py-2">
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
              Signing in...
            </>
          ) : (
            'Get Started'
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-xs text-gray-400">Or sign in with</span>
          </div>
        </div>

        {/* Social Sign-in Row */}
        <div className="flex items-center justify-center gap-4">
          {/* Google */}
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                  queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                  },
                },
              })
              if (error) setError('Google login failed: ' + error.message)
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-rose-200 hover:shadow-md hover:scale-105 active:scale-95"
            aria-label="Sign in with Google"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </button>

        </div>

        {/* Demo credentials */}
        <div className="mt-2 w-full rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center text-xs text-gray-500">
          <p className="mb-1 font-semibold text-gray-700">Demo Credentials</p>
          <p>Guest: guest@example.com / Guest123!</p>
          <p>Admin: admin@zzzhotel.com / Admin123!</p>
        </div>
      </form>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </AuthShell >
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500 animate-pulse">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
