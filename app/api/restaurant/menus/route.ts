import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const available = searchParams.get('available')
    const search = searchParams.get('search')

    let query = supabase
      .from('restaurant_menus')
      .select(`
        *,
        restaurant_categories (name)
      `)

    if (category) {
      query = query.eq('category', category)
    }

    if (available === 'true') {
      query = query.eq('is_available', true)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: menus, error } = await query.order('category')

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: menus,
      count: menus?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}