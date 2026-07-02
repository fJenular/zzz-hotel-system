import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
      <Card className="border border-red-100 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-red-700">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Failed to load recent bookings from the database.</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': 
        return 'bg-amber-50/60 text-amber-700 border-amber-100'
      case 'confirmed': 
        return 'bg-rose-50/60 text-rose-700 border-rose-100 font-semibold'
      case 'checked_in': 
        return 'bg-emerald-50/60 text-emerald-700 border-emerald-100 font-semibold'
      case 'checked_out': 
        return 'bg-gray-50 text-gray-600 border-gray-100'
      case 'cancelled': 
        return 'bg-rose-50 text-rose-800 border-rose-200 line-through opacity-75'
      default: 
        return 'bg-gray-50 text-gray-500 border-gray-100'
    }
  }

  return (
    <Card className="border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
      <CardHeader className="border-b border-gray-50 pb-4 bg-gradient-to-r from-gray-50/50 to-white">
        <CardTitle className="text-lg font-bold text-gray-800">Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {bookings && bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600 rounded-l-lg">Guest</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600">Room</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600">Dates</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600 text-right rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking: any) => (
                  <tr key={booking.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="font-semibold text-gray-800">{booking.users?.full_name || 'Guest'}</div>
                      <div className="text-xs text-gray-400 font-normal">{booking.users?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-700">Room {booking.rooms?.room_number || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{new Date(booking.check_in).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -</div>
                      <div>{new Date(booking.check_out).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(booking.status)}`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      Rp {Number(booking.total_price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 font-medium">
            No recent bookings found.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
