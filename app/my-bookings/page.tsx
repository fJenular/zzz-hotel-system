'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Calendar, CreditCard, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function MyBookingsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/login?redirect=/my-bookings')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        setUser(userData)

        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`
            *,
            rooms (room_number, room_types(name, base_price))
          `)
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })

        setBookings(bookingsData || [])
      } catch (err) {
        console.error('Error loading bookings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [router, supabase])

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'checked_in': return 'bg-blue-100 text-blue-800'
      case 'checked_out': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-rose-500 mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          
          {/* Filter tabs */}
          <div className="flex gap-2 mt-4 sm:mt-0">
            {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === f 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          Room {booking.rooms?.room_number}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{booking.rooms?.room_types?.name}</p>
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.check_in).toLocaleDateString('id-ID', { 
                            day: 'numeric', month: 'short', year: 'numeric' 
                          })} - {new Date(booking.check_out).toLocaleDateString('id-ID', { 
                            day: 'numeric', month: 'short', year: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          Rp {Number(booking.total_price).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {booking.special_requests && (
                        <p className="mt-2 text-sm text-gray-500 italic">
                          Note: {booking.special_requests}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      {booking.status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => router.push(`/booking/payment?bookingId=${booking.id}`)}
                        >
                          Pay Now
                        </Button>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/booking/success?bookingId=${booking.id}`)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-400 mb-4">
                <Calendar className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'all' ? 'No bookings yet' : `No ${filter.replace('_', ' ')} bookings`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? 'Start planning your stay at ZZZ Hotel!' 
                  : 'No bookings match this filter.'}
              </p>
              <Button onClick={() => router.push('/booking/select-room')}>
                <Home className="w-4 h-4 mr-2" />
                Book a Room
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}