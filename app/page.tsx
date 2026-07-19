'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import {
  Calendar, Users, ArrowRight, Bell, Sparkles, HelpCircle, LogOut,
  Star, Compass, MessageSquare, User, LayoutDashboard, Utensils,
  Home, ChevronDown, Minus, Plus
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { DateRangePicker } from '@/components/landing/date-range-picker'

export default function HomePage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  // Search parameters for right widget
  const [formData, setFormData] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guests: 2
  })

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const guestsRef = useRef<HTMLDivElement>(null)
  const [greeting, setGreeting] = useState("Selamat Datang")

  useEffect(() => {
    fetch("/greeting.txt")
      .then(res => res.text())
      .then(text => setGreeting(text))
      .catch(() => { })
  }, [])

  // Fetch logged in user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        setUser(userData)
        if (userData?.avatar_url) {
          setAvatarUrl(userData.avatar_url)
        }
      }
    }
    getUser()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAvatarDropdownOpen(false)
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setGuestsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      guests: formData.guests.toString()
    })
    router.push(`/booking/select-room?${params.toString()}`)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) { }
    await supabase.auth.signOut()
    setUser(null)
    setAvatarDropdownOpen(false)
    setShowLogoutModal(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/Zzz.svg" alt="ZZZ Hotel Logo" width={40} height={40} className="object-contain" priority />
            <span className="text-xl font-bold text-gray-900 tracking-tight">ZZZ HOTEL</span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <Home className="w-5 h-5 text-rose-500" />
              <span>Beranda</span>
            </Link>
            <Link href="/booking/select-room" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Compass className="w-5 h-5" />
              <span>Cari Kamar</span>
            </Link>
            <Link href="/facilities" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Sparkles className="w-5 h-5" />
              <span>Fasilitas</span>
            </Link>
            <Link href="/contact-us" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <MessageSquare className="w-5 h-5" />
              <span>Hubungi Kami</span>
            </Link>
            <Link href="/about" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <User className="w-5 h-5" />
              <span>Tentang Kami</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div className="space-y-4">
          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-400 px-4 uppercase tracking-wider">Lainnya</p>
          <nav className="space-y-1">
            {user && user.role !== 'guest' && (
              <Link
                href={
                  user.role === 'admin' || user.role === 'super_admin' ? '/admin/dashboard' :
                    user.role === 'manager' ? '/manager/dashboard' :
                      user.role === 'receptionist' ? '/receptionist/dashboard' :
                        user.role === 'rest_staff' ? '/restaurant/dashboard' :
                          user.role === 'housekeeping' ? '/housekeeping/dashboard' : '/dashboard'
                }
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 bg-rose-50/50 rounded-xl transition-all duration-200"
              >
                <LayoutDashboard className="w-5 h-5 text-rose-500" />
                <span>Panel Staf</span>
              </Link>
            )}
            {user && user.role === 'guest' && (
              <>
                <Link
                  href="/my-bookings"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Pesanan Saya</span>
                </Link>
                <Link
                  href="/restaurant/order"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200"
                >
                  <Utensils className="w-5 h-5" />
                  <span>Layanan Kamar</span>
                </Link>
              </>
            )}
            <Link href="/contact-us" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <HelpCircle className="w-5 h-5" />
              <span>Bantuan & Dukungan</span>
            </Link>
            {user && user.role !== 'guest' && (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            )}
            {!user && (
              <Link href="/login" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
                <User className="w-5 h-5" />
                <span>Masuk</span>
              </Link>
            )}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">

        {/* CENTER COLUMN: Main Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 max-w-5xl">
          {/* Header Greeting */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {greeting.replace("Tamu Terhormat", "")}
                <span className="text-rose-500">
                  {user?.full_name || "Tamu Terhormat"}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">Jelajahi fitur premium kami dan kelola pemesanan Anda dengan mudah.</p>
            </div>

            {/* Top Toolbar with Avatar Dropdown */}
            <div className="flex items-center gap-4">
              <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
              </button>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md hover:opacity-80 transition"
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-rose-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-rose-500" />
                      </div>
                    )}
                  </button>

                  {/* Avatar Dropdown Menu */}
                  {avatarDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.full_name || user?.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/my-bookings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition"
                        onClick={() => setAvatarDropdownOpen(false)}
                      >
                        <Calendar className="w-4 h-4" />
                        Pesanan Saya
                      </Link>
                      <Link
                        href="/restaurant/order"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition"
                        onClick={() => setAvatarDropdownOpen(false)}
                      >
                        <Utensils className="w-4 h-4" />
                        Layanan Kamar
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition"
                        onClick={() => setAvatarDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profil Saya
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition shadow-sm shadow-rose-200"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>

          {/* Promo Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-100 to-pink-50 border border-rose-100/50 p-8 flex items-center justify-between flex-wrap gap-6 shadow-sm animate-scale-up">
            <div className="space-y-2 max-w-md">
              <span className="px-3 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-full">Penawaran Menarik</span>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">Diskon 10%!</h2>
              <p className="text-sm text-gray-600 font-medium">Dapatkan potongan harga khusus di hari-hari tertentu. Pesan tempat menginap Anda sekarang.</p>
            </div>
            <button
              onClick={() => router.push('/booking/select-room')}
              className="p-4 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow-lg shadow-rose-200"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4">
              <Sparkles className="w-48 h-48 text-rose-500" />
            </div>
          </div>

          {/* About ZZZ Hotel */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-gray-900">Tentang ZZZ Hotel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h4 className="text-xl font-bold text-gray-800">Rasakan Kemewahan & Kenyamanan</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  ZZZ Hotel menawarkan akomodasi premium yang dirancang khusus untuk wisatawan bisnis maupun liburan. Terletak strategis di pusat kota, kami memadukan hidangan kelas dunia, spa relaksasi, dan kamar modern untuk kenyamanan terbaik Anda.
                </p>
                <div className="flex gap-4 pt-2">
                  <div className="space-y-0.5">
                    <div className="text-lg font-bold text-rose-500">100+</div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase">Kamar Mewah</div>
                  </div>
                  <div className="space-y-0.5 border-l border-gray-100 pl-4">
                    <div className="text-lg font-bold text-rose-500">4.9 ★</div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase">Rating Tamu</div>
                  </div>
                </div>
              </div>
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 border border-gray-50">
                <Image src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600" alt="Hotel main view" width={600} height={375} className="object-cover" />
              </div>
            </div>
          </section>

          {/* Room Types Information Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
              <div>
                <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider rounded-full">Koleksi Akomodasi</span>
                <h3 className="text-xl font-black text-gray-900 mt-1.5">Pilihan Tipe Kamar</h3>
                <p className="text-xs text-gray-500 mt-0.5">Setiap tipe kamar dirancang eksklusif dengan sentuhan budaya Nusantara & kenyamanan modern.</p>
              </div>
              <Link href="/booking/select-room" className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-100 flex items-center gap-1.5">
                Pesan Kamar Sekarang <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bale Card */}
              <div className="bg-white rounded-[24px] border border-gray-100/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-rose-100/50 transition-all duration-300 flex flex-col justify-between group">
                <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
                  <Image src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600" alt="Bale Room Type" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-extrabold tracking-wider uppercase">Standard Class</div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-white text-gray-900 text-xs font-bold rounded-lg shadow-sm">Lantai 1</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-gray-900 text-lg group-hover:text-rose-500 transition-colors">Bale</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Pemandangan Kota • 28 m²</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-500 block">Rp 500.000</span>
                      <span className="text-[9px] text-gray-400 block font-semibold uppercase tracking-wider">Mulai dari / malam</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Bale adalah kamar peristirahatan tradisional yang nyaman dengan sentuhan dekorasi khas Nusantara. Cocok untuk pasangan atau tamu solo yang mencari kehangatan budaya Indonesia.
                  </p>

                  {/* Info Badge */}
                  <div className="border-t border-gray-50 pt-4 space-y-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Spesifikasi & Layanan</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600">
                      <div className="flex items-center gap-2">🛏️ <span>1 King / 2 Single Bed</span></div>
                      <div className="flex items-center gap-2">👤 <span>Maks. 2 Tamu</span></div>
                      <div className="flex items-center gap-2">📶 <span>WiFi Gratis</span></div>
                      <div className="flex items-center gap-2">❄️ <span>AC & Air Panas</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Serambi Card */}
              <div className="bg-white rounded-[24px] border border-gray-100/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-rose-100/50 transition-all duration-300 flex flex-col justify-between group">
                <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
                  <Image src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600" alt="Serambi Room Type" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-extrabold tracking-wider uppercase">Deluxe Class</div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-white text-gray-900 text-xs font-bold rounded-lg shadow-sm">Lantai 2</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-gray-900 text-lg group-hover:text-rose-500 transition-colors">Serambi</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Taman Asri • 36 m²</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-500 block">Rp 850.000</span>
                      <span className="text-[9px] text-gray-400 block font-semibold uppercase tracking-wider">Mulai dari / malam</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Serambi menawarkan kamar luas dengan beranda khas pedesaan Nusantara. Desain arsitektur klasik dipadu kemewahan modern memberikan suasana santai yang otentik.
                  </p>

                  {/* Info Badge */}
                  <div className="border-t border-gray-50 pt-4 space-y-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Spesifikasi & Layanan</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600">
                      <div className="flex items-center gap-2">🛏️ <span>1 King + 1 Sofa Bed</span></div>
                      <div className="flex items-center gap-2">👤 <span>Maks. 3 Tamu</span></div>
                      <div className="flex items-center gap-2">📶 <span>WiFi Cepat</span></div>
                      <div className="flex items-center gap-2">🛋️ <span>Teras Pribadi</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pendopo Card */}
              <div className="bg-white rounded-[24px] border border-gray-100/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-rose-100/50 transition-all duration-300 flex flex-col justify-between group">
                <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
                  <Image src="https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600" alt="Pendopo Room Type" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-extrabold tracking-wider uppercase">Family Class</div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-white text-gray-900 text-xs font-bold rounded-lg shadow-sm">Lantai 3</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-gray-900 text-lg group-hover:text-rose-500 transition-colors">Pendopo</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Taman & Kolam Renang • 48 m²</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-500 block">Rp 1.200.000</span>
                      <span className="text-[9px] text-gray-400 block font-semibold uppercase tracking-wider">Mulai dari / malam</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Pendopo adalah akomodasi keluarga yang terinspirasi dari ruang pertemuan agung tradisional Jawa. Sangat lapang dengan area bermain anak dan dekorasi adat menawan.
                  </p>

                  {/* Info Badge */}
                  <div className="border-t border-gray-50 pt-4 space-y-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Spesifikasi & Layanan</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600">
                      <div className="flex items-center gap-2">🛏️ <span>1 King + 2 Single Bed</span></div>
                      <div className="flex items-center gap-2">👤 <span>Maks. 5 Tamu</span></div>
                      <div className="flex items-center gap-2">🍳 <span>Sarapan Gratis</span></div>
                      <div className="flex items-center gap-2">🏊 <span>Akses Kolam Renang</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Puri Card */}
              <div className="bg-white rounded-[24px] border border-gray-100/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-rose-100/50 transition-all duration-300 flex flex-col justify-between group">
                <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
                  <Image src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600" alt="Puri Room Type" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-extrabold tracking-wider uppercase">Suite Class</div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-white text-gray-900 text-xs font-bold rounded-lg shadow-sm">Lantai 5</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-gray-900 text-lg group-hover:text-rose-500 transition-colors">Puri</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Cakrawala Samudra • 56 m²</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-500 block">Rp 1.500.000</span>
                      <span className="text-[9px] text-gray-400 block font-semibold uppercase tracking-wider">Mulai dari / malam</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Puri menyajikan keagungan istana raja-raja Nusantara. Suite ultra-mewah dengan ruang tamu terpisah, fasilitas premium terunggul, dan layanan butler personal.
                  </p>

                  {/* Info Badge */}
                  <div className="border-t border-gray-50 pt-4 space-y-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Spesifikasi & Layanan</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600">
                      <div className="flex items-center gap-2">🛏️ <span>1 King + 1 Sofa Bed</span></div>
                      <div className="flex items-center gap-2">👤 <span>Maks. 4 Tamu</span></div>
                      <div className="flex items-center gap-2">🍸 <span>Mini Bar & Butler</span></div>
                      <div className="flex items-center gap-2">🛁 <span>Bathtub Mewah</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Hotel Facilities */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Fasilitas Utama</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all duration-300 rounded-xl space-y-2 text-center group">
                <span className="p-3 bg-rose-50 text-rose-500 rounded-lg inline-block group-hover:bg-rose-500 group-hover:text-white transition">🏊</span>
                <h4 className="font-bold text-gray-800 text-xs">Kolam Renang Infinity</h4>
                <p className="text-[10px] text-gray-400">Pemandangan cakrawala kota</p>
              </div>
              <div className="bg-white p-4 border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all duration-300 rounded-xl space-y-2 text-center group">
                <span className="p-3 bg-rose-50 text-rose-500 rounded-lg inline-block group-hover:bg-rose-500 group-hover:text-white transition">🍳</span>
                <h4 className="font-bold text-gray-800 text-xs">Restoran Mewah</h4>
                <p className="text-[10px] text-gray-400">Menu kurasi juru masak</p>
              </div>
              <div className="bg-white p-4 border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all duration-300 rounded-xl space-y-2 text-center group">
                <span className="p-3 bg-rose-50 text-rose-500 rounded-lg inline-block group-hover:bg-rose-500 group-hover:text-white transition">💆</span>
                <h4 className="font-bold text-gray-800 text-xs">Spa & Kebugaran</h4>
                <p className="text-[10px] text-gray-400">Terapi holistik relaksasi</p>
              </div>
              <div className="bg-white p-4 border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all duration-300 rounded-xl space-y-2 text-center group">
                <span className="p-3 bg-rose-50 text-rose-500 rounded-lg inline-block group-hover:bg-rose-500 group-hover:text-white transition">💪</span>
                <h4 className="font-bold text-gray-800 text-xs">Pusat Kebugaran</h4>
                <p className="text-[10px] text-gray-400">Alat latihan modern lengkap</p>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Ulasan Pengunjung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-3">
                <div className="flex gap-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  &ldquo;Pengalaman menginap akhir pekan kami di ZZZ Hotel sangat luar biasa. Detail kamar premium dan layanan kebersihan kamar sangat cepat dan bersih.&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-100">
                    <Image src="https://i.pravatar.cc/80" alt="Reviewer" width={32} height={32} />
                  </div>
                  <div>
                    <h5 className="font-bold text-[11px] text-gray-800">Sarah Jenkins</h5>
                    <p className="text-[9px] text-gray-400">Tamu Reguler</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-3">
                <div className="flex gap-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  &ldquo;Sebuah pengalaman mengesankan! Proses pemesanan sangat mudah dan pembayaran kartu kredit berjalan lancar. Sangat merekomendasikan kamar Suite untuk keluarga.&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-100">
                    <Image src="https://i.pravatar.cc/90" alt="Reviewer" width={32} height={32} />
                  </div>
                  <div>
                    <h5 className="font-bold text-[11px] text-gray-800">David Miller</h5>
                    <p className="text-[9px] text-gray-400">Wisatawan Bisnis</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* RIGHT COLUMN: Quick Search Panel */}
        <aside className="w-full lg:w-96 bg-white border-l border-gray-100 p-6 overflow-y-auto shrink-0 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">Reservasi Cepat</h3>

          {/* Quick Search Widget */}
          <form onSubmit={handleSearchSubmit} className="space-y-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm relative">
            <h4 className="font-extrabold text-sm text-gray-800 tracking-tight">Cari Kamar Tersedia</h4>
            <div className="space-y-3">
              {/* Date Range Picker */}
              <DateRangePicker
                checkIn={formData.checkIn}
                checkOut={formData.checkOut}
                onChangeCheckIn={(v) => setFormData(prev => ({ ...prev, checkIn: v }))}
                onChangeCheckOut={(v) => setFormData(prev => ({ ...prev, checkOut: v }))}
              />

              {/* Guests Dropdown */}
              <div className="relative" ref={guestsRef}>
                <button
                  type="button"
                  onClick={() => setGuestsOpen(prev => !prev)}
                  className={`w-full bg-white border rounded-2xl px-5 py-3.5 flex flex-col transition-all shadow-sm text-left cursor-pointer ${guestsOpen ? 'border-rose-400 bg-rose-50/30' : 'border-slate-100 hover:border-rose-200 hover:bg-rose-50/30'
                    }`}
                >
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">TAMU</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-700">{formData.guests} Tamu</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${guestsOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Guests Dropdown Panel */}
                {guestsOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+8px)] w-full min-w-[260px] z-50 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/60 p-4"
                    style={{ animation: 'guestsSlideDown 0.18s cubic-bezier(0.16,1,0.3,1) both' }}
                  >
                    <style>{`
                      @keyframes guestsSlideDown {
                        from { opacity:0; transform:translateY(-8px) scaleY(0.95); transform-origin:top; }
                        to   { opacity:1; transform:translateY(0)   scaleY(1);    transform-origin:top; }
                      }
                    `}</style>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Jumlah Tamu</p>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                        disabled={formData.guests <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer bg-transparent"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-2xl font-extrabold text-gray-900">{formData.guests}</span>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">orang</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, guests: Math.min(6, prev.guests + 1) }))}
                        disabled={formData.guests >= 6}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer bg-transparent"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => { setFormData(prev => ({ ...prev, guests: n })); setGuestsOpen(false) }}
                          className={`flex-1 min-w-[36px] py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${formData.guests === n
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-rose-300 hover:text-rose-500'
                            }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuestsOpen(false)}
                      className="mt-3 w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Selesai
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-200 text-center block text-sm"
            >
              Cari & Pesan Kamar
            </button>
          </form>

          {/* Featured Room Card */}
          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/20 space-y-4">
            <h4 className="font-bold text-sm text-gray-800">Kamar Unggulan Terbaik</h4>
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100">
              <Image src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400" alt="Featured Suite" width={400} height={300} className="object-cover" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-gray-900">Kamar Suite - Puri Executive</h5>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-rose-500">Rp 1.500.000<span className="text-[10px] text-gray-400 font-normal">/malam</span></span>
                <span className="text-[10px] text-gray-500">🛏️ 2 Bed | 🚿 2 Kamar Mandi</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/booking/select-room')}
              className="w-full py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
            >
              Lihat Detail
            </button>
          </div>
        </aside>

      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 max-w-sm w-full mx-4 shadow-xl space-y-4 animate-scale-up">
            <div className="text-center space-y-2">
              <span className="inline-block p-3 bg-rose-50/80 text-rose-500 rounded-full text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Keluar</h3>
              <p className="text-sm text-gray-500">Apakah Anda yakin ingin keluar dari sistem ZZZ Hotel?</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 text-xs font-bold border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 rounded-xl text-white transition shadow-md shadow-rose-200"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}