'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Calendar, Users, Search, SlidersHorizontal, MapPin, 
  Bed, Bath, Square, ArrowRight, Bell, Sparkles, HelpCircle, LogOut,
  ChevronRight, Heart, Star, Compass, ShoppingBag, MessageSquare, User, LayoutDashboard,
  ShieldCheck, Coffee, Wifi, Tv, Home
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  
  // Search parameters for right widget
  const [formData, setFormData] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guests: 2
  })

  const [user, setUser] = useState<any>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

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
    } catch (e) {}
    await supabase.auth.signOut()
    setUser(null)
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
          <Link href="/" className="flex items-center gap-3 text-xl font-bold text-gray-900 tracking-tight">
            <span className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-200">🏨</span>
            <span>ZZZ HOTEL</span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <Home className="w-5 h-5 text-rose-500" />
              <span>Home</span>
            </Link>
            <Link href="/booking/select-room" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Compass className="w-5 h-5" />
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
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
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
              <p className="text-sm text-gray-500 mt-1">Explore our premium features and manage your reservations seamlessly.</p>
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
              <span className="px-3 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-full">Promotion</span>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">10% Discount!</h2>
              <p className="text-sm text-gray-600 font-medium">Get a discount on certain days and don&apos;t miss it. Book your stay now.</p>
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
            <h3 className="text-lg font-bold text-gray-900">About ZZZ Hotel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h4 className="text-xl font-bold text-gray-800">Experience Luxury & Comfort</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  ZZZ Hotel offers premium accommodations designed for business and leisure travelers alike. Nestled in the heart of Jakarta Pusat, we combine world-class dining, relaxing spas, and state-of-the-art rooms to make your stay memorable.
                </p>
                <div className="flex gap-4 pt-2">
                  <div className="space-y-0.5">
                    <div className="text-lg font-bold text-rose-500">100+</div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase">Luxury Rooms</div>
                  </div>
                  <div className="space-y-0.5 border-l border-gray-100 pl-4">
                    <div className="text-lg font-bold text-rose-500">4.9 ★</div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase">Guest Rating</div>
                  </div>
                </div>
              </div>
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 border border-gray-50">
                <Image src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600" alt="Hotel main view" fill className="object-cover" />
              </div>
            </div>
          </section>

          {/* Hotel Facilities */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Premium Facilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all duration-300 rounded-xl space-y-2 text-center group">
                <span className="p-3 bg-rose-50 text-rose-500 rounded-lg inline-block group-hover:bg-rose-500 group-hover:text-white transition">🏊</span>
                <h4 className="font-bold text-gray-800 text-xs">Infinity Pool</h4>
                <p className="text-[10px] text-gray-400">Panoramic skyline views</p>
              </div>
              <div className="bg-white p-4 border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all duration-300 rounded-xl space-y-2 text-center group">
                <span className="p-3 bg-rose-50 text-rose-500 rounded-lg inline-block group-hover:bg-rose-500 group-hover:text-white transition">🍳</span>
                <h4 className="font-bold text-gray-800 text-xs">Fine Dining</h4>
                <p className="text-[10px] text-gray-400">Chef curated menus</p>
              </div>
              <div className="bg-white p-4 border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all duration-300 rounded-xl space-y-2 text-center group">
                <span className="p-3 bg-rose-50 text-rose-500 rounded-lg inline-block group-hover:bg-rose-500 group-hover:text-white transition">💆</span>
                <h4 className="font-bold text-gray-800 text-xs">Spa & Wellness</h4>
                <p className="text-[10px] text-gray-400">Holistic treatment therapies</p>
              </div>
              <div className="bg-white p-4 border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all duration-300 rounded-xl space-y-2 text-center group">
                <span className="p-3 bg-rose-50 text-rose-500 rounded-lg inline-block group-hover:bg-rose-500 group-hover:text-white transition">💪</span>
                <h4 className="font-bold text-gray-800 text-xs">Fitness Gym</h4>
                <p className="text-[10px] text-gray-400">Modern fitness equipments</p>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">What Our Guests Say</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-3">
                <div className="flex gap-1.5 text-amber-400">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  &ldquo;Our weekend stay at ZZZ Hotel was absolutely spectacular. The room details were premium, and the room clean service was prompt and immaculate.&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-100">
                    <Image src="https://i.pravatar.cc/80" alt="Reviewer" fill />
                  </div>
                  <div>
                    <h5 className="font-bold text-[11px] text-gray-800">Sarah Jenkins</h5>
                    <p className="text-[9px] text-gray-400">Regular Guest</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-3">
                <div className="flex gap-1.5 text-amber-400">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  &ldquo;A wonderful experience! Booking was easy, and the credit card transaction was smooth. Recommend the Suite Room for families.&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-100">
                    <Image src="https://i.pravatar.cc/90" alt="Reviewer" fill />
                  </div>
                  <div>
                    <h5 className="font-bold text-[11px] text-gray-800">David Miller</h5>
                    <p className="text-[9px] text-gray-400">Business Traveler</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* RIGHT COLUMN: Quick Search Panel */}
        <aside className="w-full lg:w-96 bg-white border-l border-gray-100 p-6 overflow-y-auto shrink-0 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">Quick Booking</h3>

          {/* Quick Search Widget */}
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <h4 className="font-bold text-sm text-gray-800">Find Available Rooms</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check In</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <input 
                    type="date" 
                    value={formData.checkIn}
                    onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                    className="bg-transparent border-none p-0 text-xs font-semibold text-gray-800 focus:ring-0 w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check Out</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <input 
                    type="date" 
                    value={formData.checkOut}
                    onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                    className="bg-transparent border-none p-0 text-xs font-semibold text-gray-800 focus:ring-0 w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Guests</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Users className="w-4 h-4 text-rose-500" />
                  <select 
                    value={formData.guests}
                    onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
                    className="bg-transparent border-none p-0 text-xs font-semibold text-gray-800 focus:ring-0 w-full cursor-pointer"
                  >
                    {[1,2,3,4,5,6].map(num => (
                      <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-200 text-center block text-sm"
            >
              Search & Book Room
            </button>
          </form>

          {/* Featured Room Card */}
          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/20 space-y-4">
            <h4 className="font-bold text-sm text-gray-800">Featured Luxury Room</h4>
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100">
              <Image src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400" alt="Featured Suite" fill className="object-cover" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-gray-900">Suite Room - Executive Suite</h5>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-rose-500">Rp 1,500,000<span className="text-[10px] text-gray-400 font-normal">/night</span></span>
                <span className="text-[10px] text-gray-500">🛏️ 2 Beds | 🚿 2 Baths</span>
              </div>
            </div>
            <button 
              onClick={() => router.push('/booking/select-room')}
              className="w-full py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
            >
              Browse Details
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
              <h3 className="text-lg font-bold text-gray-900">Confirm Log Out</h3>
              <p className="text-sm text-gray-500">Are you sure you want to log out of ZZZ Hotel?</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 text-xs font-bold border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 rounded-xl text-white transition shadow-md shadow-rose-200"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}