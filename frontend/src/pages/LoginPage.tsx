import { Link } from 'react-router-dom';
import { BlueprintGrid } from '../components/ui/BlueprintGrid';
import { PALETTES } from '../lib/brand';

const API_URL = import.meta.env.VITE_API_URL as string;
const { accent: GREEN, deep: GREEN_DEEP } = PALETTES.personal;

export const LoginPage = () => (
  <div
    className="min-h-screen relative flex items-center justify-center p-6"
    style={{ background: GREEN }}
  >
    <BlueprintGrid />

    <div className="relative w-full max-w-sm flex flex-col items-center gap-6">
      <span className="font-mono font-bold text-white text-lg tracking-tight">// loan over</span>

      <div
        className="w-full rounded-2xl p-6 flex flex-col gap-5 backdrop-blur-lg shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.25)' }}
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Bem-vindo de volta</h1>
          <p className="text-white/60 text-sm mt-1">Entre com sua conta Google para continuar.</p>
        </div>

        <a
          href={`${API_URL}/auth/google`}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 font-semibold text-sm shadow-lg transition-transform hover:scale-[1.02]"
          style={{ color: GREEN_DEEP }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Entrar com Google
        </a>

      </div>

      <Link
        to="/"
        className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
      >
        voltar ao início
      </Link>
    </div>
  </div>
);
