'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Bell, Compass, ShoppingBag, MessageSquare, User, LayoutDashboard,
  HelpCircle, LogOut, ShieldCheck, Sparkles, Star, Waves, Utensils, Heart, Dumbbell, Home
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function FacilitiesPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const facilities = [
    {
      title: "Infinity Pool",
      description: "Experience absolute relaxation with panoramic skyline views of the city. Our infinity pool is heated and includes separate shallow areas for children, sun-loungers, and an adjacent cocktail bar.",
      icon: Waves,
      image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600",
      hours: "06:00 AM - 09:00 PM",
      location: "Penthouse Level (24th Floor)"
    },
    {
      title: "Fine Dining Restaurant",
      description: "Indulge in a fine selection of local and international cuisines curated by Michelin-star chefs. Features indoor luxury seating, private dining rooms, and a stellar wine cellar list.",
      icon: Utensils,
      image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600",
      hours: "06:00 AM - 11:00 PM",
      location: "Lobby Level (1st Floor)"
    },
    {
      title: "Spa & Wellness",
      description: "Rejuvenate your body and mind with our holistic massage therapies, natural facial treatments, and hot stone rituals. Includes premium private therapy rooms and a relaxing sauna space.",
      icon: Heart,
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600",
      hours: "09:00 AM - 09:00 PM",
      location: "Wellness Wing (3rd Floor)"
    },
    {
      title: "Fitness Center",
      description: "Maintain your health routine with our fully equipped gymnasium, featuring state-of-the-art treadmills, stationary bicycles, strength training equipment, and professional on-site fitness instructors.",
      icon: Dumbbell,
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
      hours: "24 Hours (Access via Key Card)",
      location: "Wellness Wing (2nd Floor)"
    }
  ]

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
            <Link href="/booking/select-room" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Compass className="w-5 h-5" />
              <span>Discover</span>
            </Link>
            <Link href="/facilities" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <Sparkles className="w-5 h-5 text-rose-500" />
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
              <Link href="/login" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hotel Facilities</h1>
              <p className="text-sm text-gray-500 mt-1">Discover comfort, culinary excellence, and body wellness.</p>
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

          {/* Facilities list grid */}
          <div className="grid gap-6 animate-slide-up">
            {facilities.map((fac, idx) => {
              const Icon = fac.icon
              return (
                <div key={idx} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm shadow-gray-50/50 hover:shadow-md transition grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6">
                  {/* Photo Column */}
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100">
                    <Image src={fac.image} alt={fac.title} fill className="object-cover" />
                  </div>

                  {/* Info Column */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                        <Icon className="w-5 h-5" />
                      </span>
                      <h2 className="text-xl font-bold text-gray-900">{fac.title}</h2>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed">{fac.description}</p>

                    <hr className="border-gray-50" />

                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-400">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-gray-300">Opening Hours</span>
                        <span className="text-gray-700">{fac.hours}</span>
                      </div>
                      <div className="border-l border-gray-100 pl-4">
                        <span className="block text-[9px] uppercase tracking-wider text-gray-300">Location</span>
                        <span className="text-gray-700">{fac.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        {/* RIGHT COLUMN: Info panel */}
        <aside className="w-full lg:w-96 bg-white border-l border-gray-100 p-6 overflow-y-auto shrink-0 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">Highlights</h3>

          {/* Featured Promo */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-2xl p-6 space-y-3 shadow-lg shadow-rose-100">
            <Sparkles className="w-8 h-8 text-white/90" />
            <h4 className="font-black text-sm uppercase tracking-wider">Premium Access</h4>
            <p className="text-xs text-white/80 leading-relaxed">
              All in-house hotel guests enjoy free complimentary access to the Pool, Fitness Center, and high-speed Wi-Fi network.
            </p>
            <button 
              onClick={() => router.push('/booking/select-room')}
              className="w-full py-2 bg-white text-rose-600 font-bold rounded-xl text-xs hover:bg-gray-50 transition"
            >
              Book Stay Now
            </button>
          </div>

          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/20 space-y-3">
            <h4 className="font-bold text-sm text-gray-800">Dining Reservations</h4>
            <p className="text-xs text-gray-500 leading-normal">
              Planning a business dinner or private meeting? Speak to our receptionist team or order room services directly from your dashboard.
            </p>
          </div>
        </aside>

      </div>
    </div>
  )
}
