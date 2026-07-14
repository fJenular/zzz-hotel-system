'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Save, X, Search, Bell, Edit, Trash2, Calendar, Plus, User, DoorOpen, DollarSign, Clock
} from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminBookingsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create Booking State
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBooking, setNewBooking] = useState({
    user_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    guests_count: 1,
    total_price: 0,
    status: 'confirmed',
    payment_status: 'unpaid'
  })

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
      fetchFormData()
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
        rooms (
          room_number,
          room_types (name)
        ),
        payments (
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      const mappedData = (data || []).map((b: any) => {
        let pStatus = 'unpaid'
        if (b.payments && b.payments.length > 0) {
          const rawStatus = b.payments[0].status
          if (rawStatus === 'paid') pStatus = 'paid'
          else if (rawStatus === 'refunded') pStatus = 'refunded'
          else if (rawStatus === 'failed') pStatus = 'failed'
        }
        return {
          ...b,
          payment_status: pStatus
        }
      })
      setBookings(mappedData)
    }
    setLoading(false)
  }

  const fetchFormData = async () => {
    const { data: guestsData } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'guest')

    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*, room_types(name, base_price)')
      .eq('status', 'available')

    if (guestsData) setGuests(guestsData)
    if (roomsData) setRooms(roomsData)
  }

  // Calculate dynamic price
  useEffect(() => {
    if (newBooking.room_id && newBooking.check_in && newBooking.check_out) {
      const room = rooms.find(r => r.id === newBooking.room_id)
      if (room) {
        const pricePerNight = room.room_types?.base_price || 0
        const start = new Date(newBooking.check_in)
        const end = new Date(newBooking.check_out)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
        setNewBooking(prev => ({
          ...prev,
          total_price: pricePerNight * diffDays
        }))
      }
    }
  }, [newBooking.room_id, newBooking.check_in, newBooking.check_out, rooms])

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBooking.user_id || !newBooking.room_id || !newBooking.check_in || !newBooking.check_out) {
      alert('Please fill in all fields')
      return
    }

    try {
      const selectedRoom = rooms.find(r => r.id === newBooking.room_id)
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: newBooking.user_id,
          room_id: newBooking.room_id,
          room_type_id: selectedRoom?.room_type_id,
          check_in: newBooking.check_in,
          check_out: newBooking.check_out,
          guests_count: Number(newBooking.guests_count),
          total_price: newBooking.total_price,
          status: newBooking.status
        })
        .select()
        .single()

      if (error) throw error

      const dbPaymentStatus = newBooking.payment_status === 'unpaid' ? 'pending' : newBooking.payment_status
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: data.id,
          amount: newBooking.total_price,
          payment_method: 'manual',
          status: dbPaymentStatus
        })

      if (paymentError) throw paymentError

      // Update room status to occupied if checked_in
      if (newBooking.status === 'checked_in') {
        await supabase
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', newBooking.room_id)
      }

      alert('Booking created successfully!')
      setShowAddForm(false)
      setNewBooking({
        user_id: '',
        room_id: '',
        check_in: '',
        check_out: '',
        guests_count: 1,
        total_price: 0,
        status: 'confirmed',
        payment_status: 'unpaid'
      })
      fetchBookings()
      fetchFormData()
    } catch (err: any) {
      alert(err.message || 'Failed to create booking')
    }
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
      // Find booking first to see if room status needs update
      const booking = bookings.find(b => b.id === bookingId)

      const { error } = await supabase
        .from('bookings')
        .update({
          status: editForm.status
        })
        .eq('id', bookingId)

      if (error) throw error

      const { data: existingPayments } = await supabase
        .from('payments')
        .select('id')
        .eq('booking_id', bookingId)

      const dbPaymentStatus = editForm.payment_status === 'unpaid' ? 'pending' : editForm.payment_status

      if (existingPayments && existingPayments.length > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ status: dbPaymentStatus })
          .eq('id', existingPayments[0].id)
        if (paymentError) throw paymentError
      } else {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            booking_id: bookingId,
            amount: booking.total_price,
            payment_method: 'manual',
            status: dbPaymentStatus
          })
        if (paymentError) throw paymentError
      }

      // Update room status based on booking status changes
      if (booking) {
        let newRoomStatus = 'available'
        if (editForm.status === 'checked_in') {
          newRoomStatus = 'occupied'
        } else if (editForm.status === 'checked_out') {
          newRoomStatus = 'available' // needs cleaning usually, but simplify to available
        } else if (editForm.status === 'cancelled') {
          newRoomStatus = 'available'
        }

        await supabase
          .from('rooms')
          .update({ status: newRoomStatus })
          .eq('id', booking.room_id)
      }

      alert('Booking updated successfully!')
      setEditingBookingId(null)
      fetchBookings()
    } catch (err: any) {
      alert(err.message || 'Failed to update booking')
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this booking record?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error
      alert('Booking record deleted successfully.')
      fetchBookings()
    } catch (err: any) {
      alert(err.message || 'Failed to delete booking')
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
      <AdminSidebar userName={user?.full_name} userRole={user?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Hotel Bookings Management</h1>
            <p className="text-xs text-gray-500">Monitor all stay reservations, payments, and booking states.</p>
          </div>
          <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Action Bar */}
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search bookings by guest name, room, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-neutral-200 bg-white rounded-xl text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-amber-200 transition cursor-pointer"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddForm ? 'Cancel' : 'Add Booking'}</span>
            </button>
          </div>

          {/* Create Booking Form */}
          {showAddForm && (
            <div className="bg-white border border-neutral-200/60 p-8 rounded-2xl shadow-sm animate-scale-up space-y-6">
              <h3 className="text-base font-bold text-neutral-800 font-serif">Create New Booking</h3>
              <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Select Guest</label>
                  <select
                    value={newBooking.user_id}
                    onChange={(e) => setNewBooking({ ...newBooking, user_id: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Guest --</option>
                    {guests.map((g) => (
                      <option key={g.id} value={g.id}>{g.full_name} ({g.email})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Select Room</label>
                  <select
                    value={newBooking.room_id}
                    onChange={(e) => setNewBooking({ ...newBooking, room_id: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Available Room --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} - {r.room_types?.name} (Rp {r.room_types?.base_price.toLocaleString()}/night)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Guests Count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newBooking.guests_count}
                    onChange={(e) => setNewBooking({ ...newBooking, guests_count: Number(e.target.value) })}
                    className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Check-In Date</label>
                  <input
                    type="date"
                    value={newBooking.check_in}
                    onChange={(e) => setNewBooking({ ...newBooking, check_in: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Check-Out Date</label>
                  <input
                    type="date"
                    value={newBooking.check_out}
                    onChange={(e) => setNewBooking({ ...newBooking, check_out: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Booking Status</label>
                  <select
                    value={newBooking.status}
                    onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Payment Status</label>
                  <select
                    value={newBooking.payment_status}
                    onChange={(e) => setNewBooking({ ...newBooking, payment_status: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2 flex items-end justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div>
                    <span className="text-xs text-neutral-400 uppercase font-bold">Estimated Cost</span>
                    <p className="text-2xl font-black text-amber-700">Rp {newBooking.total_price.toLocaleString()}</p>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
                  >
                    Save Booking
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bookings Table */}
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading bookings...</div>
          ) : (
            <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Stay Info</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Total Cost</th>
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
                          <div className="font-bold text-amber-700">Room {booking.rooms?.room_number || 'N/A'}</div>
                          <div className="text-[10px] text-gray-400">{booking.rooms?.room_types?.name}</div>
                          <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                            {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-neutral-900 text-sm">
                          Rp {Number(booking.total_price).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {editingBookingId === booking.id ? (
                            <select 
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-amber-400"
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
                              className="border border-neutral-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-amber-400"
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
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingBookingId(null)}
                                className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStartEdit(booking)}
                                className="p-1.5 text-neutral-400 hover:bg-neutral-50 rounded-lg transition cursor-pointer"
                                title="Edit Booking Status"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBooking(booking.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Booking Permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
