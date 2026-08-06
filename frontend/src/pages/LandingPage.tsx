import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  BarChart2,
  CalendarClock,
  CreditCard,
} from 'lucide-react';
import { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { BlueprintGrid } from '../components/ui/BlueprintGrid';
import { isAuthenticated } from '../lib/auth';
import { CREAM, GREEN, GREEN_DEEP, INK, INK_MUTED, LINE } from '../lib/brand';

const API_URL = import.meta.env.VITE_API_URL as string;
const AUTH_URL = `${API_URL}/auth/google`;

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const DotTexture = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    aria-hidden
    style={{
      backgroundImage: `radial-gradient(${GREEN} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      opacity: 0.13,
    }}
  />
);

const Kicker = ({ children }: { children: string }) => (
  <p
    className="font-mono text-[11px] uppercase tracking-[0.2em] mb-3"
    style={{ color: GREEN }}
  >
    {'// '}{children}
  </p>
);

interface ChipProps {
  label: string;
  className: string;
  rotate: number;
  delay: number;
}

const FloatingChip = ({ label, className, rotate, delay }: ChipProps) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay, ease: EASE }}
    className={`absolute hidden lg:flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium shadow-sm ${className}`}
    style={{ rotate, border: `1px solid ${LINE}`, color: INK }}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
    {label}
  </motion.span>
);

interface FeatureRowProps {
  n: string;
  title: string;
  desc: string;
  delay: number;
}

const FeatureRow = ({ n, title, desc, delay }: FeatureRowProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className="grid grid-cols-[40px_1fr] md:grid-cols-[40px_1fr_1fr] items-baseline gap-x-8 py-7 border-t"
      style={{ borderColor: LINE }}
    >
      <span className="font-mono text-[11px] tracking-widest" style={{ color: GREEN }}>{n}</span>
      <h3 className="font-semibold text-[15px]" style={{ color: INK }}>{title}</h3>
      <p
        className="text-sm leading-relaxed mt-2 md:mt-0 col-start-2 md:col-start-auto"
        style={{ color: INK_MUTED }}
      >
        {desc}
      </p>
    </motion.div>
  );
};

interface StepProps {
  n: string;
  title: string;
  desc: string;
  delay: number;
}

const Step = ({ n, title, desc, delay }: StepProps) => {
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
        style={{ color: GREEN, border: `1.5px solid ${LINE}` }}
      >
        {n}
      </span>
      <div>
        <h3 className="font-semibold" style={{ color: INK }}>{title}</h3>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: INK_MUTED }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
};

const CTASection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} className="relative px-6 py-28 text-center" style={{ background: GREEN }}>
      <BlueprintGrid />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative max-w-2xl mx-auto"
      >
        <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
          Chega de não saber quando você fica no azul.
        </h2>
        <p className="text-white/75 mt-4 text-lg leading-relaxed">
          Comece agora e veja a projeção completa em minutos.
        </p>
        <a
          href={AUTH_URL}
          className="inline-flex items-center gap-2 mt-9 rounded-full bg-white px-8 py-4 font-semibold shadow-xl transition-transform hover:scale-[1.03]"
          style={{ color: GREEN_DEEP }}
        >
          Começar gratuitamente <ArrowRight size={18} />
        </a>
      </motion.div>
    </section>
  );
};

const FEATURES: FeatureRowProps[] = [
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
];

const STEPS: StepProps[] = [
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
];

const HERO_STATS = [
  { icon: CalendarClock, value: '24', label: 'meses projetados' },
  { icon: CreditCard, value: 'Real', label: 'saldo devedor com juros' },
  { icon: BarChart2, value: 'Mês a mês', label: 'data de quitação por dívida' },
];

export const LandingPage = () => {
  if (isAuthenticated()) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: CREAM }}>

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
          <a
            href={AUTH_URL}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-white rounded-full px-4 py-2 transition-colors hover:bg-white/15"
            style={{ border: '1px solid rgba(255,255,255,0.35)' }}
          >
            entrar
          </a>
        </div>
      </motion.nav>

      {/* Hero — saturated green, blueprint grid */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20"
        style={{ background: GREEN }}
      >
        <BlueprintGrid />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="relative font-mono text-[11px] uppercase tracking-[0.2em] text-white rounded-full px-4 py-2 mb-8"
          style={{ border: '1px solid rgba(255,255,255,0.35)' }}
        >
          projeção financeira pessoal
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
          className="relative text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight max-w-4xl"
        >
          Descubra quando você fica livre das dívidas
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.3, ease: EASE }}
          className="relative mt-6 text-white/80 text-lg max-w-xl leading-relaxed"
        >
          Projete seu fluxo de caixa por <strong className="text-white">24 meses</strong>, veja
          exatamente quando cada parcela acaba e quanto dinheiro é liberado todo mês.
        </motion.p>

        {/* CTA card */}
        <motion.a
          href={AUTH_URL}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42, ease: EASE }}
          whileHover={{ scale: 1.015 }}
          className="relative mt-10 w-full max-w-xl rounded-2xl p-5 flex items-center gap-4 text-left shadow-2xl"
          style={{ background: GREEN_DEEP, border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <span
            className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.15em] text-white/50 rounded px-2 py-1 shrink-0"
            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
          >
            → começar
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Monte sua primeira projeção: renda, gastos e dívidas
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              Leva menos de 5 minutos — e você sai sabendo exatamente quando fica livre.
            </p>
          </div>
          <span
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0"
            style={{ color: GREEN_DEEP }}
          >
            <ArrowRight size={16} />
          </span>
        </motion.a>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="relative mt-14 flex flex-wrap justify-center gap-x-12 gap-y-6"
        >
          {HERO_STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-white">
              <Icon size={16} className="text-white/60" />
              <span className="text-lg font-extrabold tabular-nums">{value}</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/55">{label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features — framed light zone with dot texture and floating chips */}
      <section className="relative" style={{ borderBottom: `1px solid ${LINE}` }}>
        <DotTexture />
        <div
          className="relative max-w-5xl mx-auto px-6 lg:px-12 py-24"
          style={{ borderLeft: `1px solid ${LINE}`, borderRight: `1px solid ${LINE}` }}
        >
          <FloatingChip label="Tabela Price" className="left-4 top-24" rotate={-6} delay={0.1} />
          <FloatingChip label="Meta de poupança" className="right-8 top-16" rotate={5} delay={0.2} />
          <FloatingChip label="Juros compostos" className="left-10 top-52" rotate={4} delay={0.3} />
          <FloatingChip label="24 meses" className="right-4 top-48" rotate={-4} delay={0.4} />

          <div className="text-center mb-14">
            <Kicker>funcionalidades</Kicker>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: EASE }}
              className="text-3xl lg:text-4xl font-extrabold tracking-tight"
              style={{ color: INK }}
            >
              Tudo que você precisa para sair das dívidas
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
              className="mt-3 max-w-lg mx-auto text-sm leading-relaxed"
              style={{ color: INK_MUTED }}
            >
              Não é só uma planilha. É um motor de simulação que calcula o caminho mais rápido para a
              liberdade financeira.
            </motion.p>
          </div>

          <div className="border-b" style={{ borderColor: LINE }}>
            {FEATURES.map((f) => <FeatureRow key={f.n} {...f} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative" style={{ borderBottom: `1px solid ${LINE}` }}>
        <div
          className="relative max-w-5xl mx-auto px-6 lg:px-12 py-24"
          style={{ borderLeft: `1px solid ${LINE}`, borderRight: `1px solid ${LINE}` }}
        >
          <div className="text-center mb-14">
            <Kicker>como funciona</Kicker>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: EASE }}
              className="text-3xl lg:text-4xl font-extrabold tracking-tight"
              style={{ color: INK }}
            >
              Três passos para clareza total
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map((s) => <Step key={s.n} {...s} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <footer
        className="px-6 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50"
        style={{ background: GREEN_DEEP }}
      >
        <span className="font-mono font-bold tracking-tight">// loan over</span>
        <span className="font-mono text-[10px] uppercase tracking-wider">
          © {new Date().getFullYear()} — projeção financeira pessoal.
        </span>
      </footer>
    </div>
  );
};
