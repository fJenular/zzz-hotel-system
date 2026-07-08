'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, Compass, LayoutDashboard, LogOut, Bell, BarChart3, TrendingUp, DollarSign, 
  Hotel, RefreshCw, FileText, Download, Filter, Calendar, Search, Clock,
  ArrowUpRight, ArrowDownRight, ChevronDown, Printer
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

export default function ManagerReportsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  const [bookings, setBookings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [roomRevenue, setRoomRevenue] = useState(0)
  const [diningRevenue, setDiningRevenue] = useState(0)
  const [payments, setPayments] = useState<any[]>([])

  // Filters
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all')
  const [reportType, setReportType] = useState<'all' | 'bookings' | 'dining' | 'payments'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

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

  const getDateFilter = () => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    
    switch(dateRange) {
      case 'today':
        return { field: 'created_at', gte: startOfDay }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        return { field: 'created_at', gte: weekAgo }
      }
      case 'month': {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        return { field: 'created_at', gte: monthAgo }
      }
      case 'year': {
        const yearAgo = new Date(now.getFullYear(), 0, 1).toISOString()
        return { field: 'created_at', gte: yearAgo }
      }
      default:
        return null
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    const dateFilter = getDateFilter()

    let bookingsQuery = supabase
      .from('bookings')
      .select('*, users (full_name, email, phone), rooms (room_number), room_types (name)')
      .order('created_at', { ascending: false })

    let ordersQuery = supabase
      .from('restaurant_orders')
      .select(`
        *,
        restaurant_order_details (
          *,
          restaurant_menus (name, category)
        ),
        rooms (room_number)
      `)
      .order('created_at', { ascending: false })

    let paymentsQuery = supabase
      .from('payments')
      .select('*, bookings(*, users(full_name), rooms(room_number))')
      .order('created_at', { ascending: false })

    if (dateFilter) {
      bookingsQuery = bookingsQuery.gte(dateFilter.field, dateFilter.gte)
      ordersQuery = ordersQuery.gte(dateFilter.field, dateFilter.gte)
      paymentsQuery = paymentsQuery.gte(dateFilter.field, dateFilter.gte)
    }

    const [bookingsRes, ordersRes, paymentsRes] = await Promise.all([
      bookingsQuery,
      ordersQuery,
      paymentsQuery
    ])

    if (bookingsRes.data) setBookings(bookingsRes.data)
    if (ordersRes.data) setOrders(ordersRes.data)
    if (paymentsRes.data) setPayments(paymentsRes.data)

    const roomRev = paymentsRes.data?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
    const diningRev = ordersRes.data?.reduce((sum: number, o: any) => sum + o.total_price, 0) || 0

    setRoomRevenue(roomRev)
    setDiningRevenue(diningRev)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const exportToExcel = async () => {
    setExporting(true)
    try {
      const wb = XLSX.utils.book_new()

      // 1. Bookings Sheet
      if (reportType === 'all' || reportType === 'bookings') {
        const bookingRows = bookings.map((b: any) => ({
          'Guest Name': b.users?.full_name || 'Guest',
          'Email': b.users?.email || '-',
          'Phone': b.users?.phone || '-',
          'Room Number': b.rooms?.room_number || 'N/A',
          'Room Type': b.room_types?.name || '-',
          'Check In': new Date(b.check_in).toLocaleDateString(),
          'Check Out': new Date(b.check_out).toLocaleDateString(),
          'Guests': b.guests_count,
          'Total Price': b.total_price,
          'Status': b.status,
          'Payment Status': b.payment_status,
          'Booking Date': new Date(b.created_at).toLocaleDateString(),
        }))
        const ws = XLSX.utils.json_to_sheet(bookingRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
      }

      // 2. Dining Orders Sheet
      if (reportType === 'all' || reportType === 'dining') {
        const orderRows = orders.map((o: any) => ({
          'Order Date': new Date(o.created_at).toLocaleDateString(),
          'Order Time': new Date(o.created_at).toLocaleTimeString(),
          'Room Number': o.rooms?.room_number || 'Walk-in',
          'Items': o.restaurant_order_details?.map((d: any) => `${d.quantity}x ${d.restaurant_menus?.name}`).join(', ') || '-',
          'Total Amount': o.total_price,
          'Status': o.status,
          'Notes': o.notes || '-'
        }))
        const ws = XLSX.utils.json_to_sheet(orderRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Dining Orders')
      }

      // 3. Payments Sheet
      if (reportType === 'all' || reportType === 'payments') {
        const paymentRows = payments.map((p: any) => ({
          'Transaction Date': new Date(p.created_at).toLocaleDateString(),
          'Guest Name': p.bookings?.users?.full_name || 'Guest',
          'Room Number': p.bookings?.rooms?.room_number || 'N/A',
          'Amount': p.amount,
          'Payment Method': p.payment_method,
          'Status': p.status,
          'Order ID': p.midtrans_order_id || 'LOCAL'
        }))
        const ws = XLSX.utils.json_to_sheet(paymentRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Payments')
      }

      // 4. Summary Sheet
      const summaryRows = [
        { 'Metric': 'Total Bookings', 'Value': bookings.length },
        { 'Metric': 'Total Dining Orders', 'Value': orders.length },
        { 'Metric': 'Total Payments', 'Value': payments.length },
        { 'Metric': 'Room Revenue', 'Value': `Rp ${roomRevenue.toLocaleString()}` },
        { 'Metric': 'Dining Revenue', 'Value': `Rp ${diningRevenue.toLocaleString()}` },
        { 'Metric': 'Total Revenue', 'Value': `Rp ${(roomRevenue + diningRevenue).toLocaleString()}` },
        { 'Metric': 'Report Date Range', 'Value': dateRange.toUpperCase() },
        { 'Metric': 'Generated On', 'Value': new Date().toLocaleString() },
      ]
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

      // Generate file name
      const fileName = `ZZZ-Hotel-Report_${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`
      
      // Write and download
      XLSX.writeFile(wb, fileName)
      
      alert(`Report exported successfully as "${fileName}"`)
    } catch (err: any) {
      alert('Failed to export report: ' + (err.message || 'Unknown error'))
    }
    setExporting(false)
  }

  const filteredBookings = bookings.filter(b => 
    b.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.rooms?.room_number?.includes(searchQuery) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredOrders = orders.filter(o => 
    o.rooms?.room_number?.includes(searchQuery) ||
    o.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.restaurant_order_details?.some((d: any) => d.restaurant_menus?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredPayments = payments.filter(p => 
    p.bookings?.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.payment_method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const dateRangeLabels: Record<string, string> = {
    all: 'All Time',
    today: 'Today',
    week: 'Last 7 Days',
    month: 'This Month',
    year: 'This Year'
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight block leading-tight">zzz-hotel</span>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mt-0.5">Reports</span>
            </div>
          </Link>

          <nav className="space-y-1">
            <Link href="/manager/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all duration-200">
              <LayoutDashboard className="w-5 h-5" />
              <span>Operations Report</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <FileText className="w-5 h-5" />
              <span>Revenue Analytics & Export</span>
            </div>
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
            ZZZ Hotel Reports Module<br />
            © 2026 All Rights Reserved
          </p>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Revenue & Analytics</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                {dateRangeLabels[dateRange]} · {bookings.length} bookings, {orders.length} orders, {payments.length} payments
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 rounded-xl border border-slate-100 transition ${showFilters ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : ''}`}
              title="Toggle Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button 
              onClick={fetchReports}
              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 rounded-xl border border-slate-100 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={exportToExcel}
              disabled={exporting || loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
            </button>
          </div>
        </header>

        {/* FILTER BAR */}
        {showFilters && (
          <div className="bg-white border-b border-slate-100 px-8 py-4 animate-slide-up">
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Period:</span>
                <div className="flex gap-1.5">
                  {(['all', 'today', 'week', 'month', 'year'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => { setDateRange(range); setTimeout(fetchReports, 0) }}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${
                        dateRange === range 
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                          : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {dateRangeLabels[range]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Type Filter */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Report:</span>
                <div className="flex gap-1.5">
                  {([
                    { id: 'all' as const, label: 'All Data' },
                    { id: 'bookings' as const, label: 'Bookings' },
                    { id: 'dining' as const, label: 'Dining' },
                    { id: 'payments' as const, label: 'Payments' },
                  ]).map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${
                        reportType === type.id 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">Loading reports...</div>
          ) : (
            <>
              {/* KPI SUMMARY ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-up">
                <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                    <Hotel className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bookings</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{bookings.length}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{dateRangeLabels[dateRange]}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Room Revenue</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">Rp {roomRevenue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dining Orders</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{orders.length}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-sm">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Revenue</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">Rp {(roomRevenue + diningRevenue).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* SEARCH + EXPORT NOTE */}
              <div className="flex items-center justify-between">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search across all reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2.5 w-full border border-slate-100 bg-white rounded-2xl text-sm focus:outline-none focus:border-indigo-300 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    <span className="font-bold text-slate-600">{bookings.length + orders.length + payments.length}</span> total records
                  </span>
                </div>
              </div>

              {/* REPORTS GRID */}
              {(reportType === 'all' || reportType === 'bookings') && (
                <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm animate-slide-up overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl">
                        <Hotel className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">Stays Bookings Ledger</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">{filteredBookings.length} booking records</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const rows = bookings.map((b: any) => ({
                          'Guest Name': b.users?.full_name || 'Guest',
                          'Email': b.users?.email || '-',
                          'Room': b.rooms?.room_number || 'N/A',
                          'Check In': new Date(b.check_in).toLocaleDateString(),
                          'Check Out': new Date(b.check_out).toLocaleDateString(),
                          'Total': b.total_price,
                          'Status': b.status,
                          'Payment': b.payment_status
                        }))
                        const ws = XLSX.utils.json_to_sheet(rows)
                        const wb = XLSX.utils.book_new()
                        XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
                        XLSX.writeFile(wb, `ZZZ-Bookings_${new Date().toISOString().split('T')[0]}.xlsx`)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                    >
                      <Download className="w-3 h-3" />
                      Export Table
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guest</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check In</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check Out</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No booking records found for this period.</td>
                          </tr>
                        ) : (
                          filteredBookings.map((b: any) => (
                            <tr key={b.id} className="hover:bg-slate-50/30 transition">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{b.users?.full_name || 'Guest'}</div>
                                <div className="text-[10px] text-slate-400">{b.users?.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-indigo-600">Room {b.rooms?.room_number || 'N/A'}</span>
                                <div className="text-[10px] text-slate-400">{b.room_types?.name}</div>
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-medium">{new Date(b.check_in).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-slate-600 font-medium">{new Date(b.check_out).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-right font-bold text-slate-800">Rp {Number(b.total_price).toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                                  b.status === 'confirmed' || b.status === 'checked_in' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  b.status === 'checked_out' ? 'bg-slate-100 text-slate-600 border border-slate-100' :
                                  b.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                  'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* DINING ORDERS TABLE */}
              {(reportType === 'all' || reportType === 'dining') && (
                <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm animate-slide-up overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">Room Service / Dining Ledger</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">{filteredOrders.length} order records</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const rows = orders.map((o: any) => ({
                          'Date': new Date(o.created_at).toLocaleDateString(),
                          'Room': o.rooms?.room_number || 'Walk-in',
                          'Items': o.restaurant_order_details?.map((d: any) => `${d.quantity}x ${d.restaurant_menus?.name}`).join(', '),
                          'Amount': o.total_price,
                          'Status': o.status
                        }))
                        const ws = XLSX.utils.json_to_sheet(rows)
                        const wb = XLSX.utils.book_new()
                        XLSX.utils.book_append_sheet(wb, ws, 'Dining Orders')
                        XLSX.writeFile(wb, `ZZZ-Dining_${new Date().toISOString().split('T')[0]}.xlsx`)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                    >
                      <Download className="w-3 h-3" />
                      Export Table
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">No dining orders found for this period.</td>
                          </tr>
                        ) : (
                          filteredOrders.map((o: any) => (
                            <tr key={o.id} className="hover:bg-slate-50/30 transition">
                              <td className="px-6 py-4 text-slate-500 font-medium">
                                <div>{new Date(o.created_at).toLocaleDateString()}</div>
                                <div className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleTimeString()}</div>
                              </td>
                              <td className="px-6 py-4 font-bold text-amber-600">Room {o.rooms?.room_number || 'Walk-in'}</td>
                              <td className="px-6 py-4 max-w-[250px]">
                                <div className="text-slate-700 font-medium truncate">
                                  {o.restaurant_order_details?.map((d: any) => `${d.quantity}x ${d.restaurant_menus?.name}`).join(', ')}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-slate-800">Rp {o.total_price.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                                  o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  o.status === 'preparing' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  'bg-slate-100 text-slate-600 border border-slate-100'
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PAYMENTS TABLE */}
              {(reportType === 'all' || reportType === 'payments') && (
                <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm animate-slide-up overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-xl">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">Payments Transaction Log</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">{filteredPayments.length} transaction records</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const rows = payments.map((p: any) => ({
                          'Date': new Date(p.created_at).toLocaleDateString(),
                          'Guest': p.bookings?.users?.full_name || 'Guest',
                          'Room': p.bookings?.rooms?.room_number || 'N/A',
                          'Amount': p.amount,
                          'Method': p.payment_method,
                          'Status': p.status
                        }))
                        const ws = XLSX.utils.json_to_sheet(rows)
                        const wb = XLSX.utils.book_new()
                        XLSX.utils.book_append_sheet(wb, ws, 'Payments')
                        XLSX.writeFile(wb, `ZZZ-Payments_${new Date().toISOString().split('T')[0]}.xlsx`)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                    >
                      <Download className="w-3 h-3" />
                      Export Table
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guest / Room</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No payment records found for this period.</td>
                          </tr>
                        ) : (
                          filteredPayments.map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50/30 transition">
                              <td className="px-6 py-4 text-slate-500 font-medium">{new Date(p.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <span className="font-mono text-[10px] text-slate-500 font-semibold">
                                  {p.midtrans_order_id?.substring(0, 18) || 'LOCAL'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{p.bookings?.users?.full_name || 'Guest'}</div>
                                <div className="text-[10px] text-indigo-500 font-semibold">Room {p.bookings?.rooms?.room_number || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-slate-800">Rp {Number(p.amount).toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] font-bold uppercase text-slate-600">{p.payment_method}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                                  p.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  p.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}