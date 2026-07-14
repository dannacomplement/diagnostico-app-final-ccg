import { useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import LoginPage from './pages/LoginPage';
import LoginTransitionOverlay from './components/ui/LoginTransitionOverlay';

const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WizardShell = lazy(() => import('./components/layout/WizardShell'));
const OrgWizardShell = lazy(() => import('./components/layout/OrgWizardShell'));
const TechWizardShell = lazy(() => import('./components/layout/TechWizardShell'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const OrgResultPage = lazy(() => import('./pages/OrgResultPage'));
const OrgReportPage = lazy(() => import('./pages/OrgReportPage'));
const TechResultPage = lazy(() => import('./pages/TechResultPage'));
const TechReportPage = lazy(() => import('./pages/TechReportPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
import { useDiagnosticStore } from './store/diagnosticStore';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { setNavigator, syncViewToUrl, routeToView, isSyncing, setSyncingFlag } from './lib/navigation';

/**
 * NavigationSync — bidirectional bridge between URL and Zustand view state.
 *
 * Direction A (store → URL):
 *   Subscribes to Zustand. When `view` changes for ANY reason
 *   (setView, startPrefillMode, loadDiagnosticForReport, resetDiagnostic, etc.),
 *   pushes the matching URL via React Router navigate().
 *
 * Direction B (URL → store):
 *   Watches location changes (back, forward, direct URL).
 *   Updates the store's `view` to match.
 */
function NavigationSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevViewRef = useRef<string | null>(null);

  // Register the navigate function for the bridge
  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  // Direction A: store view → URL (via Zustand subscribe)
  useEffect(() => {
    const unsub = useDiagnosticStore.subscribe((state, prevState) => {
      if (state.view !== prevState.view) {
        syncViewToUrl(state.view);
      }
    });
    return unsub;
  }, []);

  // Direction B: URL → store view (back/forward/direct access)
  useEffect(() => {
    if (isSyncing()) return; // We triggered this URL change — skip
    const view = routeToView(location.pathname);
    if (view) {
      const currentView = useDiagnosticStore.getState().view;
      if (currentView !== view && prevViewRef.current !== view) {
        setSyncingFlag(true);
        useDiagnosticStore.setState({ view });
        setTimeout(() => setSyncingFlag(false), 0);
      }
    }
    prevViewRef.current = view;
  }, [location.pathname]);

  return null;
}

/**
 * AuthGuard — redirects to /login if not authenticated.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user);
  const isLoading = useAuthStore(s => s.isLoading);

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const isLoading = useAuthStore(s => s.isLoading);
  const initialize = useAuthStore(s => s.initialize);
  const loadSettings = useSettingsStore(s => s.loadSettings);
  const user = useAuthStore(s => s.user);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Load global app settings (logo, etc.)
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Show nothing while loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-pale flex items-center justify-center">
        <p className="text-muted" style={{ fontSize: '14px' }}>Cargando...</p>
      </div>
    );
  }

  const showHeader = !!user;

  return (
    <div className="min-h-screen bg-pale">
      <NavigationSync />
      <LoginTransitionOverlay />
      {showHeader && <Header />}
      <Suspense fallback={<div className="min-h-screen bg-pale flex items-center justify-center"><p className="text-muted" style={{ fontSize: '14px' }}>Cargando...</p></div>}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route path="/" element={<AuthGuard><HomePage /></AuthGuard>} />
          <Route path="/diagnostico" element={<AuthGuard><WizardShell /></AuthGuard>} />
          <Route path="/resultado" element={<AuthGuard><ResultPage /></AuthGuard>} />
          <Route path="/reporte" element={<AuthGuard><ReportPage /></AuthGuard>} />
          <Route path="/clientes" element={<AuthGuard><HistoryPage /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/estructura" element={<AuthGuard><OrgWizardShell /></AuthGuard>} />
          <Route path="/estructura/resultado" element={<AuthGuard><OrgResultPage /></AuthGuard>} />
          <Route path="/estructura/reporte" element={<AuthGuard><OrgReportPage /></AuthGuard>} />
          <Route path="/tecnologia" element={<AuthGuard><TechWizardShell /></AuthGuard>} />
          <Route path="/tecnologia/resultado" element={<AuthGuard><TechResultPage /></AuthGuard>} />
          <Route path="/tecnologia/reporte" element={<AuthGuard><TechReportPage /></AuthGuard>} />
          <Route path="/configuracion" element={<AuthGuard><SettingsPage /></AuthGuard>} />

          {/* Catch-all → redirect to login or home */}
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
