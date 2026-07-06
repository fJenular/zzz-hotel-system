'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  DoorOpen, Plus, Trash2, Edit, Save, X, Search, Bell
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
        room_types (id, name)
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



  const filteredRooms = rooms.filter(room => 
    room.room_number.includes(searchQuery) ||
    room.room_types?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar userName={user?.full_name} userRole={user?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hotel Rooms Management</h1>
            <p className="text-xs text-gray-500">Add, edit, or delete hotel rooms and configure types.</p>
          </div>
          <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition relative">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading rooms CRUD...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Center/Left: Rooms List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search rooms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 transition bg-white"
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Room No</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Room Type</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Floor</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRooms.map((room) => (
                        <tr key={room.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {editingRoomId === room.id ? (
                              <input 
                                type="text"
                                value={editForm.room_number}
                                onChange={(e) => setEditForm({ ...editForm, room_number: e.target.value })}
                                className="border border-gray-200 rounded px-2 py-1 text-sm w-20"
                              />
                            ) : (
                              room.room_number
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-600">
                            {editingRoomId === room.id ? (
                              <select 
                                value={editForm.room_type_id}
                                onChange={(e) => setEditForm({ ...editForm, room_type_id: e.target.value })}
                                className="border border-gray-200 rounded px-2 py-1 text-sm"
                              >
                                {roomTypes.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            ) : (
                              room.room_types?.name
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                            {editingRoomId === room.id ? (
                              <input 
                                type="text"
                                value={editForm.floor}
                                onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                                className="border border-gray-200 rounded px-2 py-1 text-sm w-16"
                              />
                            ) : (
                              `Floor ${room.floor}`
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingRoomId === room.id ? (
                              <select 
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="border border-gray-200 rounded px-2 py-1 text-sm"
                              >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="dirty">Dirty</option>
                                <option value="maintenance">Maintenance</option>
                              </select>
                            ) : (
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                                room.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                                room.status === 'occupied' ? 'bg-rose-50 text-rose-600' :
                                room.status === 'dirty' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {room.status}
                              </span>
                            )}
                          </td>
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
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleStartEdit(room)}
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(room.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
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

              {/* Right: Add Room Form */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-rose-500" />
                  <span>Create Room</span>
                </h3>

                <form onSubmit={handleCreateRoom} className="space-y-4 text-xs font-semibold text-gray-500">
                  <div className="space-y-1">
                    <label className="block">Room Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. 101"
                      value={newRoom.room_number}
                      onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block">Room Type</label>
                    <select 
                      value={newRoom.room_type_id}
                      onChange={(e) => setNewRoom({ ...newRoom, room_type_id: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-300 bg-white"
                    >
                      {roomTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block">Floor</label>
                    <input 
                      type="text"
                      placeholder="e.g. 1"
                      value={newRoom.floor}
                      onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block">Initial Status</label>
                    <select 
                      value={newRoom.status}
                      onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-300 bg-white"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="dirty">Dirty</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition font-bold shadow-md shadow-rose-200 text-sm mt-2"
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
