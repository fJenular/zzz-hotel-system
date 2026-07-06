'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'

type FieldErrors = Partial<Record<'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword', string>>

export default function RegisterPage() {
  const router = useRouter()

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
      errors.fullName = 'Full name is required'
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      errors.email = 'Invalid email format'
    }

    if (!formData.phone.trim() || formData.phone.length < 10) {
      errors.phone = 'Phone number must be at least 10 digits'
    }

    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    
    if (!validateForm()) {
      return
    }

    if (!captchaToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setError('Please complete the captcha verification')
      return
    }

    setLoading(true)

    try {
      console.log('📤 Sending registration request...')
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone
        })
      })

      const result = await response.json()
      console.log('📥 Registration response:', result)

      if (!result.success) {
        if (result.error?.includes('already registered')) {
          setFieldErrors({ email: result.error })
        } else {
          setError(result.error || 'Registration failed')
        }
        setLoading(false)
        return
      }

      // Success — redirect ke halaman verify-email
      // User perlu klik link di email untuk memverifikasi sebelum bisa login
      console.log('✅ Registration successful, redirecting to verify-email...')
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err: any) {
      console.error('❌ Unexpected error during registration:', err)
      if (err instanceof SyntaxError) {
        setError('Server error. Please try again later.')
      } else {
        setError(err.message || 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create account"
      description="Join ZZZ Hotel to book faster and keep your stay details in one place."
      cardTitle="Register with email"
      cardDescription="Tell us the essentials so we can prepare your account."
      icon={UserPlus}
      size="wide"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className={authLinkClass}>
            Sign in
          </Link>
        </>
      }
    >
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-shake rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name *
                </Label>
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
                  />
                </div>
                {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
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
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </Label>
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
                  />
                </div>
                {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password *
                </Label>
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-amber-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password *
                </Label>
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
                  />
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
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

              <Button
                type="submit"
                className={authPrimaryButtonClass}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
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
    </AuthShell>
  )
}
