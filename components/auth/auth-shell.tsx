import type { ComponentType, ReactNode } from 'react'
import { Hotel } from 'lucide-react'
import Image from 'next/image'

type AuthShellProps = {
  title: string
  description: string
  cardTitle?: string
  cardDescription?: string
  icon?: ComponentType<{ className?: string }>
  children: ReactNode
  footer?: ReactNode
  isAdmin?: boolean
}

// ─── STANDARD (GUEST / RED ACCENT) ───
export const authInputClass =
  'h-12 w-full rounded-2xl border border-slate-100 bg-slate-50/70 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-red-500 focus-visible:ring-4 focus-visible:ring-red-500/10 transition-all duration-200 outline-none text-sm'

export const authPasswordInputClass =
  'h-12 w-full rounded-2xl border border-slate-100 bg-slate-50/70 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-red-500 focus-visible:ring-4 focus-visible:ring-red-500/10 transition-all duration-200 outline-none text-sm'

export const authIconClass = 'absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors'

export const authLinkClass =
  'font-semibold text-red-600 underline-offset-4 transition-colors hover:text-red-700 hover:underline'

export const authPrimaryButtonClass =
  'h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-base font-semibold text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 hover:opacity-95 transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 border-0'

export const authSecondaryButtonClass =
  'h-12 w-full rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center gap-2 cursor-pointer'

// ─── ADMIN (STAFF / BLACK & SLATE THEME) ───
export const adminInputClass =
  'h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/60 pl-11 pr-4 text-white placeholder:text-slate-500 focus-visible:bg-slate-950 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/10 transition-all duration-200 outline-none text-sm'

export const adminPasswordInputClass =
  'h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/60 pl-11 pr-11 text-white placeholder:text-slate-500 focus-visible:bg-slate-950 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/10 transition-all duration-200 outline-none text-sm'

export const adminIconClass = 'absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors'

export const adminLinkClass =
  'font-semibold text-indigo-400 underline-offset-4 transition-colors hover:text-indigo-300 hover:underline'

export const adminPrimaryButtonClass =
  'h-12 w-full rounded-2xl bg-gradient-to-r from-slate-900 to-black text-base font-semibold text-white border border-slate-800 shadow-lg hover:shadow-black/50 transition-all duration-300 hover:opacity-95 transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2'

export function AuthShell({
  title,
  description,
  cardTitle,
  cardDescription,
  icon: Icon = Hotel,
  children,
  footer,
  isAdmin = false,
}: AuthShellProps) {
  return (
    <main className={`relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-16 text-slate-900 overflow-x-hidden ${isAdmin ? 'bg-slate-950 text-white' : 'bg-blue-50/50'}`}>
      
      {/* ─── BACKGROUND LAYOUT ─── */}
      {!isAdmin ? (
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=1600&auto=format&fit=crop"
            alt="Sky Background"
            fill
            className="object-cover opacity-75"
            priority
          />
          {/* Gentle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-100/20 via-transparent to-white/40" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 select-none pointer-events-none bg-[#090d16]">
          {/* Dark tech grid pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }} />
          {/* Subtle neon glowing points */}
          <div style={{
            position: 'absolute', top: '-10%', right: '-15%',
            width: '600px', height: '600px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '-15%',
            width: '500px', height: '500px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
        </div>
      )}

      {/* ─── TOP LEFT BRANDING ─── */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-md ${isAdmin ? 'bg-indigo-500 shadow-indigo-900/30' : 'bg-red-500 shadow-red-500/25'} text-white`}>
          <Hotel className="h-4.5 w-4.5" />
        </div>
        <span className={`text-base font-bold tracking-wider ${isAdmin ? 'text-white' : 'text-slate-800'}`}>
          ZZZ HOTEL
        </span>
      </div>

      {/* ─── CARD CONTAINER ─── */}
      <div className={`relative z-10 w-full max-w-[460px] rounded-[32px] border p-8 sm:p-10 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
        isAdmin 
          ? 'bg-slate-950/80 border-slate-800/80 shadow-black/60' 
          : 'bg-white/80 border-white/50 shadow-slate-200/50'
      }`}>
        
        {/* Top Centered Icon Badge */}
        <div className="flex justify-center mb-6">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm ${
            isAdmin 
              ? 'bg-slate-900 border-slate-800 text-indigo-400' 
              : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        {/* Info Header */}
        <div className="text-center mb-8">
          {isAdmin && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="font-mono text-[10px] font-bold text-indigo-400 tracking-wider uppercase">ADMIN PORTAL</span>
            </div>
          )}
          <h1 className={`text-2xl font-bold tracking-tight ${isAdmin ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h1>
          <p className={`mt-2 text-xs leading-relaxed max-w-[320px] mx-auto ${isAdmin ? 'text-slate-400' : 'text-slate-500'}`}>
            {description}
          </p>
        </div>

        {/* Inner Content */}
        <div>{children}</div>

        {/* Footer */}
        {footer && (
          <div className={`mt-6 text-center text-xs ${isAdmin ? 'text-slate-500' : 'text-slate-500'}`}>
            {footer}
          </div>
        )}
      </div>

      {/* ─── GLOBAL STYLES & SHAKE KEYFRAME ─── */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-4px); }
          30%, 60%, 90% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        /* Custom Input focus overrides */
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px ${isAdmin ? '#0f172a' : '#f8fafc'} inset !important;
          -webkit-text-fill-color: ${isAdmin ? '#ffffff' : '#0f172a'} !important;
        }
      `}</style>
    </main>
  )
}
