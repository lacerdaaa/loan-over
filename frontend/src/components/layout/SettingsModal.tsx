import { motion } from 'framer-motion';
import { Braces, ChevronRight, Download, FileText, LogOut, Moon, Sparkles, Sun } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebts } from '../../api/debts';
import { useFixedExpenses } from '../../api/fixed-expenses';
import { useGoal } from '../../api/goal';
import { useIncome } from '../../api/income';
import { useOccasionalExpenses } from '../../api/occasional-expenses';
import { useSnapshot } from '../../api/snapshot';
import { clearToken } from '../../lib/auth';
import { buildJsonExport, buildTextExport, downloadFile } from '../../lib/export';
import { Modal } from '../ui/Modal';

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

interface Props {
  open: boolean;
  onClose: () => void;
  name?: string;
  email?: string;
  avatar?: string;
  dark: boolean;
  onThemeToggle: () => void;
  animations: boolean;
  onAnimationsToggle: () => void;
}

export const SettingsModal = ({ open, onClose, name, email, avatar, dark, onThemeToggle, animations, onAnimationsToggle }: Props) => {
  const navigate = useNavigate();

  const [exportOpen, setExportOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState(CURRENT_MONTH);
  const [exportYear, setExportYear] = useState(CURRENT_YEAR);
  const [exportFormat, setExportFormat] = useState<'text' | 'json'>('text');

  const { data: debts = [] } = useDebts();
  const { data: incomes = [] } = useIncome(exportMonth, exportYear);
  const { data: fixedExpenses = [] } = useFixedExpenses();
  const { data: occasionalExpenses = [] } = useOccasionalExpenses(exportMonth, exportYear);
  const { data: goal = null } = useGoal();
  const { data: snapshot = null } = useSnapshot(exportMonth, exportYear);

  const exportData = { month: exportMonth, year: exportYear, incomes, debts, fixedExpenses, occasionalExpenses, goal, snapshot };

  const handleExport = () => {
    if (exportFormat === 'text') {
      downloadFile(buildTextExport(exportData), `loan-over-${exportYear}-${exportMonth}.txt`, 'text/plain');
    } else {
      downloadFile(buildJsonExport(exportData), `loan-over-${exportYear}-${exportMonth}.json`, 'application/json');
    }
    setExportOpen(false);
  };

  const handleLogout = () => {
    clearToken();
    onClose();
    navigate('/login', { replace: true });
  };

  return (
    <Modal open={open} onClose={onClose} title="Configurações">
      <div className="flex flex-col gap-4">

        {/* User info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200">
          <div className="avatar shrink-0">
            <div className="w-10 rounded-full">
              {avatar
                ? <img src={avatar} alt={name ?? 'user'} referrerPolicy="no-referrer" />
                : <div className="bg-primary text-primary-content flex items-center justify-center font-bold w-full h-full rounded-full text-sm">
                    {name?.[0]?.toUpperCase() ?? '?'}
                  </div>
              }
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-base-content truncate">{name ?? '—'}</p>
            <p className="text-xs text-base-content/50 truncate">{email ?? ''}</p>
          </div>
        </div>

        {/* Theme toggle */}
        <label className="flex items-center justify-between px-1 cursor-pointer">
          <div className="flex items-center gap-3">
            {dark
              ? <Moon size={16} className="text-base-content/60" />
              : <Sun size={16} className="text-base-content/60" />
            }
            <span className="text-sm text-base-content">{dark ? 'Modo escuro' : 'Modo claro'}</span>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={dark}
            onChange={onThemeToggle}
          />
        </label>

        {/* Animations toggle */}
        <label className="flex items-center justify-between px-1 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="relative w-4 h-4">
              <motion.span
                className="block"
                animate={{ rotate: animations ? 360 : 0 }}
                transition={animations
                  ? { repeat: Infinity, duration: 4, ease: 'linear' }
                  : { duration: 0 }
                }
              >
                <Sparkles size={16} className={animations ? 'text-primary' : 'text-base-content/30'} />
              </motion.span>
              {!animations && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[18px] h-px bg-base-content/50 rotate-45 rounded-full" />
                </div>
              )}
            </div>
            <span className="text-sm text-base-content">{animations ? 'Animações ativas' : 'Animações desativadas'}</span>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={animations}
            onChange={onAnimationsToggle}
          />
        </label>

        {/* Export */}
        <button
          className="flex items-center justify-between px-1 cursor-pointer w-full"
          onClick={() => setExportOpen(true)}
        >
          <div className="flex items-center gap-3">
            <Download size={16} className="text-base-content/60" />
            <span className="text-sm text-base-content">Exportar dados</span>
          </div>
          <ChevronRight size={14} className="text-base-content/30" />
        </button>

        <div className="divider my-0" />

        {/* Logout */}
        <button
          className="btn btn-ghost btn-sm text-error justify-start gap-3"
          onClick={handleLogout}
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </div>
      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Exportar dados">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-base-content/50">Período</span>
            <div className="flex gap-2">
              <select
                className="select select-bordered select-sm flex-1"
                value={exportMonth}
                onChange={(e) => setExportMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input input-bordered input-sm w-24"
                value={exportYear}
                onChange={(e) => setExportYear(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-base-content/50">Formato</span>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm flex-1 gap-2 ${exportFormat === 'text' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setExportFormat('text')}
              >
                <FileText size={14} /> Texto
              </button>
              <button
                className={`btn btn-sm flex-1 gap-2 ${exportFormat === 'json' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setExportFormat('json')}
              >
                <Braces size={14} /> JSON
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-sm gap-2 w-full" onClick={handleExport}>
            <Download size={14} /> Baixar
          </button>
        </div>
      </Modal>
    </Modal>
  );
};
