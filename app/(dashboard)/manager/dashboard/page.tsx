'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, LogOut, Bell, RefreshCw, Compass, ShoppingBag, 
  MessageSquare, User, LayoutDashboard, HelpCircle, BarChart3, TrendingUp, DollarSign, Hotel
} from 'lucide-react'
import Link from 'next/link'

export default function ManagerDashboard() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    dirtyRooms: 0,
    roomRevenue: 0,
    restaurantRevenue: 0,
    restaurantOrdersCount: 0
  })
  const [roomsList, setRoomsList] = useState<any[]>([])

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
      fetchAnalytics()
    }
    checkUser()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    
    // 1. Bookings Count
    const { count: bCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // 2. Rooms metrics
    const { data: roomsData } = await supabase
      .from('rooms')
      .select(`
        *,
        room_types (name)
      `)
      .order('room_number')

    // 3. Room Payments
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')

    // 4. Restaurant metrics
    const { data: restOrders } = await supabase
      .from('restaurant_orders')
      .select('total_price, status')

    const totalRooms = roomsData?.length || 0
    const occupiedRooms = roomsData?.filter(r => r.status === 'occupied').length || 0
    const dirtyRooms = roomsData?.filter(r => r.status === 'dirty').length || 0

    const roomRevenue = paymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0
    const restaurantRevenue = restOrders?.reduce((sum, o) => sum + o.total_price, 0) || 0
    const restaurantOrdersCount = restOrders?.length || 0

    setStats({
      totalBookings: bCount || 0,
      totalRooms,
      occupiedRooms,
      dirtyRooms,
      roomRevenue,
      restaurantRevenue,
      restaurantOrdersCount
    })
    if (roomsData) setRoomsList(roomsData)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const occupancyRate = stats.totalRooms ? (stats.occupiedRooms / stats.totalRooms) * 100 : 0

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
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <BarChart3 className="w-5 h-5 text-rose-500" />
              <span>Operations Report</span>
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
            <h1 className="text-xl font-bold text-gray-900">Hotel Manager Analytics</h1>
            <p className="text-xs text-gray-500">Overview of operational metrics, revenues, and occupancy rates.</p>
          </div>
          <button 
            onClick={fetchAnalytics}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 transition"
            aria-label="Refresh stats"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading analytics...</div>
          ) : (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-scale-up">
                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 flex items-center gap-4">
                  <div className="p-3.5 bg-rose-50 text-rose-500 rounded-xl">
                    <Hotel className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Occupancy Rate</p>
                    <p className="text-2xl font-black text-gray-900 mt-0.5">{occupancyRate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 flex items-center gap-4">
                  <div className="p-3.5 bg-emerald-50 text-emerald-500 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Room Revenue</p>
                    <p className="text-xl font-black text-gray-900 mt-0.5">Rp {stats.roomRevenue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 flex items-center gap-4">
                  <div className="p-3.5 bg-amber-50 text-amber-500 rounded-xl">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Dining Orders</p>
                    <p className="text-2xl font-black text-gray-900 mt-0.5">{stats.restaurantOrdersCount}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 flex items-center gap-4">
                  <div className="p-3.5 bg-purple-50 text-purple-500 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Dining Revenue</p>
                    <p className="text-xl font-black text-gray-900 mt-0.5">Rp {stats.restaurantRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Room Grid and Stats Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
                {/* Rooms Grid */}
                <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900">Hotel Rooms Layout ({stats.totalRooms} Rooms)</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {roomsList.map((room) => {
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
                          className={`p-3 rounded-xl border font-bold text-center text-xs flex flex-col justify-between h-16 transition duration-200 hover:shadow-sm ${statusBg}`}
                          title={`Type: ${room.room_types?.name} | Floor: ${room.floor}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-black">{room.room_number}</span>
                            <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                          </div>
                          <span className="text-[9px] font-semibold text-gray-400 capitalize text-left">{room.status}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Operations Summary */}
                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-6">
                  <h3 className="font-bold text-gray-900">Operational Breakdown</h3>
                  
                  {/* Progress bars representing ratios */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-gray-500">
                        <span>Occupied Rooms</span>
                        <span>{stats.occupiedRooms} / {stats.totalRooms}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.occupiedRooms / (stats.totalRooms || 1)) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-gray-500">
                        <span>Dirty / Cleaning Pending</span>
                        <span>{stats.dirtyRooms} / {stats.totalRooms}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.dirtyRooms / (stats.totalRooms || 1)) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-gray-500">
                        <span>Available Rooms</span>
                        <span>{stats.totalRooms - stats.occupiedRooms - stats.dirtyRooms} / {stats.totalRooms}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${((stats.totalRooms - stats.occupiedRooms - stats.dirtyRooms) / (stats.totalRooms || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Summary Rows */}
                  <div className="space-y-3.5 text-sm font-medium">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                      <span className="text-gray-400">Total Bookings (Lifetime)</span>
                      <span className="text-gray-900 font-bold">{stats.totalBookings} Bookings</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50/50 border border-rose-100/50 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Total Revenue</p>
                        <p className="text-lg font-black text-rose-700">Rp {(stats.roomRevenue + stats.restaurantRevenue).toLocaleString()}</p>
                      </div>
                      <span className="p-2 bg-rose-500 text-white rounded-lg shadow-md shadow-rose-200">💰</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
