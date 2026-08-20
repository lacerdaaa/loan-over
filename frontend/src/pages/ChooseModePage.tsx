import { Briefcase, User } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMe, useSetAccountType } from '../api/auth';
import { useUpsertOrganization } from '../api/organization';
import { Field } from '../components/ui/Field';
import { BUSINESS_MODE_ENABLED } from '../lib/flags';

export const ChooseModePage = () => {
  const { data: me, isLoading } = useMe();
  const setAccountType = useSetAccountType();
  const upsertOrganization = useUpsertOrganization();
  const navigate = useNavigate();

  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [form, setForm] = useState({ name: '', cnpj: '', cash_balance: 0 });

  if (!BUSINESS_MODE_ENABLED) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (me && me.account_type !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  const pending = setAccountType.isPending || upsertOrganization.isPending;

  const choosePersonal = async () => {
    await setAccountType.mutateAsync('personal');
    navigate('/dashboard', { replace: true });
  };

  const submitBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    await setAccountType.mutateAsync('business');
    await upsertOrganization.mutateAsync({
      name: form.name,
      cnpj: form.cnpj || null,
      cash_balance: form.cash_balance,
    });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-base-content">Como você vai usar o Loan Over?</h1>
          <p className="text-sm text-base-content/60 mt-2">
            Escolha o tipo de conta para começar
          </p>
        </div>

        {!showBusinessForm ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={choosePersonal}
              disabled={pending}
              className="card bg-base-200 border border-base-300 p-6 flex flex-col items-center gap-3 text-center hover:border-primary transition-colors disabled:opacity-60"
            >
              <User size={28} className="text-primary" />
              <span className="font-semibold text-base-content">Pessoal</span>
              <span className="text-xs text-base-content/60 leading-relaxed">
                Controle suas dívidas e projete seu fluxo de caixa pessoal
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowBusinessForm(true)}
              disabled={pending}
              className="card bg-base-200 border border-base-300 p-6 flex flex-col items-center gap-3 text-center hover:border-primary transition-colors disabled:opacity-60"
            >
              <Briefcase size={28} className="text-primary" />
              <span className="font-semibold text-base-content">Empresa</span>
              <span className="text-xs text-base-content/60 leading-relaxed">
                Projete o caixa, folha e financiamentos da sua empresa
              </span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={submitBusiness}
            className="card bg-base-200 border border-base-300 p-6 flex flex-col gap-4"
          >
            <h2 className="font-semibold text-sm text-base-content">Dados da empresa</h2>

            <Field label="Nome da empresa">
              <input
                type="text"
                required
                className="input input-sm"
                placeholder="Ex: Minha Empresa Ltda"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <Field label="CNPJ (opcional)">
              <input
                type="text"
                className="input input-sm"
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              />
            </Field>

            <Field label="Caixa atual (R$)">
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="input input-sm"
                placeholder="Ex: 50.000"
                value={form.cash_balance || ''}
                onChange={(e) => setForm({ ...form, cash_balance: Number(e.target.value) })}
              />
            </Field>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowBusinessForm(false)}
                disabled={pending}
              >
                ← voltar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
                Continuar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
