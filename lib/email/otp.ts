import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Generate a cryptographically-safe 6-digit OTP string */
export function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(array[0] % 1_000_000).padStart(6, '0')
}

/**
 * Persist a new OTP for the given email.
 * Invalidates any previous unused OTPs for the same email.
 * Returns the generated OTP code (so the caller can email it).
 */
export async function createOTP(email: string): Promise<string> {
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Invalidate old unused OTPs for this email
  await supabaseAdmin
    .from('otp_verifications')
    .update({ used: true })
    .eq('email', email.toLowerCase())
    .eq('used', false)

  const { error } = await supabaseAdmin.from('otp_verifications').insert({
    email: email.toLowerCase(),
    otp_code: code,
    expires_at: expiresAt.toISOString(),
    used: false,
  })

  if (error) {
    console.error('createOTP insert error:', error)
    throw new Error('Failed to save OTP')
  }

  return code
}

export type OTPVerifyResult =
  | { success: true }
  | { success: false; reason: 'not_found' | 'expired' | 'used' | 'invalid' }

/**
 * Verify a 6-digit OTP for the given email.
 * Marks it as used on success.
 */
export async function verifyOTP(email: string, code: string): Promise<OTPVerifyResult> {
  const { data, error } = await supabaseAdmin
    .from('otp_verifications')
    .select('id, otp_code, expires_at, used')
    .eq('email', email.toLowerCase())
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('verifyOTP select error:', error)
    return { success: false, reason: 'not_found' }
  }

  if (!data) return { success: false, reason: 'not_found' }
  if (data.used) return { success: false, reason: 'used' }
  if (new Date(data.expires_at) < new Date()) return { success: false, reason: 'expired' }
  if (data.otp_code !== code) return { success: false, reason: 'invalid' }

  // Mark as used
  await supabaseAdmin
    .from('otp_verifications')
    .update({ used: true })
    .eq('id', data.id)

  return { success: true }
}
