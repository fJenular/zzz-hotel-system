'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  DoorOpen, Plus, Trash2, Edit, Save, X, Search, Bell, Heart, Mail, MoreVertical
} from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminRoomsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Create Room Form State
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_type_id: '',
    floor: '',
    status: 'available'
  })

  // Edit Room State
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    room_number: '',
    room_type_id: '',
    floor: '',
    status: 'available'
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

      if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
        router.push('/')
        return
      }
      setUser(userData)
      fetchData()
    }
    checkUser()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: roomsData } = await supabase
      .from('rooms')
      .select(`
        *,
        room_types (id, name, base_price)
      `)
      .order('room_number')

    const { data: typesData } = await supabase
      .from('room_types')
      .select('id, name')

    if (roomsData) setRooms(roomsData)
    if (typesData) {
      setRoomTypes(typesData)
      if (typesData.length > 0) {
        setNewRoom(prev => ({ ...prev, room_type_id: typesData[0].id }))
      }
    }
    setLoading(false)
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoom.room_number || !newRoom.floor || !newRoom.room_type_id) {
      alert('Please fill in all fields')
      return
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .insert(newRoom)

      if (error) throw error
      alert('Room created successfully!')
      setNewRoom({
        room_number: '',
        room_type_id: roomTypes[0]?.id || '',
        floor: '',
        status: 'available'
      })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to create room')
    }
  }

  const handleStartEdit = (room: any) => {
    setEditingRoomId(room.id)
    setEditForm({
      room_number: room.room_number,
      room_type_id: room.room_type_id,
      floor: room.floor,
      status: room.status
    })
  }

  const handleCancelEdit = () => {
    setEditingRoomId(null)
  }

  const handleSaveEdit = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update(editForm)
        .eq('id', roomId)

      if (error) throw error
      alert('Room updated successfully!')
      setEditingRoomId(null)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to update room')
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)

      if (error) throw error
      alert('Room deleted successfully!')
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete room')
    }
  }

  // Filtered rooms search query and active tab
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.includes(searchQuery) ||
      room.room_types?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.status.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === 'all') return matchesSearch
    return matchesSearch && room.status === activeTab
  })

  const tabs = [
    { id: 'all', label: 'All Rooms' },
    { id: 'available', label: 'Available' },
    { id: 'occupied', label: 'Occupied' },
    { id: 'dirty', label: 'Dirty' },
    { id: 'maintenance', label: 'Maintenance' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar userName={user?.full_name} userRole={user?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER BAR */}
        <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Room List</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Manage hotel rooms</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search rooms..." 
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
                {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-800 leading-none">{user?.full_name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">Hotel Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">Loading rooms CRUD...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Rooms List */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* Visual tabs to match reference image */}
                <div className="flex border-b border-slate-150 gap-6 text-xs font-bold text-slate-400">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-3 transition relative cursor-pointer ${
                        activeTab === tab.id 
                          ? 'text-red-600 font-black' 
                          : 'hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Table Container */}
                <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room Name / No</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bed Type / Type</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Floor</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredRooms.map((room) => (
                        <tr key={room.id} className="hover:bg-slate-50/30 transition">
                          
                          {/* Room Name/No */}
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {editingRoomId === room.id ? (
                              <input 
                                type="text"
                                value={editForm.room_number}
                                onChange={(e) => setEditForm({ ...editForm, room_number: e.target.value })}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs w-20 focus:outline-none focus:border-red-300 bg-white"
                              />
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-bold">
                                  {room.room_number}
                                </div>
                                <span className="font-bold text-slate-800 text-xs">Room {room.room_number}</span>
                              </div>
                            )}
                          </td>
                          
                          {/* Room Type */}
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                            {editingRoomId === room.id ? (
                              <select 
                                value={editForm.room_type_id}
                                onChange={(e) => setEditForm({ ...editForm, room_type_id: e.target.value })}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-300 bg-white"
                              >
                                {roomTypes.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            ) : (
                              room.room_types?.name
                            )}
                          </td>
                          
                          {/* Floor */}
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                            {editingRoomId === room.id ? (
                              <input 
                                type="text"
                                value={editForm.floor}
                                onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs w-16 focus:outline-none focus:border-red-300 bg-white"
                              />
                            ) : (
                              `Floor ${room.floor}`
                            )}
                          </td>

                          {/* Rate */}
                          <td className="px-6 py-4 text-xs font-bold text-slate-800">
                            Rp {Number(room.room_types?.base_price || 0).toLocaleString()}
                          </td>
                          
                          {/* Status */}
                          <td className="px-6 py-4">
                            {editingRoomId === room.id ? (
                              <select 
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-300 bg-white"
                              >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="dirty">Dirty</option>
                                <option value="maintenance">Maintenance</option>
                              </select>
                            ) : (
                              <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${
                                room.status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                room.status === 'occupied' ? 'bg-red-50 text-red-600 border-red-100' :
                                room.status === 'dirty' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>
                                {room.status}
                              </span>
                            )}
                          </td>
                          
                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            {editingRoomId === room.id ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleSaveEdit(room.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleStartEdit(room)}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(room.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-550/10 rounded-lg transition"
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

              {/* Add Room Form Card */}
              <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm space-y-5 h-fit">
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Plus className="w-5 h-5 text-red-500" />
                    <span>Create Room</span>
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Define new physical rooms</p>
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-4 text-xs font-semibold text-slate-450">
                  <div className="space-y-1.5">
                    <label className="block tracking-wider uppercase text-[10px] font-bold text-slate-400">Room Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. 101"
                      value={newRoom.room_number}
                      onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block tracking-wider uppercase text-[10px] font-bold text-slate-400">Room Type</label>
                    <select 
                      value={newRoom.room_type_id}
                      onChange={(e) => setNewRoom({ ...newRoom, room_type_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white text-slate-800"
                    >
                      {roomTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block tracking-wider uppercase text-[10px] font-bold text-slate-400">Floor</label>
                    <input 
                      type="text"
                      placeholder="e.g. 1"
                      value={newRoom.floor}
                      onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block tracking-wider uppercase text-[10px] font-bold text-slate-400">Initial Status</label>
                    <select 
                      value={newRoom.status}
                      onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white text-slate-800"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="dirty">Dirty</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition font-black shadow-md shadow-red-500/20 text-xs tracking-wider uppercase mt-3 cursor-pointer"
                  >
                    Add Room
                  </button>
                </form>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}
