'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Home, Calendar, CreditCard, ArrowLeft, Loader2, QrCode, X, CheckCircle2, Copy, Download, Bed, ShieldCheck, MapPin } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'react-qr-code'

export default function MyBookingsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')

  // QR Modal State
  const [showQRModal, setShowQRModal] = useState<{isOpen: boolean, booking: any | null}>({ isOpen: false, booking: null })

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/login?redirect=/my-bookings')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        setUser(userData)

        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`
            *,
            rooms (room_number, room_types(name, base_price))
          `)
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })

        setBookings(bookingsData || [])
      } catch (err) {
        console.error('Error loading bookings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [router, supabase])

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter)

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200'
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-200'
      case 'checked_in': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'checked_out': return 'bg-slate-50 text-slate-600 border-slate-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Terkonfirmasi'
      case 'pending': return 'Menunggu Pembayaran'
      case 'cancelled': return 'Dibatalkan'
      case 'checked_in': return 'Sedang Menginap'
      case 'checked_out': return 'Selesai'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Memuat Pesanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* Decorative bg shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rose-50/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
      </div>

      {/* QR Code Modal */}
      {showQRModal.isOpen && showQRModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowQRModal({ isOpen: false, booking: null })}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-6 mt-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">QR Check-In Anda</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Tunjukkan QR Code ini kepada resepsionis saat kedatangan.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-center mb-6 relative overflow-hidden group">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 relative z-10 transition-transform duration-300 group-hover:scale-105">
                <QRCode 
                  id={`qr-modal-${showQRModal.booking.id}`}
                  value={`CHECKIN:${showQRModal.booking.id}`}
                  size={160}
                  level="H"
                  fgColor="#0f172a"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-center mb-4">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mb-0.5">ID Reservasi</p>
                <p className="font-mono text-sm font-bold text-slate-800 tracking-wider">
                  {showQRModal.booking.id.split('-')[0].toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`CHECKIN:${showQRModal.booking.id}`)
                    alert('Alamat QR Code disalin!')
                  }}
                  className="flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin String QR
                </button>
                <button 
                  onClick={() => {
                    const svg = document.getElementById(`qr-modal-${showQRModal.booking.id}`)
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
                        downloadLink.download = `QR-CheckIn-${showQRModal.booking.rooms?.room_number}.png`
                        downloadLink.href = `${pngFile}`
                        downloadLink.click()
                      }
                      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
                    }
                  }}
                  className="flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Simpan Gambar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        
        {/* Back button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-rose-500 mb-8 transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm group-hover:border-rose-200 group-hover:bg-rose-50 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Kembali ke Beranda
        </Link>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pesanan Saya</h1>
            <p className="text-slate-500 text-sm mt-2">Kelola dan pantau semua riwayat reservasi Anda.</p>
          </div>
          
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'pending', label: 'Menunggu' },
              { id: 'confirmed', label: 'Terkonfirmasi' },
              { id: 'checked_in', label: 'Menginap' },
              { id: 'checked_out', label: 'Selesai' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                  filter === f.id 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="bg-white/80 backdrop-blur-sm p-6 rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Info Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
                        <Bed className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                          Kamar {booking.rooms?.room_number}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{booking.rooms?.room_types?.name}</p>
                      </div>
                      <span className={`ml-auto md:ml-4 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="space-y-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" /> Check-in
                        </span>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(booking.check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" /> Check-out
                        </span>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(booking.check_out).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="mt-4 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                        <p className="text-xs text-amber-800 font-medium flex gap-2">
                          <span className="font-bold">Catatan:</span> {booking.special_requests}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Price Section */}
                  <div className="flex flex-col justify-between md:items-end pt-4 border-t border-slate-100 md:border-t-0 md:pt-0 md:border-l md:pl-6 min-w-[200px]">
                    <div className="md:text-right mb-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pembayaran</p>
                      <p className="text-xl font-black text-rose-600">
                        Rp {Number(booking.total_price).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      {booking.status === 'pending' && (
                        <button 
                          onClick={() => router.push(`/booking/payment?bookingId=${booking.id}`)}
                          className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <CreditCard className="w-4 h-4" />
                          Bayar Sekarang
                        </button>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <button 
                          onClick={() => setShowQRModal({ isOpen: true, booking })}
                          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <QrCode className="w-4 h-4" />
                          Tampilkan QR Check-in
                        </button>
                      )}

                      <button 
                        onClick={() => router.push(`/booking/success?bookingId=${booking.id}`)}
                        className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl shadow-sm border border-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                        Detail Pesanan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-[32px] p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">
              {filter === 'all' ? 'Belum Ada Pesanan' : `Tidak ada pesanan dengan status "${getStatusLabel(filter)}"`}
            </h3>
            <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Anda belum memiliki riwayat reservasi kamar. Mulai rencanakan penginapan impian Anda di ZZZ Hotel!' 
                : 'Coba pilih filter lain atau lihat semua pesanan Anda.'}
            </p>
            {filter === 'all' && (
              <button 
                onClick={() => router.push('/booking/select-room')}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-rose-500 text-white font-bold text-sm rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5"
              >
                <Home className="w-4 h-4" />
                Pesan Kamar Sekarang
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}