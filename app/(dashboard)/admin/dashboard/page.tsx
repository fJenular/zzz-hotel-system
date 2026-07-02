import { createClient } from '@/lib/supabase/server'
import KPIWidget from '@/components/dashboard/KPIWidget'
import BookingChart from '@/components/dashboard/BookingChart'
import RecentBookings from '@/components/dashboard/RecentBookings'
import Link from 'next/link'
import { 
  Home, LogOut, Bell, Compass, LayoutDashboard, ShoppingBag, 
  User, BarChart3, RefreshCw, Sparkles, CreditCard, ShieldAlert, DoorOpen
} from 'lucide-react'
import LogoutButton from '@/components/layout/LogoutButton'

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
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 text-xl font-bold text-gray-900 tracking-tight">
            <span className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-200">🏨</span>
            <span>ZZZ HOTEL</span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link href="/booking/select-room" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Compass className="w-5 h-5" />
              <span>Discover</span>
            </Link>
            <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <LayoutDashboard className="w-5 h-5 text-rose-500" />
              <span>Admin Panel</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Account details & Logout Form */}
        <div className="space-y-4">
          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-400 px-4 uppercase tracking-wider">Account</p>
          <div className="px-4 py-2 bg-gray-50 rounded-xl mb-2">
            <p className="text-xs font-bold text-gray-800">{userData?.full_name || 'System Admin'}</p>
            <p className="text-[10px] text-gray-500 capitalize">{userData?.role || 'administrator'}</p>
          </div>
          
          <LogoutButton />
        </div>
      </aside>

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