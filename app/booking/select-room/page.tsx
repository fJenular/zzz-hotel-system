'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Suspense, useState, useEffect, useRef } from 'react'
import { 
  Calendar, Users, Search, SlidersHorizontal,
  Bed, Bath, Square, ArrowRight, Bell, Sparkles, HelpCircle, LogOut,
  ChevronRight, Heart, Star, Compass, ShoppingBag, MessageSquare, User, LayoutDashboard, Home, Utensils,
  Building2, Wind, Wifi, Coffee, CheckCircle2, ChevronDown, Minus, Plus
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { DiscoverFilter } from '@/components/landing/discover-filter'
import { DateRangePicker } from '@/components/landing/date-range-picker'

interface FilterState {
  adults: number
  children: number
  minPrice: number
  maxPrice: number
  roomType: string
  sortBy: string
}

function RoomSelectionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  // Search parameters
  const [formData, setFormData] = useState({
    checkIn: searchParams.get('checkIn') || new Date().toISOString().split('T')[0],
    checkOut: searchParams.get('checkOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guests: parseInt(searchParams.get('guests') || '2')
  })

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    adults: 1,
    children: 0,
    minPrice: 0,
    maxPrice: 5000000,
    roomType: 'all',
    sortBy: 'price-asc'
  })

  // Selected Room for Right Details Column
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const guestsRef = useRef<HTMLDivElement>(null)

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

  // Fetch all room types for the filter panel
  const { data: roomTypes } = useQuery({
    queryKey: ['room-types-list'],
    queryFn: async () => {
      const { data } = await supabase.from('room_types').select('id, name')
      return data || []
    }
  })

  // Query rooms with all filters applied
  const { data: rooms, isLoading, error, refetch } = useQuery({
    queryKey: ['available-rooms-search', formData.checkIn, formData.checkOut, formData.guests, filters],
    queryFn: async () => {
      const totalGuests = filters.adults + filters.children

      const { data: allRooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (*)
        `)
        .eq('status', 'available')

      if (roomsError) throw roomsError
      if (!allRooms) return []

      let filtered = allRooms

      // Filter by max occupancy (use the larger of formData.guests and adults+children from filters)
      const requiredCapacity = Math.max(formData.guests, totalGuests > 1 ? totalGuests : 0)
      if (requiredCapacity > 0) {
        filtered = filtered.filter((room: any) =>
          (room.room_types?.max_occupancy || 0) >= requiredCapacity
        )
      }

      // Filter by adults
      if (filters.adults > 1) {
        filtered = filtered.filter((room: any) =>
          (room.room_types?.max_adults || room.room_types?.max_occupancy || 0) >= filters.adults
        )
      }

      // Filter by room type
      if (filters.roomType !== 'all') {
        filtered = filtered.filter((room: any) =>
          room.room_types?.name === filters.roomType
        )
      }

      // Filter by price range
      filtered = filtered.filter((room: any) => {
        const price = room.room_types?.base_price || 0
        return price >= filters.minPrice && price <= filters.maxPrice
      })

      // Filter by bookings availability
      if (formData.checkIn && formData.checkOut) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('room_id')
          .in('status', ['pending', 'confirmed', 'checked_in'])
          .or(`and(check_in.lte.${formData.checkIn},check_out.gt.${formData.checkIn}),and(check_in.lt.${formData.checkOut},check_out.gte.${formData.checkOut})`)

        const bookedRoomIds = bookings?.map((b: any) => b.room_id) || []
        filtered = filtered.filter((r: any) => !bookedRoomIds.includes(r.id))
      }

      // Sorting
      filtered.sort((a: any, b: any) => {
        const priceA = a.room_types?.base_price || 0
        const priceB = b.room_types?.base_price || 0
        const nameA = a.room_types?.name || ''
        const nameB = b.room_types?.name || ''
        const areaA = a.room_types?.area_sqm || 0
        const areaB = b.room_types?.area_sqm || 0

        switch (filters.sortBy) {
          case 'price-asc': return priceA - priceB
          case 'price-desc': return priceB - priceA
          case 'name-asc': return nameA.localeCompare(nameB)
          case 'area-desc': return areaB - areaA
          default: return 0
        }
      })

      return filtered
    }
  })

  // Set default selected room when data loads
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0])
    }
  }, [rooms])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Helper stats generator based on room type data from DB, with fallback for Nusantara names
  const getRoomStats = (room: any) => {
    const type = room.room_types?.name?.toLowerCase() || ''
    const rt = room.room_types || {}

    // Use DB values when available
    const area = rt.area_sqm || (
      type.includes('pendopo') || type.includes('keluarga') ? 48 :
      type.includes('puri') || type.includes('suite') ? 56 :
      type.includes('serambi') || type.includes('deluxe') ? 36 : 28
    )

    const beds = rt.bed_configuration || (
      type.includes('pendopo') || type.includes('keluarga') ? '1 King Bed + 2 Single Bed' :
      type.includes('puri') || type.includes('suite') ? '1 King Bed + 1 Queen Sofa Bed' :
      type.includes('serambi') || type.includes('deluxe') ? '1 King Bed + 1 Sofa Bed' : '1 King Bed atau 2 Single Bed'
    )

    const maxOcc = rt.max_occupancy || (
      type.includes('pendopo') || type.includes('keluarga') ? 5 :
      type.includes('puri') || type.includes('suite') ? 4 :
      type.includes('serambi') || type.includes('deluxe') ? 3 : 2
    )

    let imageUrl = rt.image_url || room.image_url
    if (!imageUrl) {
      if (type.includes('pendopo') || type.includes('keluarga')) {
        imageUrl = 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&auto=format&fit=crop&q=80'
      } else if (type.includes('puri') || type.includes('suite') || type.includes('samudra')) {
        imageUrl = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&auto=format&fit=crop&q=80'
      } else if (type.includes('serambi') || type.includes('candi') || type.includes('deluxe')) {
        imageUrl = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80'
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&auto=format&fit=crop&q=80'
      }
    }

    const thumbs = [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400'
    ]

    return { area, beds, maxOcc, imageUrl, thumbs }
  }

  const parseFacilities = (val: any): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    try { return JSON.parse(val) } catch { return [] }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 text-xl font-bold text-gray-900 tracking-tight">
            <span className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-200">🏨</span>
            <span>ZZZ HOTEL</span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Home className="w-5 h-5" />
              <span>Beranda</span>
            </Link>
            <Link href="/booking/select-room" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <Compass className="w-5 h-5 text-rose-500" />
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
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <HelpCircle className="w-5 h-5" />
              <span>Bantuan & Dukungan</span>
            </Link>
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            ) : (
              <Link 
                href="/login"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200"
              >
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
                Selamat Datang, <span className="text-rose-500">{user?.full_name || 'Tamu Terhormat'}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">Temukan kamar terbaik untuk menginap yang nyaman dan mewah.</p>
            </div>
            
            {/* Top Toolbar */}
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
                        onClick={() => {
                          setAvatarDropdownOpen(false)
                          handleLogout()
                        }}
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
              <span className="px-3 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-full">Penawaran</span>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">Diskon 10%!</h2>
              <p className="text-sm text-gray-600 font-medium">Dapatkan diskon pada hari tertentu dan jangan sampai terlewat. Pesan kamar Anda sekarang.</p>
            </div>
            <button className="p-4 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow-lg shadow-rose-200">
              <ArrowRight className="w-6 h-6" />
            </button>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4">
              <Sparkles className="w-48 h-48 text-rose-500" />
            </div>
          </div>


          {/* Search Widget */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Cari Kamar Terbaik Anda</h3>

            <div className="relative">
            <form onSubmit={handleSearchSubmit} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-xl shadow-slate-100/30 flex flex-col lg:flex-row items-center gap-4 w-full">

              {/* ── Date Range Picker (Check-In + Check-Out) ── */}
              <DateRangePicker
                checkIn={formData.checkIn}
                checkOut={formData.checkOut}
                onChangeCheckIn={(v) => setFormData(prev => ({ ...prev, checkIn: v }))}
                onChangeCheckOut={(v) => setFormData(prev => ({ ...prev, checkOut: v }))}
              />
              {/* ── Guests — custom dropdown ── */}
              <div className="w-full lg:w-52 shrink-0 relative" ref={guestsRef}>
                <button
                  type="button"
                  onClick={() => setGuestsOpen(prev => !prev)}
                  className={`w-full bg-white border rounded-2xl px-5 py-3.5 flex flex-col transition-all shadow-sm text-left cursor-pointer ${
                    guestsOpen ? 'border-rose-400 bg-rose-50/30' : 'border-slate-100 hover:border-rose-200 hover:bg-rose-50/30'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">TAMU</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-sm font-bold text-slate-700">{formData.guests} {formData.guests === 1 ? 'Tamu' : 'Tamu'}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${ guestsOpen ? 'rotate-180' : '' }`} />
                  </div>
                </button>

                {/* Guests Dropdown Panel */}
                {guestsOpen && (
                  <div
                    className="absolute left-0 top-[calc(100%+8px)] w-full z-50 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/60 p-4"
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
                      {[1,2,3,4,5,6].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => { setFormData(prev => ({ ...prev, guests: n })); setGuestsOpen(false) }}
                          className={`flex-1 min-w-[36px] py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            formData.guests === n
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

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
                <button 
                  type="submit"
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-200 cursor-pointer text-sm shrink-0 border-none"
                >
                  <Search className="w-4 h-4" />
                  <span>Cari</span>
                </button>
                {/* Filter Dropdown */}
                <DiscoverFilter
                  filters={filters}
                  onApplyFilters={handleApplyFilters}
                  roomTypes={roomTypes || []}
                />
              </div>
            </form>
            </div>

            {/* Active Filters Summary */}
            {(filters.adults > 1 || filters.children > 0 || filters.roomType !== 'all') && (
              <div className="flex flex-wrap gap-2 text-xs">
                {filters.adults > 1 && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-semibold">
                    {filters.adults} Dewasa
                  </span>
                )}
                {filters.children > 0 && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-semibold">
                    {filters.children} Anak-anak
                  </span>
                )}
                {filters.roomType !== 'all' && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-semibold">
                    Tipe: {filters.roomType}
                  </span>
                )}
                {(filters.minPrice > 0 || filters.maxPrice < 5000000) && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-semibold">
                    Rp {filters.minPrice.toLocaleString()} – Rp {filters.maxPrice.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Rooms Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Kamar Tersedia ({rooms?.length || 0})</h3>
            </div>

            {isLoading ? (
              <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Mencari kamar yang tersedia...</div>
            ) : error ? (
              <div className="text-center py-16 text-red-500 font-semibold">Gagal memuat kamar. Silakan coba lagi.</div>
            ) : rooms && rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room: any) => {
                  const stats = getRoomStats(room)
                  const isSelected = selectedRoom?.id === room.id
                  const facilities = parseFacilities(room.room_types?.facilities)
                  return (
                    <div 
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-rose-500 shadow-md shadow-rose-50 scale-[1.01]' 
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                        <Image 
                          src={stats.imageUrl}
                          alt={room.room_types?.name || 'Room'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-400 hover:text-rose-500 transition">
                          <Heart className="w-4 h-4 fill-transparent hover:fill-rose-500" />
                        </button>
                        {/* Floor badge */}
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-white text-[10px] font-bold flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Lantai {room.floor}
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <div className="text-lg font-bold text-gray-900">
                            Rp {(room.room_types?.base_price || 0).toLocaleString()}
                            <span className="text-[10px] text-gray-400 font-normal">/malam</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-800 text-sm group-hover:text-rose-500 transition-colors">
                            {room.room_types?.name} — Kamar {room.room_number}
                          </h4>
                          <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                            <Building2 className="w-3 h-3" />
                            <span>Lantai {room.floor} · ZZZ Hotel</span>
                          </div>
                        </div>

                        {/* Facility chips */}
                        {facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {facilities.slice(0, 3).map((f: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-[10px] text-gray-500 font-medium">{f}</span>
                            ))}
                            {facilities.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-[10px] text-gray-400">+{facilities.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Room Stats */}
                        <div className="flex justify-between border-t border-gray-50 pt-3 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-gray-400" /> {stats.beds}</span>
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" /> Maks. {stats.maxOcc}</span>
                          <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5 text-gray-400" /> {stats.area} m²</span>
                        </div>

                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRoom(room)
                            }}
                            className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl border transition ${
                              isSelected 
                                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            Pilih
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/rooms/${room.id}?checkIn=${formData.checkIn}&checkOut=${formData.checkOut}&guests=${formData.guests}`)
                            }}
                            className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition shadow-sm shadow-rose-200"
                          >
                            Lihat
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-lg font-bold text-gray-700">Tidak ada kamar tersedia untuk tanggal ini.</p>
                <p className="text-sm text-gray-400 mt-1">Coba ubah tanggal, jumlah tamu, atau filter pencarian.</p>
              </div>
            )}
          </div>

          {/* Bottom Tabs Section — Popular room types */}
          {roomTypes && roomTypes.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <div className="flex gap-6 border-b border-gray-100 pb-2 overflow-x-auto">
                <button className="text-sm font-bold text-rose-500 border-b-2 border-rose-500 pb-2">Tipe Kamar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomTypes.slice(0, 4).map((rt: any) => {
                  const typeLower = rt.name?.toLowerCase() || ''
                  let thumbUrl = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=200'
                  if (typeLower.includes('suite') || typeLower.includes('samudra')) {
                    thumbUrl = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=200'
                  } else if (typeLower.includes('keluarga')) {
                    thumbUrl = 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=200'
                  } else if (typeLower.includes('candi')) {
                    thumbUrl = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=200'
                  }
                  return (
                    <div
                      key={rt.id}
                      className="flex gap-4 bg-white p-3 border border-gray-100 hover:border-rose-200 rounded-xl transition cursor-pointer group"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, roomType: rt.name }))
                      }}
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                        <Image src={thumbUrl} alt={rt.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <h5 className="font-bold text-sm text-gray-800 group-hover:text-rose-500 transition-colors">{rt.name}</h5>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" /> ZZZ Hotel Nusantara
                          </p>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-rose-500">
                            Rp {(rt.base_price || 0).toLocaleString()}<span className="text-[10px] text-gray-400 font-normal">/malam</span>
                          </span>
                          <span className="text-[10px] text-rose-400 font-semibold">Lihat →</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: Product Details */}
        <aside className="w-full lg:w-96 bg-white border-l border-gray-100 p-6 overflow-y-auto shrink-0 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">Detail Kamar</h3>

          {selectedRoom ? (
            <div className="space-y-6 animate-fade-in">
              {/* Image Carousel */}
              <div className="space-y-3">
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100">
                  <Image 
                    src={getRoomStats(selectedRoom).imageUrl} 
                    alt={selectedRoom.room_types?.name || 'Room'} 
                    fill 
                    className="object-cover"
                  />
                  {/* Floor badge overlay */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-bold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Lantai {selectedRoom.floor}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {getRoomStats(selectedRoom).thumbs.map((thumb: string, idx: number) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                      <Image src={thumb} alt="thumbnail" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Title & Price */}
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-gray-900">{selectedRoom.room_types?.name}</h4>
                <div className="text-xs text-gray-400 font-semibold font-sans">Kamar {selectedRoom.room_number}</div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                  <Building2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Lantai {selectedRoom.floor} · ZZZ Hotel</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-center text-xs">
                <div className="space-y-1">
                  <div className="text-gray-400 flex justify-center"><Bed className="w-4 h-4 text-gray-400" /></div>
                  <div className="font-bold text-gray-800 text-[11px] leading-tight">{getRoomStats(selectedRoom).beds}</div>
                </div>
                <div className="space-y-1 border-x border-gray-100">
                  <div className="text-gray-400 flex justify-center"><Users className="w-4 h-4 text-gray-400" /></div>
                  <div className="font-bold text-gray-800 text-[11px] leading-tight">Maks. {getRoomStats(selectedRoom).maxOcc} Tamu</div>
                </div>
                <div className="space-y-1">
                  <div className="text-gray-400 flex justify-center"><Square className="w-4 h-4 text-gray-400" /></div>
                  <div className="font-bold text-gray-800 text-[11px] leading-tight">Luas {getRoomStats(selectedRoom).area} m²</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-gray-900">Deskripsi</h5>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {selectedRoom.description || selectedRoom.room_types?.description || 'Nikmati standar kemewahan dan kenyamanan tertinggi. Kamar ini menawarkan desain modern, pemandangan indah, dan layanan prima untuk setiap tamu kami.'}
                </p>
              </div>

              {/* Facilities */}
              {(() => {
                const facs = parseFacilities(selectedRoom.room_types?.facilities)
                const aments = parseFacilities(selectedRoom.room_types?.amenities)
                if (facs.length === 0 && aments.length === 0) return null
                return (
                  <div className="space-y-3">
                    {facs.length > 0 && (
                      <div>
                        <h5 className="font-bold text-sm text-gray-900 mb-2">Fasilitas</h5>
                        <div className="grid grid-cols-2 gap-1.5">
                          {facs.map((f: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {aments.length > 0 && (
                      <div>
                        <h5 className="font-bold text-sm text-gray-900 mb-2">Amenitas</h5>
                        <div className="flex flex-wrap gap-2">
                          {aments.map((a: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-600 rounded-full text-[11px] font-semibold">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* View Type / Room Size */}
              {(selectedRoom.room_types?.view_type || selectedRoom.room_types?.room_size) && (
                <div className="space-y-2">
                  <h5 className="font-bold text-sm text-gray-900">Info Tambahan</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedRoom.room_types?.view_type && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                        <Wind className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <div className="font-bold text-blue-700 text-[11px]">{selectedRoom.room_types.view_type}</div>
                        <div className="text-[10px] text-blue-400">Pemandangan</div>
                      </div>
                    )}
                    {selectedRoom.room_types?.room_size && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                        <Square className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="font-bold text-amber-700 text-[11px]">{selectedRoom.room_types.room_size}</div>
                        <div className="text-[10px] text-amber-400">Ukuran Kamar</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button 
                onClick={() => router.push(`/rooms/${selectedRoom.id}?checkIn=${formData.checkIn}&checkOut=${formData.checkOut}&guests=${formData.guests}`)}
                className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-200 text-center block text-sm"
              >
                Pesan Sekarang — Rp {(selectedRoom.room_types?.base_price || 0).toLocaleString()}
              </button>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 text-sm">
              Pilih kamar untuk melihat informasi detail.
            </div>
          )}
        </aside>

      </div>
    </div>
  )
}

export default function RoomSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 font-semibold">Memuat Halaman...</div>}>
      <RoomSelectionContent />
    </Suspense>
  )
}
