import { ArrowRight, MapPin, Clock, Info, Ticket, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

import ticketHeroImage from "@assets/455c3dc333504d44bfe63f8258282e15.webp";

export default function TicketsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5efe6] to-[#ebddd0] flex flex-col" dir="rtl">
      <Header />
      <main className="flex-1 pb-24">
        <HeroImage />
        <TicketInfo />
        <MapSection />
        <TermsSection />
        <FooterSection />
      </main>
      <BookNowButton />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#4a1525] text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button size="icon" variant="ghost" className="text-white" data-testid="button-back">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex-1 flex justify-center">
            <img src="/logo-white.svg" alt="الدرعية" className="h-10" data-testid="img-tickets-logo" />
          </div>
          
          <div className="w-10" />
        </div>
      </div>
    </header>
  );
}

function HeroImage() {
  return (
    <div className="relative h-72 overflow-hidden">
      <img 
        src={ticketHeroImage} 
        alt="حي الطريف التاريخي" 
        className="w-full h-full object-cover"
        data-testid="img-ticket-hero"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute bottom-6 right-6 left-6 text-right">
        <div className="inline-flex items-center gap-2 bg-primary/90 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
          <Star className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">اكتشف</span>
        </div>
        <h1 className="text-white text-2xl font-bold drop-shadow-lg" data-testid="text-ticket-title">
          تذكرة دخول الدرعية
        </h1>
      </div>
    </div>
  );
}

function TicketInfo() {
  return (
    <section className="px-4 py-8" data-testid="section-ticket-info">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#c9a96e] to-[#b8935a] rounded-full flex items-center justify-center shadow-glow">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground" data-testid="text-access-title">
            تصريح دخول الدرعية
          </h2>
        </div>

        <div className="space-y-4">
          <InfoCard 
            icon={<Clock className="w-5 h-5" />}
            title="أوقات العمل"
            color="bg-[#4a1525]"
          >
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-bold text-foreground mb-1">مطل البجيري</p>
                <p>أيام الأسبوع: 9:00 ص - 12:00 م</p>
                <p>نهاية الأسبوع: 9:00 ص - 1:00 ص</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-bold text-foreground mb-1">الطريف</p>
                <p>السبت - الخميس: 10:00 ص - 12:00 م</p>
                <p>الجمعة: 2:00 م - 12:00 م</p>
              </div>
              <p className="text-xs text-muted-foreground">آخر وقت للدخول الساعة 11 مساءً</p>
            </div>
          </InfoCard>

          <InfoCard 
            icon={<MapPin className="w-5 h-5" />}
            title="الموقع"
            color="bg-[#c9a96e]"
          >
            <div className="space-y-2 text-sm">
              <p className="text-foreground">الدرعية، الرياض</p>
              <p className="text-muted-foreground">مطل البجيري وحي الطريف التاريخي</p>
            </div>
          </InfoCard>

          <InfoCard 
            icon={<Info className="w-5 h-5" />}
            title="ما يشمله التذكرة"
            color="bg-[#4a1525]"
          >
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                الدخول إلى الطريف التاريخي
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                الدخول إلى مطل البجيري
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                استرداد مبلغ التذكرة في المطاعم والمقاهي
              </li>
            </ul>
          </InfoCard>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ 
  icon, 
  title, 
  color,
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  color: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white shadow-md`}>
          {icon}
        </div>
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MapSection() {
  return (
    <section className="px-4 py-6" data-testid="section-map">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">الموقع على الخريطة</h3>
        </div>
        <div className="rounded-2xl overflow-hidden border shadow-lg">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3624.1234567890123!2d46.5763!3d24.7336!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f1b9c8d7e6f5a%3A0x1234567890abcdef!2sBujairi%20Terrace!5e0!3m2!1sen!2ssa!4v1234567890123"
            width="100%"
            height="200"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="موقع مطل البجيري"
            data-testid="map-location"
          />
        </div>
      </div>
    </section>
  );
}

function TermsSection() {
  return (
    <section className="px-4 py-6" data-testid="section-terms">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">الشروط والأحكام</h3>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
            التذاكر غير قابلة للاسترداد
          </p>
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
            يجب الحضور في الموعد المحدد
          </p>
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
            الالتزام بقواعد السلامة والأمان
          </p>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="px-4 py-8 text-center" data-testid="section-ticket-footer">
      <p className="text-xs text-muted-foreground mb-2">
        Copyright 2024 DGCL. All Rights Reserved
      </p>
      <p className="text-xs text-primary font-medium" dir="ltr">
        +966 92 002 1727
      </p>
    </footer>
  );
}

function BookNowButton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#e8d5b5] to-[#f5ebe0] border-t p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">السعر</p>
          <p className="text-xl font-bold text-primary">50 ر.س</p>
        </div>
        <Link href="/registration">
          <Button 
            size="lg"
            className="bg-primary text-white px-8 shadow-lg"
            data-testid="button-book-now"
          >
            احجز الآن
          </Button>
        </Link>
      </div>
    </div>
  );
}
