import { Check, Minus } from 'lucide-react';
import { ENTITLEMENTS, INCLUDED, NOT_INCLUDED, PRO_PRICE_LABEL } from '../../lib/billing';
import type { LandingPalette } from '../../lib/brand';

interface Props {
  palette: LandingPalette;
  href: string;
}

const Mark = ({ value, palette }: { value: string; palette: LandingPalette }) =>
  value === NOT_INCLUDED
    ? <Minus size={14} aria-label="Não incluído" style={{ color: palette.inkMuted }} />
    : <Check size={14} aria-label="Incluído" style={{ color: palette.accent }} />;

const PlanCard = ({ name, price, tier, highlight, palette, href }: {
  name: string;
  price: string;
  tier: 'free' | 'pro';
  highlight: boolean;
  palette: LandingPalette;
  href: string;
}) => (
  <div
    className="rounded-2xl p-6 flex flex-col gap-5"
    style={{
      background: palette.surface,
      border: `${highlight ? 2 : 1}px solid ${highlight ? palette.accent : palette.line}`,
    }}
  >
    <div>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: palette.accent }}>{name}</h3>
      <p className="text-3xl font-extrabold mt-2" style={{ color: palette.ink }}>{price}</p>
    </div>
    <ul className="flex flex-col gap-3 flex-1">
      {ENTITLEMENTS.map((e) => (
        <li key={e.feature} className="flex items-center gap-2.5 text-sm" style={{ color: palette.ink }}>
          <Mark value={e[tier]} palette={palette} />
          {e.feature}{e[tier] !== INCLUDED && e[tier] !== NOT_INCLUDED && `: ${e[tier]}`}
        </li>
      ))}
    </ul>
    <a
      href={href}
      className="rounded-full px-6 py-3 text-center font-semibold text-sm transition-transform hover:scale-[1.02]"
      style={highlight
        ? { background: palette.accent, color: 'white' }
        : { border: `1px solid ${palette.line}`, color: palette.ink }}
    >
      {highlight ? 'Começar com o Pro' : 'Começar grátis'}
    </a>
  </div>
);

export const PricingSection = ({ palette, href }: Props) => (
  <section className="relative" style={{ borderBottom: `1px solid ${palette.line}` }}>
    <div
      className="relative max-w-5xl mx-auto px-6 lg:px-12 py-24"
      style={{ borderLeft: `1px solid ${palette.line}`, borderRight: `1px solid ${palette.line}` }}
    >
      <div className="text-center mb-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: palette.accent }}>
          {'// planos'}
        </p>
        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: palette.ink }}>
          Comece grátis, evolua quando precisar
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <PlanCard name="Free" price="R$ 0" tier="free" highlight={false} palette={palette} href={href} />
        <PlanCard name="Pro" price={PRO_PRICE_LABEL} tier="pro" highlight palette={palette} href={href} />
      </div>
    </div>
  </section>
);
