import { Resend } from "resend";

/**
 * Check env vars at startup (optional - will warn if missing)
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

const isEmailConfigured = !!(RESEND_API_KEY && RESEND_FROM_EMAIL);

if (!isEmailConfigured) {
  console.warn("Email service not configured: Missing RESEND_API_KEY or RESEND_FROM_EMAIL. Email functionality will be disabled.");
}

/**
 * Create Resend client (only if configured)
 */
const resend = isEmailConfigured ? new Resend(RESEND_API_KEY) : null;

/**
 * Send confirmation email
 */
export async function sendConfirmationEmail(to: string, name: string) {
  if (!resend || !RESEND_FROM_EMAIL) {
    console.warn("Email not sent: Email service is not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Diriyah <${RESEND_FROM_EMAIL}>`,
      to: [to],
      subject: "تأكيد التسجيل - الدرعية",
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:20px;background:#f5f0e8;font-family:Tahoma,Arial,sans-serif">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">

    <div style="background:#3d3428;padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0">الدرعية</h1>
      <p style="color:#d4a574;margin:8px 0 0">بوابة التاريخ والثقافة</p>
    </div>

    <div style="padding:30px">
      <h2 style="color:#3d3428">مرحباً ${name} 👋</h2>

      <p style="color:#5c4a3d;line-height:1.8">
        شكراً لتسجيلك في موقع الدرعية. نحن سعداء بانضمامك إلينا!
      </p>

      <div style="background:#f5f0e8;padding:20px;border-radius:8px;margin:24px 0">
        <p style="margin:0;color:#5c4a3d;font-size:14px">
          يمكنك الآن استكشاف تجاربنا الفريدة وحجز تذاكرك لزيارة أهم
          المعالم التاريخية في الدرعية.
        </p>
      </div>

      <div style="text-align:center;margin:30px 0">
        <a
          href="https://diriyah.sa"
          style="
            display:inline-block;
            background:#c4956a;
            color:#fff;
            text-decoration:none;
            padding:14px 40px;
            border-radius:8px;
            font-weight:bold;
          "
        >
          استكشف الآن
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #e5e0d8;margin:30px 0" />

      <p style="font-size:12px;color:#999;text-align:center">
        هذه رسالة تلقائية، يرجى عدم الرد عليها
      </p>
    </div>

    <div style="background:#3d3428;padding:16px;text-align:center">
      <p style="margin:0;color:#aaa;font-size:12px">
        © 2024 الدرعية - جميع الحقوق محفوظة
      </p>
    </div>

  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Send email failed:", err);
    return { success: false, err };
  }
}
