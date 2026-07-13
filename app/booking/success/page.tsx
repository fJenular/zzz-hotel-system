'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { CheckCircle2, Home, Calendar, Bed, CreditCard, ChevronRight, Download, ScanLine } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'react-qr-code'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  
  const bookingId = searchParams.get('bookingId') || ''

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-success', bookingId],
    queryFn: async () => {
      if (!bookingId) return null
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (room_number, room_types(name))
        `)
        .eq('id', bookingId)
        .single()
      return data
    },
    enabled: !!bookingId
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">Memuat Data Pemesanan...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl text-center shadow-xl border border-slate-100 max-w-md w-full">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Pemesanan Tidak Ditemukan</h2>
          <p className="text-slate-500 text-sm mb-6">ID pemesanan tidak valid atau sudah kadaluarsa.</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-emerald-600 rounded-b-[40px] md:rounded-b-[80px] -z-10 shadow-lg" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10 text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Pemesanan Berhasil!</h1>
          <p className="text-emerald-50 text-sm md:text-base max-w-md mx-auto opacity-90">
            Kamar Anda telah berhasil dipesan. Silakan gunakan QR Code di bawah ini saat proses check-in di resepsionis.
          </p>
        </div>

        <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left: Booking Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kamar Anda</p>
                  <p className="text-lg font-black text-slate-800">Kamar {booking.rooms?.room_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Check-in
                  </p>
                  <p className="text-sm font-bold text-slate-700">{new Date(booking.check_in).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Check-out
                  </p>
                  <p className="text-sm font-bold text-slate-700">{new Date(booking.check_out).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Tipe Kamar</span>
                  <span className="font-bold text-slate-800">{booking.rooms?.room_types?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Status Pembayaran</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs uppercase tracking-wider">Berhasil</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-800">Total Dibayar</span>
                  <span className="font-black text-rose-600 text-lg">Rp {Number(booking.total_price).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Right: QR Code for Check-in */}
            <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ScanLine className="w-32 h-32" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 relative z-10 text-center">
                Scan untuk Check-in
              </p>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative z-10 hover:scale-105 transition-transform duration-300">
                <QRCode 
                  id="checkin-qr"
                  value={`CHECKIN:${booking.id}`}
                  size={160}
                  level="H"
                  fgColor="#0f172a"
                />
              </div>

              <div className="mt-5 text-center relative z-10 space-y-3 w-full">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mb-1">ID Reservasi</p>
                  <p className="font-mono text-sm font-bold text-slate-800 tracking-wider">
                    {booking.id.split('-')[0].toUpperCase()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 w-full pt-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`CHECKIN:${booking.id}`)
                      alert('Kode QR disalin!')
                    }}
                    className="flex-1 py-2 text-[10px] font-bold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    Copy Address
                  </button>
                  <button 
                    onClick={() => {
                      const svg = document.getElementById('checkin-qr')
                      if (svg) {
                        const svgData = new XMLSerializer().serializeToString(svg)
                        const canvas = document.createElement('canvas')
                        const ctx = canvas.getContext('2d')
                        const img = new Image()
                        img.onload = () => {
                          canvas.width = img.width
                          canvas.height = img.height
                          ctx?.drawImage(img, 0, 0)
                          const pngFile = canvas.toDataURL('image/png')
                          const downloadLink = document.createElement('a')
                          downloadLink.download = `QR-CheckIn-${booking.rooms?.room_number}.png`
                          downloadLink.href = `${pngFile}`
                          downloadLink.click()
                        }
                        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
                      }
                    }}
                    className="flex-1 py-2 flex items-center justify-center gap-1 text-[10px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => router.push('/my-bookings')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-4 px-8 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            Lihat Pemesanan Saya
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => router.push('/')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-4 px-8 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}