'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, Compass, LayoutDashboard, DoorOpen, Save, X, Search, LogOut, Bell, Edit, Trash2, Calendar
} from 'lucide-react'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'

export default function AdminBookingsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Editing state
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    status: '',
    payment_status: ''
  })

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

      if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
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
        users (full_name, email),
        rooms (room_number),
        room_types (name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const handleStartEdit = (booking: any) => {
    setEditingBookingId(booking.id)
    setEditForm({
      status: booking.status,
      payment_status: booking.payment_status
    })
  }

  const handleSaveEdit = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update(editForm)
        .eq('id', bookingId)

      if (error) throw error
      alert('Booking updated successfully!')
      setEditingBookingId(null)
      fetchBookings()
    } catch (err: any) {
      alert(err.message || 'Failed to update booking')
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) throw error
      alert('Booking cancelled successfully.')
      fetchBookings()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking')
    }
  }



  const filteredBookings = bookings.filter(b => 
    b.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.rooms?.room_number?.includes(searchQuery) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link href="/booking/select-room" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Compass className="w-5 h-5" />
              <span>Discover</span>
            </Link>
            <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <LayoutDashboard className="w-5 h-5" />
              <span>Admin Panel</span>
            </Link>
            <Link href="/admin/rooms" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <DoorOpen className="w-5 h-5" />
              <span>Rooms CRUD</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <Calendar className="w-5 h-5 text-rose-500" />
              <span>Bookings CRUD</span>
            </div>
            <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <DoorOpen className="w-5 h-5" />
              <span>Payments CRUD</span>
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
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hotel Bookings Management</h1>
            <p className="text-xs text-gray-500">Monitor all stay reservations, payments, and booking states.</p>
          </div>
          <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading bookings...</div>
          ) : (
            <div className="space-y-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search bookings by guest name, room, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 transition bg-white"
                />
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Stay Info</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Total Price</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Payment</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{booking.users?.full_name || 'Guest'}</div>
                          <div className="text-xs text-gray-400">{booking.users?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-rose-500">Room {booking.rooms?.room_number || 'N/A'}</div>
                          <div className="text-[10px] text-gray-400">{booking.room_types?.name}</div>
                          <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                            {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-gray-900 text-sm">
                          Rp {Number(booking.total_price).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {editingBookingId === booking.id ? (
                            <select 
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="checked_in">Checked In</option>
                              <option value="checked_out">Checked Out</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                              booking.status === 'confirmed' || booking.status === 'checked_in' ? 'bg-emerald-50 text-emerald-600' :
                              booking.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {booking.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingBookingId === booking.id ? (
                            <select 
                              value={editForm.payment_status}
                              onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                              className="border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                            >
                              <option value="unpaid">Unpaid</option>
                              <option value="paid">Paid</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                              booking.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {booking.payment_status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {editingBookingId === booking.id ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleSaveEdit(booking.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingBookingId(null)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStartEdit(booking)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {booking.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                  title="Cancel Booking"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
