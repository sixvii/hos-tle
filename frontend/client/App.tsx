import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getStoredSession } from "@/lib/api";
import Index from "./pages/Index";
import FindHostel from "./pages/FindHostel";
import HostelDetails from "./pages/HostelDetails";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import StudentPortal from "./pages/StudentPortal";
import OwnerPortal from "./pages/OwnerPortal";
import PublicPage from "./pages/PublicPage";
import BookingCheckout from "./pages/BookingCheckout";
import BookingDetails from "./pages/BookingDetails";
import AddProperty from "./pages/AddProperty";
import StudentOperations from "./pages/StudentOperations";
import StudentApplication from "./pages/StudentApplication";
import OwnerApplications from "./pages/OwnerApplications";
import UniversityPortal from "./pages/UniversityPortal";
import AdminPortal from "./pages/AdminPortal";
import AdminLogin from "./pages/AdminLogin";
import ChangePassword from "./pages/ChangePassword";
import PasswordRecovery from "./pages/PasswordRecovery";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function OwnerOnly({ children }: { children: ReactNode }) {
  const session = getStoredSession();
  return session?.user.role === "owner" ? children : <Navigate to="/login" replace />;
}

function Authenticated({ children, roles }: { children: ReactNode; roles?: Array<"student" | "owner" | "university" | "admin" | "superadmin"> }) {
  const session = getStoredSession();
  return session && (!roles || roles.includes(session.user.role)) ? children : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/find-a-hostel" element={<FindHostel />} />
          <Route path="/universities" element={<PublicPage />} />
          <Route path="/university" element={<Authenticated roles={["university"]}><UniversityPortal /></Authenticated>} />
          <Route path="/university/*" element={<Authenticated roles={["university"]}><UniversityPortal /></Authenticated>} />
          <Route path="/admin" element={<Authenticated roles={["admin", "superadmin"]}><AdminPortal /></Authenticated>} />
          <Route path="/admin/*" element={<Authenticated roles={["admin", "superadmin"]}><AdminPortal /></Authenticated>} />
          <Route path="/how-it-works" element={<PublicPage />} />
          <Route path="/about" element={<PublicPage />} />
          <Route path="/safety" element={<PublicPage />} />
          <Route path="/help" element={<PublicPage />} />
          <Route path="/contact" element={<PublicPage />} />
          <Route path="/faq" element={<PublicPage />} />
          <Route path="/terms" element={<PublicPage />} />
          <Route path="/privacy" element={<PublicPage />} />
          <Route path="/hostels/:id" element={<HostelDetails />} />
          <Route path="/booking/checkout" element={<Authenticated roles={["student"]}><BookingCheckout /></Authenticated>} />
          <Route path="/student/bookings/:id" element={<Authenticated roles={["student"]}><BookingDetails /></Authenticated>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/forgot-password" element={<PasswordRecovery />} />
          <Route path="/reset-password" element={<PasswordRecovery />} />
          <Route path="/admin/change-password" element={<Authenticated roles={["admin", "superadmin"]}><ChangePassword /></Authenticated>} />
          <Route path="/dashboard" element={<Authenticated roles={["student"]}><Dashboard /></Authenticated>} />
          <Route path="/owner/dashboard" element={<OwnerOnly><OwnerPortal /></OwnerOnly>} />
          <Route path="/owner/properties/new" element={<OwnerOnly><AddProperty /></OwnerOnly>} />
          <Route path="/owner/applications/:id" element={<OwnerOnly><OwnerApplications /></OwnerOnly>} />
          <Route path="/owner/applications" element={<OwnerOnly><OwnerApplications /></OwnerOnly>} />
          <Route path="/student/applications/new" element={<Authenticated roles={["student"]}><StudentApplication /></Authenticated>} />
          <Route path="/student/applications/:id" element={<Authenticated roles={["student"]}><StudentApplication /></Authenticated>} />
          <Route path="/student/applications" element={<Authenticated roles={["student"]}><StudentOperations /></Authenticated>} />
          <Route path="/student/payments" element={<Authenticated roles={["student"]}><StudentOperations /></Authenticated>} />
          <Route path="/student/messages" element={<Authenticated roles={["student"]}><StudentOperations /></Authenticated>} />
          <Route path="/student/notifications" element={<Authenticated roles={["student"]}><StudentOperations /></Authenticated>} />
          <Route path="/student/profile" element={<Authenticated roles={["student"]}><StudentOperations /></Authenticated>} />
          <Route path="/student/maintenance" element={<Authenticated roles={["student"]}><StudentOperations /></Authenticated>} />
          <Route path="/student/*" element={<Authenticated roles={["student"]}><StudentPortal /></Authenticated>} />
          <Route path="/owner/*" element={<OwnerOnly><OwnerPortal /></OwnerOnly>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
