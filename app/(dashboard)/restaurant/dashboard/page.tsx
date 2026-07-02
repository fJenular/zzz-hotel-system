'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, LogOut, Bell, RefreshCw, CheckCircle, Clock, 
  Sparkles, User, DoorOpen, Play, Check, Utensils, ShoppingBag
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

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')

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
              <Utensils className="w-5 h-5 text-rose-500" />
              <span>Kitchen Orders</span>
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
            <h1 className="text-xl font-bold text-gray-900">Restaurant Kitchen Staff</h1>
            <p className="text-xs text-gray-500">Track and prepare guest room service dining orders.</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 transition"
            aria-label="Refresh orders"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-8 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading orders...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Pending Orders */}
              <div className="space-y-4 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900 font-sans">New Orders</h3>
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingOrders.length}</span>
                </div>
                
                {pendingOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No new orders placed.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="p-4 border border-rose-100 bg-rose-50/10 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-rose-600">Room {order.rooms?.room_number || 'TBD'}</span>
                          <span className="text-xs text-gray-400 font-semibold">Rp {order.total_price.toLocaleString()}</span>
                        </div>
                        
                        <div className="border-t border-gray-100/60 pt-2 space-y-1">
                          {order.restaurant_order_details?.map((detail: any) => (
                            <p key={detail.id} className="text-xs text-gray-700 font-medium">
                              {detail.quantity}x {detail.restaurant_menus?.name}
                              {detail.notes && <span className="block text-[10px] text-amber-600 font-normal italic">Notes: {detail.notes}</span>}
                            </p>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="text-[10px] text-gray-400 border-t border-gray-50 pt-1">
                            General: {order.notes}
                          </div>
                        )}

                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Accept & Prepare
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Preparing Orders */}
              <div className="space-y-4 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900 font-sans">Preparing</h3>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{preparingOrders.length}</span>
                </div>
                
                {preparingOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No orders currently preparing.</p>
                ) : (
                  <div className="space-y-3">
                    {preparingOrders.map((order) => (
                      <div key={order.id} className="p-4 border border-amber-100 bg-amber-50/10 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-amber-600">Room {order.rooms?.room_number || 'TBD'}</span>
                          <span className="text-xs text-gray-400 font-semibold">Rp {order.total_price.toLocaleString()}</span>
                        </div>

                        <div className="border-t border-gray-100/60 pt-2 space-y-1">
                          {order.restaurant_order_details?.map((detail: any) => (
                            <p key={detail.id} className="text-xs text-gray-700 font-medium">
                              {detail.quantity}x {detail.restaurant_menus?.name}
                              {detail.notes && <span className="block text-[10px] text-amber-600 font-normal italic">Notes: {detail.notes}</span>}
                            </p>
                          ))}
                        </div>

                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Delivered
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 3: Delivered Orders */}
              <div className="space-y-4 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900 font-sans">Delivered Today</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{deliveredOrders.length}</span>
                </div>
                
                {deliveredOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No orders delivered yet today.</p>
                ) : (
                  <div className="space-y-3">
                    {deliveredOrders.map((order) => (
                      <div key={order.id} className="p-4 border border-emerald-100 bg-emerald-50/10 rounded-xl space-y-2 opacity-75">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-emerald-600">Room {order.rooms?.room_number || 'TBD'}</span>
                          <span className="text-xs text-gray-400">Rp {order.total_price.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-100/50 pt-2 space-y-1">
                          {order.restaurant_order_details?.map((detail: any) => (
                            <p key={detail.id} className="text-xs text-gray-500 font-medium">
                              {detail.quantity}x {detail.restaurant_menus?.name}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
