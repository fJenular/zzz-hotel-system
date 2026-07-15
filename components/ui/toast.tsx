'use client'

import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (opts: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')

  const success = (title: string, message?: string) =>
    ctx.toast({ type: 'success', title, message, duration: 4000 })
  const error = (title: string, message?: string) =>
    ctx.toast({ type: 'error', title, message, duration: 5000 })
  const warning = (title: string, message?: string) =>
    ctx.toast({ type: 'warning', title, message, duration: 4500 })
  const info = (title: string, message?: string) =>
    ctx.toast({ type: 'info', title, message, duration: 3500 })

  return { toast: ctx.toast, success, error, warning, info, dismiss: ctx.dismiss }
}

// ─── Single Toast Item ────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  const dismiss = useCallback(() => {
    setLeaving(true)
    setTimeout(() => onDismiss(toast.id), 350)
  }, [toast.id, onDismiss])

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setVisible(true))
    // Auto-dismiss
    timerRef.current = setTimeout(dismiss, toast.duration ?? 4000)
    return () => clearTimeout(timerRef.current)
  }, [dismiss, toast.duration])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error:   <XCircle      className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info:    <Info          className="w-5 h-5 text-blue-400 shrink-0" />,
  }

  const bars = {
    success: 'bg-emerald-400',
    error:   'bg-rose-400',
    warning: 'bg-amber-400',
    info:    'bg-blue-400',
  }

  const borders = {
    success: 'border-l-emerald-400',
    error:   'border-l-rose-400',
    warning: 'border-l-amber-400',
    info:    'border-l-blue-400',
  }

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gray-900 text-white rounded-2xl shadow-2xl
        border border-white/10 border-l-4 ${borders[toast.type]}
        p-4 pr-10 min-w-[300px] max-w-[380px]
        flex items-start gap-3
        transition-all duration-350 ease-out
        ${visible && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden rounded-b-2xl">
        <div
          className={`h-full ${bars[toast.type]} origin-left`}
          style={{
            animation: `toastProgress ${toast.duration ?? 4000}ms linear forwards`,
          }}
        />
      </div>
    </div>
  )
}

// ─── Provider + Container ─────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...opts, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
