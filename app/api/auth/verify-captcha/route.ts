import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 400 }
      )
    }

    // Skip captcha verification in development mode
    if (process.env.NODE_ENV === 'development' && !process.env.TURNSTILE_SECRET_KEY) {
      console.log('⚠️  Captcha verification skipped (development mode)')
      return NextResponse.json({ success: true })
    }

    // Verify with Cloudflare
    const formData = new FormData()
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY!)
    formData.append('response', token)

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!data.success) {
      console.error('Captcha verification failed:', data['error-codes'])
      return NextResponse.json(
        { success: false, error: 'Captcha verification failed', errorCodes: data['error-codes'] },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Captcha API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}