import { useEffect } from "react";
import { useMutation } from "convex/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { api } from "../../convex/_generated/api";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { initGoogleAnalytics, trackPageView } from "./lib/analytics";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ReceiptPage from "./pages/ReceiptPage";
import ThankYouPage from "./pages/ThankYouPage";
import AdminPage from "./pages/AdminPage";
import AccountPage from "./pages/AccountPage";
import AuthPage from "./pages/AuthPage";
import BrawlStarsBoostingPage from "./pages/BrawlStarsBoostingPage";
import ChatPage from "./pages/ChatPage";
import AdminSupportPage from "./pages/AdminSupportPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminOrderFulfillmentPage from "./pages/AdminOrderFulfillmentPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PublicChatWidget from "./components/PublicChatWidget";

function GoogleAnalytics() {
  const [location] = useLocation();

  useEffect(() => {
    initGoogleAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(`${location}${window.location.search}${window.location.hash}`);
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/brawl-stars-boosting" component={BrawlStarsBoostingPage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout/:id" component={CheckoutPage} />
      <Route path="/thank-you/:id" component={ThankYouPage} />
      <Route path="/receipt/:id" component={ReceiptPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/orders" component={AdminOrdersPage} />
      <Route path="/admin/orders/:id/fulfill" component={AdminOrderFulfillmentPage} />
      <Route path="/admin/support" component={AdminSupportPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const ensureDefaultCategories = useMutation(api.store.ensureDefaultCategories);

  useEffect(() => {
    void ensureDefaultCategories();
  }, [ensureDefaultCategories]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <GoogleAnalytics />
          <div className="min-h-screen flex flex-col bg-background" dir="rtl">
            <Navbar />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
            <PublicChatWidget />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
