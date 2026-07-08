import nodemailer from 'nodemailer'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testSMTP() {
  console.log('📧 Testing SMTP connection...\n')

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: 'YOUR_BREVO_SMTP_LOGIN', // Ganti dengan SMTP Login Brevo
      pass: 'YOUR_BREVO_SMTP_KEY'    // Ganti dengan SMTP Key Brevo
    }
  })

  try {
    const info = await transporter.sendMail({
      from: '"ZZZ Hotel" <noreply@zzzhotel.com>',
      to: 'zainularifinsmktibazma@gmail.com', // Email Anda
      subject: 'Test Email from Brevo',
      text: 'If you receive this, SMTP is working!',
      html: '<b>If you receive this, SMTP is working!</b>'
    })

    console.log('✅ Email sent:', info.messageId)
  } catch (error: any) {
    console.error('❌ SMTP error:', error.message)
  }
}

testSMTP()