'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  LogOut, Bell, RefreshCw, CheckCircle, Clock, 
  Sparkles, User, Play, Check, Utensils, CookingPot,
  Heart, Search, Soup, ChefHat, MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

export default function RestaurantDashboard() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

      if (userData?.role !== 'rest_staff' && userData?.role !== 'admin' && userData?.role !== 'super_admin') {
        router.push('/')
        return
      }
      setUser(userData)
      fetchOrders()
    }
    checkUser()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
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

    if (error) {
      alert(error.message)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      alert(`Order is now ${newStatus}!`)
      fetchOrders()
    } catch (err: any) {
      alert(err.message || 'Failed to update order status')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const pendingOrders = orders.filter((o: any) => o.status === 'pending')
  const preparingOrders = orders.filter((o: any) => o.status === 'preparing')
  const deliveredOrders = orders.filter((o: any) => o.status === 'delivered')

  return (
    <div className="flex min-h-screen bg-emerald-50/30 font-sans text-slate-800 antialiased">
      {/* ===== SIDEBAR: Culinary Green ===== */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-emerald-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-800 tracking-tight block leading-tight">zzz-hotel</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mt-0.5">Kitchen</span>
            </div>
          </Link>

          <nav className="space-y-1">
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100/50 rounded-xl">
              <ChefHat className="w-5 h-5 text-emerald-500" />
              <span>Kitchen Orders</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-xl transition-all duration-200 cursor-pointer">
              <CookingPot className="w-5 h-5" />
              <span>Menu Board</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-xl transition-all duration-200 cursor-pointer">
              <Soup className="w-5 h-5" />
              <span>Inventory</span>
            </div>
          </nav>

          <div className="pt-4 space-y-2">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/50 border border-emerald-100/50">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Kitchen Staff</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{user?.full_name || 'Staff'}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-emerald-100/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
          <p className="text-[9px] text-slate-400 font-medium text-center leading-relaxed">
            ZZZ Hotel Kitchen<br />
            © 2026 All Rights Reserved
          </p>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-white border-b border-emerald-100/50 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Kitchen Orders</h1>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100/50">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search orders..." 
                className="pl-9 pr-4 py-2 w-full border border-emerald-100 bg-emerald-50/20 rounded-2xl text-xs focus:outline-none focus:border-emerald-300 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 border-r border-emerald-100 pr-5">
              <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors relative" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 border border-white rounded-full"></span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 text-xs font-bold font-mono">
                {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'KS'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-800 leading-none">{user?.full_name || 'Kitchen Staff'}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">Chef</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">Loading kitchen orders...</div>
          ) : (
            <>
              {/* KPI ROW */}
              <div className="grid grid-cols-3 gap-6 animate-scale-up">
                <div className="bg-white border border-emerald-100 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{pendingOrders.length}</p>
                  </div>
                </div>
                <div className="bg-white border border-emerald-100 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <CookingPot className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preparing</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{preparingOrders.length}</p>
                  </div>
                </div>
                <div className="bg-white border border-emerald-100 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Delivered</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{deliveredOrders.length}</p>
                  </div>
                </div>
              </div>

              {/* 3-COLUMN KANBAN */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
                {/* PENDING */}
                <div className="space-y-4 bg-white border border-emerald-100 p-5 rounded-[24px] shadow-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                      <h3 className="font-bold text-slate-800">New Orders</h3>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{pendingOrders.length}</span>
                  </div>
                  
                  {pendingOrders.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">No new orders placed.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {pendingOrders.map((order: any) => (
                        <div key={order.id} className="p-4 border border-emerald-100 bg-emerald-50/20 rounded-2xl space-y-3 hover:shadow-sm transition">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span className="text-sm font-bold text-emerald-700">Room {order.rooms?.room_number || 'TBD'}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500">Rp {order.total_price.toLocaleString()}</span>
                          </div>
                          
                          <div className="border-t border-emerald-100/50 pt-2 space-y-1">
                            {order.restaurant_order_details?.map((detail: any) => (
                              <p key={detail.id} className="text-xs text-slate-700 font-medium flex justify-between">
                                <span>{detail.quantity}x {detail.restaurant_menus?.name}</span>
                                {detail.notes && <span className="text-[9px] text-amber-600 italic block">{detail.notes}</span>}
                              </p>
                            ))}
                          </div>

                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Accept & Prepare
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PREPARING */}
                <div className="space-y-4 bg-white border border-amber-100 p-5 rounded-[24px] shadow-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-amber-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <h3 className="font-bold text-slate-800">Preparing</h3>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{preparingOrders.length}</span>
                  </div>
                  
                  {preparingOrders.length === 0 ? (
                    <div className="text-center py-10">
                      <CookingPot className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">No orders being prepared.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {preparingOrders.map((order: any) => (
                        <div key={order.id} className="p-4 border border-amber-100 bg-amber-50/20 rounded-2xl space-y-3 hover:shadow-sm transition">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                              <span className="text-sm font-bold text-amber-700">Room {order.rooms?.room_number || 'TBD'}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500">Rp {order.total_price.toLocaleString()}</span>
                          </div>

                          <div className="border-t border-amber-100/50 pt-2 space-y-1">
                            {order.restaurant_order_details?.map((detail: any) => (
                              <p key={detail.id} className="text-xs text-slate-700 font-medium">
                                {detail.quantity}x {detail.restaurant_menus?.name}
                                {detail.notes && <span className="block text-[9px] text-amber-600 italic">Notes: {detail.notes}</span>}
                              </p>
                            ))}
                          </div>

                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-sm hover:shadow-md"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Mark Delivered
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DELIVERED */}
                <div className="space-y-4 bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                      <h3 className="font-bold text-slate-800">Delivered Today</h3>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">{deliveredOrders.length}</span>
                  </div>
                  
                  {deliveredOrders.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">No orders delivered today.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {deliveredOrders.map((order: any) => (
                        <div key={order.id} className="p-4 border border-slate-100 bg-slate-50/30 rounded-2xl space-y-2 opacity-75">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Room {order.rooms?.room_number || 'TBD'}</span>
                            <span className="text-xs text-slate-400">Rp {order.total_price.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-slate-100/50 pt-2 space-y-1">
                            {order.restaurant_order_details?.map((detail: any) => (
                              <p key={detail.id} className="text-xs text-slate-500 font-medium">
                                {detail.quantity}x {detail.restaurant_menus?.name}
                              </p>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-semibold text-emerald-500">Completed</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}