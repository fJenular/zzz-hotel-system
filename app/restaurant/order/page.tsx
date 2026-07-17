'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient, getBrowserUser } from '@/lib/supabase/browser'
import {
  Home, Compass, Sparkles, MessageSquare, User, LogOut, Bell,
  Plus, Minus, ShoppingCart, Utensils, Search, ChefHat, CreditCard,
  Trash2, Clock, CheckCircle2, AlertCircle, ImageOff
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import { ToastProvider, useToast } from '@/components/ui/toast'

// ─── Snap type shim ───────────────────────────────────────────────────────────
declare global {
  interface Window { snap?: any }
}

// ─── Inner page (needs toast hook) ───────────────────────────────────────────
function RestaurantOrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserSupabaseClient()
  const { success, error: toastError, warning, info } = useToast()

  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [menus, setMenus] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [orderHistory, setOrderHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [generalNotes, setGeneralNotes] = useState('')
  const [snapReady, setSnapReady] = useState(false)

  // ── Fetch order history ──────────────────────────────────────────────────
  const fetchOrderHistory = async (userId: string) => {
    let orderData = null
    try {
      const { data } = await supabase
        .from('restaurant_orders')
        .select(`
          *,
          restaurant_order_details (*, restaurant_menus (name, image_url)),
          rooms (room_number)
        `)
        .eq('guest_id', userId)
        .order('created_at', { ascending: false })
      orderData = data
      if (data) localStorage.setItem(`zzz_order_history_${userId}`, JSON.stringify(data))
    } catch (e) {
      console.error('Fetch order history error:', e)
    }

    if (!orderData) {
      const cached = localStorage.getItem(`zzz_order_history_${userId}`)
      if (cached) orderData = JSON.parse(cached)
    }

    if (orderData) setOrderHistory(orderData)
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check for payment return
    if (searchParams.get('payment') === 'success') {
      success('Pembayaran Berhasil! 🎉', 'Pesanan Anda sedang diproses oleh dapur.')
    }

    let isMounted = true
    let channel: any

    const init = async () => {
      const currentUser = await getBrowserUser(supabase)
      if (!isMounted) return
      if (!currentUser) { router.push('/login?redirect=/restaurant/order'); return }

      // Try to get user profile
      let userData = null
      try {
        const { data } = await supabase.from('users').select('*').eq('id', currentUser.id).single()
        userData = data
        if (data) localStorage.setItem(`zzz_user_${currentUser.id}`, JSON.stringify(data))
      } catch (e) {
        console.error('Fetch user error:', e)
      }
      if (!userData) {
        const cached = localStorage.getItem(`zzz_user_${currentUser.id}`)
        if (cached) userData = JSON.parse(cached)
      }
      if (!isMounted) return
      if (userData) setUser(userData)

      // Try to get bookings
      let bookingsData = null
      try {
        const { data } = await supabase
          .from('bookings')
          .select('*, rooms(room_number, room_types(name))')
          .eq('user_id', currentUser.id)
          .eq('status', 'checked_in')
          .order('check_in', { ascending: false })
        bookingsData = data
        if (data) localStorage.setItem(`zzz_bookings_${currentUser.id}`, JSON.stringify(data))
      } catch (e) {
        console.error('Fetch bookings error:', e)
      }
      if (!bookingsData) {
        const cached = localStorage.getItem(`zzz_bookings_${currentUser.id}`)
        if (cached) bookingsData = JSON.parse(cached)
      }
      if (!isMounted) return

      if (bookingsData?.length) {
        setBookings(bookingsData)
        setSelectedBooking(bookingsData[0])
      }

      // Try to get menus
      let menusData = null
      try {
        const { data } = await supabase
          .from('restaurant_menus')
          .select('*')
          .eq('is_available', true)
          .order('category')
        menusData = data
        if (data) localStorage.setItem('zzz_restaurant_menus', JSON.stringify(data))
      } catch (e) {
        console.error('Fetch menus error:', e)
      }
      if (!menusData) {
        const cached = localStorage.getItem('zzz_restaurant_menus')
        if (cached) menusData = JSON.parse(cached)
      }
      if (!isMounted) return
      if (menusData) setMenus(menusData)

      await fetchOrderHistory(currentUser.id)
      if (!isMounted) return
      setLoading(false)

      // Real-time order status
      channel = supabase
        .channel(`restaurant-orders-${currentUser.id}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public',
          table: 'restaurant_orders',
          filter: `guest_id=eq.${currentUser.id}`,
        }, (payload: any) => {
          const updated = payload.new
          if (updated.status === 'preparing') {
            info('🍳 Pesanan Diproses', 'Chef sedang menyiapkan makanan Anda!')
          } else if (updated.status === 'delivered') {
            success('🛵 Pesanan Diantar!', 'Makanan Anda sedang dalam perjalanan ke kamar.')
          }
          if (isMounted) fetchOrderHistory(currentUser.id)
        })
        .subscribe()
    }

    init()
    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const addToCart = (item: any) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuId === item.id)
      if (ex) return prev.map(c => c.menuId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuId: item.id, name: item.name, price: item.price, image_url: item.image_url, quantity: 1, notes: '' }]
    })
  }

  const removeFromCart = (menuId: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuId === menuId)
      if (ex && ex.quantity > 1) return prev.map(c => c.menuId === menuId ? { ...c, quantity: c.quantity - 1 } : c)
      return prev.filter(c => c.menuId !== menuId)
    })
  }

  const updateNotes = (menuId: string, notes: string) =>
    setCart(prev => prev.map(c => c.menuId === menuId ? { ...c, notes } : c))

  const clearCart = () => setCart([])

  // ── Place Order → then Pay ────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!selectedBooking) {
      warning('Pilih Kamar', 'Silakan pilih booking aktif terlebih dahulu.')
      return
    }
    if (cart.length === 0) {
      warning('Keranjang Kosong', 'Tambahkan menu ke keranjang sebelum memesan.')
      return
    }
    if (!snapReady) {
      warning('Memuat Pembayaran', 'Sistem pembayaran sedang dimuat, coba lagi sebentar.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Create restaurant order
      const orderRes = await fetch('/api/restaurant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ menuId: c.menuId, quantity: c.quantity, notes: c.notes || undefined })),
          roomId: selectedBooking.room_id,
          notes: generalNotes || undefined,
        }),
      })
      const orderData = await orderRes.json()
      if (!orderData.success) throw new Error(orderData.error || 'Gagal membuat pesanan')

      const restaurantOrderId = orderData.data.id
      setSubmitting(false)

      // 2. Get Midtrans token
      setPaying(true)
      const payRes = await fetch('/api/restaurant/orders/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: restaurantOrderId }),
      })
      const payData = await payRes.json()
      if (!payData.success) throw new Error(payData.error || 'Gagal membuat sesi pembayaran')

      setPaying(false)

      // 3. Open Midtrans Snap popup
      window.snap?.pay(payData.data.token, {
        onSuccess: async (result: any) => {
          try {
            await fetch('/api/restaurant/orders/pay/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: restaurantOrderId })
            })
          } catch (e) {
            console.error('Error confirming payment:', e)
          }
          success('Pembayaran Berhasil! 🎉', `Order ID: ${result.order_id}`)
          clearCart()
          setGeneralNotes('')
          fetchOrderHistory(user?.id)
        },
        onPending: (result: any) => {
          info('Menunggu Pembayaran', `Selesaikan pembayaran untuk order ${result.order_id}`)
          clearCart()
          setGeneralNotes('')
          fetchOrderHistory(user?.id)
        },
        onError: (result: any) => {
          toastError('Pembayaran Gagal', result.status_message || 'Terjadi kesalahan saat pembayaran.')
          fetchOrderHistory(user?.id)
        },
        onClose: () => {
          warning('Pembayaran Dibatalkan', 'Anda menutup jendela pembayaran. Pesanan tetap tersimpan.')
          fetchOrderHistory(user?.id)
        },
      })
    } catch (err: any) {
      toastError('Terjadi Kesalahan', err.message || 'Coba lagi beberapa saat.')
    } finally {
      setSubmitting(false)
      setPaying(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menus.map(m => m.category))).filter(Boolean).sort()
    return ['All', ...cats]
  }, [menus])

  const filteredMenus = useMemo(() => menus.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory
    const q = searchQuery.toLowerCase()
    const matchQ = !q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
    return matchCat && matchQ
  }), [menus, activeCategory, searchQuery])

  // ── Category badge colours ────────────────────────────────────────────────
  const catColor = (cat: string) => {
    if (cat === 'Main Course') return 'bg-orange-50 text-orange-600 border-orange-100'
    if (cat === 'Beverages')   return 'bg-blue-50 text-blue-600 border-blue-100'
    if (cat === 'Desserts')    return 'bg-pink-50 text-pink-600 border-pink-100'
    return 'bg-emerald-50 text-emerald-600 border-emerald-100'
  }

  const payStatusBadge = (status: string) => {
    if (status === 'paid')    return 'bg-emerald-50 text-emerald-600'
    if (status === 'failed')  return 'bg-rose-50 text-rose-600'
    if (status === 'pending') return 'bg-amber-50 text-amber-600'
    return 'bg-gray-100 text-gray-500'
  }

  const payStatusLabel = (status: string) => {
    if (status === 'paid')    return '✓ Lunas'
    if (status === 'failed')  return '✗ Gagal'
    if (status === 'pending') return '⏳ Menunggu'
    return '💳 Belum Bayar'
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Midtrans Snap Script */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
        onLoad={() => setSnapReady(true)}
      />

      <div className="flex min-h-screen bg-[#f8f7f5] font-sans text-gray-800 antialiased">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/Zzz.svg" alt="ZZZ Hotel" width={40} height={40} className="object-contain" priority />
              <span className="text-xl font-bold text-gray-900 tracking-tight">ZZZ HOTEL</span>
            </Link>
            <nav className="space-y-1">
              {[
                { href: '/', icon: Home, label: 'Home' },
                { href: '/booking/select-room', icon: Compass, label: 'Discover' },
                { href: '/facilities', icon: Sparkles, label: 'Facilities' },
                { href: '/contact-us', icon: MessageSquare, label: 'Contact Us' },
                { href: '/about', icon: User, label: 'About' },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all">
                  <Icon className="w-5 h-5" /><span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="space-y-4">
            <hr className="border-gray-100" />
            <p className="text-xs font-semibold text-gray-400 px-4 uppercase tracking-wider">Account</p>
            <div className="px-4 py-2 bg-gray-50 rounded-xl">
              <p className="text-xs font-bold text-gray-800">{user?.full_name}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all">
              <LogOut className="w-5 h-5" /><span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTAINER ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0">

          {/* CENTER: Menu Browser */}
          <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Room Service Dining</h1>
                <p className="text-sm text-gray-500 mt-1">Pesan makanan & minuman langsung ke kamar Anda.</p>
              </div>
              <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 border-2 border-white rounded-full" />
              </button>
            </div>

            {/* States */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Memuat menu & data kamar…</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white border border-rose-100 p-10 text-center rounded-3xl">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-8 h-8 text-rose-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Belum Ada Check-In Aktif</h2>
                <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                  Room service hanya tersedia untuk tamu yang sudah check-in.
                </p>
                <button onClick={() => router.push('/')} className="mt-6 px-5 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition text-sm font-bold shadow-md shadow-rose-200">
                  Kembali ke Beranda
                </button>
              </div>
            ) : (
              <div className="space-y-8">

                {/* Room selector */}
                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Antar ke Kamar</p>
                  <div className="flex gap-3 flex-wrap">
                    {bookings.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className={`p-4 rounded-xl border text-left flex-1 min-w-[160px] transition-all duration-200 ${
                          selectedBooking?.id === b.id
                            ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-200'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <p className="text-lg font-black text-gray-900">Room {b.rooms?.room_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{b.rooms?.room_types?.name}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Check-out: {new Date(b.check_out).toLocaleDateString('id-ID')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu browser */}
                <div className="space-y-5">
                  {/* Header + Search */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-rose-500" />
                      Browse Menu
                      <span className="text-sm font-normal text-gray-400">({filteredMenus.length})</span>
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari makanan…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-rose-300 bg-white w-44"
                      />
                    </div>
                  </div>

                  {/* Category tabs */}
                  <div className="flex gap-2 flex-wrap">
                    {categories.map(cat => {
                      const count = cat === 'All' ? menus.length : menus.filter(m => m.category === cat).length
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            activeCategory === cat
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                              : 'bg-white border border-gray-200 text-gray-500 hover:border-rose-200 hover:text-rose-500'
                          }`}
                        >
                          {cat} <span className="opacity-70">({count})</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Menu grid */}
                  {filteredMenus.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Tidak ada menu ditemukan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredMenus.map(item => {
                        const cartItem = cart.find(c => c.menuId === item.id)
                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-rose-100 transition-all duration-300 group flex flex-col"
                          >
                            {/* Food image */}
                            <div className="relative w-full h-40 bg-gray-100 overflow-hidden shrink-0">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageOff className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                              {/* Category badge overlay */}
                              <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold rounded-full border backdrop-blur-sm ${catColor(item.category)}`}>
                                {item.category}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="p-4 flex flex-col flex-1 gap-2">
                              <h4 className="font-bold text-gray-900 text-sm leading-snug">{item.name}</h4>
                              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1">{item.description}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm font-extrabold text-rose-500">
                                  Rp {item.price.toLocaleString('id-ID')}
                                </p>
                                {cartItem ? (
                                  <div className="flex items-center gap-1.5 bg-rose-50 rounded-xl px-1 py-0.5">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-rose-50 transition"
                                    >
                                      <Minus className="w-3 h-3 text-rose-500" />
                                    </button>
                                    <span className="text-sm font-black text-rose-600 w-5 text-center">{cartItem.quantity}</span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-6 h-6 flex items-center justify-center bg-rose-500 rounded-lg shadow-sm hover:bg-rose-600 transition"
                                    >
                                      <Plus className="w-3 h-3 text-white" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-8 h-8 flex items-center justify-center bg-rose-500 text-white rounded-xl hover:bg-rose-600 active:scale-95 transition-all shadow-sm shadow-rose-200"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Order history */}
                {orderHistory.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      Riwayat Pesanan
                    </h3>
                    <div className="space-y-3">
                      {orderHistory.map(order => (
                        <div key={order.id} className="bg-white border border-gray-100 p-5 rounded-2xl flex justify-between items-start flex-wrap gap-4 hover:shadow-sm transition">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900">Room {order.rooms?.room_number}</span>
                              <span className="text-xs text-gray-400">• {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                              {order.restaurant_order_details?.map((d: any) => (
                                <span key={d.id} className="bg-gray-50 px-2 py-0.5 rounded-lg">
                                  {d.quantity}× {d.restaurant_menus?.name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                              <p className="text-sm font-extrabold text-gray-900">Rp {Number(order.total_price).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              {/* Order status */}
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                                order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                                order.status === 'preparing' ? 'bg-amber-50 text-amber-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {order.status === 'delivered' ? '✓ Terkirim' :
                                 order.status === 'preparing' ? '🍳 Diproses' : '⏳ Antrian'}
                              </span>
                              {/* Payment status */}
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${payStatusBadge(order.payment_status ?? 'unpaid')}`}>
                                {payStatusLabel(order.payment_status ?? 'unpaid')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ── RIGHT: Cart ─────────────────────────────────────────────────── */}
          {!loading && bookings.length > 0 && (
            <aside className="w-full lg:w-80 bg-white border-l border-gray-100 p-6 shrink-0 flex flex-col gap-5 lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
              {/* Cart header */}
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-bold text-gray-900 flex-1">Keranjang</h3>
                {totalItems > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
                {cart.length > 0 && (
                  <button onClick={clearCart} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-12">
                  <ShoppingCart className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Keranjang kosong</p>
                  <p className="text-xs mt-1 opacity-70">Pilih menu untuk mulai memesan</p>
                </div>
              ) : (
                <>
                  {/* Cart items */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.menuId} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
                        {/* Thumb */}
                        {item.image_url && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-bold text-xs text-gray-900 leading-snug truncate">{item.name}</p>
                          <p className="text-[11px] font-semibold text-rose-500">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </p>
                          {/* Qty controls */}
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(item.menuId)} className="w-5 h-5 bg-gray-100 rounded-md flex items-center justify-center hover:bg-gray-200 transition">
                              <Minus className="w-2.5 h-2.5 text-gray-600" />
                            </button>
                            <span className="text-xs font-bold text-gray-800">{item.quantity}</span>
                            <button onClick={() => addToCart({ id: item.menuId, name: item.name, price: item.price, image_url: item.image_url })} className="w-5 h-5 bg-rose-500 rounded-md flex items-center justify-center hover:bg-rose-600 transition">
                              <Plus className="w-2.5 h-2.5 text-white" />
                            </button>
                          </div>
                          {/* Notes */}
                          <input
                            type="text"
                            placeholder="Catatan khusus…"
                            value={item.notes}
                            onChange={e => updateNotes(item.menuId, e.target.value)}
                            className="w-full text-[10px] border border-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:border-rose-200 bg-gray-50/50 mt-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* General notes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Catatan Dapur</label>
                    <textarea
                      placeholder="Contoh: Jangan bunyikan bel, minta sendok…"
                      value={generalNotes}
                      onChange={e => setGeneralNotes(e.target.value)}
                      className="w-full text-xs border border-gray-100 rounded-xl p-3 focus:outline-none focus:border-rose-200 bg-gray-50/50 h-16 resize-none"
                    />
                  </div>

                  {/* Total + Pay button */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Total Pembayaran</span>
                      <span className="text-lg font-black text-rose-500">
                        Rp {totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={submitting || paying}
                      className="w-full py-3.5 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 active:scale-[.98] transition-all font-bold shadow-lg shadow-rose-200 flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Membuat Pesanan…
                        </>
                      ) : paying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Memuat Pembayaran…
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Bayar Sekarang
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Pembayaran aman via Midtrans
                    </p>
                  </div>
                </>
              )}
            </aside>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Root export (wraps with ToastProvider and Suspense) ───────────────────────
export default function RestaurantOrderPage() {
  return (
    <ToastProvider>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
            <p className="text-sm text-slate-500">Memuat Menu Restoran...</p>
          </div>
        </div>
      }>
        <RestaurantOrderContent />
      </Suspense>
    </ToastProvider>
  )
}
