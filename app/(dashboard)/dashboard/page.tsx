'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Home, Calendar, CreditCard } from 'lucide-react'

export default function UserDashboard() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.error('Auth error:', authError)
          router.push('/login')
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('User fetch error:', userError)
          setError('Gagal memuat data pengguna')
          setLoading(false)
          return
        }

        setUser(userData)

        // Fetch bookings di dalam async function
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`
            *,
            rooms (room_number, room_types(name, base_price))
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setBookings(bookingsData || [])
        setLoading(false)
      } catch (err: any) {
        console.error('Unexpected error:', err)
        setError(err.message || 'Terjadi kesalahan yang tidak terduga')
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">⚠️ Error</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/login')}>
              Kembali ke Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏨 ZZZ Hotel</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{user?.full_name}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard Saya</h2>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Calendar className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-gray-600">Total Pemesanan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CreditCard className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                  <p className="text-gray-600">Dikonfirmasi</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Home className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                  <p className="text-gray-600">Tertunda</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Pemesanan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Kamar {booking.rooms?.room_number}
                        </h3>
                        <p className="text-gray-600">{booking.rooms?.room_types?.name}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status === 'confirmed' ? 'DIKONFIRMASI' : booking.status === 'pending' ? 'TERTUNDA' : booking.status.toUpperCase()}
                        </span>
                        <p className="text-lg font-bold text-blue-600 mt-2">
                          Rp {Number(booking.total_price).toLocaleString()}
                        </p>
                        {booking.status === 'pending' && (
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => router.push(`/booking/payment?bookingId=${booking.id}`)}
                          >
                            Bayar Sekarang
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Anda belum memiliki pemesanan apa pun</p>
                <Button onClick={() => router.push('/')}>
                  <Home className="w-4 h-4 mr-2" />
                  Cari Kamar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}