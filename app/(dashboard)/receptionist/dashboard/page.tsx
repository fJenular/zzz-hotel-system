'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  DoorOpen, LogOut, Bell, RefreshCw, CheckCircle, Clock, 
  ArrowRight, Sparkles, User, Search, Calendar, KeyRound, Star,
  Heart, Mail, MoreHorizontal, QrCode, X, Check
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import QRCode from 'react-qr-code'

export default function ReceptionistDashboard() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'rooms' | 'checkin' | 'checkout'>('rooms')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // State for Check-in Scan Modal
  const [showScanModal, setShowScanModal] = useState(false)
  const [scanInput, setScanInput] = useState('')

  // State for QR Modal
  const [showCheckoutQR, setShowCheckoutQR] = useState<{isOpen: boolean, booking: any | null}>({
    isOpen: false,
    booking: null
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (userData?.role !== 'receptionist' && userData?.role !== 'admin' && userData?.role !== 'super_admin') {
        router.push('/')
        return
      }
      setUser(userData)
      fetchData()
    }
    checkUser()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*, room_types (name)')
      .order('room_number')

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*, users (full_name, email, phone), rooms (room_number, room_types (name)), payments (status)')
      .order('created_at', { ascending: false })

    if (roomsData) setRooms(roomsData)
    if (bookingsData) {
      const mapped = bookingsData.map((b: any) => ({
        ...b,
        payment_status: b.payments?.[0]?.status || 'unpaid'
      }))
      setBookings(mapped)
    }
    setLoading(false)
  }

  const handleCheckIn = async (bookingId: string, roomId: string) => {
    try {
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({ status: 'checked_in' })
        .eq('id', bookingId)
      if (bookingErr) throw bookingErr

      const { error: roomErr } = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', roomId)
      if (roomErr) throw roomErr

      alert('Check-In berhasil! Kamar sekarang ditandai sebagai terisi.')
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Check-In gagal')
    }
  }

  const handleCheckOut = async (bookingId: string, roomId: string) => {
    try {
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({ status: 'checked_out' })
        .eq('id', bookingId)
      if (bookingErr) throw bookingErr

      const { error: roomErr } = await supabase
        .from('rooms')
        .update({ status: 'dirty' })
        .eq('id', roomId)
      if (roomErr) throw roomErr

      const { error: taskErr } = await supabase
        .from('housekeeping_tasks')
        .insert({
          room_id: roomId,
          task_type: 'cleaning',
          status: 'pending',
          priority: 'normal',
          due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        })
      if (taskErr) throw taskErr

      setShowCheckoutQR({ isOpen: false, booking: null })
      alert('Check-Out berhasil! Tugas housekeeping otomatis dibuat.')
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Check-Out gagal')
    }
  }

  const handleUpdateRoomStatus = async (roomId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId)
      if (error) throw error
      alert(`Status kamar diperbarui menjadi ${newStatus}`)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status')
    }
  }

  const handleScanSubmit = () => {
    if (scanInput.startsWith('CHECKIN:')) {
      const bookingId = scanInput.replace('CHECKIN:', '')
      const booking = bookings.find(b => b.id === bookingId)
      if (booking && booking.status === 'confirmed') {
        handleCheckIn(booking.id, booking.room_id)
        setShowScanModal(false)
        setScanInput('')
      } else {
        alert('Booking tidak ditemukan atau status bukan confirmed.')
      }
    } else {
      alert('Format QR tidak valid.')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredRooms = rooms.filter((room: any) => 
    room.room_number.includes(searchQuery) || 
    room.room_types?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const checkinQueue = bookings.filter((b: any) => b.status === 'confirmed')
  const checkoutQueue = bookings.filter((b: any) => b.status === 'checked_in')

  return (
    <div className="flex min-h-screen bg-amber-50/30 font-sans text-slate-800 antialiased relative">
      
      {/* CHECK-IN SCAN MODAL */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl relative">
            <button 
              onClick={() => {
                setShowScanModal(false)
                setScanInput('')
              }}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-6 mt-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Scan QR Check-In</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Simulasi scan QR: Paste alamat/string QR dari tamu untuk mengonfirmasi check-in.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Data QR Code</label>
                <input 
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Contoh: CHECKIN:uuid..."
                  className="w-full p-4 border-2 border-emerald-100 bg-emerald-50/20 rounded-2xl text-sm font-mono focus:outline-none focus:border-emerald-400 transition-colors"
                  autoFocus
                />
              </div>

              <button 
                onClick={handleScanSubmit}
                disabled={!scanInput}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200 disabled:shadow-none"
              >
                <Check className="w-4 h-4" />
                Proses Check-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT QR MODAL */}
      {showCheckoutQR.isOpen && showCheckoutQR.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowCheckoutQR({ isOpen: false, booking: null })}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-6 mt-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">QR Check-out</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Tunjukkan QR ini kepada tamu sebagai bukti akses keluar (gate pass).</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-center mb-6">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <QRCode 
                  value={`CHECKOUT:${showCheckoutQR.booking.id}:${Math.random().toString(36).substring(7)}`}
                  size={160}
                  level="H"
                  fgColor="#0f172a"
                />
              </div>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-2xl mb-6">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Kamar {showCheckoutQR.booking.rooms?.room_number}</p>
              <p className="text-sm font-bold text-slate-800">{showCheckoutQR.booking.users?.full_name}</p>
            </div>

            <button 
              onClick={() => handleCheckOut(showCheckoutQR.booking.id, showCheckoutQR.booking.room_id)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 text-white text-sm font-bold rounded-2xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
            >
              <Check className="w-4 h-4" />
              Konfirmasi Check-out
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-amber-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/Zzz.svg" alt="ZZZ Hotel Logo" width={40} height={40} className="object-contain" priority />
            <div>
              <span className="text-xl font-black text-slate-800 tracking-tight block leading-tight">ZZZ HOTEL</span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mt-0.5">Resepsionis</span>
            </div>
          </Link>

          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('rooms')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                activeTab === 'rooms' ? 'text-amber-600 bg-amber-50 border border-amber-100/50' : 'text-slate-500 hover:bg-amber-50/50 hover:text-slate-800'
              }`}
            >
              <DoorOpen className="w-5 h-5" />
              <span>Grid Kamar</span>
            </button>
            <button 
              onClick={() => setActiveTab('checkin')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                activeTab === 'checkin' ? 'text-amber-600 bg-amber-50 border border-amber-100/50' : 'text-slate-500 hover:bg-amber-50/50 hover:text-slate-800'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Antrian Check-In</span>
              {checkinQueue.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{checkinQueue.length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('checkout')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                activeTab === 'checkout' ? 'text-amber-600 bg-amber-50 border border-amber-100/50' : 'text-slate-500 hover:bg-amber-50/50 hover:text-slate-800'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
              <span>Antrian Check-Out</span>
              {checkoutQueue.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{checkoutQueue.length}</span>
              )}
            </button>
          </nav>

          <div className="pt-4 space-y-2">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100/50">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Selamat Datang</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{user?.full_name || 'Tamu'}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-amber-100/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
          <p className="text-[9px] text-slate-400 font-medium text-center leading-relaxed">
            Resepsionis ZZZ Hotel<br />
            © 2026 Hak Cipta Dilindungi
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-white border-b border-amber-100/50 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Resepsi Front Desk</h1>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100/50">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
              <div className="relative hidden sm:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari kamar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-amber-100 bg-amber-50/20 rounded-2xl text-xs focus:outline-none focus:border-amber-300 transition-colors"
                />
              </div>

            <div className="flex items-center gap-3 border-r border-amber-100 pr-5">
              <button className="p-2 text-slate-400 hover:text-amber-500 transition-colors" aria-label="Favorit">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-amber-500 transition-colors relative" aria-label="Notifikasi">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 border border-white rounded-full"></span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50 text-xs font-bold font-mono">
                {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'FR'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-800 leading-none">{user?.full_name || 'Resepsionis'}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">Resepsionis</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">Memuat data front desk...</div>
          ) : (
            <>
              {/* ROOMS GRID TAB */}
              {activeTab === 'rooms' && (
                <div className="space-y-6 animate-scale-up">
                  <div className="flex justify-between items-center gap-4 flex-wrap">
                    <div className="relative max-w-md w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Cari nomor kamar, tipe, atau status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2.5 w-full border border-amber-100 bg-white rounded-2xl text-sm focus:outline-none focus:border-amber-300 transition-colors"
                      />
                    </div>
                    <div className="flex gap-2 text-xs font-medium text-slate-500 bg-white p-1.5 rounded-2xl border border-amber-100 shadow-sm">
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 rounded-xl"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tersedia</span>
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-rose-50 text-rose-600 rounded-xl"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Ditempati</span>
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-amber-50 text-amber-600 rounded-xl"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Kotor</span>
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-slate-50 text-slate-500 rounded-xl"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Perbaikan</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredRooms.map((room: any) => {
                      let statusBg = 'bg-white border-emerald-100'
                      let statusHeader = 'bg-emerald-50 text-emerald-700'
                      let statusDot = 'bg-emerald-500'
                      let statusLabel = 'Tersedia'
                      if (room.status === 'occupied') {
                        statusBg = 'bg-white border-rose-100'
                        statusHeader = 'bg-rose-50 text-rose-700'
                        statusDot = 'bg-rose-500'
                        statusLabel = 'Ditempati'
                      } else if (room.status === 'dirty') {
                        statusBg = 'bg-white border-amber-100'
                        statusHeader = 'bg-amber-50 text-amber-700'
                        statusDot = 'bg-amber-500'
                        statusLabel = 'Kotor'
                      } else if (room.status === 'maintenance') {
                        statusBg = 'bg-white border-slate-100'
                        statusHeader = 'bg-slate-50 text-slate-700'
                        statusDot = 'bg-slate-500'
                        statusLabel = 'Perbaikan'
                      }

                      return (
                        <div 
                          key={room.id}
                          className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${statusBg}`}
                        >
                          <div className={`px-4 py-2 flex justify-between items-center ${statusHeader}`}>
                            <span className="text-xs font-black uppercase tracking-wider">{statusLabel}</span>
                            <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`}></span>
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-black text-slate-800">{room.room_number}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{room.room_types?.name}</p>
                            <p className="text-[10px] text-slate-400">Lantai {room.floor}</p>
                            <select 
                              value={room.status}
                              onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                              className="text-[10px] font-bold py-1.5 px-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none w-full cursor-pointer"
                            >
                              <option value="available">Tersedia</option>
                              <option value="occupied">Ditempati</option>
                              <option value="dirty">Kotor</option>
                              <option value="maintenance">Perbaikan</option>
                            </select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* CHECK-IN QUEUE TAB */}
              {activeTab === 'checkin' && (
                <div className="space-y-4 animate-slide-up">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-black text-slate-900">Tamu yang Akan Tiba</h2>
                    <button 
                      onClick={() => setShowScanModal(true)}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                      <QrCode className="w-4 h-4" />
                      + Check-In (Scan QR)
                    </button>
                  </div>
                  {checkinQueue.length === 0 ? (
                    <div className="bg-white border border-amber-100 p-16 text-center rounded-[28px]">
                      <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                      <p className="font-bold text-slate-700">Semua beres!</p>
                      <p className="text-xs text-slate-400 mt-1">Tidak ada tamu yang perlu di-check in hari ini.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-amber-100 rounded-[28px] overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-amber-50">
                        <thead className="bg-amber-50/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Tamu</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Kamar</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pembayaran</th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold text-amber-600 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                          {checkinQueue.map((booking: any) => (
                            <tr key={booking.id} className="hover:bg-amber-50/30 transition">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{booking.users?.full_name || 'Tamu'}</div>
                                <div className="text-xs text-slate-400">{booking.users?.phone || 'Tidak ada telepon'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-amber-600">Kamar {booking.rooms?.room_number}</div>
                                <div className="text-[10px] text-slate-400">{booking.rooms?.room_types?.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-medium text-slate-600">
                                  {new Date(booking.check_in).toLocaleDateString('id-ID')} 
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  → {new Date(booking.check_out).toLocaleDateString('id-ID')}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                                  booking.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {booking.payment_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleCheckIn(booking.id, booking.room_id)}
                                  className="px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ml-auto"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  Scan Check In
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* CHECK-OUT QUEUE TAB */}
              {activeTab === 'checkout' && (
                <div className="space-y-4 animate-slide-up">
                  <h2 className="text-lg font-black text-slate-900">Tamu yang Akan Pergi</h2>
                  {checkoutQueue.length === 0 ? (
                    <div className="bg-white border border-amber-100 p-16 text-center rounded-[28px]">
                      <Clock className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                      <p className="font-bold text-slate-700">Tidak ada inap aktif</p>
                      <p className="text-xs text-slate-400 mt-1">Tidak ada tamu yang siap untuk check-out.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-amber-100 rounded-[28px] overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-amber-50">
                        <thead className="bg-amber-50/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Tamu</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Kamar</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Periode Inap</th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold text-amber-600 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                          {checkoutQueue.map((booking: any) => (
                            <tr key={booking.id} className="hover:bg-amber-50/30 transition">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{booking.users?.full_name || 'Tamu'}</div>
                                <div className="text-xs text-slate-400">{booking.users?.phone || 'Tidak ada telepon'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-amber-600">Kamar {booking.rooms?.room_number}</div>
                                <div className="text-[10px] text-slate-400">{booking.rooms?.room_types?.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-medium text-slate-600">
                                  {new Date(booking.check_in).toLocaleDateString('id-ID')} - {new Date(booking.check_out).toLocaleDateString('id-ID')}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Check-Out: {new Date(booking.check_out).toLocaleDateString('id-ID')}
                                </div>
                              </td>
                              <td className="px-6 py-4 flex justify-end">
                                <button
                                  onClick={() => setShowCheckoutQR({ isOpen: true, booking })}
                                  className="px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  Beri QR Checkout
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}