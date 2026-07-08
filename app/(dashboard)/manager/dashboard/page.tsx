'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  BarChart3, TrendingUp, DollarSign, Target, LogOut, Bell, 
  RefreshCw, Search, Mail, Heart, Hotel, Building2, Users,
  ChevronDown, MoreHorizontal, ArrowUpRight, ArrowDownRight,
  DoorOpen, CheckCircle, Clock, Utensils, SprayCan, ChefHat,
  UserCheck, UserX, Activity
} from 'lucide-react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'

export default function ManagerDashboard() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    dirtyRooms: 0,
    roomRevenue: 0,
    restaurantRevenue: 0,
    restaurantOrdersCount: 0,
    pendingCheckIns: 0,
    pendingCheckOuts: 0,
    pendingHousekeeping: 0,
    totalStaff: 0,
    activeRestaurantOrders: 0
  })
  const [roomsList, setRoomsList] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState<'overview' | 'operations'>('overview')

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
    
    const { count: bCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*, room_types (name)')
      .order('room_number')

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')

    const { data: restOrders } = await supabase
      .from('restaurant_orders')
      .select('total_price, status')

    const { count: checkinCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')

    const { count: checkoutCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'checked_in')

    const { count: hkCount } = await supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: staffCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .or('role.eq.receptionist,role.eq.housekeeping,role.eq.rest_staff')

    const activeRestOrders = restOrders?.filter((o: any) => o.status === 'pending' || o.status === 'preparing').length || 0

    const totalRooms = roomsData?.length || 0
    const occupiedRooms = roomsData?.filter((r: any) => r.status === 'occupied').length || 0
    const dirtyRooms = roomsData?.filter((r: any) => r.status === 'dirty').length || 0

    const roomRevenue = paymentsData?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
    const restaurantRevenue = restOrders?.reduce((sum: number, o: any) => sum + o.total_price, 0) || 0
    const restaurantOrdersCount = restOrders?.length || 0

    setStats({
      totalBookings: bCount || 0,
      totalRooms,
      occupiedRooms,
      dirtyRooms,
      roomRevenue,
      restaurantRevenue,
      restaurantOrdersCount,
      pendingCheckIns: checkinCount || 0,
      pendingCheckOuts: checkoutCount || 0,
      pendingHousekeeping: hkCount || 0,
      totalStaff: staffCount || 0,
      activeRestaurantOrders: activeRestOrders
    })
    if (roomsData) setRoomsList(roomsData)
    setLastRefreshed(new Date())

    // Fetch recent activity
    fetchRecentActivity()
    
    setLoading(false)
  }

  const fetchRecentActivity = async () => {
    // Get recent bookings activity
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('*, users(full_name), rooms(room_number)')
      .order('updated_at', { ascending: false })
      .limit(5)

    // Get recent restaurant orders
    const { data: recentOrders } = await supabase
      .from('restaurant_orders')
      .select('*, rooms(room_number)')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent housekeeping tasks
    const { data: recentTasks } = await supabase
      .from('housekeeping_tasks')
      .select('*, rooms(room_number)')
      .order('created_at', { ascending: false })
      .limit(5)

    const activity: any[] = []

    recentBookings?.forEach((b: any) => {
      activity.push({
        id: `booking-${b.id}`,
        type: b.status === 'checked_in' ? 'checkin' : b.status === 'checked_out' ? 'checkout' : 'booking',
        message: `${b.users?.full_name || 'Guest'} - Room ${b.rooms?.room_number}`,
        detail: b.status === 'checked_in' ? 'Checked In' : b.status === 'checked_out' ? 'Checked Out' : `Booking ${b.status}`,
        time: b.updated_at,
        icon: b.status === 'checked_in' ? 'checkin' : b.status === 'checked_out' ? 'checkout' : 'booking'
      })
    })

    recentOrders?.forEach((o: any) => {
      activity.push({
        id: `order-${o.id}`,
        type: 'order',
        message: `Room ${o.rooms?.room_number || 'Walk-in'}`,
        detail: `Order Rp ${o.total_price?.toLocaleString()} - ${o.status}`,
        time: o.created_at,
        icon: 'order'
      })
    })

    recentTasks?.forEach((t: any) => {
      activity.push({
        id: `task-${t.id}`,
        type: 'cleaning',
        message: `Room ${t.rooms?.room_number}`,
        detail: `Cleaning - ${t.status}`,
        time: t.created_at,
        icon: 'cleaning'
      })
    })

    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    setRecentActivity(activity.slice(0, 15))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const occupancyRate = stats.totalRooms ? (stats.occupiedRooms / stats.totalRooms) * 100 : 0
  const availableRooms = stats.totalRooms - stats.occupiedRooms - stats.dirtyRooms
  const totalRevenue = stats.roomRevenue + stats.restaurantRevenue

  const getActivityIcon = (icon: string) => {
    switch(icon) {
      case 'checkin': return <UserCheck className="w-4 h-4 text-emerald-500" />
      case 'checkout': return <UserX className="w-4 h-4 text-rose-500" />
      case 'order': return <Utensils className="w-4 h-4 text-amber-500" />
      case 'cleaning': return <SprayCan className="w-4 h-4 text-sky-500" />
      default: return <Activity className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* SIDEBAR: Executive Navy */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight block leading-tight">zzz-hotel</span>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mt-0.5">Executive Suite</span>
            </div>
          </Link>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                activeSection === 'overview' 
                  ? 'font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20' 
                  : 'font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Operations Report</span>
            </button>
            <button
              onClick={() => setActiveSection('operations')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                activeSection === 'operations' 
                  ? 'font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20' 
                  : 'font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>Live Operations</span>
            </button>
            <Link 
              href="/manager/reports" 
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all duration-200"
            >
              <Target className="w-5 h-5" />
              <span>Reports & Export</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-bold">
              {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'MN'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate leading-none">{user?.full_name || 'Manager'}</p>
              <p className="text-[10px] text-slate-500 font-semibold capitalize mt-1 leading-none">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-indigo-300 hover:bg-slate-800/50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
          
          <p className="text-[9px] text-slate-600 font-medium text-center leading-relaxed">
            ZZZ Hotel Executive Dashboard<br />
            © 2026 All Rights Reserved
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              {activeSection === 'overview' ? 'Executive Overview' : 'Live Operations Monitor'}
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100/50">
                {format(new Date(), 'MMM yyyy')}
              </span>
              <button 
                onClick={fetchAnalytics}
                className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 rounded-lg transition"
                title={`Last refreshed: ${format(lastRefreshed, 'HH:mm:ss')}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search metrics..." 
                className="pl-9 pr-4 py-2 w-full border border-slate-100 bg-slate-50/50 rounded-2xl text-xs focus:outline-none focus:border-indigo-300 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 border-r border-slate-100 pr-5">
              <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors" aria-label="Favorites">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors relative" aria-label="Messages">
                <Mail className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 border border-white rounded-full"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors relative" aria-label="Notifications">
                <Bell className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/50 text-xs font-bold font-mono">
                {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'MN'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-800 leading-none">{user?.full_name || 'Manager'}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">Hotel Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">Loading executive analytics...</div>
          ) : activeSection === 'overview' ? (
            <>
              {/* KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-up">
                <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                    <Hotel className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Occupancy Rate</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{occupancyRate.toFixed(1)}%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] font-semibold text-slate-500">{stats.occupiedRooms}/{stats.totalRooms} rooms</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Room Revenue</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">Rp {stats.roomRevenue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dining Orders</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.restaurantOrdersCount}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-sm">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dining Revenue</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">Rp {stats.restaurantRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* DEPARTMENT STATUS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-slide-up">
                <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Check-Ins</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.pendingCheckIns}</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Stays (Check-Out)</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.pendingCheckOuts}</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <SprayCan className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Housekeeping</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.pendingHousekeeping}</p>
                  </div>
                </div>
              </div>

              {/* MAIN GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
                {/* ROOMS LAYOUT */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                    <div>
                      <h2 className="text-base font-black text-slate-800 tracking-tight">Hotel Room Layout</h2>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{stats.totalRooms} Rooms Total</p>
                    </div>
                    <button className="p-1 text-slate-400 hover:text-slate-600 transition" aria-label="More options">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {roomsList.map((room) => {
                      let statusBg = 'bg-emerald-50 border-emerald-100'
                      let statusDot = 'bg-emerald-500'
                      let statusText = 'text-emerald-700'
                      if (room.status === 'occupied') {
                        statusBg = 'bg-rose-50 border-rose-100'
                        statusDot = 'bg-rose-500'
                        statusText = 'text-rose-700'
                      } else if (room.status === 'dirty') {
                        statusBg = 'bg-amber-50 border-amber-100'
                        statusDot = 'bg-amber-500'
                        statusText = 'text-amber-700'
                      } else if (room.status === 'maintenance') {
                        statusBg = 'bg-slate-100 border-slate-200'
                        statusDot = 'bg-slate-500'
                        statusText = 'text-slate-700'
                      }

                      return (
                        <div 
                          key={room.id}
                          className={`p-3 rounded-xl border font-bold text-center text-xs flex flex-col justify-between h-16 transition duration-200 hover:shadow-sm ${statusBg}`}
                          title={`Type: ${room.room_types?.name} | Floor: ${room.floor}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-black text-slate-800">{room.room_number}</span>
                            <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                          </div>
                          <span className={`text-[9px] font-semibold capitalize text-left ${statusText}`}>{room.status}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* OPERATIONAL BREAKDOWN */}
                <div className="space-y-6">
                  <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                      <div>
                        <h2 className="text-base font-black text-slate-800 tracking-tight">Operational Health</h2>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Key metrics breakdown</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                          <span>Occupied Rooms</span>
                          <span className="text-slate-800">{stats.occupiedRooms} / {stats.totalRooms}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.occupiedRooms / (stats.totalRooms || 1)) * 100}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                          <span>Dirty / Cleaning Pending</span>
                          <span className="text-slate-800">{stats.dirtyRooms} / {stats.totalRooms}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.dirtyRooms / (stats.totalRooms || 1)) * 100}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                          <span>Available Rooms</span>
                          <span className="text-slate-800">{availableRooms} / {stats.totalRooms}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(availableRooms / (stats.totalRooms || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-xs font-semibold text-slate-400">Total Bookings (Lifetime)</span>
                        <span className="text-sm font-black text-slate-800">{stats.totalBookings} Bookings</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-xs font-semibold text-slate-400">Active Staff</span>
                        <span className="text-sm font-black text-slate-800">{stats.totalStaff} Staff</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-xs font-semibold text-slate-400">Active Kitchen Orders</span>
                        <span className="text-sm font-black text-slate-800">{stats.activeRestaurantOrders} Orders</span>
                      </div>

                      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50/50 border border-indigo-100/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Total Revenue</p>
                            <p className="text-lg font-black text-indigo-700">Rp {totalRevenue.toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-200">
                            <DollarSign className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* LIVE OPERATIONS SECTION */
            <>
              {/* DEPARTMENT STATUS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-up">
                <Link href="/receptionist/dashboard" className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex items-center gap-5 group">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <DoorOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Front Desk</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div>
                        <p className="text-xs text-slate-500">Check-Ins</p>
                        <p className="text-lg font-black text-slate-800">{stats.pendingCheckIns}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Check-Outs</p>
                        <p className="text-lg font-black text-slate-800">{stats.pendingCheckOuts}</p>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </Link>

                <Link href="/housekeeping/dashboard" className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex items-center gap-5 group">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <SprayCan className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Housekeeping</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div>
                        <p className="text-xs text-slate-500">Pending</p>
                        <p className="text-lg font-black text-slate-800">{stats.pendingHousekeeping}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Dirty Rooms</p>
                        <p className="text-lg font-black text-slate-800">{stats.dirtyRooms}</p>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </Link>

                <Link href="/restaurant/dashboard" className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex items-center gap-5 group">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kitchen / Restaurant</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div>
                        <p className="text-xs text-slate-500">Active Orders</p>
                        <p className="text-lg font-black text-slate-800">{stats.activeRestaurantOrders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Total Orders</p>
                        <p className="text-lg font-black text-slate-800">{stats.restaurantOrdersCount}</p>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </Link>
              </div>

              {/* RECENT ACTIVITY FEED */}
              <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm animate-slide-up">
                <div className="flex items-center justify-between pb-5 border-b border-slate-50">
                  <div>
                    <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-500" />
                      Live Activity Feed
                    </h2>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      Real-time updates from all departments
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Last refresh: {format(lastRefreshed, 'HH:mm:ss')}
                  </span>
                </div>

                <div className="mt-5 space-y-0 divide-y divide-slate-50">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Activity className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-semibold">No recent activity</p>
                      <p className="text-xs mt-1">Waiting for system events...</p>
                    </div>
                  ) : (
                    recentActivity.slice(0, 12).map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-3.5 hover:bg-slate-50/50 transition px-2 -mx-2 rounded-xl">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                          {getActivityIcon(item.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.message}</p>
                          <p className="text-[10px] text-slate-500">{item.detail}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium shrink-0">
                          {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm animate-slide-up">
                <h2 className="text-base font-black text-slate-800 tracking-tight mb-5">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Link href="/manager/reports" className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/50 transition-colors group">
                    <BarChart3 className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">View Reports</span>
                  </Link>
                  <Link href="/receptionist/dashboard" className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/50 transition-colors group">
                    <DoorOpen className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Front Desk</span>
                  </Link>
                  <Link href="/housekeeping/dashboard" className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-amber-50 border border-amber-100 hover:bg-amber-100/50 transition-colors group">
                    <SprayCan className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Housekeeping</span>
                  </Link>
                  <Link href="/restaurant/dashboard" className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-rose-50 border border-rose-100 hover:bg-rose-100/50 transition-colors group">
                    <ChefHat className="w-6 h-6 text-rose-600 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Kitchen</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}