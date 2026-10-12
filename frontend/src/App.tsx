import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { AnimationsProvider } from './lib/animations';
import { PrivacyProvider } from './lib/privacy';
import { queryClient } from './lib/queryClient';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { AccountTypeGate } from './components/auth/AccountTypeGate';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorToast } from './components/ui/ErrorToast';
import { Sidebar } from './components/layout/Sidebar';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { LoginPage } from './pages/LoginPage';

const ChooseModePage = lazy(() => import('./pages/ChooseModePage').then((m) => ({ default: m.ChooseModePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const DebtsPage = lazy(() => import('./pages/DebtsPage').then((m) => ({ default: m.DebtsPage })));
const FixedExpensesPage = lazy(() => import('./pages/FixedExpensesPage').then((m) => ({ default: m.FixedExpensesPage })));
const GoalPage = lazy(() => import('./pages/GoalPage').then((m) => ({ default: m.GoalPage })));
const IncomePage = lazy(() => import('./pages/IncomePage').then((m) => ({ default: m.IncomePage })));
const OccasionalExpensesPage = lazy(() => import('./pages/OccasionalExpensesPage').then((m) => ({ default: m.OccasionalExpensesPage })));
const PeoplePage = lazy(() => import('./pages/PeoplePage').then((m) => ({ default: m.PeoplePage })));
const TimelinePage = lazy(() => import('./pages/TimelinePage').then((m) => ({ default: m.TimelinePage })));

const PageFallback = () => (
  <div className="flex min-h-dvh items-center justify-center">
    <span className="loading loading-spinner loading-lg text-primary" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/debts" element={<DebtsPage />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/fixed-expenses" element={<FixedExpensesPage />} />
        <Route path="/occasional-expenses" element={<OccasionalExpensesPage />} />
        <Route path="/goal" element={<GoalPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export const App = () => (
  <AnimationsProvider>
  <PrivacyProvider>
  <QueryClientProvider client={queryClient}>
    <Router>
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/choose-mode" element={<ChooseModePage />} />
          <Route element={<AccountTypeGate />}>
            <Route element={<Sidebar />}>
              <Route path="/*" element={<AnimatedRoutes />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </Router>
    <ErrorToast />
  </QueryClientProvider>
  </PrivacyProvider>
  </AnimationsProvider>
);
