import { Bell, Mail } from 'lucide-react';
import { usePro } from '../../api/billing';
import {
  useNotificationPreferences,
  useSendTestEmail,
  useUpdateNotificationPreferences,
} from '../../api/notifications';
import { ProBadge } from '../ui/ProBadge';
import { UpgradeCta } from '../ui/UpgradeCta';

export const NotificationSettings = () => {
  const isPro = usePro();
  const { data: prefs } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const sendTest = useSendTestEmail();

  return (
    <section className="flex flex-col gap-3" aria-label="Notificações por e-mail">
      <h3 className="font-mono text-[11px] font-semibold text-base-content/50 uppercase tracking-[0.15em]">
        Notificações por e-mail
      </h3>

      <label className="flex items-center justify-between px-1 cursor-pointer">
        <div className="flex items-center gap-3">
          <Bell size={16} className="text-base-content/60" />
          <span className="text-sm text-base-content">Alertas de parcelas e quitações</span>
        </div>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={prefs?.email_notifications ?? false}
          disabled={!prefs || update.isPending}
          onChange={(e) => update.mutate({ email_notifications: e.target.checked })}
        />
      </label>

      <label className={`flex items-center justify-between px-1 ${isPro ? 'cursor-pointer' : 'opacity-60'}`}>
        <div className="flex items-center gap-3">
          <Mail size={16} className="text-base-content/60" />
          <span className="text-sm text-base-content">Relatório mensal</span>
          {!isPro && <ProBadge />}
        </div>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={prefs?.monthly_report ?? false}
          disabled={!isPro || !prefs || update.isPending}
          onChange={(e) => update.mutate({ monthly_report: e.target.checked })}
        />
      </label>
      {!isPro && <UpgradeCta feature="O relatório mensal" compact />}

      <div className="flex items-center gap-3 px-1">
        <button
          type="button"
          className="btn btn-ghost btn-sm border-base-300"
          disabled={sendTest.isPending}
          onClick={() => sendTest.mutate()}
        >
          Enviar e-mail de teste
        </button>
        {sendTest.isSuccess && (
          <span role="status" className="text-xs text-success">E-mail de teste enviado.</span>
        )}
      </div>
    </section>
  );
};
