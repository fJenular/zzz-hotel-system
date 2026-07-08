'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AuthShell,
  authIconClass,
  authPasswordInputClass,
  authPrimaryButtonClass,
} from '@/components/auth/auth-shell'
import { AlertCircle, CheckCircle, KeyRound, Loader2, Lock, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage('Password updated successfully. Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Set new password"
      description="Choose a fresh password for your ZZZ Hotel account."
      icon={KeyRound}
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
            <AlertDescription className="text-green-700">{message}</AlertDescription>
          </Alert>
        )}

        {/* New Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            New Password
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-red-500 p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Minimum 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Confirm Password
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
            />
          </div>
        </div>

        <Button type="submit" className={authPrimaryButtonClass} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update password'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
