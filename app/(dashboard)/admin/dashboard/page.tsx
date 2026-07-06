import { createClient } from '@/lib/supabase/server'
import KPIWidget from '@/components/dashboard/KPIWidget'
import BookingChart from '@/components/dashboard/BookingChart'
import RecentBookings from '@/components/dashboard/RecentBookings'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { Bell, LayoutDashboard, DoorOpen, CreditCard, Sparkles } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. Get current logged-in user session
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser?.id || '')
    .single()

  // 2. Calculate KPIs
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  const { count: totalRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })

  const { data: occupiedRooms } = await supabase
    .from('bookings')
    .select('room_id')
    .eq('status', 'checked_in')

  const { data: revenueData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'paid')

  const totalRevenue = revenueData?.reduce((sum, p) => sum + p.amount, 0) || 0
  const occupancyRate = totalRooms ? ((occupiedRooms?.length || 0) / totalRooms) * 100 : 0

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar userName={userData?.full_name} userRole={userData?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hotel Administrator Dashboard</h1>
            <p className="text-xs text-gray-500">Configure global configurations, manage reservations, and review metrics.</p>
          </div>
          <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* KPI Widget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-scale-up">
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-center gap-4">
              <div className="p-3.5 bg-rose-50 text-rose-500 rounded-xl">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Bookings</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{totalBookings || 0}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 text-emerald-500 rounded-xl">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Occupancy Rate</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{occupancyRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-center gap-4">
              <div className="p-3.5 bg-amber-50 text-amber-500 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Revenue</p>
                <p className="text-lg font-black text-gray-900 mt-0.5">Rp {totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-center gap-4">
              <div className="p-3.5 bg-purple-50 text-purple-500 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Available Rooms</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{(totalRooms || 0) - (occupiedRooms?.length || 0)}</p>
              </div>
            </div>
          </div>

          {/* Charts & Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            <BookingChart />
            <RecentBookings />
          </div>
        </main>
      </div>
    </div>
  )
}