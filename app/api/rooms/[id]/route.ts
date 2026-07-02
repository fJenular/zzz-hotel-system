import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: room, error } = await supabase
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
      .eq('id', params.id)
      .single()

    if (error || !room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    // Get room availability for next 30 days
    const today = new Date()
    const next30Days = new Date()
    next30Days.setDate(today.getDate() + 30)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('check_in, check_out, status')
      .eq('room_id', params.id)
      .in('status', ['pending', 'confirmed', 'checked_in'])
      .gte('check_out', today.toISOString().split('T')[0])
      .lte('check_in', next30Days.toISOString().split('T')[0])

    return NextResponse.json({
      success: true,
      data: {
        ...room,
        bookings: bookings || []
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}