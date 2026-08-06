import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GREEN } from '../../lib/brand';

interface TutorialStep {
  selector?: string;
  title: string;
  body: string;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Bem-vindo ao Loan Over',
    body: 'Vamos te mostrar os dois pontos principais. Leva menos de 1 minuto.',
  },
  {
    selector: '[data-tutorial="income"]',
    title: 'Cadastre sua renda',
    body: 'Adicione salário fixo ou renda variável. Em cada renda você pode incluir deduções como INSS e IRRF — o app calcula o líquido automaticamente.',
  },
  {
    selector: '[data-tutorial="debts"]',
    title: 'Registre suas dívidas',
    body: 'Cadastre cada parcelamento com valor, prazo e taxa de juros. Se for Tabela Price, informe o principal e a taxa mensal — o app calcula a parcela exata.',
  },
];

const PAD = 10;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const SPOTLIGHT_STEPS = STEPS.filter((s) => s.selector).length;

interface Props {
  open: boolean;
  onClose: () => void;
}

interface TooltipProps {
  rect: DOMRect;
  step: TutorialStep;
  stepIndex: number;
  isLast: boolean;
  onNext: () => void;
  onSkip: () => void;
}

const Tooltip = ({ rect, step, stepIndex, isLast, onNext, onSkip }: TooltipProps) => {
  const left = rect.right + 16;
  const top = rect.top + rect.height / 2;
  const dotIndex = stepIndex - 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -4 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="fixed bg-white rounded-xl shadow-2xl p-4"
      style={{ left, top, transform: 'translateY(-50%)', width: 272, zIndex: 10001 }}
    >
      {/* Left arrow */}
      <div
        className="absolute -left-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 0, height: 0,
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderRight: '8px solid white',
        }}
      />
      <p className="font-semibold text-sm text-base-content">{step.title}</p>
      <p className="text-xs leading-relaxed text-base-content/55 mt-1.5">{step.body}</p>
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: SPOTLIGHT_STEPS }, (_, i) => (
            <span
              key={i}
              className="block w-1.5 h-1.5 rounded-full transition-colors duration-200"
              style={{ background: i === dotIndex ? GREEN : '#e5e7eb' }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            className="text-xs text-base-content/35 hover:text-base-content/60 transition-colors"
            onClick={onSkip}
          >
            pular
          </button>
          <button className="btn btn-primary btn-xs" onClick={onNext}>
            {isLast ? 'fechar' : 'próximo →'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface CardProps {
  step: TutorialStep;
  isFirst: boolean;
  onNext: () => void;
  onSkip: () => void;
}

const CenteredCard = ({ step, isFirst, onNext, onSkip }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.97 }}
    transition={{ duration: 0.22, ease: EASE }}
    className="fixed inset-0 flex items-center justify-center p-4"
    style={{ zIndex: 10001 }}
  >
    <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6">
      <p className="font-bold text-base text-base-content">{step.title}</p>
      <p className="text-sm leading-relaxed text-base-content/60 mt-2">{step.body}</p>
      <div className="flex items-center justify-between mt-5">
        <button
          className="text-xs text-base-content/35 hover:text-base-content/60 transition-colors"
          onClick={onSkip}
        >
          pular
        </button>
        <button className="btn btn-primary btn-sm" onClick={onNext}>
          {isFirst ? 'começar →' : 'fechar'}
        </button>
      </div>
    </div>
  </motion.div>
);

export const TutorialModal = ({ open, onClose }: Props) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = STEPS[step];

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open || !current.selector) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(current.selector!);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, step, current.selector]);

  if (!open) return null;

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const showSpotlight = Boolean(current.selector) && rect !== null;

  const handleNext = () => {
    if (isLast) onClose();
    else setStep((s) => s + 1);
  };

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      {/* Dark overlay with spotlight cutout via 4 strips */}
      {showSpotlight && rect ? (
        <>
          <div style={{ position: 'fixed', inset: 0, top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD), background: 'rgba(0,0,0,0.78)' }} />
          <div style={{ position: 'fixed', top: rect.bottom + PAD, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.78)' }} />
          <div style={{ position: 'fixed', top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2, background: 'rgba(0,0,0,0.78)' }} />
          <div style={{ position: 'fixed', top: rect.top - PAD, left: rect.right + PAD, right: 0, height: rect.height + PAD * 2, background: 'rgba(0,0,0,0.78)' }} />
          {/* Green highlight ring */}
          <div
            style={{
              position: 'fixed',
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              borderRadius: 10,
              boxShadow: `0 0 0 2px ${GREEN}`,
              pointerEvents: 'none',
              zIndex: 10000,
            }}
          />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)' }} />
      )}

      {/* Tooltip or centered card */}
      <AnimatePresence mode="wait">
        {showSpotlight && rect ? (
          <Tooltip
            key={`tooltip-${step}`}
            rect={rect}
            step={current}
            stepIndex={step}
            isLast={isLast}
            onNext={handleNext}
            onSkip={onClose}
          />
        ) : (
          <CenteredCard
            key={`card-${step}`}
            step={current}
            isFirst={isFirst}
            onNext={handleNext}
            onSkip={onClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
