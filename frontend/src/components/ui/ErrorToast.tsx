import { dismissToast, useToasts } from '../../lib/toast';

export const ErrorToast = () => {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-end z-[100]" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role="alert" className="alert alert-error">
          <span>{t.text}</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            aria-label="Fechar aviso"
            onClick={() => dismissToast(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
