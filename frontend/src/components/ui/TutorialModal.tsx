import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TutorialStep {
  selector?: string;
  navigateTo?: string;
  title: string;
  body: string;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Bem-vindo ao Loan Over',
    body: 'Vamos te guiar pelos passos principais. Leva menos de 2 minutos.',
  },
  {
    navigateTo: '/income',
    selector: '[data-tutorial="add-income"]',
    title: 'Registre sua renda',
    body: 'Clique aqui para adicionar uma fonte de renda — salário fixo, renda variável, ou qualquer outra.',
  },
  {
    title: 'Adicione descontos, se aplicável',
    body: 'Dentro de cada renda cadastrada você pode incluir deduções como INSS, IRRF ou vale-transporte. O app calcula o valor líquido automaticamente.',
  },
  {
    navigateTo: '/debts',
    selector: '[data-tutorial="add-debt"]',
    title: 'Registre suas dívidas',
    body: 'Clique aqui para cadastrar uma dívida. Informe o valor da parcela, o total de parcelas e a data de início.',
  },
  {
    navigateTo: '/occasional-expenses',
    selector: '[data-tutorial="add-occasional"]',
    title: 'Registre os gastos do mês',
    body: 'Clique aqui para adicionar gastos pontuais — uma viagem, um conserto, uma compra fora do orçamento fixo.',
  },
];

const PAD = 10;
const TOOLTIP_W = 272;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const CONTENT_STEPS = STEPS.length - 1;

interface Props {
  open: boolean;
  onClose: () => void;
}

const Dots = ({ current }: { current: number }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: CONTENT_STEPS }, (_, i) => (
      <span
        key={i}
        className={`block w-1.5 h-1.5 rounded-full transition-colors duration-200 ${i === current - 1 ? 'bg-primary' : 'bg-base-300'}`}
      />
    ))}
  </div>
);

interface TooltipPos {
  left: number;
  top: number;
  arrow: 'top' | 'left' | 'right';
}

function computeTooltipPos(rect: DOMRect): TooltipPos {
  const vw = window.innerWidth;
  const spaceRight = vw - rect.right;
  const spaceLeft = rect.left;

  // Prefer placing below the element (buttons are in the header area)
  if (spaceRight < TOOLTIP_W + 32 && spaceLeft < TOOLTIP_W + 32) {
    const left = Math.max(8, Math.min(vw - TOOLTIP_W - 8, rect.left + rect.width / 2 - TOOLTIP_W / 2));
    return { left, top: rect.bottom + 16, arrow: 'top' };
  }

  // Place to the left if the button is near the right edge
  if (spaceRight < TOOLTIP_W + 32) {
    return {
      left: rect.left - TOOLTIP_W - 16,
      top: rect.top + rect.height / 2,
      arrow: 'right',
    };
  }

  // Otherwise place to the right
  return {
    left: rect.right + 16,
    top: rect.top + rect.height / 2,
    arrow: 'left',
  };
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
  const { left, top, arrow } = computeTooltipPos(rect);

  const transform =
    arrow === 'top' ? 'translateX(0)' : 'translateY(-50%)';

  const arrowEl = {
    top: (
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 0, height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderBottom: '8px solid var(--color-base-100)',
        }}
      />
    ),
    left: (
      <div
        className="absolute -left-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 0, height: 0,
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderRight: '8px solid var(--color-base-100)',
        }}
      />
    ),
    right: (
      <div
        className="absolute -right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 0, height: 0,
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderLeft: '8px solid var(--color-base-100)',
        }}
      />
    ),
  }[arrow];

  return (
    <motion.div
      initial={{ opacity: 0, y: arrow === 'top' ? -6 : 0, x: arrow === 'left' ? -6 : arrow === 'right' ? 6 : 0 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="fixed bg-base-100 rounded-xl shadow-2xl p-4"
      style={{ left, top, transform, width: TOOLTIP_W, zIndex: 10001 }}
    >
      {arrowEl}
      <p className="font-semibold text-sm text-base-content">{step.title}</p>
      <p className="text-xs leading-relaxed text-base-content/55 mt-1.5">{step.body}</p>
      <div className="flex items-center justify-between mt-4">
        <Dots current={stepIndex} />
        <div className="flex items-center gap-3">
          <button className="text-xs text-base-content/35 hover:text-base-content/60 transition-colors" onClick={onSkip}>
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
  stepIndex: number;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onSkip: () => void;
}

const CenteredCard = ({ step, stepIndex, isFirst, isLast, onNext, onSkip }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.97 }}
    transition={{ duration: 0.22, ease: EASE }}
    className="fixed inset-0 flex items-center justify-center p-4"
    style={{ zIndex: 10001 }}
  >
    <div className="w-full max-w-xs bg-base-100 rounded-2xl shadow-2xl p-6">
      <p className="font-bold text-base text-base-content">{step.title}</p>
      <p className="text-sm leading-relaxed text-base-content/60 mt-2">{step.body}</p>
      <div className="flex items-center justify-between mt-5">
        {!isFirst && <Dots current={stepIndex} />}
        <div className={`flex items-center gap-3 ${isFirst ? 'w-full justify-between' : 'ml-auto'}`}>
          <button className="text-xs text-base-content/35 hover:text-base-content/60 transition-colors" onClick={onSkip}>
            pular
          </button>
          <button className="btn btn-primary btn-sm" onClick={onNext}>
            {isFirst ? 'começar →' : isLast ? 'fechar' : 'próximo →'}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

export const TutorialModal = ({ open, onClose }: Props) =>
  open ? <TutorialOverlay onClose={onClose} /> : null;

const TutorialOverlay = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const [measured, setMeasured] = useState<{ step: number; rect: DOMRect | null } | null>(null);
  const navigate = useNavigate();

  const current = STEPS[step];
  const rect = measured?.step === step ? measured.rect : null;

  useEffect(() => {
    if (!current.selector) return;

    let resizeHandler: (() => void) | null = null;

    const measure = () => {
      const el = document.querySelector(current.selector!);
      setMeasured({ step, rect: el ? el.getBoundingClientRect() : null });
    };

    // Longer delay for navigated steps to let page render and animate in
    const delay = current.navigateTo ? 500 : 50;
    const timeoutId = setTimeout(() => {
      measure();
      resizeHandler = measure;
      window.addEventListener('resize', measure);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    };
  }, [step, current.selector, current.navigateTo]);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const showSpotlight = Boolean(current.selector) && rect !== null;

  const handleNext = () => {
    if (isLast) { onClose(); return; }
    const next = STEPS[step + 1];
    if (next.navigateTo) navigate(next.navigateTo);
    setStep((s) => s + 1);
  };

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      {showSpotlight && rect ? (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD), background: 'rgba(0,0,0,0.78)' }} />
          <div style={{ position: 'fixed', top: rect.bottom + PAD, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.78)' }} />
          <div style={{ position: 'fixed', top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2, background: 'rgba(0,0,0,0.78)' }} />
          <div style={{ position: 'fixed', top: rect.top - PAD, left: rect.right + PAD, right: 0, height: rect.height + PAD * 2, background: 'rgba(0,0,0,0.78)' }} />
          <div
            style={{
              position: 'fixed',
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              borderRadius: 10,
              boxShadow: '0 0 0 2px var(--color-primary)',
              pointerEvents: 'none',
              zIndex: 10000,
            }}
          />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)' }} />
      )}

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
            stepIndex={step}
            isFirst={isFirst}
            isLast={isLast}
            onNext={handleNext}
            onSkip={onClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
