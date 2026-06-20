import { motion } from 'framer-motion';
import { AlertTriangle, Zap } from 'lucide-react';
import { useProjection } from '../api/projection';
import { PageTransition } from '../components/ui/PageTransition';
import { ProjectionChart } from '../components/ui/ProjectionChart';
import { useAnimations } from '../lib/animations';
import { formatCurrency } from '../lib/formatCurrency';
import { monthLabel } from '../lib/monthLabel';
import { usePrivacy } from '../lib/privacy';
import type { ProjectedMonth } from '../types/api';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();

const MonthGroup = ({ m, index }: { m: ProjectedMonth; index: number }) => {
  const { mask } = usePrivacy();
  const { enabled: animated } = useAnimations();

  const alerts = m.events.filter((e) => e.type === 'alert');
  const liberations = m.events.filter((e) => e.type === 'liberation');

  return (
    <motion.div
      initial={{ opacity: 0, y: animated ? 10 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animated ? 0.2 : 0, delay: animated ? index * 0.05 : 0 }}
      className="flex flex-col gap-2"
    >
      {/* Month header */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-base-content/50 uppercase tracking-widest whitespace-nowrap">
          {monthLabel(m.month, m.year)}
        </span>
        <div className="flex-1 h-px bg-base-300" />
        <span className="text-xs text-base-content/30 tabular-nums whitespace-nowrap">
          {mask(formatCurrency(m.free_balance))} livre
        </span>
      </div>

      {/* Events */}
      <div className="flex flex-col gap-1.5 pl-1">
        {alerts.map((e, i) => (
          <div key={`a-${i}`} className="flex items-start gap-2.5">
            <div className="mt-0.5 w-5 h-5 rounded-md bg-warning/15 flex items-center justify-center shrink-0">
              <AlertTriangle size={11} className="text-warning" />
            </div>
            <p className="text-sm text-base-content/70">{e.description}</p>
          </div>
        ))}
        {liberations.map((e, i) => (
          <div key={`l-${i}`} className="flex items-start gap-2.5">
            <div className="mt-0.5 w-5 h-5 rounded-md bg-success/15 flex items-center justify-center shrink-0">
              <Zap size={11} className="text-success" />
            </div>
            <div className="flex flex-1 items-baseline justify-between gap-2 min-w-0">
              <p className="text-sm text-base-content/80">{e.description}</p>
              {e.amount > 0 && (
                <span className="text-xs font-semibold text-success tabular-nums shrink-0">
                  +{mask(formatCurrency(e.amount))}/mês
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const TimelinePage = () => {
  const { data, isLoading } = useProjection(MONTH, YEAR, 24);
  const months = data?.filter((m) => m.events.length > 0) ?? [];

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Projeção 24 meses</h1>
          <p className="text-base-content/50 text-sm mt-0.5">Fluxo de caixa futuro com base nas dívidas e renda atuais</p>
        </div>

        <div className="card bg-base-200 border border-base-300 p-5">
          {isLoading
            ? <div className="h-64 animate-pulse bg-base-300 rounded-lg" />
            : data
              ? <ProjectionChart data={data} />
              : null
          }
        </div>

        {months.length > 0 && (
          <div className="card bg-base-200 border border-base-300 p-5 flex flex-col gap-5">
            <h2 className="text-sm font-semibold text-base-content">Marcos</h2>
            {months.map((m, i) => (
              <MonthGroup key={`${m.year}-${m.month}`} m={m} index={i} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};
