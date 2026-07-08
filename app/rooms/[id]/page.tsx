'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { useState, useEffect, useRef } from 'react'
import { 
  Users, Bed, Bath, Wifi, Tv, Coffee, Star, MapPin, 
  ArrowLeft, ShieldCheck, ChevronLeft, ChevronRight,
  Home, Compass, Sparkles, MessageSquare, User, Calendar, LogOut, Utensils
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserSupabaseClient()

  // State for booking widget
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || new Date().toISOString().split('T')[0])
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests') || '2'))
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Extra Services
  const [extraServices, setExtraServices] = useState({
    roomClean: false,
    breakfast: false
  })

  // User info (simple for midtrans)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  
  const [activeTab, setActiveTab] = useState('description')
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch logged in user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      if (currentUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, email, avatar_url')
          .eq('id', currentUser.id)
          .single()
        if (userData) {
          setFullName(userData.full_name || '')
          setEmail(userData.email || currentUser.email || '')
          setAvatarUrl(userData.avatar_url)
        }
      }
    }
    getUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAvatarDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch room details
  const { data: room, isLoading } = useQuery({
    queryKey: ['room-detail', params.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (*)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      return data
    }
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAvatarDropdownOpen(false)
    router.push('/')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center font-semibold text-gray-500 animate-pulse">Loading room details...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center space-y-4">
        <div className="text-xl font-bold text-gray-800">Room not found</div>
        <button 
          onClick={() => router.push('/booking/select-room')}
          className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition shadow-md shadow-rose-200"
        >
          Back to Selection
        </button>
      </div>
    )
  }

  // Set images based on type
  const getRoomImages = (type: string) => {
    const name = type?.toLowerCase() || ''
    if (name.includes('family')) {
      return [
        'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
      ]
    } else if (name.includes('suite')) {
      return [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400',
      ]
    } else if (name.includes('deluxe')) {
      return [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
      ]
    } else {
      return [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
      ]
    }
  }

  const images = getRoomImages(room.room_types.name)
  const roomFeatures = { beds: room.room_types.name.toLowerCase().includes('family') ? 3 : room.room_types.name.toLowerCase().includes('suite') ? 2 : room.room_types.name.toLowerCase().includes('deluxe') ? 2 : 1 }

  // Calculations
  const dateDiff = checkIn && checkOut ? new Date(checkOut).getTime() - new Date(checkIn).getTime() : 0
  const nights = dateDiff > 0 ? Math.ceil(dateDiff / (1000 * 60 * 60 * 24)) : 1
  
  const basePricePerNight = room.room_types.base_price
  const cleanPrice = extraServices.roomClean ? 150000 * nights : 0
  const breakfastPrice = extraServices.breakfast ? 100000 * guests * nights : 0
  
  const subtotal = (basePricePerNight * nights) + cleanPrice + breakfastPrice
  const discount = Math.round(subtotal * 0.10)
  const serviceFee = 50000
  const totalCost = subtotal - discount + serviceFee

  const handleBookingAndPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setShowLoginModal(true)
      return
    }

    setBookingLoading(true)

    try {
      // 1. Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          room_id: room.id,
          check_in: checkIn,
          check_out: checkOut,
          guests_count: guests,
          total_price: totalCost,
          status: 'pending'
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // 2. Get Midtrans Snap token
      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          customerDetails: {
            first_name: fullName,
            email: email
          }
        })
      })

      const paymentResult = await paymentResponse.json()
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed')
      }

      // 3. Trigger Midtrans Snap popup
      if (typeof window !== 'undefined' && (window as any).snap) {
        (window as any).snap.pay(paymentResult.data.token, {
          onSuccess: async function () {
            await supabase
              .from('bookings')
              .update({ status: 'confirmed' })
              .eq('id', booking.id)
            alert('Payment successful! Your reservation has been confirmed.')
            router.push(`/booking/success?bookingId=${booking.id}`)
          },
          onPending: function () {
            alert('Payment is pending. Please complete your payment.')
            router.push(`/booking/success?bookingId=${booking.id}&status=pending`)
          },
          onError: function () {
            alert('Payment failed. Please try again.')
          },
          onClose: function () {
            alert('You closed the popup without finishing the payment')
          }
        })
      } else {
        // If snap not loaded, redirect to payment page
        router.push(`/booking/payment?bookingId=${booking.id}`)
      }
    } catch (err: any) {
      console.error(err)
      alert('Booking failed: ' + err.message)
    } finally {
      setBookingLoading(false)
    }
  }

  const loginRedirectUrl = `/login?redirect=/rooms/${room?.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">

      {/* LOGIN REQUIRED MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowLoginModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-400 to-rose-600" />
            <div className="p-7">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 mx-auto">
                <User className="h-7 w-7 text-rose-500" />
              </div>
              <h3 className="text-center text-xl font-bold text-gray-900">Sign in to continue</h3>
              <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
                You need to be logged in to complete your booking.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <a href={loginRedirectUrl} className="block w-full rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3 text-center text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:from-rose-700 hover:to-rose-600">
                  Sign In
                </a>
                <a href="/register" className="block w-full rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-semibold text-gray-700 transition hover:border-rose-200 hover:text-rose-600">
                  Create an account
                </a>
                <button onClick={() => setShowLoginModal(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1">
                  Continue browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR - SAME AS HOME */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold text-gray-900 tracking-tight">
            <span className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-200">🏨</span>
            <span>ZZZ HOTEL</span>
          </Link>

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
              <span>Contact Us</span>
            </Link>
            <Link href="/about" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <User className="w-5 h-5" />
              <span>About</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-4">
          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-400 px-4 uppercase tracking-wider">Other</p>
          <nav className="space-y-1">
            {user && (
              <>
                <Link href="/my-bookings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
                  <Calendar className="w-5 h-5" />
                  <span>My Bookings</span>
                </Link>
                <Link href="/restaurant/order" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200">
                  <Utensils className="w-5 h-5" />
                  <span>Room Service</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR with avatar */}
        <div className="border-b border-gray-100 py-4 px-6 sticky top-0 bg-white/95 backdrop-blur-md z-40">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-rose-500 transition">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)} className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md hover:opacity-80 transition">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Profile" width={36} height={36} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-rose-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-rose-500" />
                      </div>
                    )}
                  </button>
                  {avatarDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                      </div>
                      <Link href="/my-bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition" onClick={() => setAvatarDropdownOpen(false)}>
                        <Calendar className="w-4 h-4" /> My Bookings
                      </Link>
                      <Link href="/restaurant/order" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition" onClick={() => setAvatarDropdownOpen(false)}>
                        <Utensils className="w-4 h-4" /> Room Service
                      </Link>
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition" onClick={() => setAvatarDropdownOpen(false)}>
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition shadow-sm shadow-rose-200">
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* GALLERY - 1 large + 3 small with carousel */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
                  <Image 
                    src={images[currentImageIndex]} 
                    alt="Room view" 
                    fill 
                    className="object-cover transition-opacity duration-300"
                    priority
                  />
                  
                  {/* Navigation arrows on main image */}
                  <button 
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition shadow-md"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>

                  {/* Image counter */}
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </div>

                {/* Thumbnail strip */}
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition ${
                        idx === currentImageIndex ? 'border-rose-500 shadow-md' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image src={img} alt={`Room ${idx + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Location */}
              <div className="space-y-3">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  {room.room_types.name} — Room {room.room_number}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>Floor {room.floor}, ZZZ Hotel, Jl. Sudirman No. 123, Jakarta Pusat</span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600">Minimalist</span>
                <span className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600">Luxury Interior</span>
                <span className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600">City View</span>
                <span className="px-3.5 py-1.5 bg-rose-50 border border-rose-100 rounded-full text-xs font-semibold text-rose-600">Best Seller</span>
              </div>

              {/* Features Grid */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Hotel Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: Wifi, label: 'Free WiFi' },
                    { icon: Bed, label: `${roomFeatures.beds} Queen Bed${roomFeatures.beds > 1 ? 's' : ''}` },
                    { icon: Bath, label: 'Private Tub' },
                    { icon: Coffee, label: 'Breakfast' },
                    { icon: Tv, label: 'Smart TV' },
                    { icon: Users, label: `Max ${room.room_types.max_occupancy} guests` },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                      <feat.icon className="w-5 h-5 text-rose-500" />
                      <span className="text-sm font-semibold text-gray-700">{feat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description Tabs */}
              <div className="space-y-4">
                <div className="flex border-b border-gray-100 pb-2 gap-6">
                  {['description', 'features', 'reviews'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-sm font-bold pb-2 transition-all capitalize ${
                        activeTab === tab ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      {tab} {tab === 'reviews' ? '(120)' : ''}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Our House</h4>
                  {activeTab === 'description' && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {room.room_types.description || 'Experience ultimate luxury in our meticulously designed rooms. This room incorporates standard conveniences, beautiful modern furnishings, and a spacious bed layout.'}
                    </p>
                  )}
                  {activeTab === 'features' && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      This room is equipped with top-tier standard amenities. Included is high-speed Wi-Fi, air conditioning, safe lockers, iron facilities, double bathrooms with rain showers, premium toiletries, minibar snacks, and daily laundry services.
                    </p>
                  )}
                  {activeTab === 'reviews' && (
                    <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">John Doe</span>
                        <span className="text-[10px] text-gray-400">July 2026</span>
                      </div>
                      <p className="text-xs text-gray-500">Amazing experience! The room was very clean, staff was super friendly.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Booking Widget */}
            <aside className="sticky top-20 bg-white border border-gray-100 p-6 rounded-2xl shadow-md shadow-gray-50 space-y-6">
              
              {/* Price section */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-3xl font-black text-rose-500">Rp {room.room_types.base_price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 font-normal"> / Night</span>
                </div>
                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-lg border border-rose-100">10% Off</span>
              </div>

              <hr className="border-gray-50" />

              <form onSubmit={handleBookingAndPayment} className="space-y-4">
                {/* Date inputs */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check In</label>
                      <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 focus:border-rose-500 focus:ring-0 bg-gray-50/50" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check Out</label>
                      <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 focus:border-rose-500 focus:ring-0 bg-gray-50/50" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Guests</label>
                    <select value={guests} onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 focus:border-rose-500 focus:ring-0 bg-gray-50/50 cursor-pointer">
                      {[1,2,3,4,5,6].map(num => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Extra Services */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-gray-900">Extra Services</h4>
                  <label className="flex items-center justify-between p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={extraServices.roomClean} onChange={(e) => setExtraServices({...extraServices, roomClean: e.target.checked})}
                        className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-0" />
                      <span className="text-[11px] font-semibold text-gray-700">Room Clean</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-500">+Rp 150.000/night</span>
                  </label>
                  <label className="flex items-center justify-between p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={extraServices.breakfast} onChange={(e) => setExtraServices({...extraServices, breakfast: e.target.checked})}
                        className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-0" />
                      <span className="text-[11px] font-semibold text-gray-700">Breakfast Buffet</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-500">+Rp 100.000/guest</span>
                  </label>
                </div>

                {/* Price Breakdown */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-2.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>{nights} Night{nights > 1 ? 's' : ''} Price</span>
                    <span className="font-semibold text-gray-700">Rp {(basePricePerNight * nights).toLocaleString()}</span>
                  </div>
                  {extraServices.roomClean && (
                    <div className="flex justify-between text-gray-500">
                      <span>Room Cleaning Service</span>
                      <span className="font-semibold text-gray-700">Rp {cleanPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {extraServices.breakfast && (
                    <div className="flex justify-between text-gray-500">
                      <span>Breakfast Service ({guests} guests)</span>
                      <span className="font-semibold text-gray-700">Rp {breakfastPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>Service Fee</span>
                    <span className="font-semibold text-gray-700">Rp {serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-semibold bg-rose-500/5 px-2 py-1 rounded">
                    <span>10% Member Discount</span>
                    <span>-Rp {discount.toLocaleString()}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-sm font-bold text-gray-900">
                    <span>Total Cost</span>
                    <span className="text-rose-500">Rp {totalCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* SIMPLIFIED PAYMENT - just name & email for Midtrans */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-900">Contact Information</h4>
                  <input 
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 placeholder-gray-400 focus:border-rose-500 focus:ring-0 bg-gray-50/50"
                    required
                  />
                  <input 
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 placeholder-gray-400 focus:border-rose-500 focus:ring-0 bg-gray-50/50"
                    required
                  />
                  <p className="text-[10px] text-gray-400">Payment will be processed securely via Midtrans.</p>
                </div>

                <button 
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-200 text-sm flex items-center justify-center gap-2"
                >
                  {bookingLoading ? 'Processing...' : 'Book & Pay Now'}
                </button>
              </form>

              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Secure Checkout via Midtrans</span>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Midtrans Snap Script */}
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js'
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <style jsx global>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in { animation: modalIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>
    </div>
  )
}