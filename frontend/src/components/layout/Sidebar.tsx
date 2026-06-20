import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, LayoutDashboard, ListChecks, LogOut, Menu, Receipt, Target, TrendingUp, Wallet, X } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMe } from '../../api/auth';
import { clearToken } from '../../lib/auth';
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

const NavItems = ({ collapsed, onNavClick }: { collapsed?: boolean; onNavClick?: () => void }) => (
  <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
    {NAV_ITEMS.map(({ to, label, Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={onNavClick}
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
);

const UserFooter = ({ collapsed }: { collapsed?: boolean }) => {
  const { data: me } = useMe();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login', { replace: true });
  };

  return (
    <div className="p-2 border-t border-base-300 flex flex-col gap-1">
      <ThemeToggle collapsed={collapsed ?? false} />

      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
        <div className="avatar shrink-0">
          <div className="w-7 rounded-full">
            {me?.avatar
              ? <img src={me.avatar} alt={me.name ?? 'user'} referrerPolicy="no-referrer" />
              : <div className="bg-primary text-primary-content flex items-center justify-center text-xs font-bold w-full h-full rounded-full">
                  {me?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
          </div>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-base-content truncate">{me?.name ?? '—'}</p>
            <p className="text-xs text-base-content/40 truncate">{me?.email ?? ''}</p>
          </div>
        )}
        {!collapsed && (
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-base-100 overflow-hidden">

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 400, damping: 36 }}
        className="hidden md:flex flex-col border-r border-base-300 bg-base-200 overflow-hidden shrink-0"
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

        <NavItems collapsed={collapsed} />

        <UserFooter collapsed={collapsed} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-base-200 border-r border-base-300 md:hidden"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            >
              <div className="flex items-center justify-between px-4 py-5 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-content font-bold text-sm shrink-0">
                    LO
                  </div>
                  <span className="font-semibold text-base-content">Loan Over</span>
                </div>
                <button className="btn btn-ghost btn-sm btn-square" onClick={() => setMobileOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <NavItems onNavClick={() => setMobileOpen(false)} />

              <UserFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-base-300 bg-base-200 shrink-0">
          <button className="btn btn-ghost btn-sm btn-square" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="font-semibold text-base-content">Loan Over</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
