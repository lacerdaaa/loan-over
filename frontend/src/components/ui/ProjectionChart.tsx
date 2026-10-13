import { motion } from 'framer-motion';
import { AlertTriangle, Gift, PartyPopper } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EventText } from './EventText';
import { formatAxisCurrency } from '../../lib/chartFormat';
import { formatCurrency } from '../../lib/formatCurrency';
import { monthLabel } from '../../lib/monthLabel';
import { usePrivacy } from '../../lib/privacy';
import type { ProjectedMonth, ProjectionEvent } from '../../types/api';

type ProjectionEventType = ProjectionEvent['type'];

interface Props {
  data: ProjectedMonth[];
}

interface TooltipPayload {
  payload: ProjectedMonth;
}

const EVENT_STYLE = {
  liberation: { Icon: PartyPopper, className: 'text-success font-medium' },
  alert: { Icon: AlertTriangle, className: 'text-warning' },
  payroll: { Icon: Gift, className: 'text-info' },
} as const;

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  const { mask } = usePrivacy();
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold mb-1">{monthLabel(d.month, d.year)}</p>
      <p className="text-base-content/70">Saldo livre: <span className="font-medium text-base-content">{mask(formatCurrency(d.free_balance))}</span></p>
      <p className="text-base-content/70">Saldo acumulado: <span className="font-medium text-base-content">{mask(formatCurrency(d.cumulative_balance))}</span></p>
      {d.events.map((e, i) => {
        const { Icon, className } = EVENT_STYLE[e.type];
        return (
          <p key={i} className={`flex items-center gap-1 mt-1 ${className}`}>
            <Icon size={13} className="shrink-0" /> <span><EventText event={e} /></span>
          </p>
        );
      })}
    </div>
  );
};

const LEFT_AXIS = 'left';
const RIGHT_AXIS = 'right';
const CHART_HEIGHT = 280;
const PX_PER_MONTH = 48;
const BADGE_RADIUS = 5;

const monthKey = (d: ProjectedMonth) => monthLabel(d.month, d.year);
const hasEvent = (d: ProjectedMonth, type: ProjectionEventType) => d.events.some((e) => e.type === type);

const barColor = (value: number) =>
  value >= 0 ? 'var(--color-primary)' : 'var(--color-error)';

export const ProjectionChart = ({ data }: Props) => {
  const { hidden } = usePrivacy();
  const nextLiberation = data.find((m) => m.events.some((e) => e.type === 'liberation'));
  const nextLiberationEvent = nextLiberation?.events.find((e) => e.type === 'liberation');

  return (
    <div className="flex flex-col gap-4">
      {nextLiberation && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="alert bg-success/10 border border-success/30 text-success text-sm"
        >
          <PartyPopper size={15} className="shrink-0" /> Próxima liberação: <strong>{monthLabel(nextLiberation.month, nextLiberation.year)}</strong>
          {' — '}{nextLiberationEvent && <EventText event={nextLiberationEvent} />}
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <div style={{ minWidth: data.length * PX_PER_MONTH }}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" vertical={false} />
              <XAxis
                dataKey={monthKey}
                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId={LEFT_AXIS}
                tickFormatter={(v: number) => hidden ? '•••' : formatAxisCurrency(v)}
                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <YAxis
                yAxisId={RIGHT_AXIS}
                orientation="right"
                tickFormatter={(v: number) => hidden ? '•••' : formatAxisCurrency(v)}
                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'var(--color-primary)', fillOpacity: 0.06 }}
              />
              <ReferenceLine
                yAxisId={LEFT_AXIS}
                y={0}
                stroke="var(--color-base-content)"
                strokeOpacity={0.4}
                strokeDasharray="4 2"
              />
              {data.filter((d) => hasEvent(d, 'liberation')).map((d) => (
                <ReferenceLine
                  key={`lib-${monthKey(d)}`}
                  yAxisId={LEFT_AXIS}
                  x={monthKey(d)}
                  stroke="var(--color-success)"
                  strokeWidth={2}
                  strokeOpacity={0.7}
                />
              ))}
              <Bar yAxisId={LEFT_AXIS} dataKey="free_balance" name="Saldo livre" radius={[4, 4, 0, 0]} label={false}>
                {data.map((d, i) => (
                  <Cell key={i} fill={barColor(d.free_balance)} />
                ))}
              </Bar>
              <Line
                yAxisId={RIGHT_AXIS}
                type="monotone"
                dataKey="cumulative_balance"
                name="Saldo acumulado"
                stroke="var(--color-secondary)"
                strokeWidth={2}
                dot={false}
              />
              {data.filter((d) => hasEvent(d, 'alert')).map((d) => (
                <ReferenceDot
                  key={`alert-${monthKey(d)}`}
                  yAxisId={LEFT_AXIS}
                  x={monthKey(d)}
                  y={d.free_balance}
                  r={BADGE_RADIUS}
                  fill="var(--color-warning)"
                  stroke="var(--color-base-100)"
                  ifOverflow="extendDomain"
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
