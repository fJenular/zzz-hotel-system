import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bookingSchema = z.object({
  roomId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestsCount: z.number().int().positive(),
  specialRequests: z.string().optional()
})

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('bookings')
      .select(`
        *,
        rooms (
          room_number,
          room_types (
            name,
            base_price
          )
        )
      `)
      .eq('user_id', user.id)

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data: bookings, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: bookings,
      count: count || bookings?.length || 0,
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