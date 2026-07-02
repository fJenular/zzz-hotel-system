'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Calendar, Home, LogOut, Bell, Compass, ShoppingBag, 
  MessageSquare, User, LayoutDashboard, HelpCircle, 
  ChevronRight, RefreshCw, Clock, Tag, Sparkles
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function UserDashboard() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
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
      setUser(userData)
    }
    getUser()
  }, [])

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (room_number, room_types(name, base_price))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      return data
    },
    enabled: !!user
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': 
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'confirmed': 
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'checked_in': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'checked_out': 
        return 'bg-slate-50 text-slate-700 border-slate-200'
      case 'cancelled': 
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default: 
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (!user) return <div className="p-8 text-center text-gray-500 font-semibold animate-pulse">Loading dashboard...</div>

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
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <ShoppingBag className="w-5 h-5 text-rose-500" />
              <span>My Dashboard</span>
            </Link>
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <HelpCircle className="w-5 h-5" />
              <span>Help & Support</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
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
                My Bookings & Orders
              </h1>
              <p className="text-sm text-gray-500 mt-1">Hello, {user.full_name}. View and track your hotel room reservations.</p>
            </div>
            
            {/* Top Toolbar */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => refetch()}
                className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition"
                aria-label="Refresh bookings"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-rose-100 overflow-hidden relative border-2 border-white shadow-md">
                <Image src="https://i.pravatar.cc/100" alt="Avatar" fill />
              </div>
            </div>
          </div>

          {/* Bookings List Section */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading your bookings...</div>
            ) : bookings && bookings.length > 0 ? (
              <div className="grid gap-4 animate-slide-up">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="border border-gray-100 hover:border-gray-200 hover:shadow-sm transition bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900">
                              Room {booking.rooms?.room_number}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(booking.status)}`}>
                              {booking.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-500">{booking.rooms?.room_types?.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                            <span>
                              {new Date(booking.check_in).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(booking.check_out).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right space-y-1">
                          <div className="text-2xl font-black text-rose-500">
                            Rp {Number(booking.total_price).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            ID: {booking.id.substring(0, 8).toUpperCase()}
                          </div>
                          {booking.status === 'pending' && (
                            <button 
                              onClick={() => router.push(`/booking/payment?bookingId=${booking.id}`)}
                              className="mt-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-rose-200"
                            >
                              Pay Now
                            </button>
                          )}
                          {(booking.status === 'confirmed' || booking.status === 'checked_in') && (
                            <button 
                              onClick={() => router.push('/restaurant/order')}
                              className="mt-2 px-4 py-2 bg-rose-50/80 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-100 rounded-xl transition flex items-center gap-1.5"
                            >
                              🍕 Order Food
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-gray-100 bg-white rounded-2xl shadow-sm">
                <CardContent className="p-12 text-center space-y-4">
                  <p className="text-gray-500 font-medium">You don&apos;t have any bookings yet</p>
                  <button 
                    onClick={() => router.push('/booking/select-room')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition shadow-lg shadow-rose-200 text-xs"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Browse Available Rooms</span>
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Quick Promotion/Help Details */}
        <aside className="w-full lg:w-96 bg-white border-l border-gray-100 p-6 overflow-y-auto shrink-0 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">Special Benefits</h3>

          <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <Tag className="w-5 h-5" />
              <span className="font-bold text-xs">Member Special Offer</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              Earn reward points for every night spent at ZZZ Hotel. Redeem points for free laundry, dinner discounts, or spa vouchers.
            </p>
          </div>

          <div className="bg-gray-50/30 p-4 border border-gray-100 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-5 h-5" />
              <span className="font-bold text-xs">Late Check-Out</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              Available upon request for executive guests. Check with our receptionist panel directly in the lobby.
            </p>
          </div>
        </aside>

      </div>
    </div>
  )
}
