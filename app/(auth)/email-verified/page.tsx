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
      icon={CheckCircle}
    >
      <div className="space-y-6 text-center">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border border-green-100 shadow-sm shadow-green-100">
            <CheckCircle className="h-10 w-10 text-green-600 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700">
            ✅ Account activated successfully
          </p>
          <p className="text-xs text-slate-500 font-medium">
            You will be redirected to the homepage in 5 seconds...
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button asChild className={authPrimaryButtonClass}>
            <Link href="/login">
              Login to Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="ghost" className="w-full h-12 rounded-2xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-sm">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
