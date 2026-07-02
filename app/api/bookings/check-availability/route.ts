import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const roomTypeId = searchParams.get('roomTypeId')

  const supabase = await createClient()

  // Check overlapping bookings
  const { data: bookedRooms } = await supabase
    .from('bookings')
    .select('room_id')
    .eq('room_type_id', roomTypeId)
    .or(`and(check_in.lte.${checkIn},check_out.gt.${checkIn}),and(check_in.lt.${checkOut},check_out.gte.${checkOut})`)
    .in('status', ['pending', 'confirmed', 'checked_in'])

  const bookedRoomIds = bookedRooms?.map(b => b.room_id) || []

  // Get available rooms
  const { data: availableRooms } = await supabase
    .from('rooms')
    .select(`
      *,
      room_types (*)
    `)
    .eq('room_type_id', roomTypeId)
    .eq('status', 'available')
    .not('id', 'in', `(${bookedRoomIds.join(',')})`)

  return NextResponse.json(availableRooms)
}