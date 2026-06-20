import { motion } from 'framer-motion';
import { CreditCard, LayoutDashboard, ListChecks, Receipt, Target, TrendingUp, Wallet } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS: { to: string; label: string; Icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/timeline', label: 'Timeline', Icon: TrendingUp },
  { to: '/debts', label: 'Debts', Icon: CreditCard },
  { to: '/income', label: 'Income', Icon: Wallet },
  { to: '/fixed-expenses', label: 'Fixed Expenses', Icon: ListChecks },
  { to: '/occasional-expenses', label: 'Occasional', Icon: Receipt },
  { to: '/goal', label: 'Goal', Icon: Target },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-base-100 overflow-hidden">
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 400, damping: 36 }}
        className="flex flex-col border-r border-base-300 bg-base-200 overflow-hidden shrink-0"
      >
        <div className="flex items-center gap-3 px-3 py-5 border-b border-base-300">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setCollapsed((c) => !c)}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-content font-bold text-sm shrink-0"
          >
            LO
          </motion.button>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-semibold text-base-content whitespace-nowrap"
            >
              Loan Over
            </motion.span>
          )}
        </div>

        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap
                ${isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-base-content/60 hover:text-base-content hover:bg-base-300'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-base-300">
          <ThemeToggle collapsed={collapsed} />
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
