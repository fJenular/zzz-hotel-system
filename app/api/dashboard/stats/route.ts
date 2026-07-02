import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Check if user has admin/staff role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'super_admin', 'manager'].includes(userData?.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30days'

    let startDate = new Date()
    let endDate = new Date()

    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30)
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90)
    }

    // Calculate KPIs using database functions
    const { data: occupancyRate } = await supabase.rpc('calculate_occupancy_rate', {
      p_date: new Date().toISOString().split('T')[0]
    })

    const { data: revenue } = await supabase.rpc('calculate_revenue', {
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: endDate.toISOString().split('T')[0]
    })

    // Get total bookings
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // Get total rooms
    const { count: totalRooms } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })

    // Get occupied rooms
    const { data: occupiedRooms } = await supabase
      .from('bookings')
      .select('room_id')
      .eq('status', 'checked_in')

    // Calculate ADR (Average Daily Rate)
    const { data: bookingsWithPrice } = await supabase
      .from('bookings')
      .select('total_price, check_in, check_out')
      .eq('status', 'confirmed')
      .gte('created_at', startDate.toISOString())

    let adr = 0
    if (bookingsWithPrice && bookingsWithPrice.length > 0) {
      const totalRevenue = bookingsWithPrice.reduce((sum, b) => sum + b.total_price, 0)
      const totalNights = bookingsWithPrice.reduce((sum, b) => {
        const nights = Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 60 * 60 * 24))
        return sum + nights
      }, 0)
      adr = totalNights > 0 ? totalRevenue / totalNights : 0
    }

    // Calculate RevPAR (Revenue Per Available Room)
    const revpar = totalRooms ? (revenue || 0) / totalRooms : 0

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          occupancy_rate: occupancyRate || 0,
          total_revenue: revenue || 0,
          total_bookings: totalBookings || 0,
          total_rooms: totalRooms || 0,
          occupied_rooms: occupiedRooms?.length || 0,
          available_rooms: (totalRooms || 0) - (occupiedRooms?.length || 0),
          adr: Math.round(adr),
          revpar: Math.round(revpar)
        },
        period: period,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}