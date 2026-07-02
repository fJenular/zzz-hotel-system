import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const roomTypeId = searchParams.get('roomTypeId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    let query = supabase
      .from('rooms')
      .select(`
        *,
        room_types (
          id,
          name,
          description,
          base_price,
          max_occupancy
        )
      `)

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.eq('status', 'available')
    }

    // Filter by room type
    if (roomTypeId) {
      query = query.eq('room_type_id', roomTypeId)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: rooms, error, count } = await query

    if (error) throw error

    // If dates provided, filter out booked rooms
    if (checkIn && checkOut) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('room_id')
        .in('status', ['pending', 'confirmed', 'checked_in'])
        .or(`and(check_in.lte.${checkIn},check_out.gt.${checkIn}),and(check_in.lt.${checkOut},check_out.gte.${checkOut})`)

      const bookedRoomIds = bookings?.map(b => b.room_id) || []
      const availableRooms = rooms?.filter(r => !bookedRoomIds.includes(r.id))

      return NextResponse.json({
        success: true,
        data: availableRooms,
        count: availableRooms?.length || 0,
        filters: {
          checkIn,
          checkOut,
          roomTypeId,
          status: 'available'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: rooms,
      count: count || rooms?.length || 0,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}