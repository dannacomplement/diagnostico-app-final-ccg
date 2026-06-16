import { useDiagnosticStore } from '../../store/diagnosticStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function Header() {
  const setView = useDiagnosticStore(s => s.setView);
  const view = useDiagnosticStore(s => s.view);
  const user = useAuthStore(s => s.user);
  const logoutAuth = useAuthStore(s => s.logout);
  const companyLogoIcon = useSettingsStore(s => s.companyLogoIcon);

  function handleLogoClick() {
    if (view === 'wizard' || view === 'org_wizard' || view === 'tech_wizard') return;
    if (!user) {
      setView('login');
    } else if (user.role === 'master') {
      setView('home');
    } else {
      setView('dashboard');
    }
  }

  function handleNavClick() {
    if (!user) {
      setView('login');
    } else if (user.role === 'master') {
      setView('history');
    } else {
      setView('dashboard');
    }
  }

  function handleLogout() {
    logoutAuth();
    setView('login');
  }

  return (
    <header className="bg-navy sticky top-0 z-50 shadow-lg shadow-navy/20">
      <div className="w-full px-6 sm:px-10 lg:px-16 h-[4.5rem] flex items-center justify-between">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            src={companyLogoIcon || '/icon-complement.svg'}
            alt="Complement"
            className="h-9 w-auto object-contain"
          />
          <span className="font-serif text-[17px] text-white tracking-wide">
            COMPLEMENT
          </span>
        </button>
        <div className="flex items-center" style={{ gap: '12px' }}>
          {user && (
            <span className="text-xs font-medium text-white/60 hidden sm:block" style={{ maxWidth: '160px' }}>
              {user.displayName}
            </span>
          )}
          <button
            onClick={handleNavClick}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
            title={user ? (user.role === 'master' ? 'Administración' : 'Página principal') : 'Iniciar sesión'}
          >
            {user ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="text-accent" style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="text-accent" style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-error/30 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="text-white/60 hover:text-white" style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
