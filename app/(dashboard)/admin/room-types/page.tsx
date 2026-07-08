'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Search, Bell, Edit, Trash2, Save, X, Plus, Award, DollarSign, Users, FileText, Heart, Mail
} from 'lucide-react'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminRoomTypesPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create State
  const [showAddForm, setShowAddForm] = useState(false)
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    max_occupancy: 2
  })

  // Edit State
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    max_occupancy: 2
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
      fetchRoomTypes()
    }
    checkUser()
  }, [])

  const fetchRoomTypes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('room_types')
      .select('*')
      .order('name')

    if (error) {
      alert('Failed to load room types: ' + error.message)
    } else {
      setRoomTypes(data || [])
    }
    setLoading(false)
  }

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForm.name || !newForm.description || newForm.base_price <= 0) {
      alert('Please fill in all fields with valid details')
      return
    }

    try {
      const { error } = await supabase
        .from('room_types')
        .insert({
          name: newForm.name,
          description: newForm.description,
          base_price: Number(newForm.base_price),
          max_occupancy: Number(newForm.max_occupancy)
        })

      if (error) throw error

      alert('Room Type created successfully!')
      setShowAddForm(false)
      setNewForm({
        name: '',
        description: '',
        base_price: 0,
        max_occupancy: 2
      })
      fetchRoomTypes()
    } catch (err: any) {
      alert(err.message || 'Failed to create room type')
    }
  }

  const handleStartEdit = (type: any) => {
    setEditingTypeId(type.id)
    setEditForm({
      name: type.name,
      description: type.description,
      base_price: type.base_price,
      max_occupancy: type.max_occupancy
    })
  }

  const handleSaveEdit = async (typeId: string) => {
    try {
      const { error } = await supabase
        .from('room_types')
        .update({
          name: editForm.name,
          description: editForm.description,
          base_price: Number(editForm.base_price),
          max_occupancy: Number(editForm.max_occupancy)
        })
        .eq('id', typeId)

      if (error) throw error
      alert('Room Type updated successfully!')
      setEditingTypeId(null)
      fetchRoomTypes()
    } catch (err: any) {
      alert(err.message || 'Failed to update room type')
    }
  }

  const handleDeleteRoomType = async (typeId: string) => {
    if (!confirm('Are you sure you want to permanently delete this room type? Rooms belonging to this type will lose their references.')) return

    try {
      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', typeId)

      if (error) throw error
      alert('Room Type deleted successfully.')
      fetchRoomTypes()
    } catch (err: any) {
      alert(err.message || 'Failed to delete room type')
    }
  }

  const filteredTypes = roomTypes.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar userName={currentUser?.full_name} userRole={currentUser?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER BAR */}
        <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Room Types</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Configure hotel categories</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search types..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-slate-100 bg-slate-50/50 rounded-2xl text-xs focus:outline-none focus:border-red-300 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 border-r border-slate-100 pr-5">
              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" aria-label="Favorites">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors relative" aria-label="Messages">
                <Mail className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors relative" aria-label="Notifications">
                <Bell className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100/50 text-xs font-bold font-mono">
                {currentUser?.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-800 leading-none">{currentUser?.full_name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">Hotel Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          
          {/* Action Bar */}
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search configurations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 w-full border border-slate-200 bg-white rounded-2xl text-xs focus:outline-none focus:border-red-400 transition"
              />
            </div>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-md shadow-red-200 transition cursor-pointer"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddForm ? 'Cancel' : 'Add Room Type'}</span>
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white border border-slate-100 p-8 rounded-[28px] shadow-sm animate-scale-up space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Add New Room Type</h3>
                <p className="text-[10px] text-slate-405 mt-0.5">Create a room type tier</p>
              </div>
              
              <form onSubmit={handleCreateRoomType} className="grid grid-cols-1 md:grid-cols-4 gap-5">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Room Type Name</label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Grand Presidential Suite"
                      value={newForm.name}
                      onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                      className="w-full border border-slate-250 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Price / Night</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      placeholder="850000"
                      value={newForm.base_price || ''}
                      onChange={(e) => setNewForm({ ...newForm, base_price: Number(e.target.value) })}
                      className="w-full border border-slate-250 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Occupancy</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      placeholder="2"
                      value={newForm.max_occupancy || ''}
                      onChange={(e) => setNewForm({ ...newForm, max_occupancy: Number(e.target.value) })}
                      className="w-full border border-slate-250 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <textarea
                      placeholder="Describe room features, view configurations, etc."
                      value={newForm.description}
                      onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                      className="w-full border border-slate-250 rounded-2xl pl-10 pr-4 py-3 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none h-20 resize-none font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-end justify-end md:col-span-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-red-650 hover:bg-red-700 text-white font-bold rounded-2xl text-xs tracking-wider uppercase shadow-md transition cursor-pointer"
                  >
                    Save Type
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Room Types Table */}
          {loading && roomTypes.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">Loading configurations...</div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-50">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room Type</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Price</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-slate-50/30 transition">
                        
                        {/* Type Name */}
                        <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                          {editingTypeId === type.id ? (
                            <input 
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-300 bg-white"
                              required
                            />
                          ) : (
                            type.name
                          )}
                        </td>
                        
                        {/* Description */}
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-[250px] truncate font-medium">
                          {editingTypeId === type.id ? (
                            <textarea 
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-300 bg-white w-full h-12"
                              required
                            />
                          ) : (
                            type.description
                          )}
                        </td>
                        
                        {/* Base Price */}
                        <td className="px-6 py-4 font-black text-slate-800 text-xs">
                          {editingTypeId === type.id ? (
                            <input 
                              type="number"
                              value={editForm.base_price}
                              onChange={(e) => setEditForm({ ...editForm, base_price: Number(e.target.value) })}
                              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-300 bg-white w-24"
                              required
                            />
                          ) : (
                            `Rp ${Number(type.base_price).toLocaleString()}`
                          )}
                        </td>
                        
                        {/* Max Occupancy */}
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">
                          {editingTypeId === type.id ? (
                            <input 
                              type="number"
                              value={editForm.max_occupancy}
                              onChange={(e) => setEditForm({ ...editForm, max_occupancy: Number(e.target.value) })}
                              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-300 bg-white w-16"
                              required
                            />
                          ) : (
                            `${type.max_occupancy} Pax`
                          )}
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {editingTypeId === type.id ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleSaveEdit(type.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingTypeId(null)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStartEdit(type)}
                                className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                                title="Edit Room Type"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoomType(type.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Delete Room Type"
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
