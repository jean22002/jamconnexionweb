import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import MusicianDashboard from "./pages/MusicianDashboard";
import VenueDashboard from "./pages/VenueDashboard";
import VenueDetail from "./pages/VenueDetail";
import MusicianDetail from "./pages/MusicianDetail";
import Messages from "./pages/Messages";
import MessagesImproved from "./pages/MessagesImproved";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import "./App.css";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === "musician" ? "/musician" : "/venue"} replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to={user.role === "musician" ? "/musician" : "/venue"} replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          toastOptions={{
            className: "glassmorphism text-foreground",
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/venue/:id" element={<VenueDetail />} />
          <Route path="/musician/:id" element={<MusicianDetail />} />
          <Route 
            path="/musician" 
            element={
              <ProtectedRoute allowedRole="musician">
                <MusicianDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/venue" 
            element={
              <ProtectedRoute allowedRole="venue">
                <VenueDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment/success" 
            element={
              <ProtectedRoute allowedRole="venue">
                <PaymentSuccess />
              </ProtectedRoute>
            } 
          />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
