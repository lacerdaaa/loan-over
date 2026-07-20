import type { ReactNode } from 'react';

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="form-control">
    <span className="label-text text-xs mb-1">{label}</span>
    {children}
  </label>
);
