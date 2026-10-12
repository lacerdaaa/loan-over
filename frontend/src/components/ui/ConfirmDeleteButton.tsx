import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  label: string;
  pending?: boolean;
  onConfirm: () => void;
}

export const ConfirmDeleteButton = ({ label, pending = false, onConfirm }: Props) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {confirming ? (
        <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-1">
          <span className="text-xs text-error font-medium">Excluir?</span>
          <button className="btn btn-error btn-xs" disabled={pending} onClick={onConfirm}>Sim</button>
          <button className="btn btn-ghost btn-xs" onClick={() => setConfirming(false)}>Não</button>
        </motion.div>
      ) : (
        <motion.button
          key="trash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          whileTap={{ scale: 0.93 }}
          aria-label={label}
          className="btn btn-ghost btn-xs text-base-content/30 hover:text-error"
          onClick={() => setConfirming(true)}
        >
          <Trash2 size={14} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
