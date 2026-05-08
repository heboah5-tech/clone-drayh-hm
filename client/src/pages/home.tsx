import { useState } from "react";
import { Menu, X, MapPin, Clock, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

import seasonImage from "@assets/8ae74984605c4076bfde52a6a35b8bca_1772291393428.webp";
import restaurantImage from "@assets/50241d7ddb7a4537801bdee04bd13d27_1772291393426.webp";
import exploreImage from "@assets/a49e06e53a5946eca35727c91bc458c8.webp";

const LOGO_URL =
  "https://assets-diriyah.diriyah.me/4388214a05a84e7c910b39d5b9067ef3?width=750&quality=80&transform=true&format=webp";

const HERO_IMAGE_URL =
  "https://assets-diriyah.diriyah.me/37694b856a414197ac77a4d1ea9ce588";

// Darker coral so white CTA text passes WCAG AA contrast (≥ 4.5:1 on accent).
const ACCENT = "#b85a2e";
const ACCENT_DARK = "#9b4a24";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-[#1a0a10]/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          data-testid="button-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white/80 p-1"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <img
          src={LOGO_URL}
          alt="الدرعية"
          className="h-10 object-contain"
          data-testid="img-logo"
        />
        <div className="w-7" />
      </div>

      {menuOpen && (
        <nav
          className="bg-[#4a1525] border-t border-white/10 px-5 py-3 space-y-1"
          data-testid="nav-mobile-menu"
        >
          {[
            { href: "#hero", label: "الرئيسية", id: "home" },
            { href: "#season", label: "موسم الدرعية", id: "season" },
            { href: "#restaurants", label: "المطاعم", id: "restaurants" },
            { href: "#explore", label: "استكشف", id: "explore" },
            { href: "#info", label: "معلومات", id: "info" },
          ].map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block text-white/80 text-sm py-2.5 border-b border-white/5 last:border-b-0"
              data-testid={`link-${item.id}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function HeroImage() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      data-testid="section-hero"
    >
      <div className="relative h-[260px] md:h-[360px] overflow-hidden">
        <img
          src={HERO_IMAGE_URL}
          alt="مطل البجيري"
          className="w-full h-full object-cover"
          data-testid="img-hero"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        <div
          className="absolute inset-0 flex flex-col items-center justify-end text-center px-6 pb-7"
          data-testid="hero-text-overlay"
        >
          <h1
            className="text-white text-2xl md:text-4xl font-bold leading-snug drop-shadow-lg"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
            data-testid="text-hero-title"
          >
            تعرّف على مطل البجيري
            <br />
            قبل زيارتك
          </h1>
        </div>
      </div>

      <SubNav />
    </section>
  );
}

function SubNav() {
  const items = [
    { href: "#hero", label: "الرئيسية" },
    { href: "#restaurants", label: "المطاعم" },
    { href: "#info", label: "إجابات شائعة" },
    { href: "#season", label: "أخبار" },
    { href: "#info", label: "اتصل بنا" },
  ];
  return (
    <nav
      className="bg-[#1a0a10] border-y border-white/5"
      data-testid="nav-sub"
    >
      <div className="flex items-center justify-center gap-4 px-3 py-2.5 overflow-x-auto">
        {items.map((it, i) => (
          <a
            key={i}
            href={it.href}
            className="shrink-0 text-white/70 hover:text-white text-[12px] whitespace-nowrap"
            data-testid={`link-sub-${i}`}
          >
            {it.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function FeaturedBadge({ label }: { label: string }) {
  return (
    <div className="flex justify-center mb-3">
      <span
        className="inline-block text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
        style={{ backgroundColor: ACCENT }}
        data-testid="badge-featured"
      >
        {label}
      </span>
    </div>
  );
}

function SeasonSection() {
  return (
    <section
      id="season"
      className="bg-[#f5efe6] pt-6 pb-3 px-4"
      data-testid="section-season"
    >
      <div className="max-w-md mx-auto">
        <FeaturedBadge label="مميز" />
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="relative h-44 overflow-hidden">
            <img
              src={seasonImage}
              alt="موسم الدرعية"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-5">
            <h3
              className="text-[#4a1525] font-bold text-lg mb-2"
              data-testid="text-season-title"
            >
              موسم الدرعية 26
            </h3>
            <p
              className="text-[#7a6b5f] text-[12px] leading-relaxed mb-5"
              data-testid="text-season-description"
            >
              يبدأ موسم الدرعية بفعاليات وتجارب ثرية تبدأ من أول فبراير وحتى آخر
              مارس
            </p>
            <Link
              href="/tickets"
              data-testid="button-season-tickets"
              className="block w-full text-center text-white text-sm py-3 rounded-xl font-semibold transition-colors"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  ACCENT_DARK)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  ACCENT)
              }
            >
              اعرف بالمزيد
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function RestaurantSection() {
  return (
    <section
      id="restaurants"
      className="bg-[#f5efe6] pt-3 pb-3 px-4"
      data-testid="section-restaurants"
    >
      <div className="max-w-md mx-auto">
        <h3
          className="text-center text-[#4a1525] text-lg font-bold mb-4"
          data-testid="text-restaurants-heading"
        >
          حجز مطاعم مطل البجيري
        </h3>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="relative h-44 overflow-hidden">
            <img
              src={restaurantImage}
              alt="مطاعم مطل البجيري"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-5">
            <p
              className="text-[#7a6b5f] text-[12px] leading-relaxed mb-4"
              data-testid="text-restaurant-desc"
            >
              أكثر من ١٥ مطعم عالمي وسعودي في قلب الدرعية التاريخية، احجز طاولتك
              واستمتع بتجربة طعام لا تُنسى.
            </p>
            <Link
              href="/restaurants"
              data-testid="button-book-restaurant"
              className="block w-full text-center text-white text-sm py-3 rounded-xl font-semibold transition-colors"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  ACCENT_DARK)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  ACCENT)
              }
            >
              احجز طاولتك
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExploreSection() {
  return (
    <section
      id="explore"
      className="relative py-10 px-4"
      data-testid="section-explore"
    >
      <div className="absolute inset-0">
        <img
          src={exploreImage}
          alt="استكشف الدرعية"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1a0a10]/85" />
      </div>

      <div className="relative z-10 max-w-md mx-auto text-center">
        <div className="mb-5 flex justify-center">
          <div className="px-8 py-3 border border-[#c9a96e]/40">
            <span
              className="text-[#c9a96e] text-xl font-bold tracking-[0.2em] block leading-tight"
              style={{ fontFamily: "serif" }}
              data-testid="text-bujairi-logo"
            >
              BUJAIRI
            </span>
            <span className="text-[#c9a96e]/60 text-[9px] tracking-[0.35em] block mt-1">
              TERRACE
            </span>
          </div>
        </div>

        <h3
          className="text-white text-lg font-bold mb-3"
          data-testid="text-explore-title"
        >
          استكشف الدرعية - تذكرة دخول
        </h3>
        <p
          className="text-white/70 text-[12px] mb-1"
          data-testid="text-explore-price"
        >
          سعر التذكرة 50 ريال للشخص يومياً
        </p>
        <p
          className="text-white/50 text-[11px] mb-5"
          data-testid="text-explore-note"
        >
          بعد الساعة 6 مساءً
        </p>

        <Link
          href="/tickets"
          data-testid="button-explore-details"
          className="inline-block text-white text-sm font-bold rounded-xl px-8 py-3 transition-colors"
          style={{ backgroundColor: ACCENT }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              ACCENT_DARK)
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              ACCENT)
          }
        >
          احجز تذكرتك الآن
        </Link>
      </div>
    </section>
  );
}

function LocationCard() {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm"
      data-testid="card-location"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
        <h3 className="text-[#4a1525] font-bold text-sm">الموقع</h3>
      </div>
      <p className="text-[#7a6b5f] text-[12px] leading-relaxed">
        حي البجيري، الدرعية
        <br />
        الرياض - المملكة العربية السعودية
      </p>
    </div>
  );
}

function ContactCard() {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm"
      data-testid="card-contact"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <Phone className="w-4 h-4" style={{ color: ACCENT }} />
        <h3 className="text-[#4a1525] font-bold text-sm">للتواصل</h3>
      </div>
      <p className="text-[#7a6b5f] text-[12px] leading-relaxed flex items-center gap-2 mb-1.5">
        <Phone className="w-3 h-3 text-[#a09488]" /> 920000810
      </p>
      <p className="text-[#7a6b5f] text-[12px] leading-relaxed flex items-center gap-2">
        <Mail className="w-3 h-3 text-[#a09488]" /> info@diriyah.sa
      </p>
    </div>
  );
}

function HoursCard() {
  const rows: [string, string][] = [
    ["السبت - الأربعاء", "4:00 PM - 12:00 AM"],
    ["الخميس", "4:00 PM - 1:00 AM"],
    ["الجمعة", "2:00 PM - 1:00 AM"],
  ];
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm"
      data-testid="card-hours"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <Clock className="w-4 h-4" style={{ color: ACCENT }} />
        <h3 className="text-[#4a1525] font-bold text-sm">ساعات العمل</h3>
      </div>
      <div className="space-y-2">
        {rows.map(([day, hours], i) => (
          <div
            key={i}
            className="flex justify-between items-center text-[12px]"
          >
            <span className="text-[#7a6b5f]">{day}</span>
            <span className="text-[#4a1525] font-medium" dir="ltr">
              {hours}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoSection() {
  return (
    <section
      id="info"
      className="bg-[#f5efe6] pt-6 pb-6 px-4 space-y-3"
      data-testid="section-info"
    >
      <div className="max-w-md mx-auto space-y-3">
        <LocationCard />
        <ContactCard />
        <HoursCard />
      </div>
    </section>
  );
}

function MapStrip() {
  return (
    <section
      className="relative h-40 bg-[#e2d5c3]"
      data-testid="section-map"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(0deg, transparent, transparent 19px, #c9b89e 19px, #c9b89e 20px),
            repeating-linear-gradient(90deg, transparent, transparent 19px, #c9b89e 19px, #c9b89e 20px)
          `,
          opacity: 0.2,
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
          style={{ backgroundColor: ACCENT }}
        >
          <MapPin className="w-5 h-5 text-white" fill="white" />
        </div>
        <div className="mt-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded shadow-sm">
          <p className="text-[#4a1525] font-bold text-[10px]">الدرعية</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#1a0a10] py-6 px-4" data-testid="section-footer">
      <div className="max-w-md mx-auto text-center">
        <img
          src={LOGO_URL}
          alt="الدرعية"
          className="h-8 object-contain mx-auto mb-3 opacity-90"
        />
        <p className="text-white/40 text-[10px]">
          © 2024 الدرعية. جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5efe6]" data-testid="page-home">
      <Header />
      <HeroImage />
      <SeasonSection />
      <RestaurantSection />
      <ExploreSection />
      <InfoSection />
      <MapStrip />
      <Footer />
    </div>
  );
}
