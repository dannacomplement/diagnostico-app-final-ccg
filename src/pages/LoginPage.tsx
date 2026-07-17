import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useSettingsStore } from '../store/settingsStore';
import { getTestClientIds } from '../lib/storage';

export default function LoginPage() {
  const login = useAuthStore(s => s.login);
  const user = useAuthStore(s => s.user);
  const startLoginTransition = useAuthStore(s => s.startLoginTransition);
  const setView = useDiagnosticStore(s => s.setView);
  const companyLogo = useSettingsStore(s => s.companyLogo);
  const floatingLogo = useSettingsStore(s => s.floatingLogo);

  const logout = useAuthStore(s => s.logout);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const targetViewRef = useRef<'home' | 'dashboard'>('home');

  const [inactiveGate, setInactiveGate] = useState(false);
  const [checkingTest, setCheckingTest] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [masterKeyError, setMasterKeyError] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;
    setLoading(true);
    setError(false);
    setCheckingTest(true);

    const success = await login(identifier.trim(), password.trim());

    if (success) {
      const store = useAuthStore.getState();
      const loggedUser = store.user;

      if (loggedUser && loggedUser.role !== 'master') {
        const testIds = await getTestClientIds();
        if (testIds.includes(loggedUser.id)) {
          setLoading(false);
          setInactiveGate(true);
          setCheckingTest(false);
          return;
        }
      }

      setCheckingTest(false);
      targetViewRef.current = loggedUser?.role === 'master' ? 'home' : 'dashboard';
      setLoading(false);
      setTransitioning(true);
      startLoginTransition();

      setTimeout(() => {
        setView(targetViewRef.current);
      }, 2600);
    } else {
      setCheckingTest(false);
      setLoading(false);
      setError(true);
    }
  }

  function handleMasterKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (masterKey === 'CCG2026') {
      setInactiveGate(false);
      setMasterKey('');
      setMasterKeyError(false);
      targetViewRef.current = 'dashboard';
      setTransitioning(true);
      startLoginTransition();
      setTimeout(() => { setView('dashboard'); }, 2600);
    } else {
      setMasterKeyError(true);
    }
  }

  async function handleInactiveCancel() {
    await logout();
    setInactiveGate(false);
    setMasterKey('');
    setMasterKeyError(false);
  }

  if (user && !inactiveGate && !checkingTest) {
    return <Navigate to={user.role === 'master' ? '/' : '/dashboard'} replace />;
  }

  if (inactiveGate) {
    return (
      <div className="login-bg w-full min-h-screen flex flex-col items-center justify-center" style={{ padding: '40px 24px' }}>
        <div className="relative z-10" style={{ width: '100%', maxWidth: '420px' }}>
          <div className="login-card w-full rounded-2xl" style={{ padding: 'clamp(28px, 5vw, 44px) clamp(20px, 4vw, 36px)' }}>
            <div className="inline-flex items-center justify-center rounded-full mx-auto" style={{ width: '52px', height: '52px', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px', color: '#EF4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="font-serif text-center" style={{ fontSize: 'var(--fs-20)', marginBottom: '8px', color: '#002060' }}>
              Usuario Inactivo
            </h2>
            <p className="text-center leading-relaxed" style={{ fontSize: 'var(--fs-13)', marginBottom: '24px', color: '#6B7280' }}>
              Este usuario está inactivo. Para continuar, ingrese la clave maestra.
            </p>
            <form onSubmit={handleMasterKeySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="block font-medium" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px', textAlign: 'left', color: '#333' }}>
                  Clave maestra
                </label>
                <input
                  type="password"
                  value={masterKey}
                  onChange={e => { setMasterKey(e.target.value); setMasterKeyError(false); }}
                  placeholder="Ingrese la clave maestra"
                  className="input-field input-field-login"
                  autoFocus
                />
              </div>
              {masterKeyError && (
                <p className="text-error font-medium" style={{ fontSize: 'var(--fs-12)' }}>Clave maestra incorrecta.</p>
              )}
              <button
                type="submit"
                className="w-full text-white font-bold cursor-pointer"
                style={{ fontSize: 'var(--fs-14)', padding: '14px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #0047AB 0%, #2563EB 100%)' }}
              >
                Acceder
              </button>
              <button
                type="button"
                onClick={handleInactiveCancel}
                className="w-full text-muted font-medium hover:text-ink cursor-pointer"
                style={{ fontSize: 'var(--fs-13)', padding: '10px', background: 'none', border: 'none' }}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`login-bg w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden${transitioning ? ' login-exit-bg' : ''}`}
      style={{ padding: '40px 24px' }}
    >
      {/* Floating logos */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden${transitioning ? ' login-exit-floats' : ''}`} aria-hidden="true">
        {[
          { size: 120, bottom: '-8%',  left: '5%',  duration: '22s', delay: '0s' },
          { size: 20,  bottom: '-5%',  left: '20%', duration: '18s', delay: '3s' },
          { size: 70,  bottom: '-6%',  left: '35%', duration: '26s', delay: '6s' },
          { size: 16,  bottom: '-4%',  left: '50%', duration: '16s', delay: '1s' },
          { size: 90,  bottom: '-10%', left: '65%', duration: '24s', delay: '9s' },
          { size: 30,  bottom: '-3%',  left: '80%', duration: '20s', delay: '5s' },
          { size: 50,  bottom: '-7%',  left: '92%', duration: '28s', delay: '12s' },
          { size: 14,  bottom: '-5%',  left: '12%', duration: '15s', delay: '8s' },
          { size: 100, bottom: '-9%',  left: '48%', duration: '30s', delay: '15s' },
          { size: 24,  bottom: '-4%',  left: '75%', duration: '17s', delay: '11s' },
          { size: 40,  bottom: '-6%',  left: '30%', duration: '21s', delay: '18s' },
          { size: 80,  bottom: '-8%',  left: '58%', duration: '25s', delay: '4s' },
        ].map((logo, i) => (
          <img
            key={i}
            src={floatingLogo || companyLogo || '/logo-complement.svg'}
            alt=""
            className="floating-logo"
            style={{
              width: `${logo.size}px`,
              height: `${logo.size}px`,
              bottom: logo.bottom,
              left: logo.left,
              '--float-duration': logo.duration,
              '--float-delay': logo.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center" style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div className={`login-logo${transitioning ? ' login-exit-logo' : ''}`} style={{ marginBottom: '40px' }}>
          <img
            src={companyLogo || '/logo-complement.svg'}
            alt="Complement Consulting Group"
            className="mx-auto object-contain"
            style={{ height: '80px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))', border: '3px solid red', borderRadius: '8px' }}
          />
        </div>

        {/* Login card */}
        <div
          className={`login-card w-full rounded-2xl${transitioning ? ' login-exit-card' : ''}`}
          style={{ padding: 'clamp(28px, 5vw, 44px) clamp(20px, 4vw, 36px)' }}
        >
          <div
            className="login-stagger-1 inline-flex items-center justify-center rounded-full mx-auto"
            style={{ width: '52px', height: '52px', marginBottom: '20px', background: 'rgba(0, 32, 96, 0.08)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px', color: '#002060' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h2 className="login-stagger-2 font-serif" style={{ fontSize: 'var(--fs-20)', marginBottom: '8px', color: '#002060' }}>
            Iniciar Sesión
          </h2>
          <p className="login-stagger-2 leading-relaxed" style={{ fontSize: 'var(--fs-13)', marginBottom: '28px', color: '#6B7280' }}>
            Ingrese sus credenciales para acceder al sistema de radiografía empresarial.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="login-stagger-3">
              <label className="block font-medium" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px', textAlign: 'left', color: '#333' }}>
                Usuario o correo electrónico
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setError(false); }}
                placeholder="usuario o correo@empresa.com"
                className="input-field input-field-login"
                autoFocus
                autoComplete="email"
              />
            </div>
            <div className="login-stagger-4">
              <label className="block font-medium" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px', textAlign: 'left', color: '#333' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                placeholder="Contraseña"
                className="input-field input-field-login"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-error font-medium" style={{ fontSize: 'var(--fs-12)' }}>
                Usuario, correo o contraseña incorrectos.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="login-btn login-stagger-5 w-full text-white font-bold disabled:opacity-50 cursor-pointer"
              style={{
                fontSize: 'var(--fs-14)',
                padding: '14px 24px',
                borderRadius: '12px',
                marginTop: '8px',
                background: 'linear-gradient(135deg, #0047AB 0%, #2563EB 100%)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center" style={{ gap: '8px' }}>
                  <span className="login-spinner" />
                  Verificando...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        <p className={`login-stagger-5${transitioning ? ' login-exit-footer' : ''}`} style={{ fontSize: 'var(--fs-11)', marginTop: '28px', color: 'rgba(255,255,255,0.3)' }}>
          Complement Consulting Group — Radiografía Empresarial
        </p>
      </div>
    </div>
  );
}
