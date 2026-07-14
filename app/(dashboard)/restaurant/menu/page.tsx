'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, LogOut, Bell, RefreshCw, Sparkles, User, Utensils, Save, X, Edit
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function RestaurantMenuPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [menus, setMenus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Editing state
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    price: 0,
    is_available: true
  })

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
      fetchMenus()
    }
    checkUser()
  }, [])

  const fetchMenus = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('restaurant_menus')
      .select('*')
      .order('category')

    if (error) {
      alert(error.message)
    } else {
      setMenus(data || [])
    }
    setLoading(false)
  }

  const handleStartEdit = (menu: any) => {
    setEditingMenuId(menu.id)
    setEditForm({
      price: menu.price,
      is_available: menu.is_available
    })
  }

  const handleSaveEdit = async (menuId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_menus')
        .update(editForm)
        .eq('id', menuId)

      if (error) throw error
      alert('Menu updated successfully!')
      setEditingMenuId(null)
      fetchMenus()
    } catch (err: any) {
      alert(err.message || 'Failed to update menu')
    }
  }

  const handleToggleAvailable = async (menuId: string, currentAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurant_menus')
        .update({ is_available: !currentAvailable })
        .eq('id', menuId)

      if (error) throw error
      fetchMenus()
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
            <Link href="/restaurant/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Utensils className="w-5 h-5" />
              <span>Kitchen Orders</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <Utensils className="w-5 h-5 text-rose-500" />
              <span>Menu Management</span>
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
            <h1 className="text-xl font-bold text-gray-900">Restaurant Menu Configuration</h1>
            <p className="text-xs text-gray-500">Configure prices and real-time availability of dining dishes.</p>
          </div>
          <button 
            onClick={fetchMenus}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading menu items...</div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Dish Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Available</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                  {menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">{menu.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full">{menu.category}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{menu.description}</td>
                      <td className="px-6 py-4 font-extrabold text-gray-900 text-sm">
                        {editingMenuId === menu.id ? (
                          <input 
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-24 bg-white"
                          />
                        ) : (
                          `Rp ${menu.price.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleAvailable(menu.id, menu.is_available)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors border ${
                            menu.is_available 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}
                        >
                          {menu.is_available ? 'Yes (Available)' : 'No (Sold Out)'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingMenuId === menu.id ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleSaveEdit(menu.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingMenuId(null)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(menu)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
