import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ClerkProvider, SignIn, SignUp, useSession, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setClerkTokenProvider } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import Home from "./pages/Home";
import CreatePlan from "./pages/CreatePlan";
import PlanPresentation from "./pages/PlanPresentation";
import MenteeView from "./pages/MenteeView";
import MyPlan from "./pages/MyPlan";
import NotFound from "./pages/NotFound";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Synchronizes Clerk JWT into the Supabase client on every session change
function ClerkTokenSync() {
  const { session } = useSession();

  useEffect(() => {
    setClerkTokenProvider(async () => {
      if (!session) return null;
      return session.getToken({ template: "supabase" });
    });
  }, [session]);

  return null;
}

// Redirects mentees to /my-plan and admins to / after sign-in
function RoleRedirect() {
  const { isMentee, isLoading } = useUserRole();
  if (isLoading) return null;
  return <Navigate to={isMentee ? "/my-plan" : "/"} replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <ClerkTokenSync />
      <Routes>
        {/* Public routes */}
        <Route path="/mentee/:token" element={<MenteeView />} />

        {/* Auth routes (only when signed out) */}
        <Route
          path="/sign-in/*"
          element={
            <SignedOut>
              <div className="min-h-screen gradient-dark-bg flex items-center justify-center p-6">
                <SignIn routing="path" path="/sign-in" afterSignInUrl="/auth-redirect" />
              </div>
            </SignedOut>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <SignedOut>
              <div className="min-h-screen gradient-dark-bg flex items-center justify-center p-6">
                <SignUp routing="path" path="/sign-up" afterSignUpUrl="/auth-redirect" />
              </div>
            </SignedOut>
          }
        />

        {/* Role-based redirect after auth */}
        <Route
          path="/auth-redirect"
          element={
            <SignedIn>
              <RoleRedirect />
            </SignedIn>
          }
        />

        {/* Legacy /auth route — redirect to sign-in */}
        <Route path="/auth" element={<Navigate to="/sign-in" replace />} />
        <Route path="/change-password" element={<Navigate to="/" replace />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <>
              <SignedIn><Home /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          }
        />
        <Route
          path="/create"
          element={
            <>
              <SignedIn><CreatePlan /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          }
        />
        <Route
          path="/plan/:id"
          element={
            <>
              <SignedIn><PlanPresentation /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          }
        />
        <Route
          path="/my-plan"
          element={
            <>
              <SignedIn><MyPlan /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/sign-in">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
