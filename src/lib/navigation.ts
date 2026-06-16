/**
 * Navigation bridge — syncs Zustand view state ↔ React Router.
 *
 * Strategy: a Zustand subscriber watches ALL view changes (from setView,
 * startPrefillMode, loadDiagnosticForReport, resetDiagnostic, etc.)
 * and pushes the corresponding URL. This is more robust than hooking
 * individual actions.
 */

import type { AppView } from '../store/diagnosticStore';

/* ── View ↔ Route mappings ─────────────────────────────── */

const VIEW_TO_ROUTE: Record<AppView, string> = {
  login:        '/login',
  home:         '/',
  wizard:       '/diagnostico',
  result:       '/resultado',
  report:       '/reporte',
  history:      '/clientes',
  dashboard:    '/dashboard',
  org_wizard:   '/estructura',
  org_result:   '/estructura/resultado',
  org_report:   '/estructura/reporte',
  tech_wizard:  '/tecnologia',
  tech_result:  '/tecnologia/resultado',
  tech_report:  '/tecnologia/reporte',
  settings:     '/configuracion',
};

const ROUTE_TO_VIEW: Record<string, AppView> = {};
for (const [view, route] of Object.entries(VIEW_TO_ROUTE)) {
  ROUTE_TO_VIEW[route] = view as AppView;
}

export function viewToRoute(view: AppView): string {
  return VIEW_TO_ROUTE[view] ?? '/';
}

export function routeToView(pathname: string): AppView | null {
  return ROUTE_TO_VIEW[pathname] ?? null;
}

/* ── Shared navigate function ──────────────────────────── */

let _navigate: ((path: string) => void) | null = null;
let _syncing = false; // Guard against bidirectional loops

export function setNavigator(fn: (path: string) => void): void {
  _navigate = fn;
}

/**
 * Called by the Zustand subscriber when the store's `view` changes.
 * Pushes the matching URL via React Router's navigate().
 *
 * NOTE: We intentionally do NOT check _syncing here. The _syncing flag
 * is only for Direction B (URL→store) to know it should skip.
 * Direction A relies on `window.location.pathname !== route` to avoid
 * redundant navigations, which also prevents infinite loops.
 *
 * Checking _syncing here caused a bug: rapid successive view changes
 * (e.g. resetDiagnostic sets 'home', then setView sets 'wizard')
 * would block the second navigate because the first one's syncing flag
 * was still active.
 */
export function syncViewToUrl(view: AppView): void {
  const route = viewToRoute(view);
  if (_navigate && window.location.pathname !== route) {
    _syncing = true;
    _navigate(route);
    setTimeout(() => { _syncing = false; }, 0);
  }
}

/**
 * Called by NavigationSync when the URL changes (back/forward/direct).
 * Returns true if the flag is set (meaning we caused this URL change).
 */
export function isSyncing(): boolean {
  return _syncing;
}

export function setSyncingFlag(v: boolean): void {
  _syncing = v;
}
