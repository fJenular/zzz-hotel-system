'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Search, Bell, Edit, Trash2, Save, X, Plus, User, Mail, Phone, Lock, Check, Shield
} from 'lucide-react'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminUsersPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create User State
  const [showAddForm, setShowAddForm] = useState(false)
  const [newForm, setNewForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'guest'
  })

  // Edit User State
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    role: '',
    email_verified: false
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
      fetchUsers()
    }
    checkUser()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name')

    if (error) {
      alert('Failed to load users: ' + error.message)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForm.email || !newForm.password || !newForm.fullName || !newForm.phone) {
      alert('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newForm)
      })

      const res = await response.json()
      if (!res.success) throw new Error(res.error || 'Failed to create user')

      alert('User created successfully!')
      setShowAddForm(false)
      setNewForm({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'guest'
      })
      fetchUsers()
    } catch (err: any) {
      alert(err.message || 'Failed to create user')
      setLoading(false)
    }
  }

  const handleStartEdit = (user: any) => {
    setEditingUserId(user.id)
    setEditForm({
      fullName: user.full_name,
      phone: user.phone || '',
      role: user.role,
      email_verified: !!user.email_verified
    })
  }

  const handleSaveEdit = async (userId: string) => {
    try {
      setLoading(true)
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: userId,
          ...editForm
        })
      })

      const res = await response.json()
      if (!res.success) throw new Error(res.error || 'Failed to update user')

      alert('User updated successfully!')
      setEditingUserId(null)
      fetchUsers()
    } catch (err: any) {
      alert(err.message || 'Failed to update user')
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own account.')
      return
    }
    if (!confirm('Are you sure you want to permanently delete this user? All their bookings and payments will be affected.')) return

    try {
      setLoading(true)
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const res = await response.json()
      if (!res.success) throw new Error(res.error || 'Failed to delete user')

      alert('User deleted successfully.')
      fetchUsers()
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar userName={currentUser?.full_name} userRole={currentUser?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">User Accounts Management</h1>
            <p className="text-xs text-gray-500">Add, edit, delete, and configure system staff or customer guest accounts.</p>
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
                placeholder="Search accounts by name, email, or role..."
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
              <span>{showAddForm ? 'Cancel' : 'Create User'}</span>
            </button>
          </div>

          {/* Add User Form */}
          {showAddForm && (
            <div className="bg-white border border-neutral-200/60 p-8 rounded-2xl shadow-sm animate-scale-up space-y-6">
              <h3 className="text-base font-bold text-neutral-800 font-serif">Create New User / Staff Account</h3>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={newForm.fullName}
                      onChange={(e) => setNewForm({ ...newForm, fullName: e.target.value })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="email"
                      placeholder="name@zzzhotel.com"
                      value={newForm.email}
                      onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newForm.password}
                      onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={newForm.phone}
                      onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                      className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">System Role</label>
                  <select
                    value={newForm.role}
                    onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="guest">Guest / Customer</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="housekeeping">Housekeeping</option>
                    <option value="rest_staff">Restaurant Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex items-end justify-end md:col-span-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
                  >
                    Save Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          {loading && users.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading accounts...</div>
          ) : (
            <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">User Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">System Role</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Verification</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          {editingUserId === userItem.id ? (
                            <input 
                              type="text"
                              value={editForm.fullName}
                              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white"
                              required
                            />
                          ) : (
                            <div className="font-bold text-neutral-900 text-sm">
                              {userItem.full_name || 'Guest'}
                            </div>
                          )}
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{userItem.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-neutral-700">{userItem.email}</div>
                          {editingUserId === userItem.id ? (
                            <input 
                              type="text"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-0.5 mt-1 text-xs focus:outline-none focus:border-amber-400 bg-white w-full"
                            />
                          ) : (
                            <div className="text-xs text-neutral-500">{userItem.phone || '-'}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingUserId === userItem.id ? (
                            <select 
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white"
                            >
                              <option value="guest">Guest</option>
                              <option value="receptionist">Receptionist</option>
                              <option value="housekeeping">Housekeeping</option>
                              <option value="rest_staff">Restaurant Staff</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                              userItem.role === 'admin' || userItem.role === 'super_admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                              userItem.role === 'guest' ? 'bg-neutral-100 text-neutral-600 border border-neutral-200' :
                              'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {userItem.role?.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingUserId === userItem.id ? (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={editForm.email_verified}
                                onChange={(e) => setEditForm({ ...editForm, email_verified: e.target.checked })}
                                className="rounded text-amber-600 border-neutral-200 focus:ring-amber-500/20"
                              />
                              <span className="text-xs text-neutral-600 font-semibold">Verified</span>
                            </label>
                          ) : (
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 w-max ${
                              userItem.email_verified ? 'text-emerald-600 bg-emerald-50' : 'text-neutral-400 bg-neutral-50'
                            }`}>
                              <Check className="w-3 h-3" />
                              <span>{userItem.email_verified ? 'Verified' : 'Pending'}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {editingUserId === userItem.id ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleSaveEdit(userItem.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStartEdit(userItem)}
                                className="p-1.5 text-neutral-400 hover:bg-neutral-50 rounded-lg transition cursor-pointer"
                                title="Edit User Details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(userItem.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete User Permanently"
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
