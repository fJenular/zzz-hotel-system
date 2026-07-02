import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  return handleLogout(request)
}

export async function POST(request: Request) {
  return handleLogout(request)
}

async function handleLogout(request: Request) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    
    // Clear cookies explicitly if needed, but supabase.auth.signOut() clears them
    const requestUrl = new URL(request.url)
    const response = NextResponse.redirect(`${requestUrl.origin}/login`, {
      status: 302
    })
    
    return response
  } catch (error) {
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(`${requestUrl.origin}/login`, {
      status: 302
    })
  }
}