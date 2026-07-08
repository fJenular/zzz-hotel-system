'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Suspense, useState, useEffect } from 'react'
import { 
  Calendar, Users, Search, SlidersHorizontal, MapPin, 
  Bed, Bath, Square, ArrowRight, Bell, Sparkles, HelpCircle, LogOut,
  ChevronRight, Heart, Star, Compass, ShoppingBag, MessageSquare, User, LayoutDashboard, Home
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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

  // Selected Room for Right Details Column
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

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
      }
    }
    getUser()
  }, [])

  // Query rooms
  const { data: rooms, isLoading, error, refetch } = useQuery({
    queryKey: ['available-rooms-search', formData.checkIn, formData.checkOut, formData.guests],
    queryFn: async () => {
      const { data: allRooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (*)
        `)
        .eq('status', 'available')

      if (roomsError) throw roomsError
      if (!allRooms) return []

      // Filter by max occupancy
      let filtered = allRooms.filter((room: any) => 
        room.room_types.max_occupancy >= formData.guests
      )

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

      return filtered
    }
  })

  // Set default selected room when data loads
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0])
    }
  }, [rooms, selectedRoom])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Helper stats generator based on type
  const getRoomStats = (room: any) => {
    const type = room.room_types?.name?.toLowerCase() || ''
    if (type.includes('family')) {
      return { beds: 3, baths: 2, area: 55, imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&auto=format&fit=crop&q=80', thumbs: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400'] }
    } else if (type.includes('suite')) {
      return { beds: 2, baths: 2, area: 70, imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&auto=format&fit=crop&q=80', thumbs: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400'] }
    } else if (type.includes('deluxe')) {
      return { beds: 2, baths: 1, area: 45, imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80', thumbs: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400'] }
    } else {
      return { beds: 1, baths: 1, area: 30, imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&auto=format&fit=crop&q=80', thumbs: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400'] }
    }
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
              <span>Home</span>
            </Link>
            <Link href="/booking/select-room" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <Compass className="w-5 h-5 text-rose-500" />
              <span>Discover</span>
            </Link>
            <Link href="/facilities" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Sparkles className="w-5 h-5" />
              <span>Facilities</span>
            </Link>
            <Link href="/contact-us" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <MessageSquare className="w-5 h-5" />
              <span>contact us</span>
            </Link>
            <Link href="/about" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <User className="w-5 h-5" />
              <span>About</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div className="space-y-4">
          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-400 px-4 uppercase tracking-wider">Other</p>
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
                <span>Staff Panel</span>
              </Link>
            )}
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <HelpCircle className="w-5 h-5" />
              <span>Help & Support</span>
            </Link>
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            ) : (
              <Link 
                href="/login"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200"
              >
                <User className="w-5 h-5" />
                <span>Log In</span>
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
                Good Morning, <span className="text-rose-500">{user?.full_name || 'Welcome Guest'}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">Find the perfect room for your comfortable stay and follow it over time.</p>
            </div>
            
              {/* Top Toolbar */}
              <div className="flex items-center gap-4">
              <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
              </button>
              {user ? (
                <div className="w-10 h-10 rounded-full bg-rose-100 overflow-hidden relative border-2 border-white shadow-md">
                  <Image src="https://i.pravatar.cc/100" alt="Avatar" fill />
                </div>
              ) : (
                <Link 
                  href="/login"
                  className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition shadow-sm shadow-rose-200"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>

          {/* Promo Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-100 to-pink-50 border border-rose-100/50 p-8 flex items-center justify-between flex-wrap gap-6 shadow-sm animate-scale-up">
            <div className="space-y-2 max-w-md">
              <span className="px-3 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-full">Offer</span>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">10% Discount!</h2>
              <p className="text-sm text-gray-600 font-medium">Get a discount on certain days and don&apos;t miss it. Book your stay now.</p>
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
            <h3 className="text-lg font-bold text-gray-900">Find Your Best Room</h3>
            <form onSubmit={handleSearchSubmit} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch gap-4">
              {/* Check In */}
              <div className="flex-1 min-w-0 bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check-In</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <input 
                    type="date" 
                    value={formData.checkIn}
                    onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                    className="bg-transparent border-0 p-0 text-sm font-semibold text-gray-800 focus:ring-0 w-full"
                    required
                  />
                </div>
              </div>

              {/* Check Out */}
              <div className="flex-1 min-w-0 bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check-Out</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <input 
                    type="date" 
                    value={formData.checkOut}
                    onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                    className="bg-transparent border-0 p-0 text-sm font-semibold text-gray-800 focus:ring-0 w-full"
                    required
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="w-full md:w-44 bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Guests</label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-500" />
                  <select 
                    value={formData.guests}
                    onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
                    className="bg-transparent border-0 p-0 text-sm font-semibold text-gray-800 focus:ring-0 w-full cursor-pointer"
                  >
                    {[1,2,3,4,5,6].map(num => (
                      <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  type="submit"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition shadow-lg shadow-rose-200"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
                <button 
                  type="button" 
                  className="p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  aria-label="Filter"
                >
                  <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </form>
          </div>

          {/* Rooms Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Available Rooms ({rooms?.length || 0})</h3>
            </div>

            {isLoading ? (
              <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Searching available rooms...</div>
            ) : error ? (
              <div className="text-center py-16 text-red-500 font-semibold">Failed to load rooms. Please try again.</div>
            ) : rooms && rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room: any) => {
                  const stats = getRoomStats(room)
                  const isSelected = selectedRoom?.id === room.id
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
                          alt={room.room_types.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-400 hover:text-rose-500 transition">
                          <Heart className="w-4 h-4 fill-transparent hover:fill-rose-500" />
                        </button>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <div className="text-lg font-bold text-gray-900">
                            Rp {room.room_types.base_price.toLocaleString()}
                            <span className="text-[10px] text-gray-400 font-normal">/night</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-800 text-sm group-hover:text-rose-500 transition-colors">
                            {room.room_types.name} - Room {room.room_number}
                          </h4>
                          <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>Floor {room.floor}, ZZZ Hotel</span>
                          </div>
                        </div>

                        {/* Room Stats */}
                        <div className="flex justify-between border-t border-gray-50 pt-3 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-gray-400" /> {stats.beds} Beds</span>
                          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-gray-400" /> {stats.baths} Baths</span>
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
                            Select
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/rooms/${room.id}?checkIn=${formData.checkIn}&checkOut=${formData.checkOut}&guests=${formData.guests}`)
                            }}
                            className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition shadow-sm shadow-rose-200"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-lg font-bold text-gray-700">No rooms available for these dates.</p>
                <p className="text-sm text-gray-400 mt-1">Please try modifying dates or guests in the search widget.</p>
              </div>
            )}
          </div>

          {/* Bottom Tabs Section */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <div className="flex gap-6 border-b border-gray-100 pb-2 overflow-x-auto">
              <button className="text-sm font-bold text-rose-500 border-b-2 border-rose-500 pb-2">Most Popular</button>
              <button className="text-sm font-semibold text-gray-400 hover:text-gray-700 pb-2">Special Offers</button>
              <button className="text-sm font-semibold text-gray-400 hover:text-gray-700 pb-2">Near Me</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4 bg-white p-3 border border-gray-100 hover:border-gray-200 rounded-xl transition cursor-pointer">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                  <Image src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=200" alt="Room thumbnail" fill className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h5 className="font-bold text-sm text-gray-800">Sharma Springs 5 bds Luxurious</h5>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> Jl. Sudirman No. 123, Jakarta</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-rose-500">Rp 1,500,000<span className="text-[10px] text-gray-400 font-normal">/night</span></span>
                    <span className="text-[10px] text-gray-500">🛏️ 2 Beds | 🚿 2 Baths</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 bg-white p-3 border border-gray-100 hover:border-gray-200 rounded-xl transition cursor-pointer">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                  <Image src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=200" alt="Room thumbnail" fill className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h5 className="font-bold text-sm text-gray-800">Sharma Springs 5 bds Luxurious</h5>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> Jl. Sudirman No. 123, Jakarta</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-rose-500">Rp 1,200,000<span className="text-[10px] text-gray-400 font-normal">/night</span></span>
                    <span className="text-[10px] text-gray-500">🛏️ 2 Beds | 🚿 2 Baths</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: Product Details */}
        <aside className="w-full lg:w-96 bg-white border-l border-gray-100 p-6 overflow-y-auto shrink-0 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">Product Details</h3>

          {selectedRoom ? (
            <div className="space-y-6 animate-fade-in">
              {/* Image Carousel Mock */}
              <div className="space-y-3">
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100">
                  <Image 
                    src={getRoomStats(selectedRoom).imageUrl} 
                    alt={selectedRoom.room_types.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {getRoomStats(selectedRoom).thumbs.map((thumb, idx) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                      <Image src={thumb} alt="thumbnail" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Title & Price */}
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-gray-900">{selectedRoom.room_types.name}</h4>
                <div className="text-xs text-gray-400 font-semibold">Room {selectedRoom.room_number}</div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Floor {selectedRoom.floor}, ZZZ Hotel, Jl. Sudirman 123, Jakarta</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-center text-xs">
                <div className="space-y-1">
                  <div className="text-gray-400 flex justify-center"><Bed className="w-4 h-4 text-gray-400" /></div>
                  <div className="font-bold text-gray-800">{getRoomStats(selectedRoom).beds} Bedrooms</div>
                </div>
                <div className="space-y-1 border-x border-gray-100">
                  <div className="text-gray-400 flex justify-center"><Bath className="w-4 h-4 text-gray-400" /></div>
                  <div className="font-bold text-gray-800">{getRoomStats(selectedRoom).baths} Bathrooms</div>
                </div>
                <div className="space-y-1">
                  <div className="text-gray-400 flex justify-center"><Square className="w-4 h-4 text-gray-400" /></div>
                  <div className="font-bold text-gray-800">{getRoomStats(selectedRoom).area} m² Area</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-gray-900">Description</h5>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {selectedRoom.room_types.description || 'Experience the highest standard of luxury and comfort. This room offers modern design, beautiful views, and pristine services for guests.'}
                </p>
                <button className="text-xs font-bold text-rose-500 hover:text-rose-600">Read More</button>
              </div>

              {/* Mini Map Mock */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-gray-900">Location Map</h5>
                <div className="relative h-24 rounded-xl overflow-hidden border border-gray-100 bg-blue-50/30">
                  {/* Decorative map SVG drawing */}
                  <svg className="w-full h-full stroke-gray-200 fill-none" viewBox="0 0 100 50">
                    <path d="M 0,25 Q 25,10 50,25 T 100,25" strokeWidth="2" strokeDasharray="2 2" />
                    <path d="M 30,0 Q 40,25 20,50" strokeWidth="1" />
                    <path d="M 70,0 Q 60,25 80,50" strokeWidth="1.5" />
                    <circle cx="50" cy="25" r="4" className="fill-rose-500 stroke-white stroke-2 animate-ping" />
                    <circle cx="50" cy="25" r="3" className="fill-rose-500 stroke-white" />
                  </svg>
                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold rounded shadow-sm text-gray-600">Jakarta Pusat</div>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => router.push(`/rooms/${selectedRoom.id}?checkIn=${formData.checkIn}&checkOut=${formData.checkOut}&guests=${formData.guests}`)}
                className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-200 text-center block text-sm"
              >
                Price: Rp {selectedRoom.room_types.base_price.toLocaleString()} — Book Now
              </button>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 text-sm">
              Select a room to view details.
            </div>
          )}
        </aside>

      </div>
    </div>
  )
}

export default function RoomSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 font-semibold">Loading Page...</div>}>
      <RoomSelectionContent />
    </Suspense>
  )
}
