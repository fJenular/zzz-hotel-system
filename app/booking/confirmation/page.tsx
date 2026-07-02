'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, CreditCard } from 'lucide-react'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = parseInt(searchParams.get('guests') || '2')
  const roomId = searchParams.get('roomId') || ''

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialRequests: ''
  })

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setUser(userData)
        setFormData({
          fullName: userData?.full_name || '',
          email: userData?.email || '',
          phone: userData?.phone || '',
          specialRequests: ''
        })
      }
    }
    getUser()
  }, [])

  // Get room details
  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!roomId) return null
      const { data } = await supabase
        .from('rooms')
        .select('*, room_types(*)')
        .eq('id', roomId)
        .single()
      return data
    },
    enabled: !!roomId
  })

  // Calculate price
  const nights = checkIn && checkOut 
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const pricePerNight = room?.room_types?.base_price || 0
  const totalPrice = nights * pricePerNight

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Please login first to continue booking')
      router.push(`/login?redirect=/booking/confirmation?${searchParams.toString()}`)
      return
    }

    if (!roomId) {
      alert('Please select a room first')
      router.push('/booking/select-room?' + searchParams.toString())
      return
    }

    setLoading(true)

    try {
      // Create booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          room_id: roomId,
          check_in: checkIn,
          check_out: checkOut,
          total_price: totalPrice,
          status: 'pending',
          guests_count: guests,
          special_requests: formData.specialRequests
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to payment page
      router.push(`/booking/payment?bookingId=${booking.id}`)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to create booking: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Booking Confirmation</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="text-center py-8">
                  <p className="mb-4">Please login to continue</p>
                  <Button onClick={() => router.push('/login')}>Login</Button>
                </div>
              ) : (
                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      placeholder="Any special requests?"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : 'Continue to Payment'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {room && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Room</p>
                    <p className="font-semibold">Room {room.room_number}</p>
                    <p className="text-sm">{room.room_types.name}</p>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="text-sm text-gray-600">Check-in</p>
                        <p className="font-semibold">{new Date(checkIn).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="text-sm text-gray-600">Check-out</p>
                        <p className="font-semibold">{new Date(checkOut).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <p>{guests} Guest{guests > 1 ? 's' : ''}</p>
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Rp {pricePerNight.toLocaleString()} x {nights} night{nights > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">Rp {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
}