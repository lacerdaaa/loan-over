import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatAxisCurrency } from '../../lib/chartFormat';
import { formatCurrency } from '../../lib/formatCurrency';
import { monthLabel } from '../../lib/monthLabel';
import { usePrivacy } from '../../lib/privacy';
import type { ChartRow } from '../../lib/simulator';

const LEFT_AXIS = 'left';
const RIGHT_AXIS = 'right';
const CHART_HEIGHT = 300;
const PX_PER_MONTH = 48;

const rowLabel = (row: ChartRow) => monthLabel(row.month, row.year);

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  const { mask } = usePrivacy();
  if (!active || !payload?.length) return null;
  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-base-content/70">
          <span style={{ color: entry.color }}>{entry.name}</span>:{' '}
          <span className="font-medium text-base-content">{mask(formatCurrency(entry.value))}</span>
        </p>
      ))}
    </div>
  );
};

export const SimulatorChart = ({ rows }: { rows: ChartRow[] }) => {
  const { hidden } = usePrivacy();
  const formatTick = (v: number) => (hidden ? '•••' : formatAxisCurrency(v));
  const tick = { fontSize: 11, fill: 'currentColor', opacity: 0.5 };

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: rows.length * PX_PER_MONTH }}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" vertical={false} />
            <XAxis dataKey={rowLabel} tick={tick} tickLine={false} axisLine={false} />
            <YAxis yAxisId={LEFT_AXIS} tickFormatter={formatTick} tick={tick} tickLine={false} axisLine={false} width={64} />
            <YAxis yAxisId={RIGHT_AXIS} orientation="right" tickFormatter={formatTick} tick={tick} tickLine={false} axisLine={false} width={64} />
            <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine yAxisId={LEFT_AXIS} y={0} stroke="var(--color-base-content)" strokeOpacity={0.4} strokeDasharray="4 2" />
            <Line yAxisId={LEFT_AXIS} type="monotone" dataKey="baseline_free" name="Saldo livre (base)" stroke="var(--color-base-content)" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="5 3" dot={false} />
            <Line yAxisId={LEFT_AXIS} type="monotone" dataKey="scenario_free" name="Saldo livre (cenário)" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            <Line yAxisId={RIGHT_AXIS} type="monotone" dataKey="baseline_cumulative" name="Acumulado (base)" stroke="var(--color-secondary)" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="5 3" dot={false} />
            <Line yAxisId={RIGHT_AXIS} type="monotone" dataKey="scenario_cumulative" name="Acumulado (cenário)" stroke="var(--color-secondary)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
