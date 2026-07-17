import { useState, useEffect, useCallback, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Folder, Users, FlaskConical, Settings, Sparkles, CircleCheck, Pencil, Trash2,
  BarChart3, ClipboardList, Building2, Monitor, TriangleAlert, Check, Circle,
  Building, Eye, EyeOff, Palette, X, Info,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { createClientAccount, getAllClientAccounts, deleteClientAccount, updateClientProfile, getExpedienteDataForClients, getPrefillsForClients, getPrefillForUser, deletePrefill, deleteDiagnostic, deleteOrgSurvey, deleteTechSurvey, getTestClientIds, setTestClientIds } from '../lib/storage';
import { ALL_CRITERIA } from '../config/questions';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useOrgSurveyStore } from '../store/orgSurveyStore';
import { useTechSurveyStore } from '../store/techSurveyStore';
import { useBenchmarkStore } from '../store/benchmarkStore';
import { useSettingsStore } from '../store/settingsStore';
import { exportExpediente } from '../lib/exportExpediente';
import { exportToPdf } from '../lib/exportPdf';
import { exportOrgSurveyToPdf } from '../lib/exportOrgPdf';
import { exportTechSurveyToPdf } from '../lib/exportTechPdf';
import { exportToPptx } from '../lib/exportPptx';
import { SECTOR_OPTIONS } from '../config/constants';
import type { SavedDiagnostic, SavedOrgSurvey, SavedTechSurvey, Sector, AppUser, SurveyType, MarginLevel, TechMaturityLevel } from '../lib/types';
import HistoricalComparison from '../components/ui/HistoricalComparison';

function BoolMark({ value }: { value: boolean }) {
  return value
    ? <Check style={{ display: 'inline', width: 'var(--fs-10)', height: 'var(--fs-10)', marginRight: '3px', verticalAlign: '-1px' }} />
    : <Circle style={{ display: 'inline', width: 'var(--fs-10)', height: 'var(--fs-10)', marginRight: '3px', verticalAlign: '-1px' }} />;
}

type AdminTab = 'clientes' | 'expedientes' | 'inactivos_prueba' | 'configuracion';

export default function HistoryPage() {
  const setView = useDiagnosticStore(s => s.setView);
  const user = useAuthStore(s => s.user);

  const [activeTab, setActiveTab] = useState<AdminTab>('expedientes');

  // Accounts state
  const [accounts, setAccounts] = useState<AppUser[]>([]);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState<string | null>(null);

  // Expediente data state
  const [expedienteData, setExpedienteData] = useState<
    Map<string, { diagnostics: SavedDiagnostic[]; orgSurveys: SavedOrgSurvey[]; techSurveys: SavedTechSurvey[] }>
  >(new Map());
  const [loadingExpedientes, setLoadingExpedientes] = useState(true);

  // Prefill tracking — which clients have pending prefills
  const [clientPrefills, setClientPrefills] = useState<Map<string, SurveyType[]>>(new Map());

  // Test client IDs
  const [testClientIds, setTestClientIdsState] = useState<string[]>([]);

  // Settings
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  const refreshAccounts = useCallback(async () => {
    const data = await getAllClientAccounts();
    setAccounts(data);
  }, []);

  const refreshExpedientes = useCallback(async () => {
    setLoadingExpedientes(true);
    const [data, prefills, testIds] = await Promise.all([
      getExpedienteDataForClients(),
      getPrefillsForClients(),
      getTestClientIds(),
    ]);
    setExpedienteData(data);
    setClientPrefills(prefills);
    setTestClientIdsState(testIds);
    setLoadingExpedientes(false);
  }, []);

  useEffect(() => {
    refreshAccounts();
    refreshExpedientes();
  }, [refreshAccounts, refreshExpedientes]);

  async function handleDeleteAccount(accountId: string) {
    await deleteClientAccount(accountId);
    setDeleteAccountConfirm(null);
    await refreshAccounts();
    await refreshExpedientes();
  }

  const TABS: { key: AdminTab; label: string; icon: LucideIcon }[] = [
    { key: 'expedientes', label: 'Expedientes', icon: Folder },
    { key: 'clientes', label: 'Clientes', icon: Users },
    { key: 'inactivos_prueba', label: 'Inactivos / Prueba', icon: FlaskConical },
    { key: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '980px', margin: '0 auto', padding: '36px clamp(16px, 3vw, 24px)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ marginBottom: '28px', gap: '10px' }}>
        <div>
          <h1 className="font-serif text-navy" style={{ fontSize: 'clamp(18px, 4vw, 22px)' }}>Administración y Expedientes</h1>
          <p className="text-muted" style={{ fontSize: 'var(--fs-12)', marginTop: '4px' }}>
            {user?.displayName || 'Complement Consulting Group'}
          </p>
        </div>
        <button
          onClick={() => setView('home')}
          className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
          style={{ padding: '8px 20px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
        >
          ← Página Principal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto" style={{ gap: '4px', marginBottom: '28px', paddingBottom: '2px' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === tab.key
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted hover:text-ink'
            }`}
            style={{ padding: '10px clamp(10px, 2vw, 18px)', fontSize: 'clamp(11px, 2vw, 13px)', background: 'none' }}
          >
            <tab.icon style={{ display: 'inline', width: 'var(--fs-13)', height: 'var(--fs-13)', verticalAlign: '-2px', marginRight: '4px' }} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'expedientes' && (
        <ExpedientesPanel
          accounts={accounts.filter(a => !testClientIds.includes(a.id))}
          expedienteData={expedienteData}
          clientPrefills={clientPrefills}
          loading={loadingExpedientes}
          onRefresh={refreshExpedientes}
        />
      )}

      {activeTab === 'clientes' && (
        <ClientesPanel
          accounts={accounts}
          onCreated={() => { refreshAccounts(); refreshExpedientes(); }}
          showCreate={showCreateAccount}
          setShowCreate={setShowCreateAccount}
          deleteConfirm={deleteAccountConfirm}
          setDeleteConfirm={setDeleteAccountConfirm}
          onDelete={handleDeleteAccount}
        />
      )}

      {activeTab === 'inactivos_prueba' && (
        <DatosPruebaPanel
          accounts={accounts}
          expedienteData={expedienteData}
          clientPrefills={clientPrefills}
          testClientIds={testClientIds}
          onTestIdsChange={setTestClientIdsState}
          onRefresh={refreshExpedientes}
        />
      )}

      {activeTab === 'configuracion' && (
        <ConfiguracionPanel showBenchmarks={showBenchmarks} setShowBenchmarks={setShowBenchmarks} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   EXPEDIENTES PANEL — Card list → Click into client detail
   ══════════════════════════════════════════════════════════ */

const LEVEL_COLORS_EXP: Record<string, string> = {
  Bajo: 'text-error', Medio: 'text-warn', Alto: 'text-success', Avanzado: 'text-success',
};

const MARGIN_LABELS: Record<MarginLevel, { label: string; color: string }> = {
  arriba_industria: { label: 'Arriba', color: 'text-success' },
  en_rango: { label: 'En rango', color: 'text-mid' },
  debajo_industria: { label: 'Debajo', color: 'text-warn' },
  critico: { label: 'Critico', color: 'text-error' },
};

function ExpedientesPanel({
  accounts,
  expedienteData,
  clientPrefills,
  loading,
  onRefresh,
}: {
  accounts: AppUser[];
  expedienteData: Map<string, { diagnostics: SavedDiagnostic[]; orgSurveys: SavedOrgSurvey[]; techSurveys: SavedTechSurvey[] }>;
  clientPrefills: Map<string, SurveyType[]>;
  loading: boolean;
  onRefresh: () => void;
}) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'prospecto'>('todos');
  const [sortBy, setSortBy] = useState<'fecha' | 'nombre' | 'estatus' | 'tamaño'>('fecha');
  const loadDiagnosticForReport = useDiagnosticStore(s => s.loadDiagnosticForReport);
  const loadDiagnosticForEdit = useDiagnosticStore(s => s.loadDiagnosticForEdit);
  const loadOrgSurveyForReport = useOrgSurveyStore(s => s.loadOrgSurveyForReport);
  const loadOrgSurveyForEdit = useOrgSurveyStore(s => s.loadOrgSurveyForEdit);
  const loadTechSurveyForReport = useTechSurveyStore(s => s.loadTechSurveyForReport);
  const loadTechSurveyForEdit = useTechSurveyStore(s => s.loadTechSurveyForEdit);
  const setView = useDiagnosticStore(s => s.setView);

  if (loading) {
    return (
      <div className="text-center" style={{ padding: '48px 0' }}>
        <p className="text-muted" style={{ fontSize: 'var(--fs-14)' }}>Cargando expedientes...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border text-center" style={{ padding: '48px 24px' }}>
        <p className="text-muted" style={{ fontSize: 'var(--fs-13)' }}>No hay clientes registrados aun.</p>
        <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginTop: '8px' }}>Cree cuentas de clientes en la pestana "Clientes".</p>
      </div>
    );
  }

  // Detail view for a selected client
  if (selectedClientId) {
    const acc = accounts.find(a => a.id === selectedClientId);
    if (!acc) { setSelectedClientId(null); return null; }
    const data = expedienteData.get(acc.id) ?? { diagnostics: [], orgSurveys: [], techSurveys: [] };

    const hasDiagPrefill = (clientPrefills.get(acc.id) ?? []).includes('diagnostico_empresarial');

    return (
      <ClientExpedienteDetail
        account={acc}
        data={data}
        hasDiagPrefill={hasDiagPrefill}
        onBack={() => { setSelectedClientId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onDiagExtenso={(d) => { loadDiagnosticForReport(d); }}
        onOrgExtenso={(s) => { loadOrgSurveyForReport(s); setView('org_report'); }}
        onTechExtenso={(s) => { loadTechSurveyForReport(s); setView('tech_report'); }}
        onDiagEdit={(d) => { loadDiagnosticForEdit(d); }}
        onOrgEdit={(s) => { loadOrgSurveyForEdit(s); setView('org_wizard'); }}
        onTechEdit={(s) => { loadTechSurveyForEdit(s); setView('tech_wizard'); }}
        onDeleteDiag={async (id) => { await deleteDiagnostic(id); onRefresh(); }}
        onDeleteOrg={async (id) => { await deleteOrgSurvey(id); onRefresh(); }}
        onDeleteTech={async (id) => { await deleteTechSurvey(id); onRefresh(); }}
        onDeletePrefill={async () => { await deletePrefill(acc.id, 'diagnostico_empresarial'); onRefresh(); }}
      />
    );
  }

  // Client card list
  const statusColors: Record<string, string> = {
    activo: 'bg-success/10 text-success border-success/30',
    inactivo: 'bg-muted/10 text-muted border-border',
    prospecto: 'bg-warn/10 text-warn border-warn/30',
  };

  const filtered = accounts
    .filter(a => statusFilter === 'todos' || (a.status ?? 'activo') === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'nombre') return (a.displayName || '').localeCompare(b.displayName || '');
      if (sortBy === 'estatus') return (a.status ?? 'activo').localeCompare(b.status ?? 'activo');
      if (sortBy === 'tamaño') {
        const tmcA = (expedienteData.get(a.id)?.diagnostics[0]?.companySize?.tmcScore) ?? 0;
        const tmcB = (expedienteData.get(b.id)?.diagnostics[0]?.companySize?.tmcScore) ?? 0;
        return tmcB - tmcA;
      }
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>
          {filtered.length} de {accounts.length} expediente{accounts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center" style={{ gap: '10px', marginBottom: '4px' }}>
        {(['todos', 'activo', 'prospecto'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`font-medium transition-all cursor-pointer border ${statusFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-muted border-border hover:border-navy/30'}`}
            style={{ padding: '5px 14px', borderRadius: '8px', fontSize: 'var(--fs-11)', textTransform: 'capitalize' }}
          >
            {s === 'todos' ? `Todos (${accounts.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${accounts.filter(a => (a.status ?? 'activo') === s).length})`}
          </button>
        ))}

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="bg-white border border-border text-muted cursor-pointer"
          style={{ padding: '5px 10px', borderRadius: '8px', fontSize: 'var(--fs-11)', marginLeft: 'auto' }}
        >
          <option value="fecha">Ordenar: Fecha</option>
          <option value="nombre">Ordenar: Nombre</option>
          <option value="estatus">Ordenar: Estatus</option>
          <option value="tamaño">Ordenar: Tamaño (TMC)</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border text-center" style={{ padding: '48px 24px' }}>
          <p className="text-muted" style={{ fontSize: 'var(--fs-13)' }}>{accounts.length === 0 ? 'No hay clientes registrados aún.' : 'No hay expedientes con este filtro.'}</p>
        </div>
      ) : filtered.map(acc => {
        const data = expedienteData.get(acc.id) ?? { diagnostics: [], orgSurveys: [], techSurveys: [] };
        const diagCount = data.diagnostics.length;
        const orgCount = data.orgSurveys.length;
        const techCount = data.techSurveys.length;
        const hasAnySurvey = diagCount > 0 || orgCount > 0 || techCount > 0;
        const latestDiag = data.diagnostics[0];
        const hasPrefill = (clientPrefills.get(acc.id) ?? []).length > 0;
        const prefilledCount = data.diagnostics.filter(d => d.wasPrefilled === true).length;
        const soloCount = data.diagnostics.filter(d => d.wasPrefilled === false).length;
        const accStatus = acc.status ?? 'activo';

        return (
          <button
            key={acc.id}
            onClick={() => { setSelectedClientId(acc.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-full bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all cursor-pointer text-left group"
            style={{ padding: '20px 24px' }}
          >
            <div className="flex items-center" style={{ gap: '14px' }}>
              <ClientLogo logoUrl={acc.logoUrl} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <h3 className="font-bold text-navy group-hover:text-accent transition-colors truncate" style={{ fontSize: 'var(--fs-15)', marginBottom: '0' }}>
                    {acc.displayName}
                  </h3>
                  <span className={`border font-semibold flex-shrink-0 ${statusColors[accStatus]}`} style={{ padding: '1px 8px', borderRadius: '6px', fontSize: 'var(--fs-9)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {accStatus}
                  </span>
                </div>
                <p className="text-muted truncate" style={{ fontSize: 'var(--fs-11)', marginTop: '2px' }}>
                  {acc.email || acc.username}
                </p>
              </div>

              {/* Quick indicators */}
              <div className="flex items-center flex-shrink-0" style={{ gap: '8px' }}>
                {latestDiag && (
                  <span className={`font-semibold ${LEVEL_COLORS_EXP[latestDiag.profesionalizacion.level] || 'text-muted'}`} style={{ fontSize: 'var(--fs-11)' }}>
                    {latestDiag.profesionalizacion.level}
                  </span>
                )}
                <div className="hidden sm:flex" style={{ gap: '4px' }}>
                  <span className={`font-semibold border ${diagCount > 0 ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border bg-pale text-muted'}`} style={{ fontSize: 'var(--fs-10)', padding: '2px 8px', borderRadius: '6px' }}>
                    {diagCount} diag.
                  </span>
                  <span className={`font-semibold border ${orgCount > 0 ? 'border-mid/30 bg-mid/5 text-mid' : 'border-border bg-pale text-muted'}`} style={{ fontSize: 'var(--fs-10)', padding: '2px 8px', borderRadius: '6px' }}>
                    {orgCount} org.
                  </span>
                  <span className={`font-semibold border ${techCount > 0 ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border bg-pale text-muted'}`} style={{ fontSize: 'var(--fs-10)', padding: '2px 8px', borderRadius: '6px' }}>
                    {techCount} tech.
                  </span>
                </div>
                <span className="text-muted/40 group-hover:text-accent transition-colors" style={{ fontSize: 'var(--fs-16)', marginLeft: '4px' }}>→</span>
              </div>
            </div>

            {/* Status lines */}
            <div style={{ paddingLeft: '58px', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {hasPrefill && (
                <span className="text-accent font-medium inline-flex items-center" style={{ fontSize: 'var(--fs-10)', gap: '3px' }}>
                  <Sparkles style={{ width: 'var(--fs-10)', height: 'var(--fs-10)' }} /> Pre-llenado pendiente
                </span>
              )}
              {prefilledCount > 0 && (
                <span style={{ fontSize: 'var(--fs-10)', color: '#d4922e', fontWeight: 600 }}>
                  {prefilledCount} pre-llenado{prefilledCount > 1 ? 's' : ''}
                </span>
              )}
              {soloCount > 0 && (
                <span style={{ fontSize: 'var(--fs-10)', color: '#6366f1', fontWeight: 600 }}>
                  {soloCount} contestado{soloCount > 1 ? 's' : ''} solo
                </span>
              )}
            </div>
            {!hasAnySurvey && !hasPrefill && (
              <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginTop: '8px', paddingLeft: '58px' }}>
                Sin encuestas completadas
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Client Expediente Detail View ──────────────────────── */

function ClientExpedienteDetail({
  account,
  data,
  hasDiagPrefill,
  onBack,
  onDiagExtenso,
  onOrgExtenso,
  onTechExtenso,
  onDiagEdit,
  onOrgEdit,
  onTechEdit,
  onDeleteDiag,
  onDeleteOrg,
  onDeleteTech,
  onDeletePrefill,
}: {
  account: AppUser;
  data: { diagnostics: SavedDiagnostic[]; orgSurveys: SavedOrgSurvey[]; techSurveys: SavedTechSurvey[] };
  hasDiagPrefill: boolean;
  onBack: () => void;
  onDiagExtenso: (d: SavedDiagnostic) => void;
  onOrgExtenso: (s: SavedOrgSurvey) => void;
  onTechExtenso: (s: SavedTechSurvey) => void;
  onDiagEdit: (d: SavedDiagnostic) => void;
  onOrgEdit: (s: SavedOrgSurvey) => void;
  onTechEdit: (s: SavedTechSurvey) => void;
  onDeleteDiag: (id: string) => Promise<void>;
  onDeleteOrg: (id: string) => Promise<void>;
  onDeleteTech: (id: string) => Promise<void>;
  onDeletePrefill: () => Promise<void>;
}) {
  const [activeSection, setActiveSection] = useState<'resumen' | 'diagnosticos' | 'organizacional' | 'tecnologia'>('resumen');
  const [deletePrefillConfirm, setDeletePrefillConfirm] = useState(false);
  const [deletingPrefill, setDeletingPrefill] = useState(false);
  const startPrefillMode = useDiagnosticStore(s => s.startPrefillMode);
  const editPrefillMode = useDiagnosticStore(s => s.editPrefillMode);
  const diagCount = data.diagnostics.length;
  const orgCount = data.orgSurveys.length;
  const techCount = data.techSurveys.length;
  const latestDiag = data.diagnostics[0];
  const latestOrg = data.orgSurveys[0];
  const latestTech = data.techSurveys[0];
  const companyName = latestDiag?.datosGenerales.nombreComercial || latestOrg?.companyName || account.displayName;

  const hasDiagPerm = (account.surveyPermissions ?? ['diagnostico_empresarial']).includes('diagnostico_empresarial');

  function handleViewExpedientePdf() {
    exportExpediente(companyName, latestDiag, latestOrg, 'view');
  }

  async function handleStartPrefill() {
    if (hasDiagPrefill) {
      const existing = await getPrefillForUser(account.id, 'diagnostico_empresarial');
      if (existing) {
        editPrefillMode(account.id, existing);
        return;
      }
    }
    startPrefillMode(account.id);
  }

  return (
    <div className="animate-fade-up">
      {/* Back + client header */}
      <button
        onClick={onBack}
        className="flex items-center text-accent hover:text-mid transition-colors cursor-pointer"
        style={{ gap: '6px', marginBottom: '20px', fontSize: 'var(--fs-13)', fontWeight: 500, background: 'none', border: 'none', padding: 0 }}
      >
        ← Volver a expedientes
      </button>

      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: 'clamp(18px, 3vw, 28px) clamp(16px, 3vw, 32px)', marginBottom: '20px' }}>
        <div className="flex items-center" style={{ gap: '16px', marginBottom: '20px' }}>
          <ClientLogo logoUrl={account.logoUrl} size={52} />
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-navy truncate" style={{ fontSize: 'clamp(17px, 3vw, 20px)', marginBottom: '2px' }}>{account.displayName}</h2>
            <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>
              {account.email || account.username}
            </p>
          </div>
        </div>

        {/* Export buttons */}
        {(diagCount > 0 || orgCount > 0) && (
          <div className="flex flex-wrap items-center" style={{ gap: '10px', marginBottom: '14px' }}>
            <button
              onClick={handleViewExpedientePdf}
              className="bg-navy text-white font-semibold hover:bg-navy/80 transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px' }}
            >
              Ver Expediente PDF
            </button>
          </div>
        )}

        {/* Pre-fill button */}
        {hasDiagPerm && (
          <div style={{ marginTop: diagCount > 0 || orgCount > 0 ? '0' : '4px' }}>
            {hasDiagPrefill ? (
              /* ── Pre-llenado existe: mostrar tarjeta de estado ── */
              <div className="rounded-xl border-2 border-success/30 bg-success/5" style={{ padding: '16px 20px', marginTop: '10px' }}>
                <div className="flex items-center" style={{ gap: '10px', marginBottom: '10px' }}>
                  <div className="inline-flex items-center justify-center rounded-full bg-success/15 shrink-0" style={{ width: '32px', height: '32px' }}>
                    <CircleCheck className="text-success" style={{ width: 'var(--fs-15)', height: 'var(--fs-15)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-navy" style={{ fontSize: 'var(--fs-13)' }}>Pre-llenado completo</p>
                    <p className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>El cliente vera los datos pre-llenados al contestar la radiografía</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
                  <button
                    onClick={handleStartPrefill}
                    className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer inline-flex items-center"
                    style={{ fontSize: 'var(--fs-11)', padding: '7px 18px', borderRadius: '8px', gap: '5px' }}
                  >
                    <Pencil style={{ width: 'var(--fs-11)', height: 'var(--fs-11)' }} /> Editar pre-llenado
                  </button>
                  {deletePrefillConfirm ? (
                    <span className="flex items-center" style={{ gap: '6px' }}>
                      <span className="text-error font-medium" style={{ fontSize: 'var(--fs-11)' }}>¿Borrar pre-llenado?</span>
                      <button
                        onClick={async () => {
                          setDeletingPrefill(true);
                          await onDeletePrefill();
                          setDeletingPrefill(false);
                          setDeletePrefillConfirm(false);
                        }}
                        disabled={deletingPrefill}
                        className="bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer disabled:opacity-50"
                        style={{ fontSize: 'var(--fs-10)', padding: '5px 12px', borderRadius: '6px' }}
                      >
                        {deletingPrefill ? 'Borrando...' : 'Si, borrar'}
                      </button>
                      <button
                        onClick={() => setDeletePrefillConfirm(false)}
                        className="text-muted font-medium hover:text-ink transition-all cursor-pointer"
                        style={{ fontSize: 'var(--fs-10)', padding: '5px 8px' }}
                      >
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeletePrefillConfirm(true)}
                      className="border border-error/30 text-error font-medium hover:bg-error/5 transition-all cursor-pointer inline-flex items-center"
                      style={{ fontSize: 'var(--fs-11)', padding: '7px 16px', borderRadius: '8px', gap: '5px' }}
                    >
                      <Trash2 style={{ width: 'var(--fs-11)', height: 'var(--fs-11)' }} /> Borrar pre-llenado
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ── No hay pre-llenado: mostrar boton para crear ── */
              <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
                <button
                  onClick={handleStartPrefill}
                  className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer inline-flex items-center"
                  style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px', gap: '5px' }}
                >
                  <Sparkles style={{ width: 'var(--fs-11)', height: 'var(--fs-11)' }} /> Pre-llenar radiografía
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex overflow-x-auto" style={{ gap: '4px', marginBottom: '20px', paddingBottom: '2px' }}>
        {([
          { key: 'resumen' as const, label: 'Resumen Ejecutivo', icon: BarChart3 },
          ...(diagCount > 0 ? [{ key: 'diagnosticos' as const, label: `Radiografías (${diagCount})`, icon: ClipboardList }] : []),
          ...(orgCount > 0 ? [{ key: 'organizacional' as const, label: `Estructura Org. (${orgCount})`, icon: Building2 }] : []),
          ...(techCount > 0 ? [{ key: 'tecnologia' as const, label: `Tecnología (${techCount})`, icon: Monitor }] : []),
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`font-semibold transition-all cursor-pointer rounded-lg shrink-0 ${
              activeSection === tab.key
                ? 'bg-accent text-white shadow-sm'
                : 'bg-white text-muted hover:text-ink border border-border/40'
            }`}
            style={{ padding: '9px clamp(10px, 2vw, 18px)', fontSize: 'clamp(10px, 2vw, 12px)' }}
          >
            <tab.icon style={{ display: 'inline', width: 'var(--fs-13)', height: 'var(--fs-13)', verticalAlign: '-2px', marginRight: '4px' }} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {activeSection === 'resumen' && (
        <ResumenEjecutivoSection
          latestDiag={latestDiag}
          latestOrg={latestOrg}
          latestTech={latestTech}
          onDiagExtenso={onDiagExtenso}
          onOrgExtenso={onOrgExtenso}
          onTechExtenso={onTechExtenso}
        />
      )}

      {activeSection === 'diagnosticos' && (
        <DiagnosticosSection
          diagnostics={data.diagnostics}
          onExtenso={onDiagExtenso}
          onEdit={onDiagEdit}
          onDelete={onDeleteDiag}
        />
      )}

      {activeSection === 'organizacional' && (
        <OrganizacionalSection
          surveys={data.orgSurveys}
          onExtenso={onOrgExtenso}
          onEdit={onOrgEdit}
          onDelete={onDeleteOrg}
        />
      )}

      {activeSection === 'tecnologia' && (
        <TecnologiaSection
          surveys={data.techSurveys}
          onExtenso={onTechExtenso}
          onEdit={onTechEdit}
          onDelete={onDeleteTech}
        />
      )}
    </div>
  );
}

/* ── Resumen Ejecutivo Section ──────────────────────────── */

function ResumenEjecutivoSection({
  latestDiag,
  latestOrg,
  latestTech,
  onDiagExtenso,
  onOrgExtenso,
  onTechExtenso,
}: {
  latestDiag?: SavedDiagnostic;
  latestOrg?: SavedOrgSurvey;
  latestTech?: SavedTechSurvey;
  onDiagExtenso: (d: SavedDiagnostic) => void;
  onOrgExtenso: (s: SavedOrgSurvey) => void;
  onTechExtenso: (s: SavedTechSurvey) => void;
}) {
  if (!latestDiag && !latestOrg && !latestTech) {
    return (
      <div className="bg-white rounded-xl border border-border text-center" style={{ padding: '48px 24px' }}>
        <p className="text-muted" style={{ fontSize: 'var(--fs-13)' }}>Este cliente aun no ha completado ninguna encuesta.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Diagnostic summary */}
      {latestDiag && (
        <>
          <DiagEjecutivoCard diag={latestDiag} onExtenso={onDiagExtenso} />
        </>
      )}

      {/* Org survey summary */}
      {latestOrg && (
        <>
          <OrgEjecutivoCard survey={latestOrg} onExtenso={onOrgExtenso} />
        </>
      )}

      {/* Tech survey summary */}
      {latestTech && (
        <>
          <TechEjecutivoCard survey={latestTech} onExtenso={onTechExtenso} />
        </>
      )}
    </div>
  );
}

/* ── Diagnostic Ejecutivo Card (replaces inline expand) ── */

function DiagEjecutivoCard({ diag, onExtenso }: { diag: SavedDiagnostic; onExtenso: (d: SavedDiagnostic) => void }) {
  const d = diag;
  const lowProfCriteria = d.profesionalizacion.answers
    .filter(a => a.rating >= 0 && a.rating < 5)
    .map(a => {
      const config = ALL_CRITERIA.find(c => c.id === a.criterionId);
      return config ? { label: config.shortLabel, rating: a.rating } : null;
    })
    .filter(Boolean) as { label: string; rating: number }[];

  const lowInstCriteria = d.institucionalizacion.answers
    .filter(a => a.rating >= 0 && a.rating < 5)
    .map(a => {
      const config = ALL_CRITERIA.find(c => c.id === a.criterionId);
      return config ? { label: config.shortLabel, rating: a.rating } : null;
    })
    .filter(Boolean) as { label: string; rating: number }[];

  const isFamily = d.datosGenerales.empresaFamiliar !== 'no';
  const gerenciasCubiertas = d.gerencias.filter(g => g.cubierto).length;

  return (
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ marginBottom: '20px', gap: '10px' }}>
        <div>
          <div className="flex items-center flex-wrap" style={{ gap: '8px', marginBottom: '4px' }}>
            <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: 'var(--fs-10)' }}>Radiografía Empresarial</p>
            {d.wasPrefilled && (
              <span className="inline-flex items-center" style={{ fontSize: 'var(--fs-8)', padding: '2px 8px', borderRadius: '4px', background: '#d4922e15', color: '#d4922e', fontWeight: 700, border: '1px solid #d4922e30', gap: '3px' }}>
                <Sparkles style={{ width: 'var(--fs-9)', height: 'var(--fs-9)' }} /> Pre-llenado
              </span>
            )}
            {d.wasPrefilled === false && (
              <span style={{ fontSize: 'var(--fs-8)', padding: '2px 8px', borderRadius: '4px', background: '#6366f115', color: '#6366f1', fontWeight: 700, border: '1px solid #6366f130' }}>
                Contestado solo
              </span>
            )}
          </div>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>
            {new Date(d.savedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center flex-wrap" style={{ gap: '8px' }}>
          <button
            onClick={() => exportToPptx(d)}
            className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px' }}
            title="Descargar presentacion PowerPoint"
          >
            PPTX
          </button>
          <button
            onClick={() => exportToPdf(d)}
            className="border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px' }}
          >
            PDF
          </button>
          <button
            onClick={() => onExtenso(d)}
            className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-11)', padding: '6px 16px', borderRadius: '8px' }}
          >
            Ver extenso →
          </button>
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '10px', marginBottom: '16px' }}>
        <MiniMetric label="Empresa" value={d.datosGenerales.nombreComercial || '—'} />
        <MiniMetric label="Sector" value={d.datosGenerales.sector === 'manufactura' ? 'Manufactura' : d.datosGenerales.sector === 'comercio' ? 'Comercio' : 'Servicios'} />
        <MiniMetric label="Empleados" value={d.situacionActual.empleadosTotales?.toString() ?? '—'} />
        <MiniMetric label="Ventas Anuales" value={d.situacionActual.ventasAnualesMDP ? `$${d.situacionActual.ventasAnualesMDP} MDP` : '—'} />
      </div>

      {/* Scores */}
      <div className="flex flex-wrap" style={{ gap: '14px', marginBottom: '16px' }}>
        <div className="rounded-xl border border-border/30 bg-pale/50" style={{ padding: 'var(--sp-btn-a)', flex: 1, minWidth: '180px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>Profesionalización</p>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="font-bold text-ink" style={{ fontSize: 'var(--fs-18)' }}>{d.profesionalizacion.average.toFixed(0)}<span className="text-muted font-normal" style={{ fontSize: 'var(--fs-11)' }}>/100</span></span>
            <span className={`font-semibold rounded-full ${
              d.profesionalizacion.level === 'Bajo' ? 'bg-error/15 text-error' :
              d.profesionalizacion.level === 'Medio' ? 'bg-warn/15 text-warn' :
              'bg-success/15 text-success'
            }`} style={{ fontSize: 'var(--fs-10)', padding: '3px 10px' }}>
              {d.profesionalizacion.level}
            </span>
          </div>
          {lowProfCriteria.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <p className="text-muted" style={{ fontSize: 'var(--fs-9)', marginBottom: '4px' }}>Criterios bajos:</p>
              {lowProfCriteria.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between" style={{ fontSize: 'var(--fs-10)', marginBottom: '2px' }}>
                  <span className="text-muted">{c.label}</span>
                  <span className="font-bold text-error">{ratingLabelInline(c.rating)}</span>
                </div>
              ))}
              {lowProfCriteria.length > 3 && (
                <p className="text-muted" style={{ fontSize: 'var(--fs-9)' }}>+{lowProfCriteria.length - 3} mas...</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/30 bg-pale/50" style={{ padding: 'var(--sp-btn-a)', flex: 1, minWidth: '180px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>Institucionalización</p>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="font-bold text-ink" style={{ fontSize: 'var(--fs-18)' }}>{d.institucionalizacion.average.toFixed(0)}<span className="text-muted font-normal" style={{ fontSize: 'var(--fs-11)' }}>/100</span></span>
            <span className={`font-semibold rounded-full ${
              d.institucionalizacion.level === 'Bajo' ? 'bg-error/15 text-error' :
              d.institucionalizacion.level === 'Medio' ? 'bg-warn/15 text-warn' :
              'bg-success/15 text-success'
            }`} style={{ fontSize: 'var(--fs-10)', padding: '3px 10px' }}>
              {d.institucionalizacion.level}
            </span>
          </div>
          {lowInstCriteria.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <p className="text-muted" style={{ fontSize: 'var(--fs-9)', marginBottom: '4px' }}>Criterios bajos:</p>
              {lowInstCriteria.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between" style={{ fontSize: 'var(--fs-10)', marginBottom: '2px' }}>
                  <span className="text-muted">{c.label}</span>
                  <span className="font-bold text-error">{ratingLabelInline(c.rating)}</span>
                </div>
              ))}
              {lowInstCriteria.length > 3 && (
                <p className="text-muted" style={{ fontSize: 'var(--fs-9)' }}>+{lowInstCriteria.length - 3} mas...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Margins */}
      {d.marginEvaluation && d.marginData?.tieneDatosFinancieros && (
        <div style={{ marginBottom: '16px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-9)', marginBottom: '8px' }}>Margenes Financieros</p>
          <div className="flex flex-wrap" style={{ gap: '10px' }}>
            {([
              { key: 'margenBruto' as const, label: 'Bruto' },
              { key: 'margenOperativo' as const, label: 'Operativo' },
              { key: 'margenNeto' as const, label: 'Neto' },
            ]).map(m => {
              const ev = d.marginEvaluation![m.key];
              if (ev.value === null) return null;
              const ml = MARGIN_LABELS[ev.level];
              return (
                <div key={m.key} className="rounded-lg border border-border/30 bg-white text-center" style={{ padding: 'var(--sp-btn-b)', minWidth: '100px' }}>
                  <p className="text-muted" style={{ fontSize: 'var(--fs-9)' }}>{m.label}</p>
                  <p className="font-bold text-ink" style={{ fontSize: 'var(--fs-15)' }}>{ev.value}%</p>
                  <p className={`font-semibold ${ml.color}`} style={{ fontSize: 'var(--fs-9)' }}>{ml.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom row: gerencias, urgencia, family, opportunities */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '10px', marginBottom: '14px' }}>
        <MiniMetric label="Gerencias cubiertas" value={`${gerenciasCubiertas}/${d.gerencias.length}`} />
        <MiniMetric label="Urgencia" value={d.urgenciaLevel} />
        <MiniMetric label="Empresa Familiar" value={isFamily ? 'Sí' : 'No'} />
        <MiniMetric label="Areas Oportunidad" value={d.opportunityAreas.length.toString()} />
      </div>

      {/* Top opportunity areas */}
      {d.opportunityAreas.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>Areas de oportunidad principales</p>
          <div className="flex flex-wrap" style={{ gap: '6px' }}>
            {d.opportunityAreas.slice(0, 4).map(a => (
              <span key={a.serviceArea.id} className={`border font-medium ${
                a.priority === 'alta' ? 'border-error/30 bg-error/5 text-error' :
                a.priority === 'media' ? 'border-warn/30 bg-warn/5 text-warn' :
                'border-mid/30 bg-mid/5 text-mid'
              }`} style={{ fontSize: 'var(--fs-10)', padding: '3px 10px', borderRadius: '6px' }}>
                <a.serviceArea.icon style={{ display: 'inline', width: 'var(--fs-13)', height: 'var(--fs-13)', verticalAlign: '-2px', marginRight: '4px' }} /> {a.serviceArea.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Retos */}
      {d.retos.some(r => r) && (
        <div style={{ marginTop: '12px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>Retos principales</p>
          {d.retos.filter(r => r).slice(0, 3).map((r, i) => (
            <p key={i} className="text-ink" style={{ fontSize: 'var(--fs-11)', marginBottom: '3px' }}>
              <span className="font-semibold text-navy">#{i + 1}</span> {r}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Org Survey Ejecutivo Card ──────────────────────────── */

function OrgEjecutivoCard({ survey, onExtenso }: { survey: SavedOrgSurvey; onExtenso: (s: SavedOrgSurvey) => void }) {
  const s = survey;
  const totalColab = s.areaDetails.reduce((sum, a) => sum + (a.colaboradores ?? 0), 0);
  const totalNomina = s.areaDetails.reduce((sum, a) => sum + (a.colaboradores ?? 0) * (a.sueldoPromedio ?? 0), 0);
  const areasConLider = s.areaDetails.filter(a => a.tieneLider).length;

  const competLabels: Record<string, string> = {
    arriba: 'Arriba del mercado',
    en_rango: 'En rango',
    debajo: 'Debajo del mercado',
    no_se: 'No evaluado',
  };

  return (
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ marginBottom: '20px', gap: '10px' }}>
        <div>
          <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: 'var(--fs-10)', marginBottom: '4px' }}>Estructura Organizacional</p>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>
            {new Date(s.savedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center flex-wrap" style={{ gap: '8px' }}>
          <button
            onClick={() => exportOrgSurveyToPdf(s)}
            className="border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px' }}
          >
            PDF
          </button>
          <button
            onClick={() => onExtenso(s)}
            className="bg-mid text-white font-semibold hover:bg-mid/80 transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-11)', padding: '6px 16px', borderRadius: '8px' }}
          >
            Ver extenso →
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '10px', marginBottom: '16px' }}>
        <MiniMetric label="Colaboradores" value={totalColab.toString()} />
        <MiniMetric label="Nómina Mensual" value={`$${totalNomina.toLocaleString('es-MX')}`} />
        <MiniMetric label="Areas con Lider" value={`${areasConLider}/${s.areaDetails.length}`} />
        <MiniMetric label="Organigrama" value={s.orgStructure.tieneOrganigrama ? 'Sí' : 'No'} />
      </div>

      {/* Structure indicators */}
      <div className="flex flex-wrap" style={{ gap: '8px', marginBottom: '16px' }}>
        <StatusPill
          label="Descripciones de puesto"
          value={s.orgStructure.descripcionesPuesto === 'todas' ? 'Todas' : s.orgStructure.descripcionesPuesto === 'algunas' ? 'Algunas' : 'Ninguna'}
          positive={s.orgStructure.descripcionesPuesto === 'todas'}
          warning={s.orgStructure.descripcionesPuesto === 'algunas'}
        />
        <StatusPill label="Tabulador" value={s.orgStructure.tieneTabulador ? 'Sí' : 'No'} positive={s.orgStructure.tieneTabulador} />
        <StatusPill label="Reclutamiento" value={s.talentProcesses.procesoReclutamiento ? 'Sí' : 'No'} positive={s.talentProcesses.procesoReclutamiento} />
        <StatusPill
          label="Evaluaciones"
          value={s.talentProcesses.evaluacionesDesempeno === 'si' ? 'Sí' : s.talentProcesses.evaluacionesDesempeno === 'parcialmente' ? 'Parcial' : 'No'}
          positive={s.talentProcesses.evaluacionesDesempeno === 'si'}
          warning={s.talentProcesses.evaluacionesDesempeno === 'parcialmente'}
        />
        <StatusPill label="Capacitación" value={s.talentProcesses.programaCapacitacion ? 'Sí' : 'No'} positive={s.talentProcesses.programaCapacitacion} />
      </div>

      {/* Areas detail compact */}
      <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>Detalle por area</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
        {s.areaDetails.map((a, i) => (
          <div key={i} className="flex items-center rounded-md bg-pale/50" style={{ gap: '8px', padding: '6px 12px' }}>
            <span className={`rounded-full ${a.tieneLider ? 'bg-success' : 'bg-error'}`} style={{ width: '6px', height: '6px' }} />
            <span className="flex-1 text-ink font-medium" style={{ fontSize: 'var(--fs-11)' }}>{a.nombre || 'Sin nombre'}</span>
            <span className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>{a.colaboradores ?? 0} colab.</span>
            <span className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>
              {a.sueldoPromedio ? `$${a.sueldoPromedio.toLocaleString('es-MX')}` : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '10px' }}>
        <MiniMetric label="Rotación Anual" value={s.talentProcesses.rotacionAnual !== null ? `${s.talentProcesses.rotacionAnual}%` : '—'} />
        <MiniMetric label="Competitividad Sueldos" value={competLabels[s.talentProcesses.competitividadSueldos] || '—'} />
        {s.talentProcesses.retoCapitalHumano && (
          <div className="rounded-lg bg-pale/50 border border-border/30" style={{ padding: '8px 12px', gridColumn: '1 / -1' }}>
            <p className="text-muted" style={{ fontSize: 'var(--fs-9)', marginBottom: '2px' }}>Reto principal</p>
            <p className="text-ink" style={{ fontSize: 'var(--fs-11)' }}>{s.talentProcesses.retoCapitalHumano}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Diagnosticos Section (list of all diagnostics) ──── */

function DiagnosticosSection({
  diagnostics,
  onExtenso,
  onEdit,
  onDelete,
}: {
  diagnostics: SavedDiagnostic[];
  onExtenso: (d: SavedDiagnostic) => void;
  onEdit: (d: SavedDiagnostic) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    await onDelete(id);
    setDeleting(false);
    setDeleteConfirm(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <HistoricalComparison diagnostics={diagnostics} />
      {diagnostics.map(d => (
        <div key={d.id} className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '20px 24px' }}>
          <div className="flex items-center flex-wrap" style={{ gap: '12px', marginBottom: '12px' }}>
            <span className="flex-1 font-semibold text-navy" style={{ fontSize: 'var(--fs-14)' }}>
              {d.datosGenerales.nombreComercial || 'Sin nombre'}
            </span>
            {d.wasPrefilled && (
              <span className="inline-flex items-center" style={{ fontSize: 'var(--fs-9)', padding: '3px 9px', borderRadius: '6px', background: '#d4922e15', color: '#d4922e', fontWeight: 700, border: '1px solid #d4922e30', gap: '3px' }}>
                <Sparkles style={{ width: 'var(--fs-10)', height: 'var(--fs-10)' }} /> Pre-llenado
              </span>
            )}
            {d.wasPrefilled === false && (
              <span style={{ fontSize: 'var(--fs-9)', padding: '3px 9px', borderRadius: '6px', background: '#6366f115', color: '#6366f1', fontWeight: 700, border: '1px solid #6366f130' }}>
                Contestado solo
              </span>
            )}
            <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>
              {new Date(d.savedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="border border-accent/30 bg-accent/5 text-accent font-bold" style={{ fontSize: 'var(--fs-10)', padding: '3px 10px', borderRadius: '8px' }}>
              {d.companySize.size}
            </span>
            <span className={`font-semibold ${LEVEL_COLORS_EXP[d.profesionalizacion.level] || ''}`} style={{ fontSize: 'var(--fs-11)' }}>
              Prof: {d.profesionalizacion.level}
            </span>
          </div>
          <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
            <button
              onClick={() => onExtenso(d)}
              className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-11)', padding: '7px 18px', borderRadius: '8px' }}
            >
              Ver extenso →
            </button>
            <button
              onClick={() => exportToPptx(d)}
              className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px' }}
              title="Presentacion PowerPoint"
            >
              PPTX
            </button>
            <button
              onClick={() => exportToPdf(d)}
              className="border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px' }}
            >
              PDF
            </button>
            <button
              onClick={() => onEdit(d)}
              className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer inline-flex items-center"
              style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px', gap: '5px' }}
            >
              <Pencil style={{ width: 'var(--fs-11)', height: 'var(--fs-11)' }} /> Editar
            </button>
            {deleteConfirm === d.id ? (
              <span className="flex items-center" style={{ gap: '6px' }}>
                <span className="text-error font-medium" style={{ fontSize: 'var(--fs-11)' }}>Eliminar?</span>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deleting}
                  className="bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer disabled:opacity-50"
                  style={{ fontSize: 'var(--fs-10)', padding: '5px 12px', borderRadius: '6px' }}
                >
                  {deleting ? 'Eliminando...' : 'Si, eliminar'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-muted font-medium hover:text-ink transition-all cursor-pointer"
                  style={{ fontSize: 'var(--fs-10)', padding: '5px 8px' }}
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                onClick={() => setDeleteConfirm(d.id)}
                className="text-muted hover:text-error font-medium transition-all cursor-pointer"
                style={{ fontSize: 'var(--fs-11)', padding: '7px 10px', borderRadius: '8px' }}
              >
                <Trash2 style={{ width: 'var(--fs-13)', height: 'var(--fs-13)' }} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Organizacional Section (list of all org surveys) ── */

function OrganizacionalSection({
  surveys,
  onExtenso,
  onEdit,
  onDelete,
}: {
  surveys: SavedOrgSurvey[];
  onExtenso: (s: SavedOrgSurvey) => void;
  onEdit: (s: SavedOrgSurvey) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    await onDelete(id);
    setDeleting(false);
    setDeleteConfirm(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {surveys.map(s => {
        const totalColab = s.areaDetails.reduce((sum, a) => sum + (a.colaboradores ?? 0), 0);
        return (
          <div key={s.id} className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '20px 24px' }}>
            <div className="flex items-center flex-wrap" style={{ gap: '12px', marginBottom: '12px' }}>
              <span className="flex-1 font-semibold text-navy" style={{ fontSize: 'var(--fs-14)' }}>
                {s.companyName || 'Sin nombre'}
              </span>
              <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>
                {new Date(s.savedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="border border-mid/30 bg-mid/5 text-mid font-bold" style={{ fontSize: 'var(--fs-10)', padding: '3px 10px', borderRadius: '8px' }}>
                {totalColab} colab.
              </span>
              <span className="text-muted font-semibold" style={{ fontSize: 'var(--fs-11)' }}>{s.areaDetails.length} areas</span>
            </div>
            <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
              <button
                onClick={() => onExtenso(s)}
                className="bg-mid text-white font-semibold hover:bg-mid/80 transition-all cursor-pointer"
                style={{ fontSize: 'var(--fs-11)', padding: '7px 18px', borderRadius: '8px' }}
              >
                Ver extenso →
              </button>
              <button
                onClick={() => exportOrgSurveyToPdf(s)}
                className="border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
                style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px' }}
              >
                Descargar PDF
              </button>
              <button
                onClick={() => onEdit(s)}
                className="border border-mid text-mid font-semibold hover:bg-mid/5 transition-all cursor-pointer inline-flex items-center"
                style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px', gap: '5px' }}
              >
                <Pencil style={{ width: 'var(--fs-11)', height: 'var(--fs-11)' }} /> Editar
              </button>
              {deleteConfirm === s.id ? (
                <span className="flex items-center" style={{ gap: '6px' }}>
                  <span className="text-error font-medium" style={{ fontSize: 'var(--fs-11)' }}>Eliminar?</span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting}
                    className="bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer disabled:opacity-50"
                    style={{ fontSize: 'var(--fs-10)', padding: '5px 12px', borderRadius: '6px' }}
                  >
                    {deleting ? 'Eliminando...' : 'Si, eliminar'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="text-muted font-medium hover:text-ink transition-all cursor-pointer"
                    style={{ fontSize: 'var(--fs-10)', padding: '5px 8px' }}
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(s.id)}
                  className="text-muted hover:text-error font-medium transition-all cursor-pointer"
                  style={{ fontSize: 'var(--fs-11)', padding: '7px 10px', borderRadius: '8px' }}
                >
                  <Trash2 style={{ width: 'var(--fs-13)', height: 'var(--fs-13)' }} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Rating label helper ──────────────────────────────── */

function ratingLabelInline(r: number): string { return r <= 0 ? 'Bajo' : r <= 5 ? 'Medio' : 'Alto'; }

/* ── Shared mini components for ejecutivo ──────────────────── */

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white border border-border/30 text-center" style={{ padding: '10px 8px' }}>
      <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-8)', marginBottom: '3px' }}>{label}</p>
      <p className="font-bold text-ink" style={{ fontSize: 'var(--fs-12)' }}>{value}</p>
    </div>
  );
}

function StatusPill({ label, value, positive, warning }: { label: string; value: string; positive: boolean; warning?: boolean }) {
  return (
    <span className={`border font-medium ${
      positive ? 'border-success/30 bg-success/5 text-success' :
      warning ? 'border-warn/30 bg-warn/5 text-warn' :
      'border-error/30 bg-error/5 text-error'
    }`} style={{ fontSize: 'var(--fs-10)', padding: '4px 10px', borderRadius: '6px' }}>
      {label}: {value}
    </span>
  );
}

/* ── Tech Ejecutivo Card ───────────────────────────────── */

const MATURITY_COLORS_EXP: Record<TechMaturityLevel, string> = {
  basico: 'text-error',
  intermedio: 'text-warn',
  avanzado: 'text-success',
  lider_digital: 'text-accent',
};
const MATURITY_LABELS_EXP: Record<TechMaturityLevel, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  lider_digital: 'Líder Digital',
};

function TechEjecutivoCard({ survey, onExtenso }: { survey: SavedTechSurvey; onExtenso: (s: SavedTechSurvey) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)' }}>
      <div className="flex items-center" style={{ gap: '12px', marginBottom: '16px' }}>
        <div className="inline-flex items-center justify-center rounded-full bg-accent/10 shrink-0" style={{ width: '36px', height: '36px' }}>
          <Monitor className="text-accent" style={{ width: 'var(--fs-16)', height: 'var(--fs-16)' }} />
        </div>
        <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)' }}>Prueba de Tecnología</h3>
        <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>
          {new Date(survey.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="flex flex-wrap" style={{ gap: '14px', marginBottom: '16px' }}>
        <div>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-9)', marginBottom: '2px' }}>Score</p>
          <p className={`font-bold ${MATURITY_COLORS_EXP[survey.maturityLevel]}`} style={{ fontSize: 'var(--fs-18)' }}>
            {survey.maturityScore}<span className="text-muted font-normal" style={{ fontSize: 'var(--fs-11)' }}>/100</span>
          </p>
        </div>
        <div>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-9)', marginBottom: '2px' }}>Nivel</p>
          <p className={`font-bold ${MATURITY_COLORS_EXP[survey.maturityLevel]}`} style={{ fontSize: 'var(--fs-13)' }}>
            {MATURITY_LABELS_EXP[survey.maturityLevel]}
          </p>
        </div>
        <div className="flex flex-wrap" style={{ gap: '6px' }}>
          <StatusPill label="ERP" value={survey.tools.tieneERP ? 'Sí' : 'No'} positive={survey.tools.tieneERP} />
          <StatusPill label="CRM" value={survey.tools.tieneCRM ? 'Sí' : 'No'} positive={survey.tools.tieneCRM} />
          <StatusPill label="IA" value={survey.aiAdoption.usaIAEnEmpresa ? 'Sí' : 'No'} positive={survey.aiAdoption.usaIAEnEmpresa} />
          <StatusPill label="Nube" value={survey.security.usaNube ? 'Sí' : 'No'} positive={survey.security.usaNube} />
        </div>
      </div>

      <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
        <button
          onClick={() => onExtenso(survey)}
          className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
          style={{ fontSize: 'var(--fs-11)', padding: '7px 16px', borderRadius: '8px' }}
        >
          Reporte Extenso
        </button>
        <button
          onClick={() => exportTechSurveyToPdf(survey)}
          className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
          style={{ fontSize: 'var(--fs-11)', padding: '7px 16px', borderRadius: '8px' }}
        >
          PDF
        </button>
      </div>
    </div>
  );
}

/* ── Tecnología Section (list all tech surveys) ────────── */

function TecnologiaSection({
  surveys,
  onExtenso,
  onEdit,
  onDelete,
}: {
  surveys: SavedTechSurvey[];
  onExtenso: (s: SavedTechSurvey) => void;
  onEdit: (s: SavedTechSurvey) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    await onDelete(id);
    setDeleting(false);
    setDeleteConfirm(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {surveys.map((survey, i) => (
        <div key={survey.id} className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '24px 28px' }}>
          <div className="flex items-start justify-between" style={{ marginBottom: '14px' }}>
            <div>
              <h4 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)', marginBottom: '4px' }}>
                Prueba #{surveys.length - i}
                <span className="text-muted font-normal" style={{ fontSize: 'var(--fs-11)', marginLeft: '8px' }}>
                  {new Date(survey.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </h4>
            </div>
            <div className={`rounded-lg border text-center ${
              survey.maturityLevel === 'basico' ? 'border-error/20 bg-error/5 text-error' :
              survey.maturityLevel === 'intermedio' ? 'border-warn/20 bg-warn/5 text-warn' :
              survey.maturityLevel === 'avanzado' ? 'border-success/20 bg-success/5 text-success' :
              'border-accent/20 bg-accent/5 text-accent'
            }`} style={{ padding: 'var(--sp-btn-d)' }}>
              <p className="font-bold" style={{ fontSize: 'var(--fs-16)' }}>{survey.maturityScore}</p>
              <p className="font-medium" style={{ fontSize: 'var(--fs-9)' }}>{MATURITY_LABELS_EXP[survey.maturityLevel]}</p>
            </div>
          </div>

          <div className="flex flex-wrap" style={{ gap: '6px', marginBottom: '14px' }}>
            <StatusPill label="ERP" value={survey.tools.tieneERP ? 'Sí' : 'No'} positive={survey.tools.tieneERP} />
            <StatusPill label="CRM" value={survey.tools.tieneCRM ? 'Sí' : 'No'} positive={survey.tools.tieneCRM} />
            <StatusPill label="IA" value={survey.aiAdoption.usaIAEnEmpresa ? 'Sí' : 'No'} positive={survey.aiAdoption.usaIAEnEmpresa} />
            <StatusPill label="KPIs" value={survey.dataAnalytics.tieneKPIs ? 'Sí' : 'No'} positive={survey.dataAnalytics.tieneKPIs} />
            <StatusPill label="Nube" value={survey.security.usaNube ? 'Sí' : 'No'} positive={survey.security.usaNube} />
            <StatusPill label="Equipo TI" value={survey.culture.equipoTI ? 'Sí' : 'No'} positive={survey.culture.equipoTI} />
          </div>

          <div className="flex flex-wrap" style={{ gap: '8px' }}>
            <button
              onClick={() => onExtenso(survey)}
              className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-11)', padding: '7px 16px', borderRadius: '8px' }}
            >
              Reporte Extenso
            </button>
            <button
              onClick={() => exportTechSurveyToPdf(survey)}
              className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-11)', padding: '7px 16px', borderRadius: '8px' }}
            >
              PDF
            </button>
            <button
              onClick={() => onEdit(survey)}
              className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer inline-flex items-center"
              style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px', gap: '5px' }}
            >
              <Pencil style={{ width: 'var(--fs-11)', height: 'var(--fs-11)' }} /> Editar
            </button>
            {deleteConfirm === survey.id ? (
              <span className="flex items-center" style={{ gap: '6px' }}>
                <span className="text-error font-medium" style={{ fontSize: 'var(--fs-11)' }}>Eliminar?</span>
                <button
                  onClick={() => handleDelete(survey.id)}
                  disabled={deleting}
                  className="bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer disabled:opacity-50"
                  style={{ fontSize: 'var(--fs-10)', padding: '5px 12px', borderRadius: '6px' }}
                >
                  {deleting ? 'Eliminando...' : 'Si, eliminar'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-muted font-medium hover:text-ink transition-all cursor-pointer"
                  style={{ fontSize: 'var(--fs-10)', padding: '5px 8px' }}
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                onClick={() => setDeleteConfirm(survey.id)}
                className="text-muted hover:text-error font-medium transition-all cursor-pointer"
                style={{ fontSize: 'var(--fs-11)', padding: '7px 10px', borderRadius: '8px' }}
              >
                <Trash2 style={{ width: 'var(--fs-13)', height: 'var(--fs-13)' }} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CLIENTES PANEL
   ══════════════════════════════════════════════════════════ */

function ClientesPanel({
  accounts,
  onCreated,
  showCreate,
  setShowCreate,
  deleteConfirm,
  setDeleteConfirm,
  onDelete,
}: {
  accounts: AppUser[];
  onCreated: () => void;
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
  deleteConfirm: string | null;
  setDeleteConfirm: (v: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'prospecto'>('todos');
  const [sortBy, setSortBy] = useState<'fecha' | 'nombre' | 'estatus'>('fecha');

  const filtered = accounts
    .filter(a => statusFilter === 'todos' || (a.status ?? 'activo') === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'nombre') return (a.displayName || '').localeCompare(b.displayName || '');
      if (sortBy === 'estatus') return (a.status ?? 'activo').localeCompare(b.status ?? 'activo');
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });

  const statusColors: Record<string, string> = {
    activo: 'bg-success/10 text-success border-success/30',
    inactivo: 'bg-muted/10 text-muted border-border',
    prospecto: 'bg-warn/10 text-warn border-warn/30',
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>
          {filtered.length} de {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
          style={{ padding: '8px 20px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
        >
          + Crear cuenta
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center" style={{ gap: '10px', marginBottom: '16px' }}>
        {/* Status filter pills */}
        {(['todos', 'activo', 'prospecto'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`font-medium transition-all cursor-pointer border ${statusFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-muted border-border hover:border-navy/30'}`}
            style={{ padding: '5px 14px', borderRadius: '8px', fontSize: 'var(--fs-11)', textTransform: 'capitalize' }}
          >
            {s === 'todos' ? `Todos (${accounts.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${accounts.filter(a => (a.status ?? 'activo') === s).length})`}
          </button>
        ))}

        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="bg-white border border-border text-muted cursor-pointer"
          style={{ padding: '5px 10px', borderRadius: '8px', fontSize: 'var(--fs-11)', marginLeft: 'auto' }}
        >
          <option value="fecha">Ordenar: Fecha</option>
          <option value="nombre">Ordenar: Nombre</option>
          <option value="estatus">Ordenar: Estatus</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border text-center" style={{ padding: '48px 24px' }}>
          <p className="text-muted" style={{ fontSize: 'var(--fs-13)' }}>{accounts.length === 0 ? 'No hay cuentas de clientes creadas aún.' : 'No hay clientes con este filtro.'}</p>
          {accounts.length === 0 && <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginTop: '8px' }}>Crea una cuenta para que tus clientes puedan acceder a sus encuestas.</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
              statusColors={statusColors}
              onDeleteRequest={() => setDeleteConfirm(acc.id)}
              onUpdated={onCreated}
            />
          ))}
        </div>
      )}

      {/* Create account modal */}
      {showCreate && (
        <CreateAccountModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); onCreated(); }}
        />
      )}

      {/* Delete account confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-border max-w-md sm:max-w-lg lg:max-w-xl w-full text-center animate-fade-up" style={{ padding: '40px 32px', margin: '0 16px' }}>
            <div className="inline-flex items-center justify-center rounded-full bg-error/10" style={{ width: '48px', height: '48px', marginBottom: '20px' }}>
              <TriangleAlert className="text-error" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
            </div>
            <h3 className="font-serif text-navy" style={{ fontSize: 'var(--fs-18)', marginBottom: '10px' }}>¿Eliminar cuenta de cliente?</h3>
            <p className="text-muted" style={{ fontSize: 'var(--fs-13)', marginBottom: '28px' }}>
              Se eliminarán la cuenta y <strong>todas sus radiografías</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex" style={{ gap: '14px' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-border font-medium text-muted hover:text-ink transition-all cursor-pointer"
                style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-13)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => onDelete(deleteConfirm)}
                className="flex-1 rounded-xl bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer"
                style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-13)' }}
              >
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Account Card ─────────────────────────────────────────── */

function AccountCard({
  account,
  statusColors,
  onDeleteRequest,
  onUpdated,
}: {
  account: AppUser;
  statusColors: Record<string, string>;
  onDeleteRequest: () => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const perms = account.surveyPermissions ?? ['diagnostico_empresarial'];
  const hasDiag = perms.includes('diagnostico_empresarial');
  const hasOrg = perms.includes('estructura_organizacional');
  const hasTech = perms.includes('prueba_tecnologia');
  const status = account.status ?? 'activo';

  async function handleStatusChange(newStatus: string) {
    await updateClientProfile(account.id, { status: newStatus });
    setChangingStatus(false);
    onUpdated();
  }

  return (
    <>
      <div
        className="bg-white rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        style={{ padding: '20px 24px' }}
        onClick={() => setEditing(true)}
      >
        <div className="flex items-center" style={{ gap: '16px', marginBottom: '12px' }}>
          <ClientLogo logoUrl={account.logoUrl} size={44} />
          <div className="flex-1">
            <div className="flex items-center" style={{ gap: '8px' }}>
              <p className="font-semibold text-ink" style={{ fontSize: 'var(--fs-14)' }}>{account.displayName}</p>
              {/* Status badge - clickable */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setChangingStatus(!changingStatus); }}
                  className={`border font-semibold transition-all cursor-pointer ${statusColors[status] || statusColors.activo}`}
                  style={{ padding: '2px 10px', borderRadius: '6px', fontSize: 'var(--fs-9)', textTransform: 'uppercase', letterSpacing: '0.03em' }}
                >
                  {status}
                </button>
                {changingStatus && (
                  <div
                    className="absolute z-20 bg-white rounded-lg border border-border shadow-lg"
                    style={{ top: '100%', left: 0, marginTop: '4px', padding: '4px', minWidth: '120px' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {(['activo', 'inactivo', 'prospecto'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left font-medium transition-colors cursor-pointer hover:bg-pale rounded-md ${s === status ? 'text-navy' : 'text-muted'}`}
                        style={{ padding: '6px 10px', fontSize: 'var(--fs-11)', textTransform: 'capitalize' }}
                      >
                        {s === status && <Check style={{ display: 'inline', width: 'var(--fs-11)', height: 'var(--fs-11)', marginRight: '4px', verticalAlign: '-1px' }} />}{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginTop: '2px' }}>
              {account.email || account.username}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="text-accent hover:text-mid transition-colors cursor-pointer"
            style={{ padding: '6px', fontSize: 'var(--fs-13)' }}
            title="Editar perfil"
          >
            <Pencil style={{ width: 'var(--fs-13)', height: 'var(--fs-13)' }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(); }}
            className="text-muted hover:text-error transition-colors cursor-pointer"
            style={{ padding: '6px', fontSize: 'var(--fs-13)' }}
            title="Eliminar cuenta"
          >
            <Trash2 style={{ width: 'var(--fs-13)', height: 'var(--fs-13)' }} />
          </button>
        </div>

        {/* Permission badges (read-only summary) */}
        <div className="flex items-center flex-wrap" style={{ gap: '8px', paddingLeft: '60px' }}>
          <span className={`border font-medium ${hasDiag ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border bg-pale text-muted'}`} style={{ padding: '3px 10px', borderRadius: '8px', fontSize: 'var(--fs-10)' }}>
            <BoolMark value={hasDiag} /> Radiografía
          </span>
          <span className={`border font-medium ${hasOrg ? 'border-mid/30 bg-mid/5 text-mid' : 'border-border bg-pale text-muted'}`} style={{ padding: '3px 10px', borderRadius: '8px', fontSize: 'var(--fs-10)' }}>
            <BoolMark value={hasOrg} /> Estructura Org.
          </span>
          <span className={`border font-medium ${hasTech ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border bg-pale text-muted'}`} style={{ padding: '3px 10px', borderRadius: '8px', fontSize: 'var(--fs-10)' }}>
            <BoolMark value={hasTech} /> Tecnología
          </span>
        </div>
      </div>

      {editing && (
        <EditAccountModal
          account={account}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onUpdated(); }}
        />
      )}
    </>
  );
}

/* ── Edit Account Modal ─────────────────────────────────── */

function EditAccountModal({ account, onClose, onSaved }: { account: AppUser; onClose: () => void; onSaved: () => void }) {
  const [displayName, setDisplayName] = useState(account.displayName);
  const [username, setUsername] = useState(account.username ?? '');
  const [email, setEmail] = useState(account.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permDiag, setPermDiag] = useState((account.surveyPermissions ?? ['diagnostico_empresarial']).includes('diagnostico_empresarial'));
  const [permOrg, setPermOrg] = useState((account.surveyPermissions ?? []).includes('estructura_organizacional'));
  const [permTech, setPermTech] = useState((account.surveyPermissions ?? []).includes('prueba_tecnologia'));
  const [statusVal, setStatusVal] = useState<string>(account.status ?? 'activo');
  const [logoPreview, setLogoPreview] = useState<string | null>(account.logoUrl ?? null);
  const [logoChanged, setLogoChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('El archivo debe ser una imagen.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no debe exceder 5MB.'); return; }
    try {
      const base64 = await resizeImageToBase64(file, 200);
      setLogoPreview(base64);
      setLogoChanged(true);
      setError('');
    } catch { setError('Error al procesar la imagen.'); }
  }

  function handleRemoveLogo() {
    setLogoPreview(null);
    setLogoChanged(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) { setError('El nombre de usuario es obligatorio.'); return; }
    if (!/^[a-z0-9._-]+$/i.test(username.trim())) { setError('El usuario solo puede contener letras, números, puntos, guiones y guiones bajos.'); return; }
    if (!email.trim()) { setError('El correo electronico es obligatorio.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('El formato del correo electronico no es valido.'); return; }
    if (!permDiag && !permOrg && !permTech) { setError('Debe seleccionar al menos una encuesta.'); return; }

    setSaving(true);
    setError('');

    const permissions: SurveyType[] = [];
    if (permDiag) permissions.push('diagnostico_empresarial');
    if (permOrg) permissions.push('estructura_organizacional');
    if (permTech) permissions.push('prueba_tecnologia');

    const updates: Parameters<typeof updateClientProfile>[1] = {
      displayName: displayName.trim() || username.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      permissions,
      status: statusVal,
    };
    if (password.trim()) updates.password = password.trim();
    if (logoChanged) updates.logoUrl = logoPreview;

    const ok = await updateClientProfile(account.id, updates);
    setSaving(false);

    if (ok) {
      onSaved();
    } else {
      setError('Error al guardar. Es posible que el usuario ya exista.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-border max-w-md sm:max-w-lg lg:max-w-xl w-full animate-fade-up" style={{ padding: '40px 32px', margin: '0 16px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 className="font-serif text-navy" style={{ fontSize: 'var(--fs-18)', marginBottom: '6px' }}>Editar Perfil de Cliente</h3>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)', marginBottom: '28px' }}>
          Modifique los datos de la cuenta. Deje la contraseña vacía para no cambiarla.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Logo */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '10px' }}>Logo de la empresa</label>
            <div className="flex items-center" style={{ gap: '16px' }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="rounded-xl object-cover" style={{ width: '64px', height: '64px', border: '2px solid var(--color-border)' }} />
              ) : (
                <div className="flex items-center justify-center rounded-xl bg-pale border-2 border-dashed border-border" style={{ width: '64px', height: '64px' }}>
                  <Building className="text-muted" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
                </div>
              )}
              <div className="flex-1">
                <label className="inline-block border border-accent text-accent font-medium hover:bg-accent/5 transition-all cursor-pointer" style={{ padding: '7px 16px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}>
                  {logoPreview ? 'Cambiar' : 'Subir logo'}
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
                {logoPreview && (
                  <button type="button" onClick={handleRemoveLogo} className="text-muted hover:text-error transition-colors cursor-pointer" style={{ fontSize: 'var(--fs-11)', marginLeft: '10px' }}>
                    Quitar
                  </button>
                )}
                <p className="text-muted" style={{ fontSize: 'var(--fs-10)', marginTop: '4px' }}>PNG, JPG. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px' }}>Nombre del Cliente</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="input-field" placeholder="Ej: Empresa ABC" style={{ fontSize: 'var(--fs-13)' }} />
          </div>

          {/* Username */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px' }}>Usuario *</label>
            <input type="text" value={username} onChange={e => { setUsername(e.target.value.replace(/\s/g, '')); setError(''); }} className="input-field" placeholder="Ej: empresa_abc" style={{ fontSize: 'var(--fs-13)' }} />
            <p className="text-muted" style={{ fontSize: 'var(--fs-10)', marginTop: '4px' }}>Se usa para inicio de sesión. Solo letras, números, puntos y guiones.</p>
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px' }}>Correo electronico *</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} className="input-field" placeholder="Ej: contacto@empresa.com" style={{ fontSize: 'var(--fs-13)' }} />
            <p className="text-muted" style={{ fontSize: 'var(--fs-10)', marginTop: '4px' }}>Se usa para inicio de sesión y envío de reportes.</p>
          </div>

          {/* Password */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px' }}>
              Contraseña <span className="text-muted font-normal">(dejar vacío para no cambiar)</span>
            </label>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="input-field flex-1"
                placeholder="Nueva contraseña"
                style={{ fontSize: 'var(--fs-13)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted hover:text-ink transition-colors cursor-pointer"
                style={{ padding: '8px', fontSize: 'var(--fs-14)' }}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff style={{ width: 'var(--fs-14)', height: 'var(--fs-14)' }} /> : <Eye style={{ width: 'var(--fs-14)', height: 'var(--fs-14)' }} />}
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '10px' }}>Encuestas habilitadas *</label>
            <div className="flex flex-wrap" style={{ gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPermDiag(!permDiag)}
                className={`border font-medium transition-all cursor-pointer ${permDiag ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'}`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
              >
                <BoolMark value={permDiag} /> Radiografía Empresarial
              </button>
              <button
                type="button"
                onClick={() => setPermOrg(!permOrg)}
                className={`border font-medium transition-all cursor-pointer ${permOrg ? 'border-mid bg-mid/10 text-mid' : 'border-border bg-pale text-muted'}`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
              >
                <BoolMark value={permOrg} /> Estructura Organizacional
              </button>
              <button
                type="button"
                onClick={() => setPermTech(!permTech)}
                className={`border font-medium transition-all cursor-pointer ${permTech ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'}`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
              >
                <BoolMark value={permTech} /> Prueba de Tecnologia
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '10px' }}>Estatus del cliente</label>
            <div className="flex flex-wrap" style={{ gap: '10px' }}>
              {([
                { value: 'activo', label: 'Activo', colors: 'border-success bg-success/10 text-success' },
                { value: 'inactivo', label: 'Inactivo', colors: 'border-border bg-pale text-muted' },
                { value: 'prospecto', label: 'Prospecto', colors: 'border-warn bg-warn/10 text-warn' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusVal(opt.value)}
                  className={`border font-medium transition-all cursor-pointer ${statusVal === opt.value ? opt.colors : 'border-border bg-pale text-muted'}`}
                  style={{ padding: '8px 16px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
                >
                  <BoolMark value={statusVal === opt.value} /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-error text-center" style={{ fontSize: 'var(--fs-12)' }}>{error}</p>}

          <div className="flex" style={{ gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border font-medium text-muted hover:text-ink transition-all cursor-pointer" style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-13)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer disabled:opacity-50" style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-13)' }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Create Account Modal ────────────────────────────────── */

/* ── Image resize helper ─────────────────────────────────── */

function resizeImageToBase64(file: File, maxSize: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
        } else {
          if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Client Logo Avatar ──────────────────────────────────── */

function ClientLogo({ logoUrl, size = 44 }: { logoUrl?: string; size?: number }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo"
        className="rounded-full object-cover shrink-0"
        style={{ width: `${size}px`, height: `${size}px`, border: '2px solid var(--color-border)' }}
      />
    );
  }
  return (
    <div className="flex items-center justify-center rounded-full bg-navy/10 shrink-0" style={{ width: `${size}px`, height: `${size}px` }}>
      <svg xmlns="http://www.w3.org/2000/svg" className="text-navy" style={{ width: `${Math.round(size * 0.45)}px`, height: `${Math.round(size * 0.45)}px` }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
}

function CreateAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [permDiag, setPermDiag] = useState(true);
  const [permOrg, setPermOrg] = useState(false);
  const [permTech, setPermTech] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (PNG, JPG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe exceder 5MB.');
      return;
    }
    try {
      const base64 = await resizeImageToBase64(file, 200);
      setLogoPreview(base64);
      setError('');
    } catch {
      setError('Error al procesar la imagen.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Correo electrónico y contraseña son obligatorios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('El formato del correo electronico no es valido.');
      return;
    }
    if (!permDiag && !permOrg && !permTech) {
      setError('Debe seleccionar al menos una encuesta.');
      return;
    }
    setSaving(true);
    setError('');
    const permissions: SurveyType[] = [];
    if (permDiag) permissions.push('diagnostico_empresarial');
    if (permOrg) permissions.push('estructura_organizacional');
    if (permTech) permissions.push('prueba_tecnologia');
    // Auto-generate username from email
    const autoUsername = email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || email.trim();
    const result = await createClientAccount(
      autoUsername,
      password.trim(),
      displayName.trim(),
      permissions,
      logoPreview ?? undefined,
      email.trim(),
    );
    setSaving(false);
    if (result) {
      onCreated();
    } else {
      setError('Error al crear la cuenta. Es posible que el usuario ya exista.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-border max-w-md sm:max-w-lg lg:max-w-xl w-full animate-fade-up" style={{ padding: '40px 32px', margin: '0 16px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 className="font-serif text-navy" style={{ fontSize: 'var(--fs-18)', marginBottom: '6px' }}>Crear Cuenta de Cliente</h3>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)', marginBottom: '28px' }}>
          El cliente usará estas credenciales para acceder a sus encuestas.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Logo upload */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '10px' }}>Logo de la empresa</label>
            <div className="flex items-center" style={{ gap: '16px' }}>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="rounded-xl object-cover"
                  style={{ width: '64px', height: '64px', border: '2px solid var(--color-border)' }}
                />
              ) : (
                <div className="flex items-center justify-center rounded-xl bg-pale border-2 border-dashed border-border" style={{ width: '64px', height: '64px' }}>
                  <Building className="text-muted" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
                </div>
              )}
              <div className="flex-1">
                <label
                  className="inline-block border border-accent text-accent font-medium hover:bg-accent/5 transition-all cursor-pointer"
                  style={{ padding: '7px 16px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
                >
                  {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => setLogoPreview(null)}
                    className="text-muted hover:text-error transition-colors cursor-pointer"
                    style={{ fontSize: 'var(--fs-11)', marginLeft: '10px' }}
                  >
                    Quitar
                  </button>
                )}
                <p className="text-muted" style={{ fontSize: 'var(--fs-10)', marginTop: '4px' }}>PNG, JPG. Max 5MB. Se redimensiona a 200px.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px' }}>Nombre del Cliente</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="input-field" placeholder="Ej: Empresa ABC" style={{ fontSize: 'var(--fs-13)' }} />
          </div>
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px' }}>Correo electronico *</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} className="input-field" placeholder="Ej: contacto@empresa.com" style={{ fontSize: 'var(--fs-13)' }} autoFocus />
            <p className="text-muted" style={{ fontSize: 'var(--fs-10)', marginTop: '4px' }}>El cliente usará este correo para iniciar sesión y recibir reportes.</p>
          </div>
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '6px' }}>Contraseña *</label>
            <input type="text" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} className="input-field" placeholder="Contraseña para el cliente" style={{ fontSize: 'var(--fs-13)' }} />
          </div>

          {/* Survey permissions */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '10px' }}>Encuestas habilitadas *</label>
            <div className="flex flex-wrap" style={{ gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPermDiag(!permDiag)}
                className={`border font-medium transition-all cursor-pointer ${
                  permDiag ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'
                }`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
              >
                <BoolMark value={permDiag} /> Radiografía Empresarial
              </button>
              <button
                type="button"
                onClick={() => setPermOrg(!permOrg)}
                className={`border font-medium transition-all cursor-pointer ${
                  permOrg ? 'border-mid bg-mid/10 text-mid' : 'border-border bg-pale text-muted'
                }`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
              >
                <BoolMark value={permOrg} /> Estructura Organizacional
              </button>
              <button
                type="button"
                onClick={() => setPermTech(!permTech)}
                className={`border font-medium transition-all cursor-pointer ${
                  permTech ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'
                }`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
              >
                <BoolMark value={permTech} /> Prueba de Tecnologia
              </button>
            </div>
          </div>

          {error && <p className="text-error text-center" style={{ fontSize: 'var(--fs-12)' }}>{error}</p>}

          <div className="flex" style={{ gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border font-medium text-muted hover:text-ink transition-all cursor-pointer" style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-13)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer disabled:opacity-50" style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-13)' }}>
              {saving ? 'Creando...' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DATOS DE PRUEBA PANEL
   ══════════════════════════════════════════════════════════ */

function DatosPruebaPanel({
  accounts,
  expedienteData,
  clientPrefills,
  testClientIds,
  onTestIdsChange,
  onRefresh,
}: {
  accounts: AppUser[];
  expedienteData: Map<string, { diagnostics: SavedDiagnostic[]; orgSurveys: SavedOrgSurvey[]; techSurveys: SavedTechSurvey[] }>;
  clientPrefills: Map<string, SurveyType[]>;
  testClientIds: string[];
  onTestIdsChange: (ids: string[]) => void;
  onRefresh: () => Promise<void>;
}) {
  const loadDiagnosticForReport = useDiagnosticStore(s => s.loadDiagnosticForReport);
  const loadDiagnosticForEdit = useDiagnosticStore(s => s.loadDiagnosticForEdit);
  const loadOrgSurveyForReport = useOrgSurveyStore(s => s.loadOrgSurveyForReport);
  const loadOrgSurveyForEdit = useOrgSurveyStore(s => s.loadOrgSurveyForEdit);
  const loadTechSurveyForReport = useTechSurveyStore(s => s.loadTechSurveyForReport);
  const loadTechSurveyForEdit = useTechSurveyStore(s => s.loadTechSurveyForEdit);
  const setView = useDiagnosticStore(s => s.setView);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [addClientId, setAddClientId] = useState('');
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const availableClients = accounts.filter(a => a.role === 'client' && !testClientIds.includes(a.id));
  const testClients = accounts.filter(a => testClientIds.includes(a.id));

  async function handleAddTestClient() {
    if (!addClientId) return;
    const newIds = [...testClientIds, addClientId];
    await setTestClientIds(newIds);
    onTestIdsChange(newIds);
    setAddClientId('');
    setConfirmAdd(false);
  }

  async function handleRemoveTestClient(id: string) {
    const newIds = testClientIds.filter(tid => tid !== id);
    await setTestClientIds(newIds);
    onTestIdsChange(newIds);
    setConfirmRemoveId(null);
  }

  // Detail view for a selected test client — full functionality like Expedientes
  if (selectedClientId) {
    const acc = testClients.find(a => a.id === selectedClientId);
    if (!acc) { setSelectedClientId(null); return null; }
    const data = expedienteData.get(acc.id) ?? { diagnostics: [], orgSurveys: [], techSurveys: [] };
    const hasDiagPrefill = (clientPrefills.get(acc.id) ?? []).includes('diagnostico_empresarial');

    return (
      <div>
        {/* Test banner */}
        <div className="w-full bg-warn/10 border border-warn/30 rounded-xl text-center" style={{ padding: '8px 16px', marginBottom: '16px' }}>
          <p className="text-warn font-semibold flex items-center justify-center" style={{ fontSize: 'var(--fs-11)', gap: '5px' }}>
            <FlaskConical style={{ width: 'var(--fs-12)', height: 'var(--fs-12)' }} /> Cliente de prueba — los datos de este cliente son de prueba
          </p>
        </div>
        <ClientExpedienteDetail
          account={acc}
          data={data}
          hasDiagPrefill={hasDiagPrefill}
          onBack={() => { setSelectedClientId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onDiagExtenso={(d) => { loadDiagnosticForReport(d); }}
          onOrgExtenso={(s) => { loadOrgSurveyForReport(s); setView('org_report'); }}
          onTechExtenso={(s) => { loadTechSurveyForReport(s); setView('tech_report'); }}
          onDiagEdit={(d) => { loadDiagnosticForEdit(d); }}
          onOrgEdit={(s) => { loadOrgSurveyForEdit(s); setView('org_wizard'); }}
          onTechEdit={(s) => { loadTechSurveyForEdit(s); setView('tech_wizard'); }}
          onDeleteDiag={async (id) => { await deleteDiagnostic(id); onRefresh(); }}
          onDeleteOrg={async (id) => { await deleteOrgSurvey(id); onRefresh(); }}
          onDeleteTech={async (id) => { await deleteTechSurvey(id); onRefresh(); }}
          onDeletePrefill={async () => { await deletePrefill(acc.id, 'diagnostico_empresarial'); onRefresh(); }}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3 className="font-serif text-navy" style={{ fontSize: 'var(--fs-17)' }}>Clientes Inactivos / Prueba</h3>
        <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginTop: '4px' }}>
          Clientes marcados como datos de prueba. No aparecen en Expedientes y su acceso requiere clave maestra.
        </p>
      </div>

      {/* Add client selector */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '20px 24px', marginBottom: '20px' }}>
        <p className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px' }}>Agregar cliente de prueba</p>
        <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
          <select
            value={addClientId}
            onChange={e => { setAddClientId(e.target.value); setConfirmAdd(false); }}
            className="border border-border/60 rounded-lg bg-white text-ink"
            style={{ fontSize: 'var(--fs-12)', padding: '8px 12px', minWidth: '200px' }}
          >
            <option value="">Seleccionar cliente...</option>
            {availableClients.map(a => (
              <option key={a.id} value={a.id}>{a.displayName} ({a.email || a.username})</option>
            ))}
          </select>
          {!confirmAdd ? (
            <button
              onClick={() => setConfirmAdd(true)}
              disabled={!addClientId}
              className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontSize: 'var(--fs-12)', padding: '8px 18px', borderRadius: '8px' }}
            >
              Agregar
            </button>
          ) : (
            <span className="flex items-center" style={{ gap: '8px' }}>
              <span className="text-warn font-medium" style={{ fontSize: 'var(--fs-11)' }}>¿Marcar como dato de prueba?</span>
              <button
                onClick={handleAddTestClient}
                className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
                style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '6px' }}
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmAdd(false)}
                className="text-muted font-medium hover:text-ink transition-all cursor-pointer"
                style={{ fontSize: 'var(--fs-11)', padding: '6px 8px' }}
              >
                Cancelar
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {testClients.length === 0 && (
        <div className="bg-pale rounded-2xl border border-border/30 text-center" style={{ padding: '48px 24px' }}>
          <FlaskConical className="text-muted mx-auto" style={{ width: '32px', height: '32px', display: 'block', marginBottom: '12px' }} />
          <p className="text-muted font-medium" style={{ fontSize: 'var(--fs-13)' }}>No hay clientes de prueba</p>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginTop: '4px' }}>Selecciona un cliente arriba para marcarlo como dato de prueba.</p>
        </div>
      )}

      {/* Test clients cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {testClients.map(client => {
          const clientData = expedienteData.get(client.id);
          const diagCount = clientData?.diagnostics.length ?? 0;
          const orgCount = clientData?.orgSurveys.length ?? 0;
          const techCount = clientData?.techSurveys.length ?? 0;

          return (
            <div
              key={client.id}
              className="bg-white rounded-2xl border-2 border-warn/30 shadow-sm hover:shadow-md transition-all cursor-pointer"
              style={{ padding: '20px 24px' }}
              onClick={() => setSelectedClientId(client.id)}
            >
              <div className="flex items-center" style={{ gap: '14px' }}>
                <ClientLogo logoUrl={client.logoUrl} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <h3 className="font-bold text-navy truncate" style={{ fontSize: 'var(--fs-15)' }}>{client.displayName}</h3>
                    <span className="shrink-0 bg-warn/15 text-warn font-bold border border-warn/30" style={{ fontSize: 'var(--fs-9)', padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>
                      PRUEBA
                    </span>
                  </div>
                  <p className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>{client.email || client.username}</p>
                </div>
                <div className="flex items-center shrink-0" style={{ gap: '12px' }}>
                  <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>{diagCount + orgCount + techCount} encuesta{diagCount + orgCount + techCount !== 1 ? 's' : ''}</span>
                  {/* Remove button */}
                  {confirmRemoveId === client.id ? (
                    <span className="flex items-center" style={{ gap: '4px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleRemoveTestClient(client.id)}
                        className="bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer"
                        style={{ fontSize: 'var(--fs-10)', padding: '4px 10px', borderRadius: '6px' }}
                      >
                        Quitar
                      </button>
                      <button
                        onClick={() => setConfirmRemoveId(null)}
                        className="text-muted hover:text-ink transition-all cursor-pointer"
                        style={{ fontSize: 'var(--fs-10)', padding: '4px 6px' }}
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmRemoveId(client.id); }}
                      className="text-error/50 hover:text-error transition-all cursor-pointer"
                      style={{ fontSize: 'var(--fs-11)', padding: '4px 8px' }}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONFIGURACIÓN PANEL
   ══════════════════════════════════════════════════════════ */

function ConfiguracionPanel({ showBenchmarks, setShowBenchmarks }: { showBenchmarks: boolean; setShowBenchmarks: (v: boolean) => void }) {
  const [configTab, setConfigTab] = useState<'apariencia' | 'benchmarks' | 'sistema'>('apariencia');

  const CONFIG_TABS: { key: typeof configTab; label: string; icon: LucideIcon }[] = [
    { key: 'apariencia', label: 'Apariencia', icon: Palette },
    { key: 'benchmarks', label: 'Benchmarks', icon: BarChart3 },
    { key: 'sistema', label: 'Sistema', icon: Info },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex flex-wrap" style={{ gap: '6px', marginBottom: '20px' }}>
        {CONFIG_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setConfigTab(tab.key)}
            className={`font-semibold transition-all cursor-pointer rounded-lg ${
              configTab === tab.key
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white text-muted hover:text-ink border border-border/40'
            }`}
            style={{ padding: '7px 14px', fontSize: 'var(--fs-11)' }}
          >
            <tab.icon style={{ display: 'inline', width: 'var(--fs-13)', height: 'var(--fs-13)', verticalAlign: '-2px', marginRight: '4px' }} /> {tab.label}
          </button>
        ))}
      </div>

      {configTab === 'apariencia' && <LogoSettingsSubPanel />}

      {configTab === 'benchmarks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: '14px' }}>
                <div className="inline-flex items-center justify-center rounded-full bg-accent/10 shrink-0" style={{ width: '44px', height: '44px' }}>
                  <BarChart3 className="text-accent" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
                </div>
                <div>
                  <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-15)', marginBottom: '2px' }}>Benchmarks por Industria</h3>
                  <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>Márgenes financieros de referencia por sector</p>
                </div>
              </div>
              <button
                onClick={() => setShowBenchmarks(true)}
                className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
                style={{ fontSize: 'var(--fs-12)', padding: '8px 20px', borderRadius: '8px' }}
              >
                Editar
              </button>
            </div>
          </div>
          {showBenchmarks && <BenchmarkSettingsModal onClose={() => setShowBenchmarks(false)} />}
        </div>
      )}

      {configTab === 'sistema' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px' }}>
            <div className="flex items-center" style={{ gap: '14px' }}>
              <div className="inline-flex items-center justify-center rounded-full bg-mid/10 shrink-0" style={{ width: '44px', height: '44px' }}>
                <ClipboardList className="text-mid" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
              </div>
              <div>
                <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-15)', marginBottom: '2px' }}>Encuestas Disponibles</h3>
                <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>Las encuestas se configuran por cliente en la pestaña "Clientes"</p>
              </div>
            </div>
            <div className="flex flex-wrap" style={{ gap: '10px', marginTop: '16px', paddingLeft: '58px' }}>
              <span className="border border-accent/30 bg-accent/5 text-accent font-medium inline-flex items-center" style={{ fontSize: 'var(--fs-11)', padding: '4px 12px', borderRadius: '8px', gap: '4px' }}>
                <Check style={{ width: 'var(--fs-11)', height: 'var(--fs-11)' }} /> Radiografía Empresarial
              </span>
              <span className="border border-border/40 bg-pale text-muted font-medium" style={{ fontSize: 'var(--fs-11)', padding: '4px 12px', borderRadius: '8px' }}>
                Estructura Organizacional — Proximamente
              </span>
              <span className="border border-border/40 bg-pale text-muted font-medium" style={{ fontSize: 'var(--fs-11)', padding: '4px 12px', borderRadius: '8px' }}>
                Prueba de Tecnología — Proximamente
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px' }}>
            <div className="flex items-center" style={{ gap: '14px' }}>
              <div className="inline-flex items-center justify-center rounded-full bg-navy/10 shrink-0" style={{ width: '44px', height: '44px' }}>
                <Info className="text-navy" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
              </div>
              <div>
                <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-15)', marginBottom: '2px' }}>Información del Sistema</h3>
                <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>Complement Consulting Group — Radiografía Empresarial v2.0</p>
              </div>
            </div>
            <div className="grid grid-cols-2" style={{ gap: '10px', marginTop: '16px', paddingLeft: '58px' }}>
              <div className="rounded-lg bg-pale" style={{ padding: '10px 14px' }}>
                <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginBottom: '2px' }}>Base de datos</p>
                <p className="text-ink font-semibold" style={{ fontSize: 'var(--fs-11)' }}>Supabase PostgreSQL</p>
              </div>
              <div className="rounded-lg bg-pale" style={{ padding: '10px 14px' }}>
                <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginBottom: '2px' }}>Hosting</p>
                <p className="text-ink font-semibold" style={{ fontSize: 'var(--fs-11)' }}>Vercel</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogoSettingsSubPanel() {
  const companyLogo = useSettingsStore(s => s.companyLogo);
  const companyLogoIcon = useSettingsStore(s => s.companyLogoIcon);
  const floatingLogo = useSettingsStore(s => s.floatingLogo);
  const setCompanyLogo = useSettingsStore(s => s.setCompanyLogo);
  const setFloatingLogo = useSettingsStore(s => s.setFloatingLogo);

  const [preview, setPreview] = useState<string | null>(null);
  const [previewIcon, setPreviewIcon] = useState<string | null>(null);
  const [previewFloating, setPreviewFloating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const floatingFileRef = useRef<HTMLInputElement>(null);

  const hasChanges = preview !== null || previewIcon !== null || previewFloating !== null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'icon' | 'floating') {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Seleccione un archivo de imagen.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('La imagen no debe exceder 2MB.'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (target === 'logo') setPreview(dataUrl);
      else if (target === 'icon') setPreviewIcon(dataUrl);
      else setPreviewFloating(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true); setError(''); setSuccess(false);
    const logoToSave = preview !== null ? preview : companyLogo;
    const iconToSave = previewIcon !== null ? previewIcon : companyLogoIcon;
    const ok = await setCompanyLogo(logoToSave, iconToSave);
    if (previewFloating !== null) await setFloatingLogo(previewFloating);
    if (ok) { setPreview(null); setPreviewIcon(null); setPreviewFloating(null); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    else setError('Error al guardar.');
    setSaving(false);
  }

  async function handleRemoveLogo() {
    setSaving(true); setError('');
    const ok = await setCompanyLogo(null, null);
    if (ok) { setPreview(null); setPreviewIcon(null); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    else setError('Error al eliminar el logo.');
    setSaving(false);
  }

  const displayLogo = preview ?? companyLogo;
  const displayIcon = previewIcon ?? companyLogoIcon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Logo principal */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px' }}>
        <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)', marginBottom: '4px' }}>Logo principal</h3>
        <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '16px' }}>Aparece en login, portada y reportes. Se recomienda imagen horizontal con fondo transparente.</p>
        <div className="flex items-center" style={{ gap: '16px', marginBottom: '16px' }}>
          <div className="flex items-center justify-center bg-pale rounded-xl border border-border/40" style={{ width: '160px', height: '64px', overflow: 'hidden' }}>
            {displayLogo ? (
              <img src={displayLogo} alt="Logo" className="object-contain" style={{ maxWidth: '140px', maxHeight: '54px' }} />
            ) : (
              <img src="/logo-complement.svg" alt="Default" className="object-contain" style={{ maxWidth: '140px', maxHeight: '54px' }} />
            )}
          </div>
          <span className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>{displayLogo ? 'Logo personalizado' : 'Logo por defecto'}</span>
        </div>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'logo')} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="bg-accent text-white font-semibold hover:bg-mid transition-colors cursor-pointer" style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px' }}>Seleccionar</button>
          {displayLogo && <button onClick={handleRemoveLogo} disabled={saving} className="text-error font-semibold hover:bg-error/10 transition-colors cursor-pointer" style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px' }}>Quitar</button>}
        </div>
      </div>

      {/* Icono header */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px' }}>
        <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)', marginBottom: '4px' }}>Icono del encabezado</h3>
        <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '16px' }}>Icono cuadrado para la barra de navegación.</p>
        <div className="flex items-center" style={{ gap: '16px', marginBottom: '16px' }}>
          <div className="flex items-center justify-center bg-navy rounded-xl" style={{ width: '52px', height: '52px', overflow: 'hidden' }}>
            {displayIcon ? (
              <img src={displayIcon} alt="Icono" className="object-contain" style={{ maxWidth: '40px', maxHeight: '40px' }} />
            ) : (
              <img src="/icon-complement.svg" alt="Default" className="object-contain" style={{ maxWidth: '40px', maxHeight: '40px' }} />
            )}
          </div>
          <span className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>{displayIcon ? 'Icono personalizado' : 'Icono por defecto'}</span>
        </div>
        <input ref={iconFileRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'icon')} className="hidden" />
        <button onClick={() => iconFileRef.current?.click()} className="bg-accent text-white font-semibold hover:bg-mid transition-colors cursor-pointer" style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px' }}>Seleccionar</button>
      </div>

      {/* Logo flotante */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px' }}>
        <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)', marginBottom: '4px' }}>Logo flotante (login)</h3>
        <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '16px' }}>Imagen que flota en el fondo del login. Si no se configura, se usa el logo principal.</p>
        <div className="flex items-center" style={{ gap: '16px', marginBottom: '16px' }}>
          <div className="flex items-center justify-center rounded-xl" style={{ width: '64px', height: '64px', overflow: 'hidden', background: 'linear-gradient(135deg, #001845, #002060)' }}>
            <img src={(previewFloating ?? floatingLogo) || companyLogo || '/logo-complement.svg'} alt="Flotante" className="object-contain" style={{ maxWidth: '44px', maxHeight: '44px', filter: 'brightness(0) invert(1)', opacity: 0.5 }} />
          </div>
          <span className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>{(previewFloating ?? floatingLogo) ? 'Logo flotante personalizado' : 'Usando logo principal'}</span>
        </div>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <input ref={floatingFileRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'floating')} className="hidden" />
          <button onClick={() => floatingFileRef.current?.click()} className="bg-accent text-white font-semibold hover:bg-mid transition-colors cursor-pointer" style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px' }}>Seleccionar</button>
          {(previewFloating ?? floatingLogo) && (
            <button onClick={async () => { setSaving(true); await setFloatingLogo(null); setPreviewFloating(null); setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }} disabled={saving} className="text-error font-semibold hover:bg-error/10 transition-colors cursor-pointer" style={{ fontSize: 'var(--fs-11)', padding: '7px 14px', borderRadius: '8px' }}>Usar logo principal</button>
          )}
        </div>
      </div>

      {/* Error / Success / Save */}
      {error && <div className="bg-error/10 rounded-xl" style={{ padding: '10px 14px' }}><p className="text-error font-medium" style={{ fontSize: 'var(--fs-11)' }}>{error}</p></div>}
      {success && <div className="bg-success/10 rounded-xl" style={{ padding: '10px 14px' }}><p className="text-success font-medium" style={{ fontSize: 'var(--fs-11)' }}>Logo actualizado correctamente.</p></div>}
      {hasChanges && (
        <button onClick={handleSave} disabled={saving} className="w-full bg-navy text-white font-bold hover:bg-navy/90 disabled:opacity-50 transition-colors cursor-pointer" style={{ fontSize: 'var(--fs-13)', padding: '12px 24px', borderRadius: '10px' }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BENCHMARK SETTINGS MODAL
   ══════════════════════════════════════════════════════════ */

function BenchmarkSettingsModal({ onClose }: { onClose: () => void }) {
  const benchmarks = useBenchmarkStore(s => s.benchmarks);
  const setBenchmark = useBenchmarkStore(s => s.setBenchmark);
  const resetBenchmarks = useBenchmarkStore(s => s.resetBenchmarks);
  const [activeSector, setActiveSector] = useState<Sector>('manufactura');

  const b = benchmarks[activeSector];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm" style={{ padding: '16px' }}>
      <div className="bg-white rounded-2xl shadow-xl border border-border max-w-lg w-full animate-fade-up" style={{ padding: '36px 32px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <div>
            <h3 className="font-serif text-navy" style={{ fontSize: 'var(--fs-18)' }}>Configuración de Benchmarks</h3>
            <p className="text-muted" style={{ fontSize: 'var(--fs-12)', marginTop: '4px' }}>Establezca los márgenes aceptables por industria</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors cursor-pointer" style={{ padding: '4px' }}>
            <X style={{ width: 'var(--fs-18)', height: 'var(--fs-18)' }} />
          </button>
        </div>

        {/* Sector tabs */}
        <div className="flex" style={{ gap: '8px', marginBottom: '24px' }}>
          {SECTOR_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => setActiveSector(s.value)}
              className={`font-medium border transition-all cursor-pointer ${
                activeSector === s.value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-ink'
              }`}
              style={{ padding: '8px 18px', borderRadius: '10px', fontSize: 'var(--fs-12)', flex: 1 }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Benchmark fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          <div className="grid grid-cols-3" style={{ gap: '14px' }}>
            <BenchmarkField label="Margen Bruto (%)" value={b.margenBruto} onChange={v => setBenchmark(activeSector, { margenBruto: v })} />
            <BenchmarkField label="Margen Operativo (%)" value={b.margenOperativo} onChange={v => setBenchmark(activeSector, { margenOperativo: v })} />
            <BenchmarkField label="Margen Neto (%)" value={b.margenNeto} onChange={v => setBenchmark(activeSector, { margenNeto: v })} />
          </div>

          <div className="border-t border-border/40" style={{ paddingTop: '20px' }}>
            <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: 'var(--fs-10)', marginBottom: '14px' }}>Criterios de evaluación</p>
            <div className="grid grid-cols-2" style={{ gap: '14px' }}>
              <BenchmarkField label="Tolerancia (±%)" value={b.tolerancia} onChange={v => setBenchmark(activeSector, { tolerancia: v })} hint="Rango para 'En rango'" />
              <BenchmarkField label="Umbral crítico (%)" value={b.criticoUmbral} onChange={v => setBenchmark(activeSector, { criticoUmbral: v })} hint="Debajo de benchmark" />
            </div>
          </div>

          {/* Visual explanation */}
          <div className="rounded-xl bg-pale border border-border/30" style={{ padding: '16px 20px' }}>
            <p className="font-medium text-navy" style={{ fontSize: 'var(--fs-11)', marginBottom: '10px' }}>Ejemplo: Margen Bruto ({b.margenBruto}%)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="rounded-full bg-success/15 text-success font-semibold" style={{ padding: '1px 8px', fontSize: 'var(--fs-10)' }}>Arriba</span>
                <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>&gt; {b.margenBruto + b.tolerancia}%</span>
              </div>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="rounded-full bg-mid/15 text-mid font-semibold" style={{ padding: '1px 8px', fontSize: 'var(--fs-10)' }}>En rango</span>
                <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>{b.margenBruto - b.tolerancia}% — {b.margenBruto + b.tolerancia}%</span>
              </div>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="rounded-full bg-warn/15 text-warn font-semibold" style={{ padding: '1px 8px', fontSize: 'var(--fs-10)' }}>Debajo</span>
                <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>{b.margenBruto - b.criticoUmbral}% — {b.margenBruto - b.tolerancia}%</span>
              </div>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="rounded-full bg-error/15 text-error font-semibold" style={{ padding: '1px 8px', fontSize: 'var(--fs-10)' }}>Crítico</span>
                <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>&lt; {b.margenBruto - b.criticoUmbral}% o negativo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex" style={{ gap: '12px' }}>
          <button
            onClick={() => { resetBenchmarks(); }}
            className="border border-border text-muted hover:text-ink font-medium transition-all cursor-pointer"
            style={{ padding: '10px 20px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
          >
            Restablecer valores
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
            style={{ padding: '10px 20px', borderRadius: '10px', fontSize: 'var(--fs-13)' }}
          >
            Guardar y cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function BenchmarkField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-11)', marginBottom: '6px' }}>{label}</label>
      {hint && <p className="text-muted" style={{ fontSize: 'var(--fs-10)', marginBottom: '4px' }}>{hint}</p>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        step="0.5"
        className="input-field"
        style={{ fontSize: 'var(--fs-13)' }}
      />
    </div>
  );
}
