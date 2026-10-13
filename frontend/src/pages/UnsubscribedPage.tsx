import { Link } from 'react-router-dom';
import { BlueprintGrid } from '../components/ui/BlueprintGrid';
import { PALETTES } from '../lib/brand';

const { accent: GREEN, deep: GREEN_DEEP } = PALETTES.personal;

export const UnsubscribedPage = () => (
  <div className="min-h-screen relative flex items-center justify-center p-6" style={{ background: GREEN }}>
    <BlueprintGrid />
    <div className="relative w-full max-w-sm flex flex-col items-center gap-6">
      <span className="font-mono font-bold text-white text-lg tracking-tight">// loan over</span>
      <div
        className="w-full rounded-2xl p-6 flex flex-col gap-5 backdrop-blur-lg shadow-2xl text-center"
        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.25)' }}
      >
        <div>
          <h1 className="text-xl font-bold text-white">Você saiu da lista</h1>
          <p className="text-white/60 text-sm mt-1">
            Não enviaremos mais e-mails de alertas nem relatórios. Você pode reativá-los a qualquer
            momento nas configurações do app.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-sm shadow-lg transition-transform hover:scale-[1.02]"
          style={{ color: GREEN_DEEP }}
        >
          Ir para o app
        </Link>
      </div>
    </div>
  </div>
);
