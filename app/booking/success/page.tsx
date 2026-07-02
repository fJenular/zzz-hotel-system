'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Download, Home } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  
  const bookingId = searchParams.get('bookingId') || ''

  const { data: booking } = useQuery({
    queryKey: ['booking-success', bookingId],
    queryFn: async () => {
      if (!bookingId) return null
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (room_number, room_types(name))
        `)
        .eq('id', bookingId)
        .single()
      return data
    },
    enabled: !!bookingId
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your booking. We've sent a confirmation email to your registered email.
            </p>

            {booking && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-bold text-lg mb-4">Booking Details</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID</span>
                    <span className="font-mono text-sm">{booking.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room</span>
                    <span>Room {booking.rooms?.room_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in</span>
                    <span>{new Date(booking.check_in).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out</span>
                    <span>{new Date(booking.check_out).toLocaleDateString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Paid</span>
                    <span className="text-blue-600">Rp {Number(booking.total_price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                View My Bookings
              </Button>
              <Button onClick={() => router.push('/')}>
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}