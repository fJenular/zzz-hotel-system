'use client'

import { useQuery } from '@tanstack/react-query'
import { RoomCard } from './room-card'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

export function RoomsSection() {
  const supabase = createBrowserSupabaseClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['available-rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, room_types(name, base_price, max_occupancy)')
        .eq('status', 'available')
        .limit(6)
      
      if (error) throw error
      return data
    }
  })

  if (isLoading) return <div className="text-center py-10">Loading rooms...</div>
  if (error) return <div className="text-center py-10 text-red-500">Failed to load rooms</div>

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-8">Available Rooms</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map((room: any) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </section>
  )
}