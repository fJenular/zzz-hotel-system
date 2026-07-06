'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Search, Bell, Edit, Trash2, Save, X, Plus, Utensils, DollarSign, Tag, Check, CircleAlert
} from 'lucide-react'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminMenusPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [menus, setMenus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create State
  const [showAddForm, setShowAddForm] = useState(false)
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Main Course',
    is_available: true
  })

  // Edit State
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    is_available: true
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser()
      if (!activeUser) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', activeUser.id)
        .single()

      if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
        router.push('/')
        return
      }
      setCurrentUser(userData)
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
      .order('name')

    if (error) {
      alert('Failed to load menu items: ' + error.message)
    } else {
      setMenus(data || [])
    }
    setLoading(false)
  }

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForm.name || !newForm.description || newForm.price <= 0) {
      alert('Please fill in all fields with valid details')
      return
    }

    try {
      const { error } = await supabase
        .from('restaurant_menus')
        .insert({
          name: newForm.name,
          description: newForm.description,
          price: Number(newForm.price),
          category: newForm.category,
          is_available: newForm.is_available
        })

      if (error) throw error

      alert('Menu item created successfully!')
      setShowAddForm(false)
      setNewForm({
        name: '',
        description: '',
        price: 0,
        category: 'Main Course',
        is_available: true
      })
      fetchMenus()
    } catch (err: any) {
      alert(err.message || 'Failed to create menu item')
    }
  }

  const handleStartEdit = (item: any) => {
    setEditingMenuId(item.id)
    setEditForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      is_available: item.is_available
    })
  }

  const handleSaveEdit = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_menus')
        .update({
          name: editForm.name,
          description: editForm.description,
          price: Number(editForm.price),
          category: editForm.category,
          is_available: editForm.is_available
        })
        .eq('id', itemId)

      if (error) throw error
      alert('Menu item updated successfully!')
      setEditingMenuId(null)
      fetchMenus()
    } catch (err: any) {
      alert(err.message || 'Failed to update menu item')
    }
  }

  const handleDeleteMenu = async (itemId: string) => {
    if (!confirm('Are you sure you want to permanently delete this menu item?')) return

    try {
      const { error } = await supabase
        .from('restaurant_menus')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      alert('Menu item deleted successfully.')
      fetchMenus()
    } catch (err: any) {
      alert(err.message || 'Failed to delete menu item')
    }
  }

  const filteredMenus = menus.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar userName={currentUser?.full_name} userRole={currentUser?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Restaurant Menus Management</h1>
            <p className="text-xs text-gray-500">Configure menus, pricing, description, category, and food/beverage availability.</p>
          </div>
          <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Action Bar */}
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search menu items by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-neutral-200 bg-white rounded-xl text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-amber-200 transition cursor-pointer"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddForm ? 'Cancel' : 'Add Menu Item'}</span>
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white border border-neutral-200/60 p-8 rounded-2xl shadow-sm animate-scale-up space-y-6">
              <h3 className="text-base font-bold text-neutral-800 font-serif">Add New Menu Item</h3>
              <form onSubmit={handleCreateMenu} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Item Name</label>
                  <div className="relative">
                    <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="e.g. Nasi Goreng Kambing"
                      value={newForm.name}
                      onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      placeholder="45000"
                      value={newForm.price || ''}
                      onChange={(e) => setNewForm({ ...newForm, price: Number(e.target.value) })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Category</label>
                  <select
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Appetizers">Appetizers</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of the menu item (ingredients, spicy level, etc.)"
                    value={newForm.description}
                    onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newForm.is_available}
                      onChange={(e) => setNewForm({ ...newForm, is_available: e.target.checked })}
                      className="rounded text-amber-600 border-neutral-200 focus:ring-amber-500/20"
                    />
                    <span className="text-xs text-neutral-600 font-bold uppercase">Available for order</span>
                  </label>
                </div>

                <div className="flex items-end justify-end md:col-span-4 mt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
                  >
                    Save Menu Item
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Menus Table */}
          {loading && menus.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading menu items...</div>
          ) : (
            <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Menu Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Availability</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMenus.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-bold text-neutral-900 text-sm">
                          {editingMenuId === item.id ? (
                            <input 
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white"
                              required
                            />
                          ) : (
                            item.name
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-neutral-700">
                          {editingMenuId === item.id ? (
                            <select 
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white"
                            >
                              <option value="Main Course">Main Course</option>
                              <option value="Beverages">Beverages</option>
                              <option value="Desserts">Desserts</option>
                              <option value="Appetizers">Appetizers</option>
                            </select>
                          ) : (
                            <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-full font-bold text-[10px]">
                              {item.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-neutral-900 text-sm">
                          {editingMenuId === item.id ? (
                            <input 
                              type="number"
                              value={editForm.price}
                              onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white w-24"
                              required
                            />
                          ) : (
                            `Rp ${Number(item.price).toLocaleString()}`
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-600 max-w-[200px] truncate">
                          {editingMenuId === item.id ? (
                            <input 
                              type="text"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-400 bg-white w-full"
                              required
                            />
                          ) : (
                            item.description
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingMenuId === item.id ? (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={editForm.is_available}
                                onChange={(e) => setEditForm({ ...editForm, is_available: e.target.checked })}
                                className="rounded text-amber-600 border-neutral-200 focus:ring-amber-500/20"
                              />
                              <span className="text-xs text-neutral-600 font-semibold">Available</span>
                            </label>
                          ) : (
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 w-max ${
                              item.is_available ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                            }`}>
                              {item.is_available ? 'Available' : 'Out of stock'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {editingMenuId === item.id ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingMenuId(null)}
                                className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 text-neutral-400 hover:bg-neutral-50 rounded-lg transition cursor-pointer"
                                title="Edit Menu Item"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMenu(item.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Menu Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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
