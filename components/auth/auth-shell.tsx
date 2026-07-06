import type { ComponentType, ReactNode } from 'react'
import { Hotel, Sparkles, ShieldCheck, MapPin } from 'lucide-react'
import Image from 'next/image'

import { Card, CardContent } from '@/components/ui/card'

type AuthShellProps = {
  title: string
  description: string
  cardTitle: string
  cardDescription?: string
  icon?: ComponentType<{ className?: string }>
  children: ReactNode
  footer?: ReactNode
  size?: 'default' | 'wide'
}

export const authInputClass =
  'h-12 rounded-xl border-gray-200 bg-white/80 pl-11 text-gray-900 placeholder:text-gray-400 focus-visible:border-rose-500 focus-visible:ring-rose-500/20 transition-all duration-200'

export const authPasswordInputClass =
  'h-12 rounded-xl border-gray-200 bg-white/80 pl-11 pr-11 text-gray-900 placeholder:text-gray-400 focus-visible:border-rose-500 focus-visible:ring-rose-500/20 transition-all duration-200'

export const authIconClass = 'absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-400/80'

export const authLinkClass =
  'font-semibold text-rose-600 underline-offset-4 transition-colors hover:text-rose-700 hover:underline'

export const authPrimaryButtonClass =
  'h-12 w-full rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-500 text-base font-semibold text-white shadow-lg shadow-rose-500/25 transition-all duration-300 hover:from-rose-700 hover:via-rose-600 hover:to-red-600 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer'

export const authSecondaryButtonClass =
  'h-12 w-full rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all duration-300 hover:bg-gray-50 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center gap-2 cursor-pointer'

export function AuthShell({
  title,
  description,
  cardTitle,
  cardDescription,
  icon: Icon = Hotel,
  children,
  footer,
  size = 'default',
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen w-full bg-gray-50/50 text-gray-900">
      {/* Left side: Premium Image Panel (Visible on Desktop) */}
      <section className="relative hidden w-1/2 lg:flex flex-col justify-between overflow-hidden bg-gray-950 p-12 text-white">
        {/* Background Image with elegant overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80" 
            alt="Luxury Hotel Lobby" 
            fill
            className="object-cover opacity-60 scale-105 transition-transform duration-10000 hover:scale-100"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-gray-950/40 to-rose-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_30%,rgba(0,0,0,0.6)_100%)]" />
        </div>

        {/* Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-900/40">
            <Hotel className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-wider text-white">ZZZ HOTEL</span>
        </div>

        {/* Mid Text */}
        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-5xl font-extrabold tracking-tight leading-tight text-white">
            Your Gateway to <br />
            <span className="text-rose-400">Tranquility &amp; Luxury</span>
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Experience world-class accommodation, award-winning fine dining, and unparalleled comfort designed just for you.
          </p>

          {/* Micro Features list */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-gray-200">5-Star Luxury Suites &amp; Smart Rooms</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-gray-200">Guaranteed Secure Booking &amp; Flexible Check-ins</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-gray-200">Located in the Heart of the Hospitality Hub</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-gray-400">
          © 2026 ZZZ Hotel. All rights reserved.
        </div>
      </section>

      {/* Right side: Authentication Form Panel */}
      <section className="relative flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Soft radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.06)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.04)_0%,transparent_50%)] pointer-events-none" />
        
        <div className="mx-auto w-full max-w-md">
          {/* Logo on mobile only */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-200">
              <Hotel className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-wider text-rose-600">ZZZ HOTEL</h1>
          </div>

          {/* Icon + Title + Description */}
          <div className="mb-8 flex flex-col items-center text-center">
            {/* Icon badge */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-100">
              <Icon className="h-7 w-7 text-gray-700" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-xs">
              {description}
            </p>
          </div>

          <Card className="border border-gray-100 bg-white/80 shadow-xl shadow-gray-200/50 backdrop-blur-md rounded-2xl">
            <CardContent className="pt-8 pb-8 px-6 sm:px-8">{children}</CardContent>
          </Card>

          {footer ? (
            <div className="mt-6 text-center text-sm text-gray-500">
              {footer}
            </div>
          ) : null}
          
          <p className="mt-8 text-center text-xs text-gray-400 lg:hidden">
            © 2026 ZZZ Hotel. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  )
}
