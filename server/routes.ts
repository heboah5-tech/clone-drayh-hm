import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Resend } from "resend";

const RESEND_API_KEY = "re_6kmv4kCn_K1YNR2wVkmUPjxjMxw3qRrDS";
const RESEND_FROM_EMAIL = "noreply@drayha.com";
const BINCODES_API_KEY =
  process.env.BINCODES_API_KEY || "537622aa19e26541f896393352b78ec2";
const BINCODES_LOOKUP_URL = "https://api.bincodes.com/bin/";
const BINLIST_LOOKUP_URL = "https://lookup.binlist.net/";
const BIN_CACHE_TTL_MS = 1000 * 60 * 30;

const resend = new Resend(RESEND_API_KEY);
const binLookupCache = new Map<
  string,
  {
    expiresAt: number;
    data: {
      bin: string;
      bankName: string;
      cardBrand: string;
      cardType: string;
      cardLevel: string;
      country: string;
      countryCode: string;
    };
  }
>();

interface BinCodesApiResponse {
  bin?: string;
  bank?: string;
  card?: string;
  type?: string;
  level?: string;
  country?: string;
  countrycode?: string;
  valid?: string | boolean;
  error?: string;
  message?: string;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Send confirmation email endpoint
  app.post("/api/send-confirmation-email", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ success: false, error: "Email and name are required" });
      }

      const { data, error } = await resend.emails.send({
        from: `Diriyah <${RESEND_FROM_EMAIL}>`,
        to: [email],
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
      <h2 style="color:#3d3428">مرحباً ${name}</h2>
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
        <a href="https://diriyah.sa" style="display:inline-block;background:#c4956a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:bold;">
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
        return res.status(500).json({ success: false, error: "Failed to send email" });
      }

      console.log("Email sent successfully:", data);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Email send error:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  app.get("/api/bin-lookup/:bin", async (req, res) => {
    try {
      const rawBin = String(req.params.bin || "");
      const normalizedBin = rawBin.replace(/\D/g, "").slice(0, 6);

      if (normalizedBin.length < 6) {
        return res.status(400).json({
          success: false,
          error: "BIN must be at least 6 digits",
        });
      }

      const cached = binLookupCache.get(normalizedBin);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
        });
      }

      const lookupUrl = new URL(BINCODES_LOOKUP_URL);
      lookupUrl.searchParams.set("format", "json");
      lookupUrl.searchParams.set("api_key", BINCODES_API_KEY);
      lookupUrl.searchParams.set("bin", normalizedBin);

      const response = await fetch(lookupUrl.toString(), {
        headers: { Accept: "application/json" },
      });

      let payload: BinCodesApiResponse | null = null;
      try {
        payload = (await response.json()) as BinCodesApiResponse;
      } catch {
        payload = null;
      }

      if (!response.ok || !payload) {
        return res.status(502).json({
          success: false,
          error: "BIN lookup provider unavailable",
        });
      }

      const isValid = `${payload.valid}`.toLowerCase() === "true";
      if (!isValid || payload.error) {
        return res.status(422).json({
          success: false,
          error: payload.message || "Invalid BIN",
          code: payload.error || undefined,
        });
      }

      let bankName = payload.bank || "";

      // Fallback to binlist.net if primary API returned no bank name
      if (!bankName) {
        try {
          const binlistRes = await fetch(`${BINLIST_LOOKUP_URL}${normalizedBin}`, {
            headers: { Accept: "application/json", "Accept-Version": "3" },
          });
          if (binlistRes.ok) {
            const binlistData = await binlistRes.json() as { bank?: { name?: string } };
            if (binlistData?.bank?.name) {
              bankName = binlistData.bank.name;
            }
          }
        } catch {
          // silently ignore fallback errors
        }
      }

      const data = {
        bin: payload.bin || normalizedBin,
        bankName,
        cardBrand: payload.card || "",
        cardType: payload.type || "",
        cardLevel: payload.level || "",
        country: payload.country || "",
        countryCode: payload.countrycode || "",
      };

      binLookupCache.set(normalizedBin, {
        data,
        expiresAt: Date.now() + BIN_CACHE_TTL_MS,
      });

      return res.json({ success: true, data });
    } catch (error) {
      console.error("BIN lookup error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to lookup BIN",
      });
    }
  });

  return httpServer;
}
