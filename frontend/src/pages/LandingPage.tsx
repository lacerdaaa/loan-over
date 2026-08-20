import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  BarChart2,
  CalendarClock,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BlueprintGrid } from '../components/ui/BlueprintGrid';
import { isAuthenticated } from '../lib/auth';
import { PALETTES, type LandingMode, type LandingPalette } from '../lib/brand';

const API_URL = import.meta.env.VITE_API_URL as string;
const AUTH_URL = `${API_URL}/auth/google`;
const WAITLIST_URL =
  'mailto:edulacerdaaa@gmail.com?subject=' +
  encodeURIComponent('LoanOver Business — lista de espera');

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const modeFromSearch = (search: string): LandingMode =>
  new URLSearchParams(search).get('mode') === 'business' ? 'business' : 'personal';

const DotTexture = ({ palette }: { palette: LandingPalette }) => (
  <div
    className="absolute inset-0 pointer-events-none"
    aria-hidden
    style={{
      backgroundImage: `radial-gradient(${palette.accent} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      opacity: 0.13,
    }}
  />
);

const Kicker = ({ children, palette }: { children: string; palette: LandingPalette }) => (
  <p
    className="font-mono text-[11px] uppercase tracking-[0.2em] mb-3"
    style={{ color: palette.accent }}
  >
    {'// '}{children}
  </p>
);

interface ChipProps {
  label: string;
  className: string;
  rotate: number;
  delay: number;
  palette: LandingPalette;
}

const FloatingChip = ({ label, className, rotate, delay, palette }: ChipProps) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay, ease: EASE }}
    className={`absolute hidden lg:flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-sm ${className}`}
    style={{ rotate, border: `1px solid ${palette.line}`, color: palette.ink, background: palette.surface }}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.accent }} />
    {label}
  </motion.span>
);

interface FeatureData {
  n: string;
  title: string;
  desc: string;
  delay: number;
}

interface FeatureRowProps extends FeatureData {
  palette: LandingPalette;
}

const FeatureRow = ({ n, title, desc, delay, palette }: FeatureRowProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className="grid grid-cols-[40px_1fr] md:grid-cols-[40px_1fr_1fr] items-baseline gap-x-8 py-7 border-t"
      style={{ borderColor: palette.line }}
    >
      <span className="font-mono text-[11px] tracking-widest" style={{ color: palette.accent }}>{n}</span>
      <h3 className="font-semibold text-[15px]" style={{ color: palette.ink }}>{title}</h3>
      <p
        className="text-sm leading-relaxed mt-2 md:mt-0 col-start-2 md:col-start-auto"
        style={{ color: palette.inkMuted }}
      >
        {desc}
      </p>
    </motion.div>
  );
};

interface StepData {
  n: string;
  title: string;
  desc: string;
  delay: number;
}

interface StepProps extends StepData {
  palette: LandingPalette;
}

const Step = ({ n, title, desc, delay, palette }: StepProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className="flex flex-col gap-4"
    >
      <span
        className="font-mono text-sm w-10 h-10 rounded-full flex items-center justify-center"
        style={{ color: palette.accent, border: `1.5px solid ${palette.line}` }}
      >
        {n}
      </span>
      <div>
        <h3 className="font-semibold" style={{ color: palette.ink }}>{title}</h3>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: palette.inkMuted }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
};

interface CTAData {
  heading: string;
  sub: string;
  button: string;
}

interface CTASectionProps {
  palette: LandingPalette;
  content: CTAData;
  href: string;
}

const CTASection = ({ palette, content, href }: CTASectionProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section
      ref={ref}
      className="relative px-6 py-28 text-center"
      style={{ background: palette.hero, transition: 'background 0.4s' }}
    >
      <BlueprintGrid />
      <motion.div
        key={content.heading}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="relative max-w-2xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
            {content.heading}
          </h2>
          <p className="text-white/75 mt-4 text-lg leading-relaxed">{content.sub}</p>
          <a
            href={href}
            className="inline-flex items-center gap-2 mt-9 rounded-full bg-white px-8 py-4 font-semibold shadow-xl transition-transform hover:scale-[1.03]"
            style={{ color: palette.deep }}
          >
            {content.button} <ArrowRight size={18} />
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};

interface HeroStat {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface HeroCTA {
  badge: string;
  title: string;
  sub: string;
}

interface ChipData {
  label: string;
  className: string;
  rotate: number;
  delay: number;
}

interface LandingContent {
  navbarLabel: string;
  badge: string;
  h1: string;
  heroParagraph: React.ReactNode;
  heroCTA: HeroCTA;
  heroStats: HeroStat[];
  chips: ChipData[];
  featuresKicker: string;
  featuresHeading: string;
  featuresSub: string;
  features: FeatureData[];
  stepsKicker: string;
  stepsHeading: string;
  steps: StepData[];
  cta: CTAData;
  footerTagline: string;
}

const CONTENT: Record<LandingMode, LandingContent> = {
  personal: {
    navbarLabel: 'projeção financeira pessoal',
    badge: 'projeção financeira pessoal',
    h1: 'Descubra quando você fica livre das dívidas',
    heroParagraph: (
      <>
        Projete seu fluxo de caixa por <strong className="text-white">24 meses</strong>, veja
        exatamente quando cada parcela acaba e quanto dinheiro é liberado todo mês.
      </>
    ),
    heroCTA: {
      badge: '→ começar',
      title: 'Monte sua primeira projeção: renda, gastos e dívidas',
      sub: 'Leva menos de 5 minutos — e você sai sabendo exatamente quando fica livre.',
    },
    heroStats: [
      { icon: CalendarClock, value: '24', label: 'meses projetados' },
      { icon: CreditCard, value: 'Real', label: 'saldo devedor com juros' },
      { icon: BarChart2, value: 'Mês a mês', label: 'data de quitação por dívida' },
    ],
    chips: [
      { label: 'Tabela Price', className: 'left-4 top-24', rotate: -6, delay: 0.1 },
      { label: 'Meta de poupança', className: 'right-8 top-16', rotate: 5, delay: 0.2 },
      { label: 'Juros compostos', className: 'left-10 top-52', rotate: 4, delay: 0.3 },
      { label: '24 meses', className: 'right-4 top-48', rotate: -4, delay: 0.4 },
    ],
    featuresKicker: 'funcionalidades',
    featuresHeading: 'Tudo que você precisa para sair das dívidas',
    featuresSub:
      'Não é só uma planilha. É um motor de simulação que calcula o caminho mais rápido para a liberdade financeira.',
    features: [
      {
        n: '01',
        title: 'Saldo devedor real',
        desc: 'Suporte a Tabela Price e juros compostos. Veja o quanto você ainda deve de verdade — não só o número de parcelas restantes.',
        delay: 0,
      },
      {
        n: '02',
        title: 'Projeção de 24 meses',
        desc: 'Simule seu fluxo de caixa mês a mês. Veja quando o saldo livre começa a crescer de verdade.',
        delay: 0.06,
      },
      {
        n: '03',
        title: 'Eventos de liberação',
        desc: 'Saiba exatamente em qual mês cada dívida acaba e quanto dinheiro volta para o seu orçamento — automaticamente.',
        delay: 0.12,
      },
      {
        n: '04',
        title: 'Meta de poupança',
        desc: 'Defina um valor e um prazo. Veja o aporte mensal necessário e se a projeção atual te leva lá.',
        delay: 0.18,
      },
    ],
    stepsKicker: 'como funciona',
    stepsHeading: 'Três passos para clareza total',
    steps: [
      {
        n: '01',
        title: 'Cadastre sua renda',
        desc: 'Salário fixo, renda variável, deduções como INSS e IRRF. O app calcula o que de fato sobra no seu bolso antes de qualquer conta chegar.',
        delay: 0,
      },
      {
        n: '02',
        title: 'Registre suas dívidas',
        desc: 'Parcelas, taxa de juros, data de início. O sistema usa juros compostos para mostrar o saldo devedor real — não só quantas parcelas ainda faltam.',
        delay: 0.12,
      },
      {
        n: '03',
        title: 'Saiba exatamente quando você fica livre',
        desc: 'Veja uma projeção de 24 meses, mês a mês. Descubra em qual data cada dívida termina e quanto dinheiro é liberado para o seu orçamento a cada quitação.',
        delay: 0.24,
      },
    ],
    cta: {
      heading: 'Chega de não saber quando você fica no azul.',
      sub: 'Comece agora e veja a projeção completa em minutos.',
      button: 'Começar gratuitamente',
    },
    footerTagline: 'projeção financeira pessoal.',
  },
  business: {
    navbarLabel: 'gestão de caixa para empresas',
    badge: 'gestão de caixa para empresas',
    h1: 'Saiba quantos meses de caixa sua empresa tem',
    heroParagraph: (
      <>
        Projete receitas, folha e financiamentos por{' '}
        <strong className="text-white">24 meses</strong>. Veja quando cada parcela acaba e quanto
        caixa volta para a operação.
      </>
    ),
    heroCTA: {
      badge: '→ lista de espera',
      title: 'Entre na lista de espera do LoanOver Business',
      sub: 'Runway em tempo real, projeção de caixa e fim de financiamentos para a sua empresa.',
    },
    heroStats: [
      { icon: CalendarClock, value: 'Runway', label: 'meses de caixa à vista' },
      { icon: CreditCard, value: 'Real', label: 'custo dos financiamentos' },
      { icon: BarChart2, value: 'Mês a mês', label: 'projeção de caixa' },
    ],
    chips: [
      { label: 'Runway', className: 'left-4 top-24', rotate: -6, delay: 0.1 },
      { label: 'Folha de pagamento', className: 'right-8 top-16', rotate: 5, delay: 0.2 },
      { label: 'Financiamentos', className: 'left-10 top-52', rotate: 4, delay: 0.3 },
      { label: 'Cenários', className: 'right-4 top-48', rotate: -4, delay: 0.4 },
    ],
    featuresKicker: 'funcionalidades',
    featuresHeading: 'Clareza de caixa para a sua operação',
    featuresSub:
      'O mesmo motor de projeção, aplicado a receitas, folha e financiamentos. Veja quantos meses de caixa a empresa tem.',
    features: [
      {
        n: '01',
        title: 'Runway em tempo real',
        desc: 'Saiba quantos meses de caixa sua empresa tem no ritmo de gasto atual. Antecipe o aperto antes que ele chegue.',
        delay: 0,
      },
      {
        n: '02',
        title: 'Projeção de caixa 24 meses',
        desc: 'Simule receitas, folha e custos fixos mês a mês. Veja a linha do tempo completa do seu caixa.',
        delay: 0.06,
      },
      {
        n: '03',
        title: 'Fim de financiamentos',
        desc: 'Saiba em qual mês cada financiamento acaba e quanto caixa volta para a operação a cada quitação.',
        delay: 0.12,
      },
      {
        n: '04',
        title: 'Cenários de receita',
        desc: 'Rode a projeção em cenários pessimista, base e otimista. Entenda o impacto de cada aposta no caixa.',
        delay: 0.18,
      },
    ],
    stepsKicker: 'como funciona',
    stepsHeading: 'Três passos para enxergar o caixa',
    steps: [
      {
        n: '01',
        title: 'Cadastre receitas e contratos',
        desc: 'Contratos recorrentes, vendas pontuais e deduções de impostos. O app calcula o que de fato entra no caixa.',
        delay: 0,
      },
      {
        n: '02',
        title: 'Registre custos e financiamentos',
        desc: 'Folha, pró-labore, aluguel, software e financiamentos. Veja o custo real de cada parcela ao longo do tempo.',
        delay: 0.12,
      },
      {
        n: '03',
        title: 'Veja o runway e quando o caixa respira',
        desc: 'Uma projeção de 24 meses, mês a mês. Descubra quantos meses de caixa a empresa tem e quando cada financiamento libera dinheiro para a operação.',
        delay: 0.24,
      },
    ],
    cta: {
      heading: 'Chega de descobrir o buraco no caixa no fim do mês.',
      sub: 'Entre na lista de espera e seja o primeiro a projetar o caixa da sua empresa.',
      button: 'Entrar na lista de espera',
    },
    footerTagline: 'gestão de caixa para empresas.',
  },
};

interface ModeToggleProps {
  mode: LandingMode;
  onChange: (mode: LandingMode) => void;
}

const MODE_SEGMENTS: { mode: LandingMode; label: string }[] = [
  { mode: 'personal', label: 'Pessoal' },
  { mode: 'business', label: 'Empresas' },
];

const ModeToggle = ({ mode, onChange }: ModeToggleProps) => (
  <div
    className="flex items-center rounded-full p-0.5"
    style={{ border: '1px solid rgba(255,255,255,0.35)' }}
  >
    {MODE_SEGMENTS.map((segment) => (
      <button
        key={segment.mode}
        type="button"
        onClick={() => onChange(segment.mode)}
        className={`font-mono text-[11px] uppercase tracking-[0.15em] text-white rounded-full px-3 py-1.5 transition-colors ${
          mode === segment.mode ? 'bg-white/15' : 'hover:bg-white/10'
        }`}
      >
        {segment.label}
      </button>
    ))}
  </div>
);

export const LandingPage = () => {
  const [mode, setMode] = useState<LandingMode>(() => modeFromSearch(window.location.search));

  if (isAuthenticated()) return <Navigate to="/dashboard" replace />;

  const palette = PALETTES[mode];
  const content = CONTENT[mode];
  const heroHref = mode === 'business' ? WAITLIST_URL : AUTH_URL;

  const changeMode = (next: LandingMode) => {
    setMode(next);
    const url = next === 'business' ? '?mode=business' : window.location.pathname;
    window.history.replaceState(null, '', url);
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: palette.bg, transition: 'background 0.4s' }}
    >

      {/* Floating navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="fixed top-4 inset-x-4 z-50"
      >
        <div
          className="max-w-5xl mx-auto flex items-center justify-between rounded-2xl px-4 py-2.5 backdrop-blur-lg shadow-lg"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <span className="font-mono font-bold text-white tracking-tight">// loan over</span>
          <ModeToggle mode={mode} onChange={changeMode} />
          <a
            href={AUTH_URL}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-white rounded-full px-4 py-2 transition-colors hover:bg-white/15"
            style={{ border: '1px solid rgba(255,255,255,0.35)' }}
          >
            entrar
          </a>
        </div>
      </motion.nav>

      {/* Hero — saturated palette, blueprint grid */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20"
        style={{ background: palette.hero, transition: 'background 0.4s' }}
      >
        <BlueprintGrid />

        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="relative flex flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-white rounded-full px-4 py-2 mb-8"
            style={{ border: '1px solid rgba(255,255,255,0.35)' }}
          >
            {content.badge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight max-w-4xl"
          >
            {content.h1}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: EASE }}
            className="mt-6 text-white/80 text-lg max-w-xl leading-relaxed"
          >
            {content.heroParagraph}
          </motion.p>

          {/* CTA card */}
          <motion.a
            href={heroHref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42, ease: EASE }}
            whileHover={{ scale: 1.015 }}
            className="mt-10 w-full max-w-xl rounded-2xl p-5 flex items-center gap-4 text-left shadow-2xl"
            style={{ background: palette.deep, border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span
              className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.15em] text-white/50 rounded px-2 py-1 shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {content.heroCTA.badge}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{content.heroCTA.title}</p>
              <p className="text-white/50 text-xs mt-0.5">{content.heroCTA.sub}</p>
            </div>
            <span
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0"
              style={{ color: palette.deep }}
            >
              <ArrowRight size={16} />
            </span>
          </motion.a>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="mt-14 flex flex-wrap justify-center gap-x-12 gap-y-6"
          >
            {content.heroStats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-white">
                <Icon size={16} className="text-white/60" />
                <span className="text-lg font-extrabold tabular-nums">{value}</span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-white/55">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features — framed light zone with dot texture and floating chips */}
      <section className="relative" style={{ borderBottom: `1px solid ${palette.line}` }}>
        <DotTexture palette={palette} />
        <div
          className="relative max-w-5xl mx-auto px-6 lg:px-12 py-24"
          style={{ borderLeft: `1px solid ${palette.line}`, borderRight: `1px solid ${palette.line}` }}
        >
          {content.chips.map((chip) => (
            <FloatingChip key={chip.label} {...chip} palette={palette} />
          ))}

          <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: EASE }}>
            <div className="text-center mb-14">
              <Kicker palette={palette}>{content.featuresKicker}</Kicker>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: EASE }}
                className="text-3xl lg:text-4xl font-extrabold tracking-tight"
                style={{ color: palette.ink }}
              >
                {content.featuresHeading}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
                className="mt-3 max-w-lg mx-auto text-sm leading-relaxed"
                style={{ color: palette.inkMuted }}
              >
                {content.featuresSub}
              </motion.p>
            </div>

            <div className="border-b" style={{ borderColor: palette.line }}>
              {content.features.map((f) => <FeatureRow key={f.n} {...f} palette={palette} />)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative" style={{ borderBottom: `1px solid ${palette.line}` }}>
        <div
          className="relative max-w-5xl mx-auto px-6 lg:px-12 py-24"
          style={{ borderLeft: `1px solid ${palette.line}`, borderRight: `1px solid ${palette.line}` }}
        >
          <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: EASE }}>
            <div className="text-center mb-14">
              <Kicker palette={palette}>{content.stepsKicker}</Kicker>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: EASE }}
                className="text-3xl lg:text-4xl font-extrabold tracking-tight"
                style={{ color: palette.ink }}
              >
                {content.stepsHeading}
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {content.steps.map((s) => <Step key={s.n} {...s} palette={palette} />)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <CTASection palette={palette} content={content.cta} href={heroHref} />

      {/* Footer */}
      <footer
        className="px-6 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50"
        style={{ background: palette.deep, transition: 'background 0.4s' }}
      >
        <span className="font-mono font-bold tracking-tight">// loan over</span>
        <span className="font-mono text-[10px] uppercase tracking-wider">
          © {new Date().getFullYear()} — {content.footerTagline}
        </span>
      </footer>
    </div>
  );
};
