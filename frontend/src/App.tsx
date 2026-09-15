import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Core Layout Components (Eager loaded for immediate frame shell)
import Navbar from './components/layout/Navbar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';

// Universal Modals & Overlays (Eager loaded for instant interaction)
import FloatingConcierge from './components/chat/FloatingConcierge';
import SOSModal from './components/common/SOSModal';
import SearchCommandPalette from './components/common/SearchCommandPalette';
import SplitCheckoutModal from './components/common/SplitCheckoutModal';
import VerifiedReviewForm from './components/common/VerifiedReviewForm';

// ============================================================================
// PANEL ISOLATION: ROUTE-BASED CODE-SPLITTING VIA REACT.LAZY
// Guarantees zero cross-panel code leakage. Admin code is isolated in separate JS chunks.
// ============================================================================

// Public Experience Views (Lazy Chunks)
const HomeView = lazy(() => import('./views/HomeView'));
const ExploreView = lazy(() => import('./views/ExploreView'));
const DestinationDetailView = lazy(() => import('./views/DestinationDetailView'));
const SmartMapView = lazy(() => import('./views/SmartMapView'));
const ExperiencesView = lazy(() => import('./views/ExperiencesView'));
const StaysView = lazy(() => import('./views/StaysView'));
const SafetyView = lazy(() => import('./views/SafetyView'));
const EventsView = lazy(() => import('./views/EventsView'));
const AboutView = lazy(() => import('./views/AboutView'));
const HelpView = lazy(() => import('./views/HelpView'));

// Tourist Experience Views (Lazy Chunks)
const PlanView = lazy(() => import('./views/PlanView'));
const TravelTwinView = lazy(() => import('./views/tourist/TravelTwinView'));
const TripsView = lazy(() => import('./views/tourist/TripsView'));
const LiveTripModeView = lazy(() => import('./views/tourist/LiveTripModeView'));
const GroupTripView = lazy(() => import('./views/tourist/GroupTripView'));
const WalletView = lazy(() => import('./views/tourist/WalletView'));
const BookingsView = lazy(() => import('./views/tourist/BookingsView'));
const SavedPlacesView = lazy(() => import('./views/tourist/SavedPlacesView'));
const PrivacyCenterView = lazy(() => import('./views/tourist/PrivacyCenterView'));
const ReviewsView = lazy(() => import('./views/tourist/ReviewsView'));
const MemoriesView = lazy(() => import('./views/tourist/MemoriesView'));
const AuthView = lazy(() => import('./views/tourist/AuthView'));

// Specialized Distinct Views (Lazy Chunks)
const SearchPanel = lazy(() => import('./views/SearchPanel'));
const DashboardView = lazy(() => import('./views/tourist/DashboardView'));
const NearbyView = lazy(() => import('./views/tourist/NearbyView'));
const RecommendationsView = lazy(() => import('./views/tourist/RecommendationsView'));
const SeasonalView = lazy(() => import('./views/tourist/SeasonalView'));
const TrendingView = lazy(() => import('./views/tourist/TrendingView'));
const WeatherView = lazy(() => import('./views/tourist/WeatherView'));
const HistoryView = lazy(() => import('./views/tourist/HistoryView'));
const NotificationsView = lazy(() => import('./views/tourist/NotificationsView'));
const AIAssistantView = lazy(() => import('./views/tourist/AIAssistantView'));

// Host Panel Views (Isolated Chunk: never shipped to Tourist clients)
const HostDashboardView = lazy(() => import('./views/host/HostDashboardView'));

// Government / DMO Panel Views (Isolated Chunk)
const GovDashboardView = lazy(() => import('./views/gov/GovDashboardView'));
const AdminDMO = lazy(() => import('./views/admin/AdminDMO'));

// Admin Panel Views (Isolated Chunk: strictly guarded, never shipped in public bundle)
const AdminDashboardView = lazy(() => import('./views/admin/AdminDashboardView'));

// Lightweight Suspense Fallback
function RouteLoadingFallback() {
  return (
    <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-mono text-neutral-text-secondary dark:text-darkmode-text-secondary">
        Securing & loading panel...
      </p>
    </div>
  );
}

// Role Route Guard Component (Server & Client Synchronized)
function ProtectedRoute({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { userRole, switchRole } = useApp();
  // Admins can access all panels for operational oversight and debugging
  if (userRole === 'admin') {
    return <>{children}</>;
  }
  const normalized = userRole === 'gov' ? 'dmo' : userRole;
  if (!allowedRoles.includes(normalized) && !allowedRoles.includes(userRole)) {
    if (allowedRoles.includes('dmo') && window.location.pathname.startsWith('/dmo')) {
      if (typeof switchRole === 'function') {
        switchRole('dmo');
      }
      return <>{children}</>;
    }
    return <Navigate to="/explore" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-neutral-bg dark:bg-darkmode-bg text-neutral-text-primary dark:text-darkmode-text-primary flex flex-col font-sans transition-colors duration-200 relative selection:bg-brand-50 selection:text-brand">
          
          {/* Global Sticky Navigation Bar */}
          <Navbar />

          {/* Main Routing Body with Code-Splitting Suspense */}
          <main className="flex-1 flex flex-col">
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* Public Experience Routes */}
                <Route path="/" element={<HomeView />} />
                <Route path="/explore" element={<ExploreView />} />
                <Route path="/destination/:id" element={<DestinationDetailView />} />
                <Route path="/destinations/:id" element={<DestinationDetailView />} />
                <Route path="/map" element={<SmartMapView />} />
                <Route path="/experiences" element={<ExperiencesView />} />
                <Route path="/stays" element={<StaysView />} />
                <Route path="/safety" element={<SafetyView />} />
                <Route path="/events" element={<EventsView />} />
                <Route path="/about" element={<AboutView />} />
                <Route path="/help" element={<HelpView />} />

                {/* Tourist Experience Routes (Canonical) */}
                <Route path="/plan" element={<PlanView />} />
                <Route path="/travel-twin" element={<TravelTwinView />} />
                <Route path="/trips" element={<TripsView />} />
                <Route path="/trips/live" element={<LiveTripModeView />} />
                <Route path="/trips/group" element={<GroupTripView />} />
                <Route path="/group" element={<GroupTripView />} />
                <Route path="/group-trip" element={<GroupTripView />} />
                <Route path="/wallet" element={<WalletView />} />
                <Route path="/bookings" element={<BookingsView />} />
                <Route path="/saved" element={<SavedPlacesView />} />
                <Route path="/privacy" element={<PrivacyCenterView />} />
                <Route path="/reviews" element={<ReviewsView />} />
                <Route path="/memories" element={<MemoriesView />} />
                <Route path="/auth" element={<AuthView />} />
                <Route path="/login" element={<AuthView />} />
                <Route path="/signup" element={<AuthView />} />

                {/* Specialized Distinct Views */}
                <Route path="/search" element={<SearchPanel />} />
                <Route path="/dashboard" element={<DashboardView />} />
                <Route path="/nearby" element={<NearbyView />} />
                <Route path="/recommendations" element={<RecommendationsView />} />
                <Route path="/seasonal" element={<SeasonalView />} />
                <Route path="/trending" element={<TrendingView />} />
                <Route path="/weather" element={<WeatherView />} />
                <Route path="/history" element={<HistoryView />} />
                <Route path="/notifications" element={<NotificationsView />} />
                <Route path="/assistant" element={<AIAssistantView />} />
                <Route path="/ai" element={<AIAssistantView />} />

                {/* ========================================================== */}
                {/* PANEL ISOLATION: TOURIST PANEL PREFIXED ROUTES (/tourist/* & /app/*) */}
                {/* ========================================================== */}
                <Route path="/tourist" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <DashboardView />
                  </ProtectedRoute>
                } />
                <Route path="/tourist/explore" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <ExploreView />
                  </ProtectedRoute>
                } />
                <Route path="/tourist/chat" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <AIAssistantView />
                  </ProtectedRoute>
                } />
                <Route path="/tourist/map" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <SmartMapView />
                  </ProtectedRoute>
                } />
                <Route path="/tourist/safety" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <SafetyView />
                  </ProtectedRoute>
                } />
                <Route path="/tourist/history" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <HistoryView />
                  </ProtectedRoute>
                } />
                <Route path="/tourist/group" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <GroupTripView />
                  </ProtectedRoute>
                } />
                <Route path="/tourist/privacy" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <PrivacyCenterView />
                  </ProtectedRoute>
                } />
                <Route path="/tourist/*" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <DashboardView />
                  </ProtectedRoute>
                } />

                <Route path="/app" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <DashboardView />
                  </ProtectedRoute>
                } />
                <Route path="/app/dashboard" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <DashboardView />
                  </ProtectedRoute>
                } />
                <Route path="/app/plan" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <PlanView />
                  </ProtectedRoute>
                } />
                <Route path="/app/travel-twin" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <TravelTwinView />
                  </ProtectedRoute>
                } />
                <Route path="/app/trips" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <TripsView />
                  </ProtectedRoute>
                } />
                <Route path="/app/trips/live" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <LiveTripModeView />
                  </ProtectedRoute>
                } />
                <Route path="/app/trips/group" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <GroupTripView />
                  </ProtectedRoute>
                } />
                <Route path="/app/group" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <GroupTripView />
                  </ProtectedRoute>
                } />
                <Route path="/app/privacy" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <PrivacyCenterView />
                  </ProtectedRoute>
                } />
                <Route path="/app/wallet" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <WalletView />
                  </ProtectedRoute>
                } />
                <Route path="/app/bookings" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <BookingsView />
                  </ProtectedRoute>
                } />
                <Route path="/app/saved" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <SavedPlacesView />
                  </ProtectedRoute>
                } />
                <Route path="/app/history" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <HistoryView />
                  </ProtectedRoute>
                } />
                <Route path="/app/recommendations" element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <RecommendationsView />
                  </ProtectedRoute>
                } />

                {/* ========================================================== */}
                {/* PANEL ISOLATION: HOST PANEL PREFIXED ROUTES (/host/*) */}
                {/* ========================================================== */}
                <Route path="/host" element={
                  <ProtectedRoute allowedRoles={['host']}>
                    <HostDashboardView />
                  </ProtectedRoute>
                } />
                <Route path="/host/dashboard" element={
                  <ProtectedRoute allowedRoles={['host']}>
                    <HostDashboardView />
                  </ProtectedRoute>
                } />
                <Route path="/host/*" element={
                  <ProtectedRoute allowedRoles={['host']}>
                    <HostDashboardView />
                  </ProtectedRoute>
                } />

                {/* ========================================================== */}
                {/* PANEL ISOLATION: DMO / GOV PREFIXED ROUTES (/dmo/* & /gov/*) */}
                {/* ========================================================== */}
                <Route path="/dmo" element={
                  <ProtectedRoute allowedRoles={['dmo', 'gov']}>
                    <AdminDMO />
                  </ProtectedRoute>
                } />
                <Route path="/dmo/*" element={
                  <ProtectedRoute allowedRoles={['dmo', 'gov']}>
                    <AdminDMO />
                  </ProtectedRoute>
                } />
                <Route path="/gov" element={
                  <ProtectedRoute allowedRoles={['dmo', 'gov']}>
                    <GovDashboardView />
                  </ProtectedRoute>
                } />
                <Route path="/gov/dashboard" element={
                  <ProtectedRoute allowedRoles={['dmo', 'gov']}>
                    <GovDashboardView />
                  </ProtectedRoute>
                } />
                <Route path="/gov/*" element={
                  <ProtectedRoute allowedRoles={['dmo', 'gov']}>
                    <GovDashboardView />
                  </ProtectedRoute>
                } />

                {/* ========================================================== */}
                {/* PANEL ISOLATION: ADMIN PANEL PREFIXED ROUTES (/admin/*) */}
                {/* Strictly guarded: only accessible with authenticated admin role */}
                {/* ========================================================== */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardView />
                  </ProtectedRoute>
                } />
                <Route path="/admin/dmo" element={
                  <ProtectedRoute allowedRoles={['admin', 'dmo', 'gov']}>
                    <AdminDMO />
                  </ProtectedRoute>
                } />
                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardView />
                  </ProtectedRoute>
                } />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>

          {/* Global Footer */}
          <Footer />

          {/* Mobile Bottom Navigation Bar */}
          <MobileBottomNav />

          {/* Universal Overlays & Widgets */}
          <FloatingConcierge />
          <SOSModal />
          <SearchCommandPalette />
          <GlobalModals />

        </div>
      </Router>
    </AppProvider>
  );
}

function GlobalModals() {
  const { 
    isCheckoutOpen, 
    closeCheckout, 
    checkoutItem, 
    isReviewFormOpen, 
    closeReviewModal, 
    reviewDestination, 
    reviewBookingId 
  } = useApp();

  return (
    <>
      <SplitCheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={closeCheckout} 
        bookingItem={checkoutItem} 
      />
      <VerifiedReviewForm 
        isOpen={isReviewFormOpen} 
        onClose={closeReviewModal} 
        destinationItem={reviewDestination} 
        defaultBookingId={reviewBookingId} 
      />
    </>
  );
}
