import { ArrowRight, ChevronDown, Calendar, Clock, Ticket, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { handleCurrentPage } from "@/lib/firebase";

export default function BookingPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:00");

  useEffect(() => {
    handleCurrentPage("booking");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5efe6] to-[#ebddd0] flex flex-col" dir="rtl">
      <Header />
      <main className="flex-1 pb-8">
        <TitleSection />
        <BookingForm date={date} setDate={setDate} time={time} setTime={setTime} />
        <TermsSection />
        <FooterSection />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-[#4a1525] text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/registration">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back-booking">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex-1 flex justify-center">
            <img src="/logo-white.svg" alt="الدرعية" className="h-12" data-testid="img-booking-logo" />
          </div>
          
          <div className="w-10" />
        </div>
        
        <div className="flex items-center justify-center gap-1 mt-6 pb-2">
          {[
            { number: 1, label: "تسجيل" },
            { number: 2, label: "الحجز" },
            { number: 3, label: "السلة" },
            { number: 4, label: "الدفع" },
          ].map((step, index, arr) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step.number <= 2
                      ? "bg-gradient-to-br from-[#c9a96e] to-[#b8935a] text-white shadow-lg"
                      : "bg-white/20 text-white/60"
                  }`}
                >
                  {step.number}
                </div>
                <span className="text-xs mt-2 text-white/80">{step.label}</span>
              </div>
              {index < arr.length - 1 && (
                <div
                  className={`w-10 h-1 mx-1 rounded-full ${
                    step.number < 2 ? "bg-gradient-to-r from-[#c9a96e] to-[#b8935a]" : "bg-white/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

function TitleSection() {
  return (
    <div className="bg-gradient-to-r from-[#4a1525] to-[#3a0f1d] py-8 px-4 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Ticket className="w-7 h-7 text-[#c9a96e]" />
        <h1 className="text-2xl font-bold text-white" data-testid="text-booking-title">
          تصريح دخول الدرعية
        </h1>
      </div>
      <p className="text-white/70 text-sm">اختر التاريخ والوقت المناسب لزيارتك</p>
    </div>
  );
}

function BookingForm({ 
  date, 
  setDate, 
  time, 
  setTime 
}: { 
  date: Date | undefined; 
  setDate: (d: Date | undefined) => void; 
  time: string; 
  setTime: (t: string) => void;
}) {
  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", 
    "17:00", "18:00"
  ];
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleConfirmBooking = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    const bookingData = { date: date?.toISOString(), time };
    localStorage.setItem("bookingData", JSON.stringify(bookingData));
    const ok = await handleCurrentPage("booking");
    if (!ok) {
      setSubmitError("تعذر إكمال الحجز، يرجى المحاولة مرة أخرى");
      setIsSubmitting(false);
      return;
    }
    setLocation("/cart");
  };

  return (
    <section className="px-4 py-8" data-testid="section-booking-form">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 space-y-6 animate-fade-in">
        <h2 className="text-center text-xl font-bold text-foreground">
          الرجاء الاختيار
        </h2>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              اختيار التاريخ *
            </Label>
            <Input
              type="date"
              value={date ? date.toISOString().split('T')[0] : ''}
              onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full text-center h-12 rounded-xl border-2 focus:border-primary"
              data-testid="input-date"
            />
            {date && (
              <div className="text-center mt-3 p-3 bg-primary/10 rounded-xl" data-testid="text-selected-date">
                <p className="text-sm text-primary font-medium">
                  التاريخ المحدد: {date.toLocaleDateString('ar-SA')}
                </p>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              اختيار الوقت *
            </Label>
            <div className="relative">
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-input bg-background text-foreground appearance-none text-center font-medium focus:border-primary focus:outline-none"
                data-testid="select-time"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#f5efe6] to-[#ebddd0] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">أسعار التذاكر</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">تذكرة دخول الدرعية</span>
            <span className="font-bold text-xl text-primary">50 ر.س</span>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            size="lg"
            className="w-full bg-primary text-white shadow-lg"
            onClick={() => {
              void handleConfirmBooking();
            }}
            disabled={isSubmitting}
            data-testid="button-confirm-booking"
          >
            {isSubmitting ? "جاري الإرسال..." : "احجز الآن"}
          </Button>

          {submitError && (
            <p className="text-red-500 text-xs text-center" data-testid="error-booking-submit">
              {submitError}
            </p>
          )}
          
          <Link href="/tickets">
            <Button 
              variant="outline"
              size="lg"
              className="w-full"
              data-testid="button-cancel-booking"
            >
              إلغاء
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function TermsSection() {
  return (
    <section className="px-4 py-6 max-w-md mx-auto" data-testid="section-booking-terms">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">الشروط والأحكام</h3>
        </div>
        <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
          <p>
            يلزم الضيف بالحجز والوصول في الوقت المحدد.
          </p>
          <p>
            يلزم الضيف بعدم الحجز لتذاكر لعدة مطاعم في نفس الوقت، كما يُحظر إعادة بيع الحجوزات.
          </p>
          <p>
            يمكن إجراء الحجوزات من خلال الموقع الإلكتروني الخاص بالمحل فقط.
          </p>
          <p>
            الحجوزات تسمح بالدخول مرة واحدة إلى المنطقة ومغادرة التاريخ المحدد فقط.
          </p>
          <p>
            جميع المبالغ التي لم يتم دفعها للحجز غير مستردة.
          </p>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="px-4 py-6 text-center" data-testid="section-booking-footer">
      <p className="text-xs text-muted-foreground">
        حقوق النشر 2024. جميع الحقوق محفوظة
      </p>
    </footer>
  );
}
