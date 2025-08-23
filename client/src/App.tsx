import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePageTransition } from "@/hooks/usePageTransition";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { TelegramProvider } from "@/hooks/use-telegram";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AuthScreen } from "@/components/auth-screen";
import Home from "@/pages/home";
import Raffles from "@/pages/raffles";
import Profile from "@/pages/profile";
import UserMainPage from "@/pages/user-main";
import EnhancedUserMainPage from "@/pages/enhanced-user-main";
import UserTabsMainPage from "@/pages/user-tabs-main";
import AdminPanelEnhanced from "@/pages/admin-panel-enhanced";

import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { transitionClass } = usePageTransition();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram-button mx-auto mb-4"></div>
          <p className="text-telegram-hint">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Role-based routing
  const userRole = user?.userType || "regular";
  const adminLevel = user?.adminLevel || 1;

  return (
    <>
      <Header />
      <main className={`main-content ${transitionClass}`}>
        <Switch>
          {userRole === "bot_admin" ? (
            // All admin levels (0, 1, 2) - Admin panel
            <>
              <Route path="/" component={AdminPanelEnhanced} />
              <Route path="/admin" component={AdminPanelEnhanced} />
              <Route path="/profile" component={Profile} />
            </>
          ) : (
            // Regular users
            <>
              <Route path="/" component={UserTabsMainPage} />
              <Route path="/raffles" component={UserTabsMainPage} />
              <Route path="/profile" component={Profile} />
              <Route path="/history" component={Profile} />
            </>
          )}
          {/* Fallback 404 route - only shows for invalid URLs */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="app-container bg-telegram-bg">
              <Router />
              <Toaster />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </TelegramProvider>
    </QueryClientProvider>
  );
}

export default App;
