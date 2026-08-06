import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, CreditCard, TrendingUp, Wallet, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GREEN, GREEN_TINT, INK, INK_MUTED, LINE } from '../../lib/brand';

interface StepDef {
  kicker?: string;
  icon: React.ElementType;
  title: string;
  body: string;
  sub?: string;
}

const STEPS: StepDef[] = [
  {
    icon: TrendingUp,
    title: 'Bem-vindo ao Loan Over',
    body: 'Vamos te mostrar como configurar sua situação financeira. São 3 passos simples — leva menos de 1 minuto.',
  },
  {
    kicker: '01 · renda',
    icon: Wallet,
    title: 'Cadastre sua renda',
    body: 'No menu Renda, adicione seu salário fixo ou qualquer outra fonte de renda variável. Você pode ter quantas quiser.',
    sub: 'Em cada renda, você pode adicionar deduções como INSS, IRRF ou vale-transporte. O app calcula o valor líquido automaticamente.',
  },
  {
    kicker: '02 · dívidas',
    icon: CreditCard,
    title: 'Registre suas dívidas',
    body: 'No menu Dívidas, cadastre cada parcelamento com o valor da parcela, o total de parcelas e a data de início.',
    sub: 'Se a dívida tem juros compostos (Tabela Price), informe o principal e a taxa mensal — o app calcula a parcela exata.',
  },
  {
    kicker: '03 · feito',
    icon: CheckCircle,
    title: 'Tudo pronto.',
    body: 'Acesse o Dashboard para ver sua projeção de 24 meses e descobrir exatamente quando cada dívida termina e o dinheiro volta para você.',
  },
];

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export const TutorialModal = ({ open, onClose }: Props) => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) goTo(step + 1);
    else onClose();
  };

  const handleBack = () => {
    if (step > 0) goTo(step - 1);
  };

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'white' }}
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
      >
        {/* Colored header */}
        <div className="relative flex flex-col items-center pt-10 pb-8 px-6" style={{ background: GREEN }}>
          <button
            onClick={onClose}
            aria-label="Pular tutorial"
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            <X size={14} />
          </button>

          {current.kicker && (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.2em] mb-4"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {current.kicker}
            </span>
          )}

          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <Icon size={26} color="white" />
          </div>

          <h2 className="text-xl font-bold text-white text-center leading-tight">
            {current.title}
          </h2>
        </div>

        {/* Step body */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: dir * 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -16 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="px-6 pt-5 pb-6 flex flex-col gap-3 min-h-[120px]"
          >
            <p className="text-sm leading-relaxed" style={{ color: INK }}>
              {current.body}
            </p>
            {current.sub && (
              <p
                className="text-xs leading-relaxed px-3 py-2.5 rounded-lg"
                style={{ background: GREEN_TINT, color: INK_MUTED }}
              >
                {current.sub}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div
          className="px-6 pb-5 pt-3 flex items-center justify-between"
          style={{ borderTop: `1px solid ${LINE}` }}
        >
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="block w-1.5 h-1.5 rounded-full transition-colors duration-200"
                style={{ background: i === step ? GREEN : LINE }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={handleBack}
                className="btn btn-ghost btn-sm font-mono text-xs"
              >
                ← voltar
              </button>
            )}
            <button
              onClick={handleNext}
              className="btn btn-sm font-mono text-xs text-white border-none"
              style={{ background: GREEN }}
            >
              {isFirst ? 'começar →' : isLast ? 'fechar' : 'próximo →'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
