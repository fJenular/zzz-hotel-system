'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, Compass, LayoutDashboard, LogOut, Bell, BarChart3, TrendingUp, DollarSign, Hotel, RefreshCw, FileText
} from 'lucide-react'
import Link from 'next/link'

export default function ManagerReportsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [bookings, setBookings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [roomRevenue, setRoomRevenue] = useState(0)
  const [diningRevenue, setDiningRevenue] = useState(0)

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

      if (userData?.role !== 'manager' && userData?.role !== 'admin' && userData?.role !== 'super_admin') {
        router.push('/')
        return
      }
      setUser(userData)
      fetchReports()
    }
    checkUser()
  }, [])

  const fetchReports = async () => {
    setLoading(true)

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*, users (full_name), rooms (room_number)')
      .order('created_at', { ascending: false })

    const { data: ordersData } = await supabase
      .from('restaurant_orders')
      .select(`
        *,
        restaurant_order_details (
          *,
          restaurant_menus (name, category)
        )
      `)
      .order('created_at', { ascending: false })

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')

    if (bookingsData) setBookings(bookingsData)
    if (ordersData) setOrders(ordersData)

    const roomRev = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
    const diningRev = ordersData?.reduce((sum, o) => sum + o.total_price, 0) || 0

    setRoomRevenue(roomRev)
    setDiningRevenue(diningRev)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
            <Link href="/manager/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <LayoutDashboard className="w-5 h-5" />
              <span>Operations Report</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <BarChart3 className="w-5 h-5 text-rose-500" />
              <span>Revenue Analytics</span>
            </div>
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

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Revenue & Order Analytics</h1>
            <p className="text-xs text-gray-500">Examine details of dining orders and hotel room stay transactions.</p>
          </div>
          <button 
            onClick={fetchReports}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading reports...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Recent Stays Payments */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-rose-500" />
                  <span>Stays Bookings Ledger ({bookings.length} Bookings)</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-gray-500">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
                        <th className="px-4 py-2 text-left">Guest</th>
                        <th className="px-4 py-2 text-left">Room</th>
                        <th className="px-4 py-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-semibold text-gray-900">{b.users?.full_name}</td>
                          <td className="px-4 py-2.5 font-bold text-rose-500">Room {b.rooms?.room_number}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900">Rp {Number(b.total_price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Recent Food Service Ledger */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-500" />
                  <span>Room Service Ledger ({orders.length} Orders)</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-gray-500">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Items</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-gray-400 font-semibold">{new Date(o.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">
                            {o.restaurant_order_details?.map((d: any) => `${d.quantity}x ${d.restaurant_menus?.name}`).join(', ')}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900">Rp {o.total_price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}
