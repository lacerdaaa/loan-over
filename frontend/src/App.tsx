import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { DebtsPage } from './pages/DebtsPage';
import { FixedExpensesPage } from './pages/FixedExpensesPage';
import { GoalPage } from './pages/GoalPage';
import { IncomePage } from './pages/IncomePage';
import { TimelinePage } from './pages/TimelinePage';

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/debts" element={<DebtsPage />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/fixed-expenses" element={<FixedExpensesPage />} />
        <Route path="/goal" element={<GoalPage />} />
      </Routes>
    </AnimatePresence>
  );
};

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <Routes>
        <Route element={<Sidebar />}>
          <Route path="/*" element={<AnimatedRoutes />} />
        </Route>
      </Routes>
    </Router>
  </QueryClientProvider>
);
