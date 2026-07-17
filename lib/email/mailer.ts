import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

/**
 * Send a branded OTP email to the given address.
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  fullName: string
): Promise<void> {
  const mailOptions = {
    from: `"ZZZ Hotel" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `${otp} — Kode Verifikasi ZZZ Hotel`,
    html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifikasi Email — ZZZ Hotel</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;max-width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:36px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:16px;padding:12px 20px;">
                <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">ZZZ Hotel</span>
              </div>
              <p style="color:#94a3b8;font-size:13px;margin:10px 0 0;letter-spacing:1px;text-transform:uppercase;">Luxury Stay Experience</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;">Halo, ${fullName}! 👋</h1>
              <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">
                Terima kasih telah mendaftar di <strong>ZZZ Hotel</strong>. Gunakan kode verifikasi di bawah ini untuk mengaktifkan akun Anda.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#f1f5f9,#e2e8f0);border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;border:2px dashed #cbd5e1;">
                <p style="color:#64748b;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;font-weight:600;">Kode Verifikasi Anda</p>
                <span style="font-size:48px;font-weight:800;letter-spacing:12px;color:#0f172a;font-family:'Courier New',monospace;">${otp}</span>
                <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">⏱ Berlaku selama <strong>10 menit</strong></p>
              </div>

              <!-- Warning -->
              <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:14px 16px;margin:0 0 24px;">
                <p style="color:#9a3412;font-size:13px;margin:0;line-height:1.6;">
                  <strong>⚠️ Jangan bagikan kode ini</strong> kepada siapapun, termasuk staf ZZZ Hotel. Kami tidak pernah meminta kode verifikasi Anda.
                </p>
              </div>

              <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
                Jika Anda tidak melakukan pendaftaran ini, abaikan email ini. Kode akan kadaluarsa secara otomatis.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} ZZZ Hotel Management System. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }

  await transporter.sendMail(mailOptions)
}
