'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  DoorOpen, LogOut, Bell, RefreshCw, CheckCircle, Clock, 
  ArrowRight, Sparkles, User, Search, Calendar, KeyRound, Star,
  Heart, Mail, MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

export default function ReceptionistDashboard() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'rooms' | 'checkin' | 'checkout'>('rooms')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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
      .select('*, users (full_name, email, phone), rooms (room_number), room_types (name)')
      .order('created_at', { ascending: false })

    if (roomsData) setRooms(roomsData)
    if (bookingsData) setBookings(bookingsData)
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

      alert('Check-In successful! Room is now marked occupied.')
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Check-In failed')
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

      alert('Check-Out successful! Housekeeping task auto-created.')
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Check-Out failed')
    }
  }

  const handleUpdateRoomStatus = async (roomId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId)
      if (error) throw error
      alert(`Room status updated to ${newStatus}`)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to update status')
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
    <div className="flex min-h-screen bg-amber-50/30 font-sans text-slate-800 antialiased">
      {/* ===== SIDEBAR: Warm Hospitality Amber ===== */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-amber-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-800 tracking-tight block leading-tight">zzz-hotel</span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mt-0.5">Front Desk</span>
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
              <span>Rooms Grid</span>
            </button>
            <button 
              onClick={() => setActiveTab('checkin')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                activeTab === 'checkin' ? 'text-amber-600 bg-amber-50 border border-amber-100/50' : 'text-slate-500 hover:bg-amber-50/50 hover:text-slate-800'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Check-In Queue</span>
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
              <span>Check-Out Queue</span>
              {checkoutQueue.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{checkoutQueue.length}</span>
              )}
            </button>
          </nav>

          <div className="pt-4 space-y-2">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100/50">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Welcome</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{user?.full_name || 'Guest'}</p>
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
            <span>Log Out</span>
          </button>
          <p className="text-[9px] text-slate-400 font-medium text-center leading-relaxed">
            ZZZ Hotel Front Desk<br />
            © 2026 All Rights Reserved
          </p>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-white border-b border-amber-100/50 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Front Desk Reception</h1>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100/50">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
              <div className="relative hidden sm:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search rooms..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-amber-100 bg-amber-50/20 rounded-2xl text-xs focus:outline-none focus:border-amber-300 transition-colors"
                />
              </div>

            <div className="flex items-center gap-3 border-r border-amber-100 pr-5">
              <button className="p-2 text-slate-400 hover:text-amber-500 transition-colors" aria-label="Favorites">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-amber-500 transition-colors relative" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 border border-white rounded-full"></span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50 text-xs font-bold font-mono">
                {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'FR'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-800 leading-none">{user?.full_name || 'Receptionist'}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">Front Desk</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">Loading front desk data...</div>
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
                        placeholder="Search room number, type, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2.5 w-full border border-amber-100 bg-white rounded-2xl text-sm focus:outline-none focus:border-amber-300 transition-colors"
                      />
                    </div>
                    <div className="flex gap-2 text-xs font-medium text-slate-500 bg-white p-1.5 rounded-2xl border border-amber-100 shadow-sm">
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 rounded-xl"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available</span>
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-rose-50 text-rose-600 rounded-xl"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Occupied</span>
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-amber-50 text-amber-600 rounded-xl"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Dirty</span>
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-slate-50 text-slate-500 rounded-xl"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Maint</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredRooms.map((room: any) => {
                      let statusBg = 'bg-white border-emerald-100'
                      let statusHeader = 'bg-emerald-50 text-emerald-700'
                      let statusDot = 'bg-emerald-500'
                      let statusLabel = 'Available'
                      if (room.status === 'occupied') {
                        statusBg = 'bg-white border-rose-100'
                        statusHeader = 'bg-rose-50 text-rose-700'
                        statusDot = 'bg-rose-500'
                        statusLabel = 'Occupied'
                      } else if (room.status === 'dirty') {
                        statusBg = 'bg-white border-amber-100'
                        statusHeader = 'bg-amber-50 text-amber-700'
                        statusDot = 'bg-amber-500'
                        statusLabel = 'Dirty'
                      } else if (room.status === 'maintenance') {
                        statusBg = 'bg-white border-slate-100'
                        statusHeader = 'bg-slate-50 text-slate-700'
                        statusDot = 'bg-slate-500'
                        statusLabel = 'Maintenance'
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
                            <p className="text-[10px] text-slate-400">Floor {room.floor}</p>
                            <select 
                              value={room.status}
                              onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                              className="text-[10px] font-bold py-1.5 px-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none w-full cursor-pointer"
                            >
                              <option value="available">Available</option>
                              <option value="occupied">Occupied</option>
                              <option value="dirty">Dirty</option>
                              <option value="maintenance">Maintenance</option>
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
                  <h2 className="text-lg font-black text-slate-900">Arriving Guests</h2>
                  {checkinQueue.length === 0 ? (
                    <div className="bg-white border border-amber-100 p-16 text-center rounded-[28px]">
                      <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                      <p className="font-bold text-slate-700">All caught up!</p>
                      <p className="text-xs text-slate-400 mt-1">There are no pending arrivals left to check in today.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-amber-100 rounded-[28px] overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-amber-50">
                        <thead className="bg-amber-50/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Payment</th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold text-amber-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                          {checkinQueue.map((booking: any) => (
                            <tr key={booking.id} className="hover:bg-amber-50/30 transition">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{booking.users?.full_name || 'Guest'}</div>
                                <div className="text-xs text-slate-400">{booking.users?.phone || 'No phone'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-amber-600">Room {booking.rooms?.room_number}</div>
                                <div className="text-[10px] text-slate-400">{booking.room_types?.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-medium text-slate-600">
                                  {new Date(booking.check_in).toLocaleDateString()} 
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  → {new Date(booking.check_out).toLocaleDateString()}
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
                                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  Check In
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
                  <h2 className="text-lg font-black text-slate-900">Departing Guests</h2>
                  {checkoutQueue.length === 0 ? (
                    <div className="bg-white border border-amber-100 p-16 text-center rounded-[28px]">
                      <Clock className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                      <p className="font-bold text-slate-700">No active stays</p>
                      <p className="text-xs text-slate-400 mt-1">There are no checked-in guests ready to checkout.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-amber-100 rounded-[28px] overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-amber-50">
                        <thead className="bg-amber-50/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-amber-600 uppercase tracking-wider">Stay Period</th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold text-amber-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                          {checkoutQueue.map((booking: any) => (
                            <tr key={booking.id} className="hover:bg-amber-50/30 transition">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{booking.users?.full_name || 'Guest'}</div>
                                <div className="text-xs text-slate-400">{booking.users?.phone || 'No phone'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-amber-600">Room {booking.rooms?.room_number}</div>
                                <div className="text-[10px] text-slate-400">{booking.room_types?.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-medium text-slate-600">
                                  {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Checkout: {new Date(booking.check_out).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleCheckOut(booking.id, booking.room_id)}
                                  className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  Check Out
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