import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import SignUp from "./pages/SignUp";
import Hostels from "./pages/Hostels";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerHostels from "./pages/OwnerHostels";
import OwnerRooms from "./pages/OwnerRooms";
import OwnerStudents from "./pages/OwnerStudents";
import OwnerPayments from "./pages/OwnerPayments";
import OwnerComplaints from "./pages/OwnerComplaints";
import OwnerNotices from "./pages/OwnerNotices";
import PaymentTracking from "./pages/PaymentTracking";
import StudentDashboard from "./pages/StudentDashboard";
import StudentComplaints from "./pages/StudentComplaints";
import StudentNotices from "./pages/StudentNotices";
import StudentRoom from "./pages/StudentRoom";
import StudentProfile from "./pages/StudentProfile";
import RateHostel from "./pages/RateHostel";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/hostels" element={<Hostels />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* Owner routes */}
          <Route path="/owner" element={<ProtectedRoute allowedRole="owner"><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/owner/hostels" element={<ProtectedRoute allowedRole="owner"><OwnerHostels /></ProtectedRoute>} />
          <Route path="/owner/rooms" element={<ProtectedRoute allowedRole="owner"><OwnerRooms /></ProtectedRoute>} />
          <Route path="/owner/students" element={<ProtectedRoute allowedRole="owner"><OwnerStudents /></ProtectedRoute>} />
          <Route path="/owner/payments" element={<ProtectedRoute allowedRole="owner"><OwnerPayments /></ProtectedRoute>} />
          <Route path="/owner/complaints" element={<ProtectedRoute allowedRole="owner"><OwnerComplaints /></ProtectedRoute>} />
          <Route path="/owner/notices" element={<ProtectedRoute allowedRole="owner"><OwnerNotices /></ProtectedRoute>} />
          {/* Student routes */}
          <Route path="/student" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/room" element={<ProtectedRoute allowedRole="student"><StudentRoom /></ProtectedRoute>} />
          <Route path="/student/complaints" element={<ProtectedRoute allowedRole="student"><StudentComplaints /></ProtectedRoute>} />
          <Route path="/student/notices" element={<ProtectedRoute allowedRole="student"><StudentNotices /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRole="student"><StudentProfile /></ProtectedRoute>} />
          <Route path="/student/rate" element={<ProtectedRoute allowedRole="student"><RateHostel /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute allowedRole="student"><PaymentTracking /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
