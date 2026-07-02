import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const availabilitySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  roomTypeId: z.string().uuid().optional(),
  guests: z.number().int().positive().optional()
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const validatedData = availabilitySchema.parse(body)

    // Get all rooms of the specified type
    let query = supabase
      .from('rooms')
      .select(`
        *,
        room_types (
          id,
          name,
          base_price,
          max_occupancy
        )
      `)
      .eq('status', 'available')

    if (validatedData.roomTypeId) {
      query = query.eq('room_type_id', validatedData.roomTypeId)
    }

    if (validatedData.guests) {
      query = supabase
        .from('rooms')
        .select(`
          *,
          room_types!inner (
            id,
            name,
            base_price,
            max_occupancy
          )
        `)
        .eq('status', 'available')
        .gte('room_types.max_occupancy', validatedData.guests)

      if (validatedData.roomTypeId) {
        query = query.eq('room_type_id', validatedData.roomTypeId)
      }
    }

    const { data: rooms, error } = await query

    if (error) throw error

    // Check which rooms are booked
    const { data: bookings } = await supabase
      .from('bookings')
      .select('room_id')
      .in('status', ['pending', 'confirmed', 'checked_in'])
      .or(`and(check_in.lte.${validatedData.checkIn},check_out.gt.${validatedData.checkIn}),and(check_in.lt.${validatedData.checkOut},check_out.gte.${validatedData.checkOut})`)

    const bookedRoomIds = bookings?.map(b => b.room_id) || []
    const availableRooms = rooms?.filter(r => !bookedRoomIds.includes(r.id))

    return NextResponse.json({
      success: true,
      data: {
        available: availableRooms || [],
        count: availableRooms?.length || 0,
        checkIn: validatedData.checkIn,
        checkOut: validatedData.checkOut,
        totalRooms: rooms?.length || 0,
        bookedRooms: bookedRoomIds.length
      }
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}