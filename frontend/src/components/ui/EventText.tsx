import { buildEventParts } from '../../lib/projectionEvents';
import { formatCurrency } from '../../lib/formatCurrency';
import { usePrivacy } from '../../lib/privacy';
import type { ProjectionEvent } from '../../types/api';

/** Renders a projection event label, blurring the debt name and masking amounts in privacy mode. */
export const EventText = ({ event }: { event: ProjectionEvent }) => {
  const { hidden, mask } = usePrivacy();

  return (
    <>
      {buildEventParts(event).map((part, i) => {
        if (part.kind === 'amount') return <span key={i}>{mask(formatCurrency(part.amount ?? 0))}</span>;
        if (part.kind === 'name') {
          return (
            <span key={i} className={`transition-[filter] ${hidden ? 'blur-sm select-none' : ''}`}>
              {part.text}
            </span>
          );
        }
        return <span key={i}>{part.text}</span>;
      })}
    </>
  );
};
