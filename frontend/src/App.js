import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PWAPrompt from "./components/PWAPrompt";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import "leaflet/dist/leaflet.css";
import "./App.css";

// Pages critiques (chargées immédiatement)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

// Pages non-critiques (chargées à la demande)
const MusicianDashboard = lazy(() => import("./pages/MusicianDashboard"));
const VenueDashboard = lazy(() => import("./pages/VenueDashboard"));
const MelomaneDashboard = lazy(() => import("./pages/MelomaneDashboard"));
const VenueDetail = lazy(() => import("./pages/VenueDetail"));
const MusicianDetail = lazy(() => import("./pages/MusicianDetail"));
const MelomaneDetail = lazy(() => import("./pages/MelomaneDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const MessagesImproved = lazy(() => import("./pages/MessagesImproved"));
const FAQ = lazy(() => import("./pages/FAQ"));
const VenueRegister = lazy(() => import("./pages/VenueRegister"));
const MusicianRegister = lazy(() => import("./pages/MusicianRegister"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Tarifs = lazy(() => import("./pages/Tarifs"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const TrialExpired = lazy(() => import("./pages/TrialExpired"));
const CGU = lazy(() => import("./pages/CGU"));
const CGV = lazy(() => import("./pages/CGV"));
const MapExplorer = lazy(() => import("./pages/MapExplorer"));
const BadgesPage = lazy(() => import("./pages/BadgesPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground animate-pulse">Chargement...</p>
    </div>
  </div>
);

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
    return <Navigate to={user.role === "musician" ? "/musician" : user.role === "venue" ? "/venue" : "/melomane"} replace />;
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
    return <Navigate to={user.role === "musician" ? "/musician" : user.role === "venue" ? "/venue" : "/melomane"} replace />;
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
        <PWAPrompt />
        <PushNotificationPrompt />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/tarifs" element={<Tarifs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/venue/:id" element={<VenueDetail />} />
            <Route path="/musician/:id" element={<MusicianDetail />} />
            <Route path="/melomane/:id" element={<MelomaneDetail />} />
            <Route path="/map" element={<MapExplorer />} />
            <Route path="/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
            <Route path="/notification-settings" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
            <Route path="/cgu" element={<CGU />} />
            <Route path="/cgv" element={<CGV />} />
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
            path="/melomane" 
            element={
              <ProtectedRoute allowedRole="melomane">
                <MelomaneDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trial-expired" 
            element={
              <ProtectedRoute allowedRole="venue">
                <TrialExpired />
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
          <Route 
            path="/payment/cancel" 
            element={
              <ProtectedRoute allowedRole="venue">
                <PaymentCancel />
              </ProtectedRoute>
            } 
          />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages-improved" element={<ProtectedRoute><MessagesImproved /></ProtectedRoute>} />
          <Route path="/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/venue-register" element={<VenueRegister />} />
          <Route path="/musician-register" element={<MusicianRegister />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
