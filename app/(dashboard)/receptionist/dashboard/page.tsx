'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, LogOut, Bell, RefreshCw, CheckCircle, Clock, 
  ArrowRight, ShieldAlert, Sparkles, User, Search, DoorOpen, ListTodo
} from 'lucide-react'
import Image from 'next/image'
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
    
    // Fetch Rooms
    const { data: roomsData } = await supabase
      .from('rooms')
      .select(`
        *,
        room_types (name)
      `)
      .order('room_number')

    // Fetch Bookings with profiles (users)
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        *,
        users (full_name, email, phone),
        rooms (room_number),
        room_types (name)
      `)
      .order('created_at', { ascending: false })

    if (roomsData) setRooms(roomsData)
    if (bookingsData) setBookings(bookingsData)
    setLoading(false)
  }

  const handleCheckIn = async (bookingId: string, roomId: string) => {
    try {
      // 1. Update booking status to checked_in
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({ status: 'checked_in' })
        .eq('id', bookingId)

      if (bookingErr) throw bookingErr

      // 2. Update room status to occupied
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
      // 1. Update booking status to checked_out
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({ status: 'checked_out' })
        .eq('id', bookingId)

      if (bookingErr) throw bookingErr

      // 2. Update room status to dirty
      const { error: roomErr } = await supabase
        .from('rooms')
        .update({ status: 'dirty' })
        .eq('id', roomId)

      if (roomErr) throw roomErr

      // 3. Create housekeeping task
      const { error: taskErr } = await supabase
        .from('housekeeping_tasks')
        .insert({
          room_id: roomId,
          task_type: 'cleaning',
          status: 'pending',
          priority: 'normal',
          due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
        })

      if (taskErr) throw taskErr

      alert('Check-Out successful! Housekeeping task auto-created and room marked dirty.')
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

  const filteredRooms = rooms.filter(room => 
    room.room_number.includes(searchQuery) || 
    room.room_types?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const checkinQueue = bookings.filter(b => b.status === 'confirmed')
  const checkoutQueue = bookings.filter(b => b.status === 'checked_in')

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
            <button 
              onClick={() => setActiveTab('rooms')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'rooms' ? 'text-rose-500 bg-rose-50/60 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <DoorOpen className="w-5 h-5" />
              <span>Rooms Grid</span>
            </button>
            <button 
              onClick={() => setActiveTab('checkin')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'checkin' ? 'text-rose-500 bg-rose-50/60 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Check-In Queue</span>
              {checkinQueue.length > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{checkinQueue.length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('checkout')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'checkout' ? 'text-rose-500 bg-rose-50/60 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
              <span>Check-Out Queue</span>
              {checkoutQueue.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{checkoutQueue.length}</span>
              )}
            </button>
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Front Desk Receptionist</h1>
            <p className="text-xs text-gray-500">Manage live room status, guest arrivals, and check-out workflows.</p>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 transition"
            aria-label="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading dashboard data...</div>
          ) : (
            <>
              {/* Rooms Grid Tab */}
              {activeTab === 'rooms' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center gap-4 flex-wrap">
                    <div className="relative max-w-md w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search room number, type, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 transition bg-white"
                      />
                    </div>
                    <div className="flex gap-2 text-xs font-medium text-gray-500 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                      <span className="px-2 py-1 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available</span>
                      <span className="px-2 py-1 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Occupied</span>
                      <span className="px-2 py-1 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Dirty</span>
                      <span className="px-2 py-1 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Maintenance</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredRooms.map((room) => {
                      let statusBg = 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      let statusDot = 'bg-emerald-500'
                      if (room.status === 'occupied') {
                        statusBg = 'bg-rose-50 border-rose-100 text-rose-700'
                        statusDot = 'bg-rose-500'
                      } else if (room.status === 'dirty') {
                        statusBg = 'bg-amber-50 border-amber-100 text-amber-700'
                        statusDot = 'bg-amber-500'
                      } else if (room.status === 'maintenance') {
                        statusBg = 'bg-gray-100 border-gray-200 text-gray-700'
                        statusDot = 'bg-gray-500'
                      }

                      return (
                        <div 
                          key={room.id}
                          className={`p-5 rounded-2xl border bg-white flex flex-col justify-between h-40 hover:shadow-md transition duration-200 ${statusBg}`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-2xl font-black">{room.room_number}</span>
                              <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`}></span>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-1">{room.room_types?.name}</p>
                            <p className="text-[10px] text-gray-400">Floor {room.floor}</p>
                          </div>

                          <div className="mt-4 flex gap-1">
                            <select 
                              value={room.status}
                              onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                              className="text-[10px] font-bold py-1 px-2 bg-white/80 border border-gray-200 rounded-lg text-gray-700 focus:outline-none w-full"
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

              {/* Check-In Queue Tab */}
              {activeTab === 'checkin' && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-bold text-gray-900">Arriving Guests (Check-In Required)</h2>
                  {checkinQueue.length === 0 ? (
                    <div className="bg-white border border-gray-100 p-12 text-center rounded-2xl">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <p className="font-semibold text-gray-700">All caught up!</p>
                      <p className="text-xs text-gray-400 mt-1">There are no pending arrivals left to check in today.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Room Assigned</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Status</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {checkinQueue.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50/50 transition">
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{booking.users?.full_name || 'Guest'}</div>
                                <div className="text-xs text-gray-400">{booking.users?.phone || 'No phone'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-rose-500">Room {booking.rooms?.room_number}</div>
                                <div className="text-[10px] text-gray-400">{booking.room_types?.name}</div>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-gray-600">
                                {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                                  booking.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                  {booking.payment_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleCheckIn(booking.id, booking.room_id)}
                                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition"
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
                </div>
              )}

              {/* Check-Out Queue Tab */}
              {activeTab === 'checkout' && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-bold text-gray-900">Departing Guests (Check-Out Required)</h2>
                  {checkoutQueue.length === 0 ? (
                    <div className="bg-white border border-gray-100 p-12 text-center rounded-2xl">
                      <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                      <p className="font-semibold text-gray-700">No active stays</p>
                      <p className="text-xs text-gray-400 mt-1">There are no checked-in guests list matching checkout today.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Room Occupied</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Stay Period</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Checkout Due</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {checkoutQueue.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50/50 transition">
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{booking.users?.full_name || 'Guest'}</div>
                                <div className="text-xs text-gray-400">{booking.users?.phone || 'No phone'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-rose-500">Room {booking.rooms?.room_number}</div>
                                <div className="text-[10px] text-gray-400">{booking.room_types?.name}</div>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-gray-600">
                                {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500">
                                {new Date(booking.check_out).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleCheckOut(booking.id, booking.room_id)}
                                  className="px-3.5 py-1.5 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition"
                                >
                                  Complete Check-Out
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
