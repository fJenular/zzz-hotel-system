'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Search, Bell, Edit, Trash2, Save, X, Plus, Award, DollarSign, Users, FileText
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
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar userName={currentUser?.full_name} userRole={currentUser?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Room Types Configuration</h1>
            <p className="text-xs text-gray-500">Configure base price, occupancy limits, and details for suites and standard rooms.</p>
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
                placeholder="Search room types by name or details..."
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
              <span>{showAddForm ? 'Cancel' : 'Add Room Type'}</span>
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white border border-neutral-200/60 p-8 rounded-2xl shadow-sm animate-scale-up space-y-6">
              <h3 className="text-base font-bold text-neutral-800 font-serif">Add New Room Type</h3>
              <form onSubmit={handleCreateRoomType} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Room Type Name</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="e.g. Grand Presidential Suite"
                      value={newForm.name}
                      onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Base Price / Night</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      placeholder="850000"
                      value={newForm.base_price || ''}
                      onChange={(e) => setNewForm({ ...newForm, base_price: Number(e.target.value) })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Max Occupancy</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      placeholder="2"
                      value={newForm.max_occupancy || ''}
                      onChange={(e) => setNewForm({ ...newForm, max_occupancy: Number(e.target.value) })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                    <textarea
                      placeholder="Describe room features, bed configuration, views, etc."
                      value={newForm.description}
                      onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-sm bg-white focus:border-amber-400 focus:outline-none h-16 resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-end justify-end md:col-span-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
                  >
                    Save Room Type
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Room Types Table */}
          {loading && roomTypes.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading room configurations...</div>
          ) : (
            <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Room Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Base Price</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Max Occupancy</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-bold text-neutral-900 text-sm">
                          {editingTypeId === type.id ? (
                            <input 
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white"
                              required
                            />
                          ) : (
                            type.name
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-600 max-w-[250px] truncate">
                          {editingTypeId === type.id ? (
                            <textarea 
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-400 bg-white w-full h-12"
                              required
                            />
                          ) : (
                            type.description
                          )}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-neutral-900 text-sm">
                          {editingTypeId === type.id ? (
                            <input 
                              type="number"
                              value={editForm.base_price}
                              onChange={(e) => setEditForm({ ...editForm, base_price: Number(e.target.value) })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white w-24"
                              required
                            />
                          ) : (
                            `Rp ${Number(type.base_price).toLocaleString()}`
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-neutral-700">
                          {editingTypeId === type.id ? (
                            <input 
                              type="number"
                              value={editForm.max_occupancy}
                              onChange={(e) => setEditForm({ ...editForm, max_occupancy: Number(e.target.value) })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white w-16"
                              required
                            />
                          ) : (
                            `${type.max_occupancy} Pax`
                          )}
                        </td>
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
                                className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStartEdit(type)}
                                className="p-1.5 text-neutral-400 hover:bg-neutral-50 rounded-lg transition cursor-pointer"
                                title="Edit Room Type"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoomType(type.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Room Type Permanently"
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
