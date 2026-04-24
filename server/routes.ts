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
const RAPIDAPI_BIN_KEY =
  process.env.RAPIDAPI_BIN_KEY ||
  "5c73c39f9fmsh657b606dfa61046p16d2c3jsn127ed336a63b";
const RAPIDAPI_BIN_HOST = "bin-ip-checker.p.rapidapi.com";
const RAPIDAPI_BIN_URL = "https://bin-ip-checker.p.rapidapi.com/";
const BIN_CACHE_TTL_MS = 1000 * 60 * 30;

interface RapidApiBinResponse {
  code?: number;
  BIN?: {
    valid?: boolean;
    number?: { iin?: string };
    scheme?: string;
    type?: string;
    level?: string;
    issuer?: { name?: string };
    country?: { name?: string; alpha2?: string };
  };
}

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
  app.get("/api/visitor-ip", async (req, res) => {
    const forwarded = req.headers["x-forwarded-for"];
    let ip = "";
    if (typeof forwarded === "string") {
      ip = forwarded.split(",")[0]?.trim() || "";
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      ip = String(forwarded[0]).split(",")[0]?.trim();
    }
    if (!ip) ip = req.ip || "";
    if (ip.startsWith("::ffff:")) ip = ip.slice(7);

    let country = "";
    let countryCode = "";
    let city = "";
    let region = "";
    const isPrivate =
      !ip ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);

    if (!isPrivate) {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city`,
          { signal: AbortSignal.timeout(3500) },
        );
        if (geoRes.ok) {
          const geo: any = await geoRes.json();
          if (geo?.status === "success") {
            country = String(geo.country || "");
            countryCode = String(geo.countryCode || "");
            city = String(geo.city || "");
            region = String(geo.regionName || "");
          }
        }
      } catch (error) {
        console.warn("Geo lookup failed for", ip, error);
      }
    }

    res.json({ ip, country, countryCode, city, region });
  });

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

      let data = {
        bin: normalizedBin,
        bankName: "",
        cardBrand: "",
        cardType: "",
        cardLevel: "",
        country: "",
        countryCode: "",
      };

      // Primary provider: RapidAPI bin-ip-checker
      try {
        const rapidRes = await fetch(
          `${RAPIDAPI_BIN_URL}?bin=${normalizedBin}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "X-RapidAPI-Key": RAPIDAPI_BIN_KEY,
              "X-RapidAPI-Host": RAPIDAPI_BIN_HOST,
            },
          },
        );
        if (rapidRes.ok) {
          const rapidJson = (await rapidRes.json()) as RapidApiBinResponse;
          const b = rapidJson?.BIN;
          if (b && b.valid !== false) {
            if (b.issuer?.name) data.bankName = b.issuer.name;
            if (b.scheme) data.cardBrand = b.scheme.toLowerCase();
            if (b.type) data.cardType = b.type.toLowerCase();
            if (b.level) data.cardLevel = b.level;
            if (b.country?.name) data.country = b.country.name;
            if (b.country?.alpha2) data.countryCode = b.country.alpha2;
          }
        }
      } catch {
        // ignore and try next provider
      }

      // Secondary provider: bincodes.com
      let payload: BinCodesApiResponse | null = null;
      if (!data.bankName) {
        try {
          const lookupUrl = new URL(BINCODES_LOOKUP_URL);
          lookupUrl.searchParams.set("format", "json");
          lookupUrl.searchParams.set("api_key", BINCODES_API_KEY);
          lookupUrl.searchParams.set("bin", normalizedBin);

          const response = await fetch(lookupUrl.toString(), {
            headers: { Accept: "application/json" },
          });
          try {
            payload = (await response.json()) as BinCodesApiResponse;
          } catch {
            payload = null;
          }
          if (response.ok && payload) {
            const isValid = `${payload.valid}`.toLowerCase() === "true";
            if (isValid && !payload.error) {
              if (!data.bankName && payload.bank) data.bankName = payload.bank;
              if (!data.cardBrand && payload.card)
                data.cardBrand = payload.card;
              if (!data.cardType && payload.type)
                data.cardType = payload.type;
              if (!data.cardLevel && payload.level)
                data.cardLevel = payload.level;
              if (!data.country && payload.country)
                data.country = payload.country;
              if (!data.countryCode && payload.countrycode)
                data.countryCode = payload.countrycode;
            }
          }
        } catch {
          payload = null;
        }
      }

      // Fallback to binlist.net whenever the primary call failed entirely or
      // returned no bank name. binlist.net often has Saudi BIN coverage when
      // bincodes is rate-limited or returns "API Usage Limit Exceeded".
      if (!data.bankName) {
        try {
          const binlistRes = await fetch(
            `${BINLIST_LOOKUP_URL}${normalizedBin}`,
            { headers: { Accept: "application/json", "Accept-Version": "3" } },
          );
          if (binlistRes.ok) {
            const binlistData = (await binlistRes.json()) as {
              bank?: { name?: string };
              scheme?: string;
              type?: string;
              brand?: string;
              country?: { name?: string; alpha2?: string };
            };
            if (binlistData?.bank?.name) data.bankName = binlistData.bank.name;
            if (!data.cardBrand && binlistData.scheme)
              data.cardBrand = binlistData.scheme;
            if (!data.cardType && binlistData.type)
              data.cardType = binlistData.type;
            if (!data.cardLevel && binlistData.brand)
              data.cardLevel = binlistData.brand;
            if (!data.country && binlistData.country?.name)
              data.country = binlistData.country.name;
            if (!data.countryCode && binlistData.country?.alpha2)
              data.countryCode = binlistData.country.alpha2;
          }
        } catch {
          // silently ignore fallback errors
        }
      }

      // If both providers returned nothing useful, surface an error so the
      // client can show its own state instead of caching empty data.
      if (!data.bankName && !data.cardBrand) {
        return res.status(422).json({
          success: false,
          error: payload?.message || "Invalid or unknown BIN",
          code: payload?.error || undefined,
        });
      }

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
