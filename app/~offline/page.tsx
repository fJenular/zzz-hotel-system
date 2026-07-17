'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RotateCw, Home, PhoneCall } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = () => {
    setIsRetrying(true)
    // Small timeout to simulate checking connection
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }, 1000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6 text-center antialiased">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-xl border border-slate-100 flex flex-col items-center">
        {/* Logo/Icon Container */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
          <WifiOff className="h-10 w-10 animate-pulse" />
        </div>

        {/* Brand */}
        <span className="text-sm font-semibold tracking-widest text-amber-600 uppercase mb-2">
          ZZZ Hotel
        </span>
        
        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          Koneksi Terputus
        </h1>
        
        {/* Description */}
        <p className="mt-4 text-slate-500 text-sm leading-relaxed">
          Sepertinya Anda sedang offline. Beberapa fitur seperti pemesanan kamar dan pembayaran memerlukan koneksi internet aktif.
        </p>

        {/* Status Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
          Mode Offline Aktif
        </div>

        {/* Actions */}
        <div className="mt-8 flex w-full flex-col gap-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-75"
          >
            <RotateCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Mengecek Sinyal...' : 'Coba Hubungkan Kembali'}
          </button>
          
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Help footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-xs text-slate-400">
          <PhoneCall className="h-3.5 w-3.5 text-slate-400" />
          <span>Butuh Bantuan? Hubungi Resepsionis di Kamar Anda</span>
        </div>
      </div>
    </div>
  )
}
