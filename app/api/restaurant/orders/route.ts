import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const orderSchema = z.object({
  items: z.array(z.object({
    menuId: z.string().uuid(),
    quantity: z.number().int().positive(),
    notes: z.string().optional()
  })),
  roomId: z.string().uuid().optional(),
  tableNumber: z.string().optional(),
  notes: z.string().optional()
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = orderSchema.parse(body)

    // Calculate total and validate menus
    let totalPrice = 0
    const orderDetails = []

    for (const item of validatedData.items) {
      const { data: menu, error: menuError } = await supabase
        .from('restaurant_menus')
        .select('price, is_available, name')
        .eq('id', item.menuId)
        .single()

      if (menuError || !menu) {
        return NextResponse.json(
          { success: false, error: `Menu not found: ${item.menuId}` },
          { status: 404 }
        )
      }

      if (!menu.is_available) {
        return NextResponse.json(
          { success: false, error: `Menu not available: ${menu.name}` },
          { status: 400 }
        )
      }

      const subtotal = menu.price * item.quantity
      totalPrice += subtotal

      orderDetails.push({
        menu_id: item.menuId,
        quantity: item.quantity,
        price: menu.price,
        subtotal: subtotal,
        notes: item.notes
      })
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('restaurant_orders')
      .insert({
        guest_id: user.id,
        room_id: validatedData.roomId || null,
        table_number: validatedData.tableNumber || null,
        total_price: totalPrice,
        status: 'pending',
        notes: validatedData.notes
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order details
    const detailsWithOrderId = orderDetails.map(detail => ({
      ...detail,
      order_id: order.id
    }))

    const { error: detailsError } = await supabase
      .from('restaurant_order_details')
      .insert(detailsWithOrderId)

    if (detailsError) {
      // Rollback order if details failed
      await supabase.from('restaurant_orders').delete().eq('id', order.id)
      throw detailsError
    }

    // Add to kitchen queue
    await supabase
      .from('kitchen_queue')
      .insert({
        order_id: order.id,
        priority: 'normal',
        status: 'pending'
      })

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order placed successfully'
    }, { status: 201 })
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

    let query = supabase
      .from('restaurant_orders')
      .select(`
        *,
        restaurant_order_details (
          *,
          restaurant_menus (name, category)
        ),
        rooms (room_number)
      `)
      .eq('guest_id', user.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}