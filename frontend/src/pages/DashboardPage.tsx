import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebts } from '../api/debts';
import { useSnapshot } from '../api/snapshot';
import { StatCard } from '../components/ui/StatCard';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';
import { monthLabel } from '../lib/monthLabel';

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

const addMonths = (month: number, year: number, delta: number) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};

const payoffMonth = (startDate: string, total: number) => {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + total);
  return monthLabel(d.getMonth() + 1, d.getFullYear());
};

export const DashboardPage = () => {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);

  const snapshot = useSnapshot(month, year);
  const debts = useDebts();
  const openDebts = debts.data?.filter((d) => !d.closed) ?? [];
  const snap = snapshot.data;

  const navigate = (delta: number) => {
    const next = addMonths(month, year, delta);
    setMonth(next.month);
    setYear(next.year);
  };

  const isCurrentMonth = month === CURRENT_MONTH && year === CURRENT_YEAR;

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-base-content">{monthLabel(month, year)}</h1>
            <p className="text-base-content/50 text-sm mt-0.5">Monthly overview</p>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.93 }}
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} />
            </motion.button>
            {!isCurrentMonth && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.93 }}
                className="btn btn-ghost btn-xs text-primary px-2"
                onClick={() => { setMonth(CURRENT_MONTH); setYear(CURRENT_YEAR); }}
              >
                Today
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.93 }}
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => navigate(1)}
            >
              <ArrowRight size={16} />
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {snap ? (
            <>
              <StatCard label="Total Income" value={snap.total_income} delay={0} />
              <StatCard
                label="Total Outflow"
                value={snap.total_debts + snap.total_fixed + (snap.total_occasional ?? 0)}
                delay={0.07}
              />
              <StatCard
                label="Free Balance"
                value={snap.free_balance}
                variant={snap.free_balance >= 0 ? 'positive' : 'negative'}
                delay={0.14}
              />
            </>
          ) : (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card bg-base-200 border border-base-300 p-6 h-24 animate-pulse" />
            ))
          )}
        </div>

        {snap && ((snap.total_occasional ?? 0) > 0 || (snap.total_debt_balance ?? 0) > 0 || (snap.total_benefit ?? 0) > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(snap.total_benefit ?? 0) > 0 && (
              <Link to="/income" className="card bg-base-200 border border-base-300 p-4 hover:border-warning/40 transition-colors">
                <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Benefits (restricted)</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(snap.total_benefit)}</p>
              </Link>
            )}
            {(snap.total_occasional ?? 0) > 0 && (
              <Link to="/occasional-expenses" className="card bg-base-200 border border-base-300 p-4 hover:border-error/40 transition-colors">
                <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Occasional this month</p>
                <p className="text-xl font-bold text-error">{formatCurrency(snap.total_occasional)}</p>
              </Link>
            )}
            {(snap.total_debt_balance ?? 0) > 0 && (
              <Link to="/debts" className="card bg-base-200 border border-base-300 p-4 hover:border-error/40 transition-colors">
                <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Total debt remaining</p>
                <p className="text-xl font-bold text-error">{formatCurrency(snap.total_debt_balance)}</p>
              </Link>
            )}
          </div>
        )}

        <div className="card bg-base-200 border border-base-300 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-base-content">Open Debts</h2>
            <Link to="/debts" className="text-primary text-sm hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>

          {openDebts.length === 0 && (
            <p className="text-base-content/50 text-sm flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> No open debts</p>
          )}

          <div className="flex flex-col gap-3">
            {openDebts.map((debt, i) => (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3"
              >
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-base-content">{debt.name}</span>
                    <span className="text-base-content/50">
                      {formatCurrency(debt.installment_amount)}/mo · payoff {payoffMonth(debt.start_date, debt.total_installments)}
                    </span>
                  </div>
                  <progress
                    className="progress progress-primary w-full h-1.5"
                    value={debt.paid_installments}
                    max={debt.total_installments}
                  />
                </div>
                <span className="badge badge-ghost text-xs shrink-0">
                  {debt.total_installments - debt.paid_installments} left
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <Link to="/timeline">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="card bg-primary/5 border border-primary/20 p-4 flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="font-semibold text-primary">View 24-month projection</p>
              <p className="text-sm text-base-content/50">See when each debt closes and your balance grows</p>
            </div>
            <ArrowRight size={20} className="text-primary" />
          </motion.div>
        </Link>
      </div>
    </PageTransition>
  );
};
