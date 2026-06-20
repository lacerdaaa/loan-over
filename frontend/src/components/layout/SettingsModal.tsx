import { LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { Modal } from '../ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  name?: string;
  email?: string;
  avatar?: string;
}

export const SettingsModal = ({ open, onClose, name, email, avatar }: Props) => {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    onClose();
    navigate('/login', { replace: true });
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-4">

        {/* User info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200">
          <div className="avatar">
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
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            {dark ? <Moon size={16} className="text-base-content/60" /> : <Sun size={16} className="text-base-content/60" />}
            <span className="text-sm text-base-content">{dark ? 'Dark mode' : 'Light mode'}</span>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={dark}
            onChange={toggle}
          />
        </div>

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
    </Modal>
  );
};
