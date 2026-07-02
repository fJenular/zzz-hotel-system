'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, LogOut, Bell, RefreshCw, CheckCircle, Clock, 
  ArrowRight, ShieldAlert, Sparkles, User, DoorOpen
} from 'lucide-react'
import Link from 'next/link'

export default function ReceptionistCheckInPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      fetchBookings()
    }
    checkUser()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users (full_name, email, phone),
        rooms (room_number),
        room_types (name)
      `)
      .eq('status', 'confirmed')
      .order('check_in', { ascending: true })

    if (error) {
      alert(error.message)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const handleCheckIn = async (bookingId: string, roomId: string) => {
    try {
      // 1. Update booking status
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({ status: 'checked_in' })
        .eq('id', bookingId)

      if (bookingErr) throw bookingErr

      // 2. Update room status
      const { error: roomErr } = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', roomId)

      if (roomErr) throw roomErr

      alert('Check-In completed successfully!')
      fetchBookings()
    } catch (err: any) {
      alert(err.message || 'Check-In failed')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold text-gray-900 tracking-tight">
            <span className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-200">🏨</span>
            <span>ZZZ HOTEL</span>
          </Link>

          <nav className="space-y-1">
            <Link href="/receptionist/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <DoorOpen className="w-5 h-5" />
              <span>Rooms Grid</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <CheckCircle className="w-5 h-5 text-rose-500" />
              <span>Check-In Queue</span>
            </div>
            <Link href="/receptionist/check-out" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <ArrowRight className="w-5 h-5" />
              <span>Check-Out Queue</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-4">
          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-400 px-4 uppercase tracking-wider">Account</p>
          <div className="px-4 py-2 bg-gray-50 rounded-xl mb-2">
            <p className="text-xs font-bold text-gray-800">{user?.full_name}</p>
            <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Check-In Operations</h1>
            <p className="text-xs text-gray-500">Manage incoming guest arrivals and room key issuances.</p>
          </div>
          <button 
            onClick={fetchBookings}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading check-in queue...</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white border border-gray-100 p-12 text-center rounded-2xl">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">No arrivals queued</p>
              <p className="text-xs text-gray-400 mt-1">There are no bookings awaiting check-in at this time.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Room Assigned</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Payment</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{booking.users?.full_name || 'Guest'}</div>
                        <div className="text-[10px] text-gray-400">{booking.users?.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-rose-500">Room {booking.rooms?.room_number}</div>
                        <div className="text-[10px] text-gray-400">{booking.room_types?.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                          booking.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {booking.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleCheckIn(booking.id, booking.room_id)}
                          className="px-3.5 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition shadow-sm"
                        >
                          Complete Check-In
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
