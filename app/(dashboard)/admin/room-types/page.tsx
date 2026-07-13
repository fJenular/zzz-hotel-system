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
    max_occupancy: 2,
    max_adults: 2,
    max_children: 1,
    bed_configuration: '',
    area_sqm: 0,
    view_type: '',
    room_size: '',
    facilities: '',
    amenities: ''
  })

  // Edit State
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    max_occupancy: 2,
    max_adults: 2,
    max_children: 1,
    bed_configuration: '',
    area_sqm: 0,
    view_type: '',
    room_size: '',
    facilities: '',
    amenities: ''
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
      const parsedFacilities = newForm.facilities
        ? newForm.facilities.split(',').map(f => f.trim()).filter(Boolean)
        : []
      const parsedAmenities = newForm.amenities
        ? newForm.amenities.split(',').map(a => a.trim()).filter(Boolean)
        : []

      const { error } = await supabase
        .from('room_types')
        .insert({
          name: newForm.name,
          description: newForm.description,
          base_price: Number(newForm.base_price),
          max_occupancy: Number(newForm.max_occupancy),
          max_adults: Number(newForm.max_adults),
          max_children: Number(newForm.max_children),
          bed_configuration: newForm.bed_configuration,
          area_sqm: Number(newForm.area_sqm),
          view_type: newForm.view_type,
          room_size: newForm.room_size,
          facilities: parsedFacilities,
          amenities: parsedAmenities
        })

      if (error) throw error

      alert('Room Type created successfully!')
      setShowAddForm(false)
      setNewForm({
        name: '',
        description: '',
        base_price: 0,
        max_occupancy: 2,
        max_adults: 2,
        max_children: 1,
        bed_configuration: '',
        area_sqm: 0,
        view_type: '',
        room_size: '',
        facilities: '',
        amenities: ''
      })
      fetchRoomTypes()
    } catch (err: any) {
      console.error(err)
      if (err.message?.includes('column') || err.message?.includes('schema cache')) {
        alert('Gagal membuat tipe kamar. Tampaknya Anda belum menjalankan migrasi database. Silakan jalankan file SQL `scripts/migration-add-room-fields.sql` di Supabase SQL Editor terlebih dahulu.\n\nDetail: ' + err.message)
      } else {
        alert(err.message || 'Failed to create room type')
      }
    }
  }

  const handleStartEdit = (type: any) => {
    setEditingTypeId(type.id)
    setEditForm({
      name: type.name || '',
      description: type.description || '',
      base_price: type.base_price || 0,
      max_occupancy: type.max_occupancy || 2,
      max_adults: type.max_adults || 2,
      max_children: type.max_children || 1,
      bed_configuration: type.bed_configuration || '',
      area_sqm: type.area_sqm || 0,
      view_type: type.view_type || '',
      room_size: type.room_size || '',
      facilities: Array.isArray(type.facilities) ? type.facilities.join(', ') : '',
      amenities: Array.isArray(type.amenities) ? type.amenities.join(', ') : ''
    })
  }

  const handleSaveEdit = async (typeId: string) => {
    try {
      const parsedFacilities = editForm.facilities
        ? editForm.facilities.split(',').map(f => f.trim()).filter(Boolean)
        : []
      const parsedAmenities = editForm.amenities
        ? editForm.amenities.split(',').map(a => a.trim()).filter(Boolean)
        : []

      const { error } = await supabase
        .from('room_types')
        .update({
          name: editForm.name,
          description: editForm.description,
          base_price: Number(editForm.base_price),
          max_occupancy: Number(editForm.max_occupancy),
          max_adults: Number(editForm.max_adults),
          max_children: Number(editForm.max_children),
          bed_configuration: editForm.bed_configuration,
          area_sqm: Number(editForm.area_sqm),
          view_type: editForm.view_type,
          room_size: editForm.room_size,
          facilities: parsedFacilities,
          amenities: parsedAmenities
        })
        .eq('id', typeId)

      if (error) throw error
      alert('Room Type updated successfully!')
      setEditingTypeId(null)
      fetchRoomTypes()
    } catch (err: any) {
      console.error(err)
      if (err.message?.includes('column') || err.message?.includes('schema cache')) {
        alert('Gagal memperbarui tipe kamar. Silakan jalankan file SQL `scripts/migration-add-room-fields.sql` di Supabase SQL Editor terlebih dahulu.\n\nDetail: ' + err.message)
      } else {
        alert(err.message || 'Failed to update room type')
      }
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

          {/* Add/Edit Form */}
          {(showAddForm || editingTypeId) && (
            <div className="bg-white border border-slate-100 p-8 rounded-[28px] shadow-sm animate-scale-up space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">
                    {editingTypeId ? 'Edit Room Type' : 'Add New Room Type'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {editingTypeId ? 'Modify room type configuration' : 'Create a room type tier'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingTypeId(null)
                  }}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={editingTypeId ? (e) => { e.preventDefault(); handleSaveEdit(editingTypeId); } : handleCreateRoomType} className="grid grid-cols-1 md:grid-cols-4 gap-5">
                
                {/* Room Type Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Room Type Name</label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Nusa Indah (Standard Room)"
                      value={editingTypeId ? editForm.name : newForm.name}
                      onChange={(e) => editingTypeId ? setEditForm({ ...editForm, name: e.target.value }) : setNewForm({ ...newForm, name: e.target.value })}
                      className="w-full border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Base Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Price / Night (Rp)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      placeholder="500000"
                      value={editingTypeId ? editForm.base_price || '' : newForm.base_price || ''}
                      onChange={(e) => editingTypeId ? setEditForm({ ...editForm, base_price: Number(e.target.value) }) : setNewForm({ ...newForm, base_price: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Max Occupancy */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Occupancy</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      placeholder="2"
                      value={editingTypeId ? editForm.max_occupancy || '' : newForm.max_occupancy || ''}
                      onChange={(e) => editingTypeId ? setEditForm({ ...editForm, max_occupancy: Number(e.target.value) }) : setNewForm({ ...newForm, max_occupancy: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                      required
                      min="1"
                    />
                  </div>
                </div>

                {/* Max Adults */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Adults</label>
                  <input
                    type="number"
                    placeholder="2"
                    value={editingTypeId ? editForm.max_adults || '' : newForm.max_adults || ''}
                    onChange={(e) => editingTypeId ? setEditForm({ ...editForm, max_adults: Number(e.target.value) }) : setNewForm({ ...newForm, max_adults: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                    required
                    min="1"
                  />
                </div>

                {/* Max Children */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Children</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={editingTypeId ? editForm.max_children || '' : newForm.max_children || ''}
                    onChange={(e) => editingTypeId ? setEditForm({ ...editForm, max_children: Number(e.target.value) }) : setNewForm({ ...newForm, max_children: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                    required
                    min="0"
                  />
                </div>

                {/* Bed Configuration */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bed Configuration</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 King Bed atau 2 Single Bed"
                    value={editingTypeId ? editForm.bed_configuration : newForm.bed_configuration}
                    onChange={(e) => editingTypeId ? setEditForm({ ...editForm, bed_configuration: e.target.value }) : setNewForm({ ...newForm, bed_configuration: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                  />
                </div>

                {/* Area Sqm */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Area Size (m²)</label>
                  <input
                    type="number"
                    placeholder="28"
                    value={editingTypeId ? editForm.area_sqm || '' : newForm.area_sqm || ''}
                    onChange={(e) => editingTypeId ? setEditForm({ ...editForm, area_sqm: Number(e.target.value) }) : setNewForm({ ...newForm, area_sqm: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                  />
                </div>

                {/* View Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">View Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Kota, Samudra, Taman"
                    value={editingTypeId ? editForm.view_type : newForm.view_type}
                    onChange={(e) => editingTypeId ? setEditForm({ ...editForm, view_type: e.target.value }) : setNewForm({ ...newForm, view_type: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                  />
                </div>

                {/* Room Size */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Room Size Description</label>
                  <input
                    type="text"
                    placeholder="e.g. 28 sqm"
                    value={editingTypeId ? editForm.room_size : newForm.room_size}
                    onChange={(e) => editingTypeId ? setEditForm({ ...editForm, room_size: e.target.value }) : setNewForm({ ...newForm, room_size: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                  />
                </div>

                <div className="md:col-span-1"></div>

                {/* Facilities */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facilities (comma separated)</label>
                  <input
                    type="text"
                    placeholder="AC, WiFi Gratis, TV LED 32 inch, Air Panas"
                    value={editingTypeId ? editForm.facilities : newForm.facilities}
                    onChange={(e) => editingTypeId ? setEditForm({ ...editForm, facilities: e.target.value }) : setNewForm({ ...newForm, facilities: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                  />
                </div>

                {/* Amenities */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amenities (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Premium Soap, Slippers, Coffee Maker"
                    value={editingTypeId ? editForm.amenities : newForm.amenities}
                    onChange={(e) => editingTypeId ? setEditForm({ ...editForm, amenities: e.target.value }) : setNewForm({ ...newForm, amenities: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none font-semibold"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <textarea
                      placeholder="Describe room features, view configurations, etc."
                      value={editingTypeId ? editForm.description : newForm.description}
                      onChange={(e) => editingTypeId ? setEditForm({ ...editForm, description: e.target.value }) : setNewForm({ ...newForm, description: e.target.value })}
                      className="w-full border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs bg-white text-slate-800 focus:border-red-400 focus:outline-none h-20 resize-none font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-end justify-end md:col-span-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-red-650 hover:bg-red-700 text-white font-bold rounded-2xl text-xs tracking-wider uppercase shadow-md transition cursor-pointer bg-red-600"
                  >
                    {editingTypeId ? 'Update Type' : 'Save Type'}
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
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facilities</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-slate-50/30 transition">
                        
                        {/* Type Name */}
                        <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                          {type.name}
                        </td>
                        
                        {/* Description */}
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-[250px] truncate font-medium">
                          {type.description}
                        </td>
                        
                        {/* Base Price */}
                        <td className="px-6 py-4 font-black text-slate-800 text-xs">
                          Rp {Number(type.base_price).toLocaleString()}
                        </td>
                        
                        {/* Max Occupancy */}
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">
                          {type.max_occupancy} Pax
                          {type.max_adults !== undefined && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              ({type.max_adults} D, {type.max_children || 0} A)
                            </span>
                          )}
                        </td>

                        {/* Facilities */}
                        <td className="px-6 py-4 text-[11px] text-slate-500 max-w-[200px] truncate font-medium">
                          {Array.isArray(type.facilities) ? type.facilities.join(', ') : '-'}
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                handleStartEdit(type)
                                setShowAddForm(false)
                              }}
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
