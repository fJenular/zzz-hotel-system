'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, Compass, Sparkles, MessageSquare, User, LogOut, Bell,
  Plus, Minus, ShoppingCart, CheckCircle, RefreshCw, Clock, Utensils
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function RestaurantOrderPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  
  const [menus, setMenus] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([]) // array of { menuId, name, price, quantity, notes }
  
  const [orderHistory, setOrderHistory] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [generalNotes, setGeneralNotes] = useState('')

  const fetchOrderHistory = async (userId: string) => {
    const { data: ordersData } = await supabase
      .from('restaurant_orders')
      .select(`
        *,
        restaurant_order_details (
          *,
          restaurant_menus (name)
        ),
        rooms (room_number)
      `)
      .eq('guest_id', userId)
      .order('created_at', { ascending: false })

    if (ordersData) setOrderHistory(ordersData)
  }

  useEffect(() => {
    let isMounted = true
    let channel: any

    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!isMounted) return

      if (!currentUser) {
        router.push('/login?redirect=/restaurant/order')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      if (!isMounted) return
      setUser(userData)

      // Fetch user bookings (MUST be checked_in to order room service)
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (
            room_number,
            room_types (name)
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'checked_in')
        .order('check_in', { ascending: false })
      if (!isMounted) return

      if (bookingsData && bookingsData.length > 0) {
        setBookings(bookingsData)
        setSelectedBooking(bookingsData[0]) // default to first active booking
      }

      // Fetch restaurant menu items
      const { data: menusData } = await supabase
        .from('restaurant_menus')
        .select('*')
        .eq('is_available', true)
      if (!isMounted) return

      if (menusData) setMenus(menusData)

      // Fetch past orders
      await fetchOrderHistory(currentUser.id)
      if (!isMounted) return
      setLoading(false)

      // Subscribe to real-time status updates of restaurant orders
      channel = supabase
        .channel(`restaurant-orders-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'restaurant_orders',
            filter: `guest_id=eq.${currentUser.id}`
          },
          (payload: any) => {
            const updatedOrder = payload.new
            if (updatedOrder.status === 'preparing') {
              alert('🍳 Dapur ZZZ Hotel: Pesanan Anda sedang diproses oleh chef!')
            } else if (updatedOrder.status === 'delivered') {
              alert('🛵 Dapur ZZZ Hotel: Pesanan makanan Anda sudah siap dan sedang diantarkan ke kamar!')
            }
            if (isMounted) fetchOrderHistory(currentUser.id)
          }
        )
        .subscribe()
    }
    
    checkUser()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const handleAddToCart = (menuItem: any) => {
    const existing = cart.find(item => item.menuId === menuItem.id)
    if (existing) {
      setCart(cart.map(item => item.menuId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { menuId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1, notes: '' }])
    }
  }

  const handleRemoveFromCart = (menuItemId: string) => {
    const existing = cart.find(item => item.menuId === menuItemId)
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => item.menuId === menuItemId ? { ...item, quantity: item.quantity - 1 } : item))
    } else {
      setCart(cart.filter(item => item.menuId !== menuItemId))
    }
  }

  const handleUpdateItemNotes = (menuItemId: string, notes: string) => {
    setCart(cart.map(item => item.menuId === menuItemId ? { ...item, notes } : item))
  }

  const handlePlaceOrder = async () => {
    if (!selectedBooking) {
      alert('You must select an active room booking to order food.')
      return
    }
    if (cart.length === 0) {
      alert('Your cart is empty.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/restaurant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            menuId: item.menuId,
            quantity: item.quantity,
            notes: item.notes || undefined
          })),
          roomId: selectedBooking.room_id,
          notes: generalNotes || undefined
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to place order')

      alert('Pizza and dining order placed successfully! Check your order queue.')
      setCart([])
      setGeneralNotes('')
      
      // Refresh order history
      const { data: ordersData } = await supabase
        .from('restaurant_orders')
        .select(`
          *,
          restaurant_order_details (
            *,
            restaurant_menus (name)
          ),
          rooms (room_number)
        `)
        .eq('guest_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersData) setOrderHistory(ordersData)
    } catch (err: any) {
      alert(err.message || 'Error ordering food')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/Zzz.svg" alt="ZZZ Hotel Logo" width={40} height={40} className="object-contain" priority />
            <span className="text-xl font-bold text-gray-900 tracking-tight">ZZZ HOTEL</span>
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
            <Link href="/facilities" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Sparkles className="w-5 h-5" />
              <span>Facilities</span>
            </Link>
            <Link href="/contact-us" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <MessageSquare className="w-5 h-5" />
              <span>contact us</span>
            </Link>
            <Link href="/about" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <User className="w-5 h-5" />
              <span>About</span>
            </Link>
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
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        
        {/* CENTER COLUMN: Browse Menu */}
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 max-w-5xl">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Room Service Dining</h1>
              <p className="text-sm text-gray-500 mt-1">Order fresh meals, snacks, and beverages straight to your room.</p>
            </div>
            
            <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading menu & active stays...</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white border border-rose-100 p-8 text-center rounded-2xl animate-scale-up">
              <Utensils className="w-12 h-12 text-rose-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900">Belum Ada Check-In Aktif</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Pemesanan makanan & layanan kamar hanya tersedia bagi tamu yang sudah melakukan check-in dan berstatus menginap di hotel kami.
              </p>
              <button 
                onClick={() => router.push('/')}
                className="mt-6 px-5 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition text-sm font-bold shadow-md shadow-rose-200"
              >
                Kembali ke Beranda
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Select Active Stay */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Deliver to Room</label>
                <div className="flex gap-4">
                  {bookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`p-4 rounded-xl border text-left flex-1 transition duration-200 ${
                        selectedBooking?.id === booking.id 
                          ? 'border-rose-500 bg-rose-50/20 text-rose-700 font-semibold' 
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <p className="text-lg font-black">Room {booking.rooms?.room_number}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{booking.rooms?.room_types?.name}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Check-out: {new Date(booking.check_out).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Categories Grid */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Browse Menu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menus.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white border border-gray-100 p-5 rounded-2xl flex justify-between items-center gap-4 hover:shadow-sm transition"
                    >
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full">{item.category}</span>
                        <h4 className="font-bold text-gray-900 mt-1.5">{item.name}</h4>
                        <p className="text-xs text-gray-500">{item.description}</p>
                        <p className="text-sm font-extrabold text-rose-500 mt-1">Rp {item.price.toLocaleString()}</p>
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="px-3.5 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition text-xs font-bold shadow-sm"
                      >
                        Add to Order
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Dining Orders History */}
              {orderHistory.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">Your Past Dining Orders</h3>
                  <div className="space-y-3">
                    {orderHistory.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-100 p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">Room {order.rooms?.room_number}</span>
                            <span className="text-xs text-gray-400">• {new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.restaurant_order_details?.map((detail: any) => (
                              <span key={detail.id} className="mr-3">{detail.quantity}x {detail.restaurant_menus?.name}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                            <p className="text-sm font-extrabold text-gray-900">Rp {order.total_price.toLocaleString()}</p>
                          </div>
                          
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                            order.status === 'preparing' ? 'bg-amber-50 text-amber-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {order.status === 'delivered' ? 'Delivered' :
                             order.status === 'preparing' ? 'Preparing' : 'Queued'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: Cart Summary */}
        {!loading && bookings.length > 0 && (
          <aside className="w-full lg:w-80 bg-white border-l border-gray-100 p-6 shrink-0 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-rose-500" />
              <span>Cart Summary</span>
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-xs">
                Your cart is empty. Add food items from the menu to start order.
              </div>
            ) : (
              <div className="space-y-6 flex flex-col justify-between min-h-[400px]">
                <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1">
                  {cart.map((item) => (
                    <div key={item.menuId} className="space-y-1.5 pb-3 border-b border-gray-50">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-gray-900">{item.name}</span>
                        <span className="text-xs font-semibold text-gray-500">Rp {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleRemoveFromCart(item.menuId)}
                          className="p-1 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-gray-800">{item.quantity}</span>
                        <button 
                          onClick={() => handleAddToCart(item)}
                          className="p-1 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input 
                        type="text"
                        placeholder="Add special instructions (notes)..."
                        value={item.notes}
                        onChange={(e) => handleUpdateItemNotes(item.menuId, e.target.value)}
                        className="w-full text-[10px] border border-gray-100 rounded-lg px-2.5 py-1 focus:outline-none focus:border-rose-200 bg-gray-50/50"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">General Kitchen Notes</label>
                    <textarea 
                      placeholder="E.g., Please deliver cutlery. Don't ring doorbell..."
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      className="w-full text-xs border border-gray-100 rounded-xl p-3 focus:outline-none focus:border-rose-200 bg-gray-50/50 h-20 resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold pt-2">
                    <span className="text-gray-500">Total Price</span>
                    <span className="text-rose-500 text-lg font-black">Rp {totalCartPrice.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="w-full py-3.5 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition font-bold shadow-lg shadow-rose-200 flex items-center justify-center gap-2 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
