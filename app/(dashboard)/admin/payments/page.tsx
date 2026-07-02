'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, Compass, LayoutDashboard, DoorOpen, Search, LogOut, Bell, CreditCard, Calendar
} from 'lucide-react'
import Link from 'next/link'

export default function AdminPaymentsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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

      if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
        router.push('/')
        return
      }
      setUser(userData)
      fetchPayments()
    }
    checkUser()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings (
          *,
          users (full_name, email),
          rooms (room_number)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredPayments = payments.filter(p => 
    p.bookings?.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bookings?.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.payment_method.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link href="/booking/select-room" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Compass className="w-5 h-5" />
              <span>Discover</span>
            </Link>
            <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <LayoutDashboard className="w-5 h-5" />
              <span>Admin Panel</span>
            </Link>
            <Link href="/admin/rooms" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <DoorOpen className="w-5 h-5" />
              <span>Rooms CRUD</span>
            </Link>
            <Link href="/admin/bookings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Calendar className="w-5 h-5" />
              <span>Bookings CRUD</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <CreditCard className="w-5 h-5 text-rose-500" />
              <span>Payments CRUD</span>
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
            <h1 className="text-xl font-bold text-gray-900">Hotel Payments History</h1>
            <p className="text-xs text-gray-500">Track paid transactions, methods, and booking linkages.</p>
          </div>
          <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading payments...</div>
          ) : (
            <div className="space-y-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search payments by name, status, or method..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 transition bg-white"
                />
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Payment ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {p.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{p.bookings?.users?.full_name || 'Guest'}</div>
                          <div className="text-[10px] text-gray-400">{p.bookings?.users?.email}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-rose-500">
                          Room {p.bookings?.rooms?.room_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 capitalize font-semibold">
                          {p.payment_method}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                            p.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-gray-900 text-sm">
                          Rp {Number(p.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
