'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    AuthShell,
    authIconClass,
    authPasswordInputClass,
    authPrimaryButtonClass,
} from '@/components/auth/auth-shell'
import { AlertCircle, CheckCircle, KeyRound, Loader2, Lock } from 'lucide-react'

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
}

export default function ResetPasswordPage() {
    const router = useRouter()
    const supabase = createBrowserSupabaseClient()
    const [loading, setLoading] = useState(false)
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
            router.push('/login')
        } catch (error: unknown) {
            setError(getErrorMessage(error, 'Failed to update password'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthShell
            title="Set new password"
            description="Choose a fresh password for your ZZZ Hotel account."
            cardTitle="Secure your account"
            cardDescription="Use at least 6 characters and confirm it below."
            icon={KeyRound}
        >
            <form onSubmit={handleResetPassword} className="space-y-5">
                {error && (
                    <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {message && (
                    <Alert className="rounded-xl border-red-100 bg-white/70">
                        <CheckCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-slate-700">{message}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                    <div className="relative">
                        <Lock className={authIconClass} />
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={authPasswordInputClass}
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                        <Lock className={authIconClass} />
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={authPasswordInputClass}
                            required
                            minLength={6}
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
