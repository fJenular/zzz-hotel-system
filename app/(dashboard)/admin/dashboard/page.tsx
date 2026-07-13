import { createClient } from '@/lib/supabase/server'
import BookingChart from '@/components/dashboard/BookingChart'
import RecentBookings from '@/components/dashboard/RecentBookings'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { 
  Bell, LayoutDashboard, DoorOpen, CreditCard, Sparkles, 
  Search, Heart, Mail, Calendar, ChevronLeft, ChevronRight, MoreHorizontal 
} from 'lucide-react'
import Image from 'next/image'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. Get current logged-in user session
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser?.id || '')
    .single()

  // 2. Fetch KPIs
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
  const availableRoomsCount = (totalRooms || 0) - (occupiedRooms?.length || 0)

  // 3. Fetch rooms list for bottom status box
  const { data: recentRooms } = await supabase
    .from('rooms')
    .select(`
      id,
      room_number,
      floor,
      status,
      room_types (
        name,
        base_price
      )
    `)
    .limit(3)

  // 4. Fetch month bookings for interactive calendar dashboard
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  
  const startOfMonth = new Date(year, month, 1).toISOString()
  const endOfMonth = new Date(year, month + 1, 0).toISOString()
  
  const { data: monthBookings } = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .or(`check_in.gte.${startOfMonth},check_out.lte.${endOfMonth}`)

  // Gather days with bookings
  const bookedDays = new Set<number>()
  if (monthBookings) {
    monthBookings.forEach((b: any) => {
      const start = new Date(b.check_in)
      const end = new Date(b.check_out)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === year && d.getMonth() === month) {
          bookedDays.add(d.getDate())
        }
      }
    })
  }

  // Generate calendar days
  const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sunday, etc.
  const totalDays = new Date(year, month + 1, 0).getDate()
  const calendarCells: (number | null)[] = []
  
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null)
  }
  for (let i = 1; i <= totalDays; i++) {
    calendarCells.push(i)
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar userName={userData?.full_name} userRole={userData?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER BAR (Mimics reference layout with search and user icons) */}
        <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Search Input bar */}
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari..." 
                className="pl-9 pr-4 py-2 w-full border border-slate-100 bg-slate-50/50 rounded-2xl text-xs focus:outline-none focus:border-red-300 transition-colors"
              />
            </div>

            {/* Utility Actions */}
            <div className="flex items-center gap-3 border-r border-slate-100 pr-5">
              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" aria-label="Favorites">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors relative" aria-label="Messages">
                <Mail className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors relative" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
              </button>
            </div>

            {/* Admin profile image */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100/50 text-xs font-bold font-mono">
                {userData?.full_name ? userData.full_name.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-800 leading-none">{userData?.full_name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">Admin Hotel</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          
          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-up">
            
            {/* Total Bookings */}
            <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-sm">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pemesanan</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{totalBookings || 0}</p>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tingkat Hunian</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{occupancyRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pendapatan</p>
                <p className="text-base font-black text-slate-800 mt-1">Rp {totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Available Rooms */}
            <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kamar Tersedia</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{availableRoomsCount}</p>
              </div>
            </div>
          </div>

          {/* MAIN GRID SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT & CENTER COLUMN (Calendar & Recent Bookings) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Calendar Widget Card (Mimics image calendar block) */}
              <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                  <div>
                    <h2 className="text-base font-black text-slate-800 tracking-tight">Jadwal Pemesanan Terbaru</h2>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Ringkasan Waktu</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">{monthLabel}</span>
                    <div className="flex gap-1.5">
                      <button className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition" aria-label="Previous month">
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <button className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition" aria-label="Next month">
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  {/* Day Names Row */}
                  <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    <span>Mg</span><span>Sn</span><span>Sl</span><span>Rb</span><span>Km</span><span>Jm</span><span>Sb</span>
                  </div>
                  
                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-bold text-slate-700">
                    {calendarCells.map((cell, idx) => {
                      if (cell === null) {
                        return <div key={`empty-${idx}`} />;
                      }
                      const isBooked = bookedDays.has(cell)
                      const isToday = cell === now.getDate()
                      return (
                        <div key={`day-${cell}`} className="flex justify-center py-1">
                          <div className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition ${
                            isToday 
                              ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
                              : isBooked 
                                ? 'bg-red-50/80 text-red-600 border border-red-100/50' 
                                : 'hover:bg-slate-50 text-slate-600'
                          }`}>
                            {cell}
                            {isBooked && !isToday && (
                              <span className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Bookings List */}
              <RecentBookings />
            </div>

            {/* RIGHT COLUMN (Stats Chart & Recent Room Status) */}
            <div className="space-y-8">
              
              {/* Reservation Stats Chart */}
              <BookingChart />

              {/* Recent Room Status Box */}
              <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-800 tracking-tight">Kamar Terbaru</h2>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Status Langsung</p>
                  </div>
                  <button className="p-1 text-slate-400 hover:text-slate-600 transition" aria-label="More options">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {recentRooms && recentRooms.map((room: any) => (
                    <div key={room.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-500 text-xs font-black">
                          {room.room_number}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{room.room_types?.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Lantai {room.floor} · Rp {Number(room.room_types?.base_price).toLocaleString()}/malam</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          room.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                          room.status === 'occupied' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {room.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}