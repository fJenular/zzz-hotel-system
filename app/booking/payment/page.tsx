'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, QrCode, Building, Wallet } from 'lucide-react'
import Script from 'next/script'

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const bookingId = searchParams.get('bookingId') || ''
  const [loading, setLoading] = useState(false)
  const [snapToken, setSnapToken] = useState<string | null>(null)

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

  const handlePayment = async () => {
    if (!bookingId) return

    setLoading(true)
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Payment failed')
      }

      setSnapToken(data.data.token)

      // Trigger Midtrans Snap popup
      if (typeof window !== 'undefined' && (window as any).snap) {
        (window as any).snap.pay(data.data.token, {
          onSuccess: async function (result: any) {
            console.log('Payment success:', result)

            // Update booking status
            await supabase
              .from('bookings')
              .update({ status: 'confirmed' })
              .eq('id', bookingId)

            // Update payment status
            await supabase
              .from('payments')
              .update({
                status: 'paid',
                paid_at: new Date().toISOString()
              })
              .eq('booking_id', bookingId)

            alert('Pembayaran berhasil!')
            router.push(`/booking/success?bookingId=${bookingId}`)
          },
          onPending: function (result: any) {
            console.log('Payment pending:', result)
            alert('Pembayaran tertunda. Harap selesaikan pembayaran Anda.')
            router.push(`/booking/success?bookingId=${bookingId}&status=pending`)
          },
          onError: function (result: any) {
            console.log('Payment error:', result)
            alert('Pembayaran gagal. Silakan coba lagi.')
          },
          onClose: function () {
            alert('Anda menutup popup tanpa menyelesaikan pembayaran')
          }
        })
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert('Pembayaran gagal: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!booking) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center">Memuat...</div>
  }

  return (
    <>
      {/* Midtrans Snap JS */}
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js'
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Pembayaran</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail Pemesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Kamar</span>
                <span className="font-semibold">Kamar {booking.rooms?.room_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipe</span>
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

          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm">Kartu Kredit</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <QrCode className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm">QRIS</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Building className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm">Transfer Bank</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm">E-Wallet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handlePayment}
            className="w-full text-lg py-6"
            disabled={loading}
          >
            {loading ? 'Memproses...' : `Bayar Rp ${Number(booking.total_price).toLocaleString()}`}
          </Button>
        </div>
      </div>
    </>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <PaymentContent />
    </Suspense>
  )
}