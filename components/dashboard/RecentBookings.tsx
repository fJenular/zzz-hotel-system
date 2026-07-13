import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

export default async function RecentBookings() {
  const supabase = await createClient()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      check_in,
      check_out,
      total_price,
      status,
      created_at,
      users (
        full_name,
        email
      ),
      rooms (
        room_number
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching recent bookings:', error)
    return (
      <Card className="border border-red-100 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-red-700">Pemesanan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-red-500">Gagal memuat pemesanan terbaru dari database.</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': 
        return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'confirmed': 
        return 'bg-red-50 text-red-600 border-red-100'
      case 'checked_in': 
        return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      case 'checked_out': 
        return 'bg-slate-50 text-slate-500 border-slate-100'
      case 'cancelled': 
        return 'bg-rose-50 text-rose-500 border-rose-100 line-through opacity-75'
      default: 
        return 'bg-slate-50 text-slate-500 border-slate-100'
    }
  }

  return (
    <Card className="border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl p-2">
      <CardHeader className="pb-4 border-b border-slate-50/50">
        <CardTitle className="text-base font-black text-slate-800 tracking-tight">Pemesanan Terbaru</CardTitle>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Catatan database real-time</p>
      </CardHeader>
      <CardContent className="pt-4">
        {bookings && bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-500">
              <thead>
                <tr className="border-b border-slate-100/80">
                  <th className="pb-3 px-2 font-bold text-slate-400 uppercase tracking-wider">Tamu</th>
                  <th className="pb-3 px-2 font-bold text-slate-400 uppercase tracking-wider">Kamar</th>
                  <th className="pb-3 px-2 font-bold text-slate-400 uppercase tracking-wider">Jadwal</th>
                  <th className="pb-3 px-2 font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100/50">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{booking.users?.full_name || 'Tamu'}</div>
                          <div className="text-[10px] text-slate-400">{booking.users?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="font-bold text-slate-700">No. {booking.rooms?.room_number || 'N/A'}</span>
                    </td>
                    <td className="py-3.5 px-2 text-[10px] font-semibold text-slate-500">
                      <div>{new Date(booking.check_in).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                      <div className="text-slate-400 font-medium">hingga {new Date(booking.check_out).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusStyle(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right font-black text-slate-850">
                      Rp {Number(booking.total_price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-450 font-medium">
            Tidak ada pemesanan terbaru yang ditemukan.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
