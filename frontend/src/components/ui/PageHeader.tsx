import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export const PageHeader = ({ title, subtitle, action }: Props) => (
  <div className="flex justify-between items-start gap-3">
    <div>
      <h1 className="text-2xl font-bold text-base-content">{title}</h1>
      {subtitle && <div className="text-base-content/50 text-sm mt-0.5">{subtitle}</div>}
    </div>
    {action}
  </div>
);
