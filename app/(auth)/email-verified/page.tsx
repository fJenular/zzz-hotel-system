'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AuthShell,
  authPrimaryButtonClass,
} from '@/components/auth/auth-shell'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function EmailVerifiedPage() {
  const router = useRouter()

  // Auto redirect ke home setelah 5 detik
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <AuthShell
      title="Email verified!"
      description="Your account has been successfully activated."
      cardTitle="Welcome to ZZZ Hotel 🎉"
      cardDescription="Your email address has been verified. You can now log in and enjoy all features."
      icon={CheckCircle}
    >
      <div className="space-y-6 text-center">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            ✅ Account activated successfully
          </p>
          <p className="text-xs text-slate-500">
            You will be redirected to the homepage in 5 seconds...
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className={authPrimaryButtonClass}>
            <Link href="/login">
              Login to Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="ghost" className="w-full text-slate-600 hover:text-slate-800">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
