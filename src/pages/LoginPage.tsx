import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useSettingsStore } from '../store/settingsStore';

export default function LoginPage() {
  const login = useAuthStore(s => s.login);
  const user = useAuthStore(s => s.user);
  const setView = useDiagnosticStore(s => s.setView);
  const companyLogo = useSettingsStore(s => s.companyLogo);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;
    setLoading(true);
    setError(false);

    const success = await login(identifier.trim(), password.trim());
    setLoading(false);

    if (success) {
      // Redirect based on role
      const store = useAuthStore.getState();
      if (store.user?.role === 'master') {
        setView('home');
      } else {
        setView('dashboard');
      }
    } else {
      setError(true);
    }
  }

  // If somehow already logged in, redirect
  if (user) {
    return <Navigate to={user.role === 'master' ? '/' : '/dashboard'} replace />;
  }

  return (
    <div
      className="w-full min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center"
      style={{ padding: '40px 24px' }}
    >
      <div className="flex flex-col items-center text-center animate-fade-up" style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ marginBottom: '36px' }}>
          <img
            src={companyLogo || '/logo-complement.svg'}
            alt="Complement Consulting Group"
            className="mx-auto object-contain"
            style={{ height: '72px' }}
          />
        </div>

        {/* Login card */}
        <div
          className="w-full bg-white rounded-2xl border border-border/40 shadow-md"
          style={{ padding: '44px 36px' }}
        >
          <div
            className="inline-flex items-center justify-center rounded-full bg-navy/10 mx-auto"
            style={{ width: '52px', height: '52px', marginBottom: '20px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="text-navy" style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h2 className="font-serif text-navy" style={{ fontSize: '20px', marginBottom: '8px' }}>
            Iniciar Sesion
          </h2>
          <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '28px' }}>
            Ingrese sus credenciales para acceder al sistema de diagnostico.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '6px', textAlign: 'left' }}>
                Correo electronico
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setError(false); }}
                placeholder="correo@empresa.com"
                className="input-field"
                autoFocus
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '6px', textAlign: 'left' }}>
                Contrasena
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                placeholder="Contrasena"
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-error font-medium" style={{ fontSize: '12px' }}>
                Correo o contrasena incorrectos.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white font-bold hover:bg-mid transition-all cursor-pointer disabled:opacity-50"
              style={{ fontSize: '14px', padding: '14px 24px', borderRadius: '12px', marginTop: '8px' }}
            >
              {loading ? 'Verificando...' : 'Iniciar Sesion'}
            </button>
          </form>
        </div>

        <p className="text-muted/40" style={{ fontSize: '11px', marginTop: '28px' }}>
          Complement Consulting Group — Diagnostico Empresarial
        </p>
      </div>
    </div>
  );
}
