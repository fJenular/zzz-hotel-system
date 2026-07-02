'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, QrCode, Building, Wallet, CheckCircle } from 'lucide-react'

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  
  const bookingId = searchParams.get('bookingId') || ''
  const [selectedMethod, setSelectedMethod] = useState('qris')
  const [loading, setLoading] = useState(false)

  // Get booking details
  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (room_number, room_types(name, base_price))
        `)
        .eq('id', bookingId)
        .single()
      return data
    },
    enabled: !!bookingId
  })

  const paymentMethods = [
    { id: 'qris', name: 'QRIS', icon: QrCode, description: 'Scan QR from any e-wallet' },
    { id: 'bank_transfer', name: 'Bank Transfer (VA)', icon: Building, description: 'Virtual Account from any bank' },
    { id: 'e_wallet', name: 'E-Wallet', icon: Wallet, description: 'GoPay, OVO, Dana, ShopeePay' },
    { id: 'credit_card', name: 'Credit Card', icon: CreditCard, description: 'Visa, Mastercard, JCB' }
  ]

  const handlePayment = async () => {
    if (!bookingId) return

    setLoading(true)
    try {
      // Call payment API
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          paymentMethod: selectedMethod
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Payment failed')
      }

      // In production, redirect to Midtrans
      // window.location.href = data.data.redirect_url
      
      // For demo, simulate successful payment
      alert('Payment successful! (Demo mode)')
      
      // Update booking status
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)

      // Redirect to success page
      router.push(`/booking/success?bookingId=${bookingId}`)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Payment failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!booking) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center">Loading...</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Payment</h1>

      <div className="space-y-6">
        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Room</span>
              <span className="font-semibold">Room {booking.rooms?.room_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type</span>
              <span>{booking.rooms?.room_types?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in</span>
              <span>{new Date(booking.check_in).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out</span>
              <span>{new Date(booking.check_out).toLocaleDateString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-blue-600">Rp {Number(booking.total_price).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <label
                  key={method.id}
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedMethod === method.id 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-5 h-5"
                  />
                  <Icon className="w-8 h-8 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-semibold">{method.name}</p>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </label>
              )
            })}
          </CardContent>
        </Card>

        {/* Pay Button */}
        <Button 
          onClick={handlePayment}
          className="w-full text-lg py-6"
          disabled={loading}
        >
          {loading ? 'Processing...' : `Pay Rp ${Number(booking.total_price).toLocaleString()}`}
        </Button>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  )
}