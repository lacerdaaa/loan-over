import { motion } from 'framer-motion';
import { AlertTriangle, PartyPopper } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../../lib/formatCurrency';
import { monthLabel } from '../../lib/monthLabel';
import { usePrivacy } from '../../lib/privacy';
import type { ProjectedMonth } from '../../types/api';

interface Props {
  data: ProjectedMonth[];
}

interface TooltipPayload {
  payload: ProjectedMonth;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  const { mask } = usePrivacy();
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold mb-1">{monthLabel(d.month, d.year)}</p>
      <p className="text-base-content/70">Saldo livre: <span className="font-medium text-base-content">{mask(formatCurrency(d.free_balance))}</span></p>
      {d.events.map((e, i) => (
        <p key={i} className={`flex items-center gap-1 mt-1 ${e.type === 'liberation' ? 'text-success font-medium' : 'text-warning'}`}>
          {e.type === 'liberation' ? <PartyPopper size={13} /> : <AlertTriangle size={13} />} {e.description}
        </p>
      ))}
    </div>
  );
};

const barColor = (value: number) => (value >= 0 ? '#10b981' : '#ef4444');

export const ProjectionChart = ({ data }: Props) => {
  const { hidden } = usePrivacy();
  const nextLiberation = data.find((m) => m.events.some((e) => e.type === 'liberation'));

  return (
    <div className="flex flex-col gap-4">
      {nextLiberation && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="alert bg-success/10 border border-success/30 text-success text-sm"
        >
          <PartyPopper size={15} className="shrink-0" /> Próxima liberação: <strong>{monthLabel(nextLiberation.month, nextLiberation.year)}</strong>
          {' — '}{nextLiberation.events.find((e) => e.type === 'liberation')?.description}
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <div style={{ minWidth: data.length * 48 }}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" vertical={false} />
              <XAxis
                dataKey={(d: ProjectedMonth) => monthLabel(d.month, d.year)}
                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => hidden ? '•••' : `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16,185,129,0.06)' }} />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 2" />
              <Bar dataKey="free_balance" radius={[4, 4, 0, 0]} label={false}>
                {data.map((d, i) => (
                  <Cell key={i} fill={barColor(d.free_balance)} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
