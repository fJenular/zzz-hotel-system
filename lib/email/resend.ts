import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = token

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@zzzhotel.com',
      to: email,
      subject: 'Verify Your Email - ZZZ Hotel',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🏨 ZZZ Hotel</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Thank you for registering with ZZZ Hotel! Please click the button below to verify your email address and activate your account.
                        </p>
                        
                        <!-- CTA Button -->
                        <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center" style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                              <a href="${verificationUrl}" 
                                 style="display: inline-block; padding: 14px 40px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                                Verify Email Address
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="color: #667eea; font-size: 14px; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 4px; margin: 10px 0;">
                          ${verificationUrl}
                        </p>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                          This link will expire in 24 hours for security reasons.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
                          If you didn't create an account with ZZZ Hotel, you can safely ignore this email.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          © 2026 ZZZ Hotel. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@zzzhotel.com',
      to: email,
      subject: 'Reset Your Password - ZZZ Hotel',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🏨 ZZZ Hotel</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          We received a request to reset your password. Click the button below to choose a new password.
                        </p>
                        
                        <!-- CTA Button -->
                        <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center" style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                              <a href="${resetUrl}" 
                                 style="display: inline-block; padding: 14px 40px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="color: #667eea; font-size: 14px; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 4px; margin: 10px 0;">
                          ${resetUrl}
                        </p>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          © 2026 ZZZ Hotel. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}