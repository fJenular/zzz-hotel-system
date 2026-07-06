'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { useState, useEffect } from 'react'
import { 
  Users, Bed, Bath, Wifi, Tv, Coffee, Star, MapPin, 
  ArrowLeft, CheckCircle, ShieldCheck, CreditCard, ChevronRight, Heart,
  LayoutDashboard, Compass, ShoppingBag, MessageSquare, User, Sparkles, Home
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserSupabaseClient()

  // State for booking widget
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || new Date().toISOString().split('T')[0])
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests') || '2'))
  
  // Extra Services
  const [extraServices, setExtraServices] = useState({
    roomClean: false,
    breakfast: false
  })

  // Payment Form fields
  const [paymentMethod, setPaymentMethod] = useState('visa')
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiry: '',
    cvv: '',
    billingCountry: 'Indonesia'
  })
  
  const [activeTab, setActiveTab] = useState('description')
  const [user, setUser] = useState<any>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Fetch logged in user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    }
    getUser()
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center font-semibold text-gray-500 animate-pulse">Loading room details...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
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
      return {
        main: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800',
        sub1: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400',
        sub2: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
        sub3: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
        beds: 3, baths: 2, area: 55
      }
    } else if (name.includes('suite')) {
      return {
        main: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
        sub1: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
        sub2: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
        sub3: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400',
        beds: 2, baths: 2, area: 70
      }
    } else if (name.includes('deluxe')) {
      return {
        main: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
        sub1: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400',
        sub2: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400',
        sub3: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
        beds: 2, baths: 1, area: 45
      }
    } else {
      return {
        main: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
        sub1: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
        sub2: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400',
        sub3: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
        beds: 1, baths: 1, area: 30
      }
    }
  }

  const images = getRoomImages(room.room_types.name)

  // Calculations
  const dateDiff = checkIn && checkOut ? new Date(checkOut).getTime() - new Date(checkIn).getTime() : 0
  const nights = dateDiff > 0 ? Math.ceil(dateDiff / (1000 * 60 * 60 * 24)) : 1
  
  const basePricePerNight = room.room_types.base_price
  const cleanPrice = extraServices.roomClean ? 150000 * nights : 0
  const breakfastPrice = extraServices.breakfast ? 100000 * guests * nights : 0
  
  const subtotal = (basePricePerNight * nights) + cleanPrice + breakfastPrice
  const discount = Math.round(subtotal * 0.10) // 10% discount
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
      // 1. Create booking in supabase
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          room_id: room.id,
          check_in: checkIn,
          check_out: checkOut,
          guests_count: guests,
          total_price: totalCost,
          status: 'pending' // pending until payment callback verifies
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // 2. Process payments API
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: 'credit_card'
        })
      })

      const paymentDataResult = await paymentResponse.json()
      if (!paymentDataResult.success) {
        throw new Error(paymentDataResult.error || 'Payment failed')
      }

      // Simulate successful payment (Update booking status to confirmed)
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id)

      alert('Payment successful! Your reservation has been confirmed.')
      router.push(`/booking/success?bookingId=${booking.id}`)
    } catch (err: any) {
      console.error(err)
      alert('Booking failed: ' + err.message)
    } finally {
      setBookingLoading(false)
    }
  }

  // Build the login redirect URL with current room path preserved
  const loginRedirectUrl = `/login?redirect=/rooms/${room?.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-800 antialiased">

      {/* ── LOGIN REQUIRED MODAL ── */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowLoginModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl shadow-rose-900/10 overflow-hidden animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-400 to-rose-600" />

            <div className="p-7">
              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 mx-auto">
                <svg className="h-7 w-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              {/* Text */}
              <h3 className="text-center text-xl font-bold text-gray-900">Sign in to continue</h3>
              <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
                You need to be logged in to complete your booking. It only takes a moment!
              </p>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={loginRedirectUrl}
                  className="block w-full rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3 text-center text-sm font-semibold text-white shadow-md shadow-rose-200 transition-all duration-200 hover:from-rose-700 hover:to-rose-600 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  className="block w-full rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-rose-200 hover:text-rose-600"
                >
                  Create an account
                </a>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
                >
                  Continue browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in { animation: modalIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>
      {/* SLIM ICON SIDEBAR (Image 2 style) */}
      <aside className="hidden md:flex flex-col w-20 bg-white border-r border-gray-100 py-6 items-center justify-between shrink-0">
        <div className="space-y-8 flex flex-col items-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-rose-500">
            <span className="p-1.5 bg-rose-500 text-white text-xs rounded-lg">🏨</span>
          </Link>

          {/* Icons */}
          <nav className="flex flex-col gap-6 items-center">
            <Link href="/" className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition" aria-label="Home">
              <Home className="w-5 h-5" />
            </Link>
            <Link href="/booking/select-room" className="p-3 text-rose-500 bg-rose-50 rounded-xl transition" aria-label="Discover">
              <Compass className="w-5 h-5 text-rose-500" />
            </Link>
            <Link href="/facilities" className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition" aria-label="Facilities">
              <Sparkles className="w-5 h-5" />
            </Link>
            <Link href="/contact-us" className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition" aria-label="contact us">
              <MessageSquare className="w-5 h-5" />
            </Link>
            <Link href="/about" className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition" aria-label="About">
              <User className="w-5 h-5" />
            </Link>
          </nav>
        </div>

        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </aside>

      {/* RIGHT SIDE CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER NAV (Image 2 style) */}
        <header className="border-b border-gray-100 py-4 px-6 sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span className="p-1.5 bg-rose-500 text-white text-xs rounded-lg">🏨</span>
            <span>ZZZ HOTEL</span>
          </Link>
          
          {/* Menu */}
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-gray-500">
            <Link href="/" className="hover:text-rose-500 transition">Home</Link>
            <Link href="/booking/select-room" className="hover:text-rose-500 transition">Discover</Link>
            <Link href="/facilities" className="hover:text-rose-500 transition">Facilities</Link>
            <Link href="/contact-us" className="hover:text-rose-500 transition">contact us</Link>
            <Link href="/about" className="hover:text-rose-500 transition">About</Link>
          </nav>

          {/* Right menu bar */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <input type="text" placeholder="Search here..." className="bg-transparent border-none text-xs w-36 focus:ring-0 p-0 text-gray-700" />
              <button className="text-gray-400 hover:text-gray-600"><Star className="w-3.5 h-3.5" /></button>
            </div>
            <button className="p-2 border border-gray-100 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition">
              <span className="block w-4 h-4 relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* BACK ACTION & TITLE */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center justify-center p-3 border border-gray-100 rounded-full text-gray-600 hover:bg-gray-50 hover:text-rose-500 transition animate-fade-in"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-2">
            <button className="p-3 border border-gray-100 rounded-full text-gray-400 hover:text-rose-500 transition">
              <Heart className="w-5 h-5 fill-transparent hover:fill-rose-500" />
            </button>
          </div>
        </div>

        {/* CONTENT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT SECTION: Collage & Details */}
          <div className="lg:col-span-2 space-y-8 animate-slide-up">
            
            {/* Collage of Images */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main Image */}
              <div className="md:col-span-2 relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
                <Image src={images.main} alt="Main room view" fill className="object-cover" priority />
              </div>
              
              {/* Vertical stacked side images */}
              <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
                <div className="relative aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-50 shadow-sm">
                  <Image src={images.sub1} alt="Room detail 1" fill className="object-cover" />
                </div>
                <div className="relative aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-50 shadow-sm">
                  <Image src={images.sub2} alt="Room detail 2" fill className="object-cover" />
                </div>
                <div className="relative aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-50 shadow-sm">
                  <Image src={images.sub3} alt="Room detail 3" fill className="object-cover" />
                </div>
              </div>
            </div>

            {/* Title & Location details */}
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {room.room_types.name} — Room {room.room_number}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Floor {room.floor}, ZZZ Hotel, Jl. Sudirman No. 123, Jakarta Pusat</span>
              </div>
            </div>

            {/* Badges / Features list */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600">Minimalist</span>
              <span className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600">Luxury Interior</span>
              <span className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600">City View</span>
              <span className="px-3.5 py-1.5 bg-rose-50 border border-rose-100 rounded-full text-xs font-semibold text-rose-600">Best Seller</span>
            </div>

            {/* Room Features Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Hotel Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Wifi className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-semibold text-gray-700">Free WiFi</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Bed className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-semibold text-gray-700">{images.beds} Queen Bed{images.beds > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Bath className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-semibold text-gray-700">Private Tub</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Coffee className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-semibold text-gray-700">Breakfast</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Tv className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-semibold text-gray-700">Smart TV</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Users className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-semibold text-gray-700">Max {room.room_types.max_occupancy} guests</span>
                </div>
              </div>
            </div>

            {/* Description Tab Widget */}
            <div className="space-y-4">
              <div className="flex border-b border-gray-100 pb-2 gap-6 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`text-sm font-bold pb-2 transition-all ${
                    activeTab === 'description' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Description
                </button>
                <button 
                  onClick={() => setActiveTab('features')}
                  className={`text-sm font-bold pb-2 transition-all ${
                    activeTab === 'features' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Feature
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`text-sm font-bold pb-2 transition-all ${
                    activeTab === 'reviews' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Reviews (120)
                </button>
              </div>

              {/* Tab Contents */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Our House</h4>
                  {activeTab === 'description' && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {room.room_types.description || 'Experience ultimate luxury in our meticulously designed rooms. This room incorporates standard conveniences, beautiful modern furnishings, and a spacious bed layout. It represents a premium standard stay designed to cater to all your accommodation needs with complete peace and relaxation.'}
                    </p>
                  )}
                  {activeTab === 'features' && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      This room is equipped with top-tier standard amenities. Included is high-speed Wi-Fi, air conditioning, safe lockers, iron facilities, double bathrooms with rain showers, premium toiletries, minibar snacks, and daily laundry services.
                    </p>
                  )}
                  {activeTab === 'reviews' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">John Doe</span>
                          <span className="text-[10px] text-gray-400">July 2026</span>
                        </div>
                        <p className="text-gray-500">Amazing experience! The room was very clean, staff was super friendly, and the breakfast was delicious.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Decorative Map */}
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 text-sm">Location</h4>
                  <div className="relative h-28 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                    <svg className="w-full h-full stroke-gray-200 fill-none" viewBox="0 0 100 50">
                      <path d="M 0,25 Q 25,10 50,25 T 100,25" strokeWidth="2" strokeDasharray="2 2" />
                      <circle cx="50" cy="25" r="4" className="fill-rose-500 stroke-white stroke-2 animate-ping" />
                      <circle cx="50" cy="25" r="3" className="fill-rose-500 stroke-white" />
                    </svg>
                    <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold rounded shadow-sm text-gray-600">Jakarta, ID</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: Sticky Booking & Checkout form */}
          <aside className="sticky top-20 bg-white border border-gray-100 p-6 rounded-2xl shadow-md shadow-gray-50 space-y-6 animate-slide-right">
            
            {/* Price section */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-3xl font-black text-rose-500">Rp {room.room_types.base_price.toLocaleString()}</span>
                <span className="text-xs text-gray-400 font-normal"> / Night</span>
              </div>
              <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-lg border border-rose-100">10% Off</span>
            </div>

            <hr className="border-gray-50" />

            {/* Checkin form & fields */}
            <form onSubmit={handleBookingAndPayment} className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check In</label>
                    <input 
                      type="date" 
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 focus:border-rose-500 focus:ring-0 bg-gray-50/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check Out</label>
                    <input 
                      type="date" 
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 focus:border-rose-500 focus:ring-0 bg-gray-50/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Adults/Children</label>
                  <select 
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 focus:border-rose-500 focus:ring-0 bg-gray-50/50 cursor-pointer"
                  >
                    {[1,2,3,4,5,6].map(num => (
                      <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Extra services checkboxes */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-900">Extra Services</h4>
                
                <label className="flex items-center justify-between p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={extraServices.roomClean}
                      onChange={(e) => setExtraServices({...extraServices, roomClean: e.target.checked})}
                      className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-0"
                    />
                    <span className="text-[11px] font-semibold text-gray-700">Room Clean</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-500">+Rp 150.000/night</span>
                </label>

                <label className="flex items-center justify-between p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={extraServices.breakfast}
                      onChange={(e) => setExtraServices({...extraServices, breakfast: e.target.checked})}
                      className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-0"
                    />
                    <span className="text-[11px] font-semibold text-gray-700">Breakfast Buffet</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-500">+Rp 100.000/guest</span>
                </label>
              </div>

              {/* Price Calculation breakdown */}
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

              {/* Payment Details Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-900">Payment Details</h4>
                
                {/* Method selector buttons */}
                <div className="grid grid-cols-5 gap-1.5">
                  {['visa', 'mastercard', 'stripe', 'gpay', 'paypal'].map((method) => (
                    <button 
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 border rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                        paymentMethod === method 
                          ? 'border-rose-500 bg-rose-50/50 text-rose-500' 
                          : 'border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <input 
                    type="text"
                    placeholder="Card Number"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 placeholder-gray-400 focus:border-rose-500 focus:ring-0 bg-gray-50/50"
                    required
                  />
                  <input 
                    type="text"
                    placeholder="Cardholder Name"
                    value={paymentData.cardholderName}
                    onChange={(e) => setPaymentData({...paymentData, cardholderName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 placeholder-gray-400 focus:border-rose-500 focus:ring-0 bg-gray-50/50"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      placeholder="MM/YY"
                      value={paymentData.expiry}
                      onChange={(e) => setPaymentData({...paymentData, expiry: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 placeholder-gray-400 focus:border-rose-500 focus:ring-0 bg-gray-50/50"
                      required
                    />
                    <input 
                      type="password"
                      placeholder="CVV"
                      maxLength={3}
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 placeholder-gray-400 focus:border-rose-500 focus:ring-0 bg-gray-50/50"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 text-rose-500 border-gray-300 rounded focus:ring-0 mt-0.5" required />
                  <span className="text-[9px] text-gray-400 leading-normal">
                    By clicking Pay Now, I agree to the Reservation and Cancellation policies.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button 
                type="submit"
                disabled={bookingLoading}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-200 text-sm flex items-center justify-center gap-2"
              >
                {bookingLoading ? 'Processing Payment...' : 'Pay Now'}
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Secure Checkout SSL Guaranteed</span>
            </div>
          </aside>
        </div>

      </div>
    </div>
    </div>
  )
}