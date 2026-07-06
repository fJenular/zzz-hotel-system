'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Search, Bell, Edit, Trash2, Save, X, CreditCard, Calendar, DollarSign
} from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminPaymentsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Edit State
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    amount: 0,
    payment_method: '',
    status: ''
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
      fetchPayments()
    }
    checkUser()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings (
          *,
          users (full_name, email),
          rooms (room_number)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }

  const handleStartEdit = (payment: any) => {
    setEditingPaymentId(payment.id)
    setEditForm({
      amount: payment.amount,
      payment_method: payment.payment_method,
      status: payment.status
    })
  }

  const handleSaveEdit = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          amount: Number(editForm.amount),
          payment_method: editForm.payment_method,
          status: editForm.status
        })
        .eq('id', paymentId)

      if (error) throw error
      alert('Payment updated successfully!')
      setEditingPaymentId(null)
      fetchPayments()
    } catch (err: any) {
      alert(err.message || 'Failed to update payment')
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this payment record?')) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error
      alert('Payment record deleted successfully.')
      fetchPayments()
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment')
    }
  }

  const filteredPayments = payments.filter(p => 
    p.bookings?.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bookings?.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.midtrans_order_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar userName={user?.full_name} userRole={user?.role} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Hotel Payments History</h1>
            <p className="text-xs text-gray-500">Track paid transactions, methods, and booking linkages.</p>
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
                placeholder="Search transactions by guest, status, or method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-neutral-200 bg-white rounded-xl text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading payments...</div>
          ) : (
            <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase font-sans">Midtrans Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase font-sans">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase font-sans">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase font-sans">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase font-sans">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase font-sans">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase font-sans">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-neutral-800 font-mono truncate max-w-[150px]">
                            {payment.midtrans_order_id || 'LOCAL-PAY'}
                          </div>
                          {payment.bookings?.rooms && (
                            <div className="text-[10px] text-amber-700 font-semibold">
                              Room {payment.bookings.rooms.room_number}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 text-sm">
                            {payment.bookings?.users?.full_name || 'Guest'}
                          </div>
                          <div className="text-xs text-gray-400">{payment.bookings?.users?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          {editingPaymentId === payment.id ? (
                            <input 
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 w-28 text-sm focus:outline-none focus:border-amber-400 bg-white"
                            />
                          ) : (
                            <div className="font-extrabold text-neutral-900 text-sm">
                              Rp {Number(payment.amount).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingPaymentId === payment.id ? (
                            <select 
                              value={editForm.payment_method}
                              onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white"
                            >
                              <option value="qris">QRIS</option>
                              <option value="credit_card">Credit Card</option>
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="cash">Cash / Receptionist</option>
                            </select>
                          ) : (
                            <span className="text-xs font-semibold text-neutral-600 uppercase">
                              {payment.payment_method}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingPaymentId === payment.id ? (
                            <select 
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-amber-400 bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                              payment.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                              payment.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {payment.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {editingPaymentId === payment.id ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleSaveEdit(payment.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingPaymentId(null)}
                                className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStartEdit(payment)}
                                className="p-1.5 text-neutral-400 hover:bg-neutral-50 rounded-lg transition cursor-pointer"
                                title="Edit Transaction"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(payment.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Payment record"
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
