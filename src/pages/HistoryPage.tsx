import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { createClientAccount, getAllClientAccounts, deleteClientAccount, updateClientProfile, getExpedienteDataForClients, getPrefillsForClients, deletePrefill, deleteDiagnostic, deleteOrgSurvey, deleteTechSurvey } from '../lib/storage';
import { generateSampleDiagnostic, generateSampleOrgSurvey } from '../lib/sampleData';
import { ALL_CRITERIA } from '../config/questions';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useOrgSurveyStore } from '../store/orgSurveyStore';
import { useTechSurveyStore } from '../store/techSurveyStore';
import { useBenchmarkStore } from '../store/benchmarkStore';
import { exportExpediente } from '../lib/exportExpediente';
import { exportToPdf } from '../lib/exportPdf';
import { exportOrgSurveyToPdf } from '../lib/exportOrgPdf';
import { exportTechSurveyToPdf } from '../lib/exportTechPdf';
import { exportToPptx } from '../lib/exportPptx';
import { SECTOR_OPTIONS } from '../config/constants';
import type { SavedDiagnostic, SavedOrgSurvey, SavedTechSurvey, Sector, AppUser, SurveyType, MarginLevel, TechMaturityLevel } from '../lib/types';

type AdminTab = 'clientes' | 'expedientes' | 'datos_prueba' | 'configuracion';

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

  // Settings
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  const refreshAccounts = useCallback(async () => {
    const data = await getAllClientAccounts();
    setAccounts(data);
  }, []);

  const refreshExpedientes = useCallback(async () => {
    setLoadingExpedientes(true);
    const [data, prefills] = await Promise.all([
      getExpedienteDataForClients(),
      getPrefillsForClients(),
    ]);
    setExpedienteData(data);
    setClientPrefills(prefills);
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

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'expedientes', label: 'Expedientes', icon: '📁' },
    { key: 'clientes', label: 'Clientes', icon: '👥' },
    { key: 'datos_prueba', label: 'Datos de Prueba', icon: '🧪' },
    { key: 'configuracion', label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '36px 24px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ marginBottom: '28px', gap: '10px' }}>
        <div>
          <h1 className="font-serif text-navy" style={{ fontSize: '22px' }}>Administración y Expedientes</h1>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
            {user?.displayName || 'Complement Consulting Group'}
          </p>
        </div>
        <button
          onClick={() => setView('home')}
          className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
          style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '12px' }}
        >
          ← Página Principal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap" style={{ gap: '6px', marginBottom: '28px' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted hover:text-ink'
            }`}
            style={{ padding: '10px 18px', fontSize: '13px', background: 'none' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'expedientes' && (
        <ExpedientesPanel
          accounts={accounts}
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

      {activeTab === 'datos_prueba' && (
        <DatosPruebaPanel />
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
        <p className="text-muted" style={{ fontSize: '14px' }}>Cargando expedientes...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border text-center" style={{ padding: '48px 24px' }}>
        <p className="text-muted" style={{ fontSize: '13px' }}>No hay clientes registrados aun.</p>
        <p className="text-muted" style={{ fontSize: '11px', marginTop: '8px' }}>Cree cuentas de clientes en la pestana "Clientes".</p>
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>
        {accounts.length} cliente{accounts.length !== 1 ? 's' : ''} registrado{accounts.length !== 1 ? 's' : ''}
      </p>

      {accounts.map(acc => {
        const data = expedienteData.get(acc.id) ?? { diagnostics: [], orgSurveys: [], techSurveys: [] };
        const diagCount = data.diagnostics.length;
        const orgCount = data.orgSurveys.length;
        const techCount = data.techSurveys.length;
        const hasAnySurvey = diagCount > 0 || orgCount > 0 || techCount > 0;
        const latestDiag = data.diagnostics[0];
        const hasPrefill = (clientPrefills.get(acc.id) ?? []).length > 0;
        const prefilledCount = data.diagnostics.filter(d => d.wasPrefilled === true).length;
        const soloCount = data.diagnostics.filter(d => d.wasPrefilled === false).length;

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
                <h3 className="font-bold text-navy group-hover:text-accent transition-colors truncate" style={{ fontSize: '15px', marginBottom: '2px' }}>
                  {acc.displayName}
                </h3>
                <p className="text-muted truncate" style={{ fontSize: '11px' }}>
                  {acc.email || acc.username}
                </p>
              </div>

              {/* Quick indicators */}
              <div className="flex items-center flex-shrink-0" style={{ gap: '8px' }}>
                {latestDiag && (
                  <span className={`font-semibold ${LEVEL_COLORS_EXP[latestDiag.profesionalizacion.level] || 'text-muted'}`} style={{ fontSize: '11px' }}>
                    {latestDiag.profesionalizacion.level}
                  </span>
                )}
                <div className="flex" style={{ gap: '4px' }}>
                  <span className={`font-semibold border ${diagCount > 0 ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border bg-pale text-muted'}`} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px' }}>
                    {diagCount} diag.
                  </span>
                  <span className={`font-semibold border ${orgCount > 0 ? 'border-mid/30 bg-mid/5 text-mid' : 'border-border bg-pale text-muted'}`} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px' }}>
                    {orgCount} org.
                  </span>
                  <span className={`font-semibold border ${techCount > 0 ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border bg-pale text-muted'}`} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px' }}>
                    {techCount} tech.
                  </span>
                </div>
                <span className="text-muted/40 group-hover:text-accent transition-colors" style={{ fontSize: '16px', marginLeft: '4px' }}>→</span>
              </div>
            </div>

            {/* Status lines */}
            <div style={{ paddingLeft: '58px', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {hasPrefill && (
                <span className="text-accent font-medium" style={{ fontSize: '10px' }}>
                  ✨ Pre-llenado pendiente
                </span>
              )}
              {prefilledCount > 0 && (
                <span style={{ fontSize: '10px', color: '#d4922e', fontWeight: 600 }}>
                  {prefilledCount} pre-llenado{prefilledCount > 1 ? 's' : ''}
                </span>
              )}
              {soloCount > 0 && (
                <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600 }}>
                  {soloCount} contestado{soloCount > 1 ? 's' : ''} solo
                </span>
              )}
            </div>
            {!hasAnySurvey && !hasPrefill && (
              <p className="text-muted" style={{ fontSize: '11px', marginTop: '8px', paddingLeft: '58px' }}>
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

  function handleDownloadExpedientePdf() {
    exportExpediente(companyName, latestDiag, latestOrg, 'download');
  }

  function handleStartPrefill() {
    startPrefillMode(account.id);
  }

  return (
    <div className="animate-fade-up">
      {/* Back + client header */}
      <button
        onClick={onBack}
        className="flex items-center text-accent hover:text-mid transition-colors cursor-pointer"
        style={{ gap: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', padding: 0 }}
      >
        ← Volver a expedientes
      </button>

      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px', marginBottom: '20px' }}>
        <div className="flex items-center" style={{ gap: '16px', marginBottom: '20px' }}>
          <ClientLogo logoUrl={account.logoUrl} size={52} />
          <div className="flex-1">
            <h2 className="font-serif text-navy" style={{ fontSize: '20px', marginBottom: '2px' }}>{account.displayName}</h2>
            <p className="text-muted" style={{ fontSize: '12px' }}>{account.email || account.username}</p>
          </div>
        </div>

        {/* Export buttons */}
        {(diagCount > 0 || orgCount > 0) && (
          <div className="flex flex-wrap items-center" style={{ gap: '10px', marginBottom: '14px' }}>
            <button
              onClick={handleViewExpedientePdf}
              className="bg-navy text-white font-semibold hover:bg-navy/80 transition-all cursor-pointer"
              style={{ fontSize: '12px', padding: '9px 22px', borderRadius: '10px' }}
            >
              Ver Expediente PDF
            </button>
            <button
              onClick={handleDownloadExpedientePdf}
              className="border border-navy text-navy font-semibold hover:bg-navy/5 transition-all cursor-pointer"
              style={{ fontSize: '12px', padding: '9px 22px', borderRadius: '10px' }}
            >
              Descargar PDF
            </button>
            {!(diagCount > 0 && orgCount > 0) && (
              <span className="text-warn font-medium" style={{ fontSize: '11px' }}>
                Expediente parcial ({diagCount === 0 ? 'falta diagnostico' : 'falta estructura org.'})
              </span>
            )}
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
                    <span style={{ fontSize: '15px' }}>✅</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-navy" style={{ fontSize: '13px' }}>Pre-llenado completo</p>
                    <p className="text-muted" style={{ fontSize: '11px' }}>El cliente vera los datos pre-llenados al contestar el diagnostico</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
                  <button
                    onClick={handleStartPrefill}
                    className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
                    style={{ fontSize: '11px', padding: '7px 18px', borderRadius: '8px' }}
                  >
                    ✏️ Editar pre-llenado
                  </button>
                  {deletePrefillConfirm ? (
                    <span className="flex items-center" style={{ gap: '6px' }}>
                      <span className="text-error font-medium" style={{ fontSize: '11px' }}>¿Borrar pre-llenado?</span>
                      <button
                        onClick={async () => {
                          setDeletingPrefill(true);
                          await onDeletePrefill();
                          setDeletingPrefill(false);
                          setDeletePrefillConfirm(false);
                        }}
                        disabled={deletingPrefill}
                        className="bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer disabled:opacity-50"
                        style={{ fontSize: '10px', padding: '5px 12px', borderRadius: '6px' }}
                      >
                        {deletingPrefill ? 'Borrando...' : 'Si, borrar'}
                      </button>
                      <button
                        onClick={() => setDeletePrefillConfirm(false)}
                        className="text-muted font-medium hover:text-ink transition-all cursor-pointer"
                        style={{ fontSize: '10px', padding: '5px 8px' }}
                      >
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeletePrefillConfirm(true)}
                      className="border border-error/30 text-error font-medium hover:bg-error/5 transition-all cursor-pointer"
                      style={{ fontSize: '11px', padding: '7px 16px', borderRadius: '8px' }}
                    >
                      🗑️ Borrar pre-llenado
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ── No hay pre-llenado: mostrar boton para crear ── */
              <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
                <button
                  onClick={handleStartPrefill}
                  className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
                  style={{ fontSize: '12px', padding: '9px 22px', borderRadius: '10px' }}
                >
                  ✨ Pre-llenar diagnostico
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex" style={{ gap: '4px', marginBottom: '20px' }}>
        {([
          { key: 'resumen' as const, label: 'Resumen Ejecutivo', icon: '📊' },
          ...(diagCount > 0 ? [{ key: 'diagnosticos' as const, label: `Diagnosticos (${diagCount})`, icon: '📋' }] : []),
          ...(orgCount > 0 ? [{ key: 'organizacional' as const, label: `Estructura Org. (${orgCount})`, icon: '🏗️' }] : []),
          ...(techCount > 0 ? [{ key: 'tecnologia' as const, label: `Tecnología (${techCount})`, icon: '💻' }] : []),
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`font-semibold transition-all cursor-pointer rounded-lg ${
              activeSection === tab.key
                ? 'bg-accent text-white shadow-sm'
                : 'bg-white text-muted hover:text-ink border border-border/40'
            }`}
            style={{ padding: '9px 18px', fontSize: '12px' }}
          >
            {tab.icon} {tab.label}
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
        <p className="text-muted" style={{ fontSize: '13px' }}>Este cliente aun no ha completado ninguna encuesta.</p>
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
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <div>
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '4px' }}>
            <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '10px' }}>Diagnostico Empresarial</p>
            {d.wasPrefilled && (
              <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '4px', background: '#d4922e15', color: '#d4922e', fontWeight: 700, border: '1px solid #d4922e30' }}>
                ✨ Pre-llenado
              </span>
            )}
            {d.wasPrefilled === false && (
              <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '4px', background: '#6366f115', color: '#6366f1', fontWeight: 700, border: '1px solid #6366f130' }}>
                Contestado solo
              </span>
            )}
          </div>
          <p className="text-muted" style={{ fontSize: '11px' }}>
            {new Date(d.savedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <button
            onClick={() => exportToPptx(d)}
            className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
            style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '8px' }}
            title="Descargar presentacion PowerPoint"
          >
            PPTX
          </button>
          <button
            onClick={() => exportToPdf(d)}
            className="border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
            style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '8px' }}
          >
            PDF
          </button>
          <button
            onClick={() => onExtenso(d)}
            className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
            style={{ fontSize: '11px', padding: '6px 16px', borderRadius: '8px' }}
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
        <div className="rounded-xl border border-border/30 bg-pale/50" style={{ padding: '14px 18px', flex: 1, minWidth: '180px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: '9px', marginBottom: '6px' }}>Profesionalizacion</p>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="font-bold text-ink" style={{ fontSize: '18px' }}>{d.profesionalizacion.average.toFixed(0)}<span className="text-muted font-normal" style={{ fontSize: '11px' }}>/100</span></span>
            <span className={`font-semibold rounded-full ${
              d.profesionalizacion.level === 'Bajo' ? 'bg-error/15 text-error' :
              d.profesionalizacion.level === 'Medio' ? 'bg-warn/15 text-warn' :
              'bg-success/15 text-success'
            }`} style={{ fontSize: '10px', padding: '3px 10px' }}>
              {d.profesionalizacion.level}
            </span>
          </div>
          {lowProfCriteria.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <p className="text-muted" style={{ fontSize: '9px', marginBottom: '4px' }}>Criterios bajos:</p>
              {lowProfCriteria.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between" style={{ fontSize: '10px', marginBottom: '2px' }}>
                  <span className="text-muted">{c.label}</span>
                  <span className="font-bold text-error">{ratingLabelInline(c.rating)}</span>
                </div>
              ))}
              {lowProfCriteria.length > 3 && (
                <p className="text-muted" style={{ fontSize: '9px' }}>+{lowProfCriteria.length - 3} mas...</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/30 bg-pale/50" style={{ padding: '14px 18px', flex: 1, minWidth: '180px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: '9px', marginBottom: '6px' }}>Institucionalizacion</p>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="font-bold text-ink" style={{ fontSize: '18px' }}>{d.institucionalizacion.average.toFixed(0)}<span className="text-muted font-normal" style={{ fontSize: '11px' }}>/100</span></span>
            <span className={`font-semibold rounded-full ${
              d.institucionalizacion.level === 'Bajo' ? 'bg-error/15 text-error' :
              d.institucionalizacion.level === 'Medio' ? 'bg-warn/15 text-warn' :
              'bg-success/15 text-success'
            }`} style={{ fontSize: '10px', padding: '3px 10px' }}>
              {d.institucionalizacion.level}
            </span>
          </div>
          {lowInstCriteria.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <p className="text-muted" style={{ fontSize: '9px', marginBottom: '4px' }}>Criterios bajos:</p>
              {lowInstCriteria.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between" style={{ fontSize: '10px', marginBottom: '2px' }}>
                  <span className="text-muted">{c.label}</span>
                  <span className="font-bold text-error">{ratingLabelInline(c.rating)}</span>
                </div>
              ))}
              {lowInstCriteria.length > 3 && (
                <p className="text-muted" style={{ fontSize: '9px' }}>+{lowInstCriteria.length - 3} mas...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Margins */}
      {d.marginEvaluation && d.marginData?.tieneDatosFinancieros && (
        <div style={{ marginBottom: '16px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: '9px', marginBottom: '8px' }}>Margenes Financieros</p>
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
                <div key={m.key} className="rounded-lg border border-border/30 bg-white text-center" style={{ padding: '10px 16px', minWidth: '100px' }}>
                  <p className="text-muted" style={{ fontSize: '9px' }}>{m.label}</p>
                  <p className="font-bold text-ink" style={{ fontSize: '15px' }}>{ev.value}%</p>
                  <p className={`font-semibold ${ml.color}`} style={{ fontSize: '9px' }}>{ml.label}</p>
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
        <MiniMetric label="Empresa Familiar" value={isFamily ? 'Si' : 'No'} />
        <MiniMetric label="Areas Oportunidad" value={d.opportunityAreas.length.toString()} />
      </div>

      {/* Top opportunity areas */}
      {d.opportunityAreas.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: '9px', marginBottom: '6px' }}>Areas de oportunidad principales</p>
          <div className="flex flex-wrap" style={{ gap: '6px' }}>
            {d.opportunityAreas.slice(0, 4).map(a => (
              <span key={a.serviceArea.id} className={`border font-medium ${
                a.priority === 'alta' ? 'border-error/30 bg-error/5 text-error' :
                a.priority === 'media' ? 'border-warn/30 bg-warn/5 text-warn' :
                'border-mid/30 bg-mid/5 text-mid'
              }`} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px' }}>
                {a.serviceArea.icon} {a.serviceArea.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Retos */}
      {d.retos.some(r => r) && (
        <div style={{ marginTop: '12px' }}>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: '9px', marginBottom: '6px' }}>Retos principales</p>
          {d.retos.filter(r => r).slice(0, 3).map((r, i) => (
            <p key={i} className="text-ink" style={{ fontSize: '11px', marginBottom: '3px' }}>
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
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <div>
          <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '10px', marginBottom: '4px' }}>Estructura Organizacional</p>
          <p className="text-muted" style={{ fontSize: '11px' }}>
            {new Date(s.savedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <button
            onClick={() => exportOrgSurveyToPdf(s)}
            className="border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
            style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '8px' }}
          >
            PDF
          </button>
          <button
            onClick={() => onExtenso(s)}
            className="bg-mid text-white font-semibold hover:bg-mid/80 transition-all cursor-pointer"
            style={{ fontSize: '11px', padding: '6px 16px', borderRadius: '8px' }}
          >
            Ver extenso →
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '10px', marginBottom: '16px' }}>
        <MiniMetric label="Colaboradores" value={totalColab.toString()} />
        <MiniMetric label="Nomina Mensual" value={`$${totalNomina.toLocaleString('es-MX')}`} />
        <MiniMetric label="Areas con Lider" value={`${areasConLider}/${s.areaDetails.length}`} />
        <MiniMetric label="Organigrama" value={s.orgStructure.tieneOrganigrama ? 'Si' : 'No'} />
      </div>

      {/* Structure indicators */}
      <div className="flex flex-wrap" style={{ gap: '8px', marginBottom: '16px' }}>
        <StatusPill
          label="Descripciones de puesto"
          value={s.orgStructure.descripcionesPuesto === 'todas' ? 'Todas' : s.orgStructure.descripcionesPuesto === 'algunas' ? 'Algunas' : 'Ninguna'}
          positive={s.orgStructure.descripcionesPuesto === 'todas'}
          warning={s.orgStructure.descripcionesPuesto === 'algunas'}
        />
        <StatusPill label="Tabulador" value={s.orgStructure.tieneTabulador ? 'Si' : 'No'} positive={s.orgStructure.tieneTabulador} />
        <StatusPill label="Reclutamiento" value={s.talentProcesses.procesoReclutamiento ? 'Si' : 'No'} positive={s.talentProcesses.procesoReclutamiento} />
        <StatusPill
          label="Evaluaciones"
          value={s.talentProcesses.evaluacionesDesempeno === 'si' ? 'Si' : s.talentProcesses.evaluacionesDesempeno === 'parcialmente' ? 'Parcial' : 'No'}
          positive={s.talentProcesses.evaluacionesDesempeno === 'si'}
          warning={s.talentProcesses.evaluacionesDesempeno === 'parcialmente'}
        />
        <StatusPill label="Capacitacion" value={s.talentProcesses.programaCapacitacion ? 'Si' : 'No'} positive={s.talentProcesses.programaCapacitacion} />
      </div>

      {/* Areas detail compact */}
      <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: '9px', marginBottom: '6px' }}>Detalle por area</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
        {s.areaDetails.map((a, i) => (
          <div key={i} className="flex items-center rounded-md bg-pale/50" style={{ gap: '8px', padding: '6px 12px' }}>
            <span className={`rounded-full ${a.tieneLider ? 'bg-success' : 'bg-error'}`} style={{ width: '6px', height: '6px' }} />
            <span className="flex-1 text-ink font-medium" style={{ fontSize: '11px' }}>{a.nombre || 'Sin nombre'}</span>
            <span className="text-muted" style={{ fontSize: '10px' }}>{a.colaboradores ?? 0} colab.</span>
            <span className="text-muted" style={{ fontSize: '10px' }}>
              {a.sueldoPromedio ? `$${a.sueldoPromedio.toLocaleString('es-MX')}` : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '10px' }}>
        <MiniMetric label="Rotacion Anual" value={s.talentProcesses.rotacionAnual !== null ? `${s.talentProcesses.rotacionAnual}%` : '—'} />
        <MiniMetric label="Competitividad Sueldos" value={competLabels[s.talentProcesses.competitividadSueldos] || '—'} />
        {s.talentProcesses.retoCapitalHumano && (
          <div className="rounded-lg bg-pale/50 border border-border/30" style={{ padding: '8px 12px', gridColumn: '1 / -1' }}>
            <p className="text-muted" style={{ fontSize: '9px', marginBottom: '2px' }}>Reto principal</p>
            <p className="text-ink" style={{ fontSize: '11px' }}>{s.talentProcesses.retoCapitalHumano}</p>
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
      {diagnostics.map(d => (
        <div key={d.id} className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '20px 24px' }}>
          <div className="flex items-center flex-wrap" style={{ gap: '12px', marginBottom: '12px' }}>
            <span className="flex-1 font-semibold text-navy" style={{ fontSize: '14px' }}>
              {d.datosGenerales.nombreComercial || 'Sin nombre'}
            </span>
            {d.wasPrefilled && (
              <span style={{ fontSize: '9px', padding: '3px 9px', borderRadius: '6px', background: '#d4922e15', color: '#d4922e', fontWeight: 700, border: '1px solid #d4922e30' }}>
                ✨ Pre-llenado
              </span>
            )}
            {d.wasPrefilled === false && (
              <span style={{ fontSize: '9px', padding: '3px 9px', borderRadius: '6px', background: '#6366f115', color: '#6366f1', fontWeight: 700, border: '1px solid #6366f130' }}>
                Contestado solo
              </span>
            )}
            <span className="text-muted" style={{ fontSize: '11px' }}>
              {new Date(d.savedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="border border-accent/30 bg-accent/5 text-accent font-bold" style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '8px' }}>
              {d.companySize.size}
            </span>
            <span className={`font-semibold ${LEVEL_COLORS_EXP[d.profesionalizacion.level] || ''}`} style={{ fontSize: '11px' }}>
              Prof: {d.profesionalizacion.level}
            </span>
          </div>
          <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
            <button
              onClick={() => onExtenso(d)}
              className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
              style={{ fontSize: '11px', padding: '7px 18px', borderRadius: '8px' }}
            >
              Ver extenso →
            </button>
            <button
              onClick={() => exportToPptx(d)}
              className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
              style={{ fontSize: '11px', padding: '7px 14px', borderRadius: '8px' }}
              title="Presentacion PowerPoint"
            >
              PPTX
            </button>
            <button
              onClick={() => exportToPdf(d)}
              className="border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
              style={{ fontSize: '11px', padding: '7px 14px', borderRadius: '8px' }}
            >
              PDF
            </button>
            <button
              onClick={() => onEdit(d)}
              className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
              style={{ fontSize: '11px', padding: '7px 14px', borderRadius: '8px' }}
            >
              ✏️ Editar
            </button>
            {deleteConfirm === d.id ? (
              <span className="flex items-center" style={{ gap: '6px' }}>
                <span className="text-error font-medium" style={{ fontSize: '11px' }}>Eliminar?</span>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deleting}
                  className="bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer disabled:opacity-50"
                  style={{ fontSize: '10px', padding: '5px 12px', borderRadius: '6px' }}
                >
                  {deleting ? 'Eliminando...' : 'Si, eliminar'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-muted font-medium hover:text-ink transition-all cursor-pointer"
                  style={{ fontSize: '10px', padding: '5px 8px' }}
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                onClick={() => setDeleteConfirm(d.id)}
                className="text-muted hover:text-error font-medium transition-all cursor-pointer"
                style={{ fontSize: '11px', padding: '7px 10px', borderRadius: '8px' }}
              >
                🗑️
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
              <span className="flex-1 font-semibold text-navy" style={{ fontSize: '14px' }}>
                {s.companyName || 'Sin nombre'}
              </span>
              <span className="text-muted" style={{ fontSize: '11px' }}>
                {new Date(s.savedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="border border-mid/30 bg-mid/5 text-mid font-bold" style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '8px' }}>
                {totalColab} colab.
              </span>
              <span className="text-muted font-semibold" style={{ fontSize: '11px' }}>{s.areaDetails.length} areas</span>
            </div>
            <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
              <button
                onClick={() => onExtenso(s)}
                className="bg-mid text-white font-semibold hover:bg-mid/80 transition-all cursor-pointer"
                style={{ fontSize: '11px', padding: '7px 18px', borderRadius: '8px' }}
              >
                Ver extenso →
              </button>
              <button
                onClick={() => exportOrgSurveyToPdf(s)}
                className="border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
                style={{ fontSize: '11px', padding: '7px 14px', borderRadius: '8px' }}
              >
                Descargar PDF
              </button>
              <button
                onClick={() => onEdit(s)}
                className="border border-mid text-mid font-semibold hover:bg-mid/5 transition-all cursor-pointer"
                style={{ fontSize: '11px', padding: '7px 14px', borderRadius: '8px' }}
              >
                ✏️ Editar
              </button>
              {deleteConfirm === s.id ? (
                <span className="flex items-center" style={{ gap: '6px' }}>
                  <span className="text-error font-medium" style={{ fontSize: '11px' }}>Eliminar?</span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting}
                    className="bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer disabled:opacity-50"
                    style={{ fontSize: '10px', padding: '5px 12px', borderRadius: '6px' }}
                  >
                    {deleting ? 'Eliminando...' : 'Si, eliminar'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="text-muted font-medium hover:text-ink transition-all cursor-pointer"
                    style={{ fontSize: '10px', padding: '5px 8px' }}
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(s.id)}
                  className="text-muted hover:text-error font-medium transition-all cursor-pointer"
                  style={{ fontSize: '11px', padding: '7px 10px', borderRadius: '8px' }}
                >
                  🗑️
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
      <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: '8px', marginBottom: '3px' }}>{label}</p>
      <p className="font-bold text-ink" style={{ fontSize: '12px' }}>{value}</p>
    </div>
  );
}

function StatusPill({ label, value, positive, warning }: { label: string; value: string; positive: boolean; warning?: boolean }) {
  return (
    <span className={`border font-medium ${
      positive ? 'border-success/30 bg-success/5 text-success' :
      warning ? 'border-warn/30 bg-warn/5 text-warn' :
      'border-error/30 bg-error/5 text-error'
    }`} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px' }}>
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
  basico: 'Basico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  lider_digital: 'Lider Digital',
};

function TechEjecutivoCard({ survey, onExtenso }: { survey: SavedTechSurvey; onExtenso: (s: SavedTechSurvey) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '24px 28px' }}>
      <div className="flex items-center" style={{ gap: '12px', marginBottom: '16px' }}>
        <div className="inline-flex items-center justify-center rounded-full bg-accent/10 shrink-0" style={{ width: '36px', height: '36px' }}>
          <span style={{ fontSize: '16px' }}>💻</span>
        </div>
        <h3 className="font-bold text-navy" style={{ fontSize: '14px' }}>Prueba de Tecnología</h3>
        <span className="text-muted" style={{ fontSize: '11px' }}>
          {new Date(survey.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="flex flex-wrap" style={{ gap: '14px', marginBottom: '16px' }}>
        <div>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: '9px', marginBottom: '2px' }}>Score</p>
          <p className={`font-bold ${MATURITY_COLORS_EXP[survey.maturityLevel]}`} style={{ fontSize: '18px' }}>
            {survey.maturityScore}<span className="text-muted font-normal" style={{ fontSize: '11px' }}>/100</span>
          </p>
        </div>
        <div>
          <p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: '9px', marginBottom: '2px' }}>Nivel</p>
          <p className={`font-bold ${MATURITY_COLORS_EXP[survey.maturityLevel]}`} style={{ fontSize: '13px' }}>
            {MATURITY_LABELS_EXP[survey.maturityLevel]}
          </p>
        </div>
        <div className="flex flex-wrap" style={{ gap: '6px' }}>
          <StatusPill label="ERP" value={survey.tools.tieneERP ? 'Si' : 'No'} positive={survey.tools.tieneERP} />
          <StatusPill label="CRM" value={survey.tools.tieneCRM ? 'Si' : 'No'} positive={survey.tools.tieneCRM} />
          <StatusPill label="IA" value={survey.aiAdoption.usaIAEnEmpresa ? 'Si' : 'No'} positive={survey.aiAdoption.usaIAEnEmpresa} />
          <StatusPill label="Nube" value={survey.security.usaNube ? 'Si' : 'No'} positive={survey.security.usaNube} />
        </div>
      </div>

      <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
        <button
          onClick={() => onExtenso(survey)}
          className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
          style={{ fontSize: '11px', padding: '7px 16px', borderRadius: '8px' }}
        >
          Reporte Extenso
        </button>
        <button
          onClick={() => exportTechSurveyToPdf(survey)}
          className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
          style={{ fontSize: '11px', padding: '7px 16px', borderRadius: '8px' }}
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
              <h4 className="font-bold text-navy" style={{ fontSize: '14px', marginBottom: '4px' }}>
                Prueba #{surveys.length - i}
                <span className="text-muted font-normal" style={{ fontSize: '11px', marginLeft: '8px' }}>
                  {new Date(survey.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </h4>
            </div>
            <div className={`rounded-lg border text-center ${
              survey.maturityLevel === 'basico' ? 'border-error/20 bg-error/5 text-error' :
              survey.maturityLevel === 'intermedio' ? 'border-warn/20 bg-warn/5 text-warn' :
              survey.maturityLevel === 'avanzado' ? 'border-success/20 bg-success/5 text-success' :
              'border-accent/20 bg-accent/5 text-accent'
            }`} style={{ padding: '6px 14px' }}>
              <p className="font-bold" style={{ fontSize: '16px' }}>{survey.maturityScore}</p>
              <p className="font-medium" style={{ fontSize: '9px' }}>{MATURITY_LABELS_EXP[survey.maturityLevel]}</p>
            </div>
          </div>

          <div className="flex flex-wrap" style={{ gap: '6px', marginBottom: '14px' }}>
            <StatusPill label="ERP" value={survey.tools.tieneERP ? 'Si' : 'No'} positive={survey.tools.tieneERP} />
            <StatusPill label="CRM" value={survey.tools.tieneCRM ? 'Si' : 'No'} positive={survey.tools.tieneCRM} />
            <StatusPill label="IA" value={survey.aiAdoption.usaIAEnEmpresa ? 'Si' : 'No'} positive={survey.aiAdoption.usaIAEnEmpresa} />
            <StatusPill label="KPIs" value={survey.dataAnalytics.tieneKPIs ? 'Si' : 'No'} positive={survey.dataAnalytics.tieneKPIs} />
            <StatusPill label="Nube" value={survey.security.usaNube ? 'Si' : 'No'} positive={survey.security.usaNube} />
            <StatusPill label="Equipo TI" value={survey.culture.equipoTI ? 'Si' : 'No'} positive={survey.culture.equipoTI} />
          </div>

          <div className="flex flex-wrap" style={{ gap: '8px' }}>
            <button
              onClick={() => onExtenso(survey)}
              className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
              style={{ fontSize: '11px', padding: '7px 16px', borderRadius: '8px' }}
            >
              Reporte Extenso
            </button>
            <button
              onClick={() => exportTechSurveyToPdf(survey)}
              className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
              style={{ fontSize: '11px', padding: '7px 16px', borderRadius: '8px' }}
            >
              PDF
            </button>
            <button
              onClick={() => onEdit(survey)}
              className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
              style={{ fontSize: '11px', padding: '7px 14px', borderRadius: '8px' }}
            >
              ✏️ Editar
            </button>
            {deleteConfirm === survey.id ? (
              <span className="flex items-center" style={{ gap: '6px' }}>
                <span className="text-error font-medium" style={{ fontSize: '11px' }}>Eliminar?</span>
                <button
                  onClick={() => handleDelete(survey.id)}
                  disabled={deleting}
                  className="bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer disabled:opacity-50"
                  style={{ fontSize: '10px', padding: '5px 12px', borderRadius: '6px' }}
                >
                  {deleting ? 'Eliminando...' : 'Si, eliminar'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-muted font-medium hover:text-ink transition-all cursor-pointer"
                  style={{ fontSize: '10px', padding: '5px 8px' }}
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                onClick={() => setDeleteConfirm(survey.id)}
                className="text-muted hover:text-error font-medium transition-all cursor-pointer"
                style={{ fontSize: '11px', padding: '7px 10px', borderRadius: '8px' }}
              >
                🗑️
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
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <p className="text-muted" style={{ fontSize: '12px' }}>
          {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} de cliente
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
          style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '12px' }}
        >
          + Crear cuenta
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-border text-center" style={{ padding: '48px 24px' }}>
          <p className="text-muted" style={{ fontSize: '13px' }}>No hay cuentas de clientes creadas aún.</p>
          <p className="text-muted" style={{ fontSize: '11px', marginTop: '8px' }}>Crea una cuenta para que tus clientes puedan acceder a sus encuestas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {accounts.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
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
          <div className="bg-white rounded-2xl shadow-xl border border-border max-w-md w-full text-center animate-fade-up" style={{ padding: '40px 32px', margin: '0 16px' }}>
            <div className="inline-flex items-center justify-center rounded-full bg-error/10" style={{ width: '48px', height: '48px', marginBottom: '20px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
            </div>
            <h3 className="font-serif text-navy" style={{ fontSize: '18px', marginBottom: '10px' }}>¿Eliminar cuenta de cliente?</h3>
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '28px' }}>
              Se eliminarán la cuenta y <strong>todos sus diagnósticos</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex" style={{ gap: '14px' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-border font-medium text-muted hover:text-ink transition-all cursor-pointer"
                style={{ padding: '10px 16px', fontSize: '13px' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => onDelete(deleteConfirm)}
                className="flex-1 rounded-xl bg-error text-white font-semibold hover:bg-error/80 transition-all cursor-pointer"
                style={{ padding: '10px 16px', fontSize: '13px' }}
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
  onDeleteRequest,
  onUpdated,
}: {
  account: AppUser;
  onDeleteRequest: () => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const perms = account.surveyPermissions ?? ['diagnostico_empresarial'];
  const hasDiag = perms.includes('diagnostico_empresarial');
  const hasOrg = perms.includes('estructura_organizacional');
  const hasTech = perms.includes('prueba_tecnologia');

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
            <p className="font-semibold text-ink" style={{ fontSize: '14px' }}>{account.displayName}</p>
            <p className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
              {account.email || account.username}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="text-accent hover:text-mid transition-colors cursor-pointer"
            style={{ padding: '6px', fontSize: '13px' }}
            title="Editar perfil"
          >
            ✏️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(); }}
            className="text-muted hover:text-error transition-colors cursor-pointer"
            style={{ padding: '6px', fontSize: '13px' }}
            title="Eliminar cuenta"
          >
            🗑️
          </button>
        </div>

        {/* Permission badges (read-only summary) */}
        <div className="flex items-center flex-wrap" style={{ gap: '8px', paddingLeft: '60px' }}>
          <span className={`border font-medium ${hasDiag ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border bg-pale text-muted'}`} style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '10px' }}>
            {hasDiag ? '✓' : '○'} Diagnóstico
          </span>
          <span className={`border font-medium ${hasOrg ? 'border-mid/30 bg-mid/5 text-mid' : 'border-border bg-pale text-muted'}`} style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '10px' }}>
            {hasOrg ? '✓' : '○'} Estructura Org.
          </span>
          <span className={`border font-medium ${hasTech ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border bg-pale text-muted'}`} style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '10px' }}>
            {hasTech ? '✓' : '○'} Tecnología
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
  const [email, setEmail] = useState(account.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permDiag, setPermDiag] = useState((account.surveyPermissions ?? ['diagnostico_empresarial']).includes('diagnostico_empresarial'));
  const [permOrg, setPermOrg] = useState((account.surveyPermissions ?? []).includes('estructura_organizacional'));
  const [permTech, setPermTech] = useState((account.surveyPermissions ?? []).includes('prueba_tecnologia'));
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
      displayName: displayName.trim() || account.username.trim(),
      username: account.username.trim(),
      email: email.trim(),
      permissions,
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
      <div className="bg-white rounded-2xl shadow-xl border border-border max-w-md w-full animate-fade-up" style={{ padding: '40px 32px', margin: '0 16px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 className="font-serif text-navy" style={{ fontSize: '18px', marginBottom: '6px' }}>Editar Perfil de Cliente</h3>
        <p className="text-muted" style={{ fontSize: '12px', marginBottom: '28px' }}>
          Modifique los datos de la cuenta. Deje la contraseña vacía para no cambiarla.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Logo */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '10px' }}>Logo de la empresa</label>
            <div className="flex items-center" style={{ gap: '16px' }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="rounded-xl object-cover" style={{ width: '64px', height: '64px', border: '2px solid var(--color-border)' }} />
              ) : (
                <div className="flex items-center justify-center rounded-xl bg-pale border-2 border-dashed border-border" style={{ width: '64px', height: '64px' }}>
                  <span className="text-muted" style={{ fontSize: '20px' }}>🏢</span>
                </div>
              )}
              <div className="flex-1">
                <label className="inline-block border border-accent text-accent font-medium hover:bg-accent/5 transition-all cursor-pointer" style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '12px' }}>
                  {logoPreview ? 'Cambiar' : 'Subir logo'}
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
                {logoPreview && (
                  <button type="button" onClick={handleRemoveLogo} className="text-muted hover:text-error transition-colors cursor-pointer" style={{ fontSize: '11px', marginLeft: '10px' }}>
                    Quitar
                  </button>
                )}
                <p className="text-muted" style={{ fontSize: '10px', marginTop: '4px' }}>PNG, JPG. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '6px' }}>Nombre del Cliente</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="input-field" placeholder="Ej: Empresa ABC" style={{ fontSize: '13px' }} />
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '6px' }}>Correo electronico *</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} className="input-field" placeholder="Ej: contacto@empresa.com" style={{ fontSize: '13px' }} />
            <p className="text-muted" style={{ fontSize: '10px', marginTop: '4px' }}>Se usa para inicio de sesion y envio de reportes.</p>
          </div>

          {/* Password */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '6px' }}>
              Contrasena <span className="text-muted font-normal">(dejar vacio para no cambiar)</span>
            </label>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="input-field flex-1"
                placeholder="Nueva contraseña"
                style={{ fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted hover:text-ink transition-colors cursor-pointer"
                style={{ padding: '8px', fontSize: '14px' }}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '10px' }}>Encuestas habilitadas *</label>
            <div className="flex flex-wrap" style={{ gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPermDiag(!permDiag)}
                className={`border font-medium transition-all cursor-pointer ${permDiag ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'}`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px' }}
              >
                {permDiag ? '✓' : '○'} Diagnóstico Empresarial
              </button>
              <button
                type="button"
                onClick={() => setPermOrg(!permOrg)}
                className={`border font-medium transition-all cursor-pointer ${permOrg ? 'border-mid bg-mid/10 text-mid' : 'border-border bg-pale text-muted'}`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px' }}
              >
                {permOrg ? '✓' : '○'} Estructura Organizacional
              </button>
              <button
                type="button"
                onClick={() => setPermTech(!permTech)}
                className={`border font-medium transition-all cursor-pointer ${permTech ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'}`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px' }}
              >
                {permTech ? '✓' : '○'} Prueba de Tecnologia
              </button>
            </div>
          </div>

          {error && <p className="text-error text-center" style={{ fontSize: '12px' }}>{error}</p>}

          <div className="flex" style={{ gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border font-medium text-muted hover:text-ink transition-all cursor-pointer" style={{ padding: '10px 16px', fontSize: '13px' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer disabled:opacity-50" style={{ padding: '10px 16px', fontSize: '13px' }}>
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
      setError('Correo electronico y contrasena son obligatorios.');
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
      <div className="bg-white rounded-2xl shadow-xl border border-border max-w-md w-full animate-fade-up" style={{ padding: '40px 32px', margin: '0 16px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 className="font-serif text-navy" style={{ fontSize: '18px', marginBottom: '6px' }}>Crear Cuenta de Cliente</h3>
        <p className="text-muted" style={{ fontSize: '12px', marginBottom: '28px' }}>
          El cliente usará estas credenciales para acceder a sus encuestas.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Logo upload */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '10px' }}>Logo de la empresa</label>
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
                  <span className="text-muted" style={{ fontSize: '20px' }}>🏢</span>
                </div>
              )}
              <div className="flex-1">
                <label
                  className="inline-block border border-accent text-accent font-medium hover:bg-accent/5 transition-all cursor-pointer"
                  style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '12px' }}
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
                    style={{ fontSize: '11px', marginLeft: '10px' }}
                  >
                    Quitar
                  </button>
                )}
                <p className="text-muted" style={{ fontSize: '10px', marginTop: '4px' }}>PNG, JPG. Max 5MB. Se redimensiona a 200px.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '6px' }}>Nombre del Cliente</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="input-field" placeholder="Ej: Empresa ABC" style={{ fontSize: '13px' }} />
          </div>
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '6px' }}>Correo electronico *</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} className="input-field" placeholder="Ej: contacto@empresa.com" style={{ fontSize: '13px' }} autoFocus />
            <p className="text-muted" style={{ fontSize: '10px', marginTop: '4px' }}>El cliente usara este correo para iniciar sesion y recibir reportes.</p>
          </div>
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '6px' }}>Contrasena *</label>
            <input type="text" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} className="input-field" placeholder="Contrasena para el cliente" style={{ fontSize: '13px' }} />
          </div>

          {/* Survey permissions */}
          <div>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '10px' }}>Encuestas habilitadas *</label>
            <div className="flex flex-wrap" style={{ gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPermDiag(!permDiag)}
                className={`border font-medium transition-all cursor-pointer ${
                  permDiag ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'
                }`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px' }}
              >
                {permDiag ? '✓' : '○'} Diagnóstico Empresarial
              </button>
              <button
                type="button"
                onClick={() => setPermOrg(!permOrg)}
                className={`border font-medium transition-all cursor-pointer ${
                  permOrg ? 'border-mid bg-mid/10 text-mid' : 'border-border bg-pale text-muted'
                }`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px' }}
              >
                {permOrg ? '✓' : '○'} Estructura Organizacional
              </button>
              <button
                type="button"
                onClick={() => setPermTech(!permTech)}
                className={`border font-medium transition-all cursor-pointer ${
                  permTech ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'
                }`}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px' }}
              >
                {permTech ? '✓' : '○'} Prueba de Tecnologia
              </button>
            </div>
          </div>

          {error && <p className="text-error text-center" style={{ fontSize: '12px' }}>{error}</p>}

          <div className="flex" style={{ gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border font-medium text-muted hover:text-ink transition-all cursor-pointer" style={{ padding: '10px 16px', fontSize: '13px' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer disabled:opacity-50" style={{ padding: '10px 16px', fontSize: '13px' }}>
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

function DatosPruebaPanel() {
  const loadDiagnosticForReport = useDiagnosticStore(s => s.loadDiagnosticForReport);
  const loadOrgSurveyForReport = useOrgSurveyStore(s => s.loadOrgSurveyForReport);
  const setView = useDiagnosticStore(s => s.setView);

  const sampleDiag = generateSampleDiagnostic();
  const sampleOrg = generateSampleOrgSurvey();

  const companyName = sampleDiag.datosGenerales.nombreComercial;

  function handleViewExpediente() {
    exportExpediente(companyName, sampleDiag, sampleOrg, 'view');
  }

  function handleDownloadExpediente() {
    exportExpediente(companyName, sampleDiag, sampleOrg, 'download');
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 className="font-serif text-navy" style={{ fontSize: '17px' }}>Expediente de Prueba</h3>
        <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
          Cliente ficticio para visualizar como se ve un expediente completo. Los datos no se guardan.
        </p>
      </div>

      {/* Test mode banner */}
      <div className="w-full bg-warn/10 border border-warn/30 rounded-xl text-center" style={{ padding: '12px 20px', marginBottom: '20px' }}>
        <p className="text-warn font-semibold" style={{ fontSize: '12px' }}>Modo de prueba — estos datos son ficticios y no se guardan</p>
      </div>

      {/* Expediente actions */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '24px 28px', marginBottom: '20px' }}>
        <div className="flex items-center" style={{ gap: '14px', marginBottom: '16px' }}>
          <ClientLogo size={44} />
          <div className="flex-1">
            <h3 className="font-bold text-navy" style={{ fontSize: '15px', marginBottom: '2px' }}>{companyName}</h3>
            <p className="text-muted" style={{ fontSize: '11px' }}>Cliente de prueba — Manufactura</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
          <button onClick={handleViewExpediente} className="bg-navy text-white font-semibold hover:bg-navy/80 transition-all cursor-pointer" style={{ fontSize: '12px', padding: '8px 20px', borderRadius: '8px' }}>
            Ver Expediente PDF
          </button>
          <button onClick={handleDownloadExpediente} className="border border-navy text-navy font-semibold hover:bg-navy/5 transition-all cursor-pointer" style={{ fontSize: '12px', padding: '8px 20px', borderRadius: '8px' }}>
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Resumen cards using new components */}
      <DiagEjecutivoCard
        diag={sampleDiag}
        onExtenso={(d) => loadDiagnosticForReport(d)}
      />
      <div style={{ marginTop: '16px' }}>
        <OrgEjecutivoCard
          survey={sampleOrg}
          onExtenso={(s) => { loadOrgSurveyForReport(s); setView('org_report'); }}
        />
      </div>

      {/* Info note */}
      <div className="bg-pale rounded-xl border border-border/30" style={{ padding: '16px 20px', marginTop: '20px' }}>
        <p className="text-muted" style={{ fontSize: '11px' }}>
          <strong>Nota:</strong> Este expediente usa datos ficticios para que pueda visualizar como se ve un cliente con ambas encuestas completadas.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONFIGURACIÓN PANEL
   ══════════════════════════════════════════════════════════ */

function ConfiguracionPanel({ showBenchmarks, setShowBenchmarks }: { showBenchmarks: boolean; setShowBenchmarks: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Benchmark settings card */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '14px' }}>
            <div className="inline-flex items-center justify-center rounded-full bg-accent/10 shrink-0" style={{ width: '44px', height: '44px' }}>
              <span style={{ fontSize: '20px' }}>📊</span>
            </div>
            <div>
              <h3 className="font-bold text-navy" style={{ fontSize: '15px', marginBottom: '2px' }}>Benchmarks por Industria</h3>
              <p className="text-muted" style={{ fontSize: '12px' }}>Márgenes financieros de referencia por sector</p>
            </div>
          </div>
          <button
            onClick={() => setShowBenchmarks(true)}
            className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
            style={{ fontSize: '12px', padding: '8px 20px', borderRadius: '8px' }}
          >
            Editar
          </button>
        </div>
      </div>

      {/* Encuestas config card */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px' }}>
        <div className="flex items-center" style={{ gap: '14px' }}>
          <div className="inline-flex items-center justify-center rounded-full bg-mid/10 shrink-0" style={{ width: '44px', height: '44px' }}>
            <span style={{ fontSize: '20px' }}>📋</span>
          </div>
          <div>
            <h3 className="font-bold text-navy" style={{ fontSize: '15px', marginBottom: '2px' }}>Encuestas Disponibles</h3>
            <p className="text-muted" style={{ fontSize: '12px' }}>Las encuestas se configuran por cliente en la pestaña "Clientes"</p>
          </div>
        </div>
        <div className="flex flex-wrap" style={{ gap: '10px', marginTop: '16px', paddingLeft: '58px' }}>
          <span className="border border-accent/30 bg-accent/5 text-accent font-medium" style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '8px' }}>
            ✓ Diagnóstico Empresarial
          </span>
          <span className="border border-mid/30 bg-mid/5 text-mid font-medium" style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '8px' }}>
            ✓ Estructura Organizacional
          </span>
        </div>
      </div>

      {/* System info card */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '28px 32px' }}>
        <div className="flex items-center" style={{ gap: '14px' }}>
          <div className="inline-flex items-center justify-center rounded-full bg-navy/10 shrink-0" style={{ width: '44px', height: '44px' }}>
            <span style={{ fontSize: '20px' }}>ℹ️</span>
          </div>
          <div>
            <h3 className="font-bold text-navy" style={{ fontSize: '15px', marginBottom: '2px' }}>Información del Sistema</h3>
            <p className="text-muted" style={{ fontSize: '12px' }}>Complement Consulting Group — Diagnóstico Empresarial v2.0</p>
          </div>
        </div>
        <div className="grid grid-cols-2" style={{ gap: '10px', marginTop: '16px', paddingLeft: '58px' }}>
          <div className="rounded-lg bg-pale" style={{ padding: '10px 14px' }}>
            <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: '9px', marginBottom: '2px' }}>Base de datos</p>
            <p className="text-ink font-semibold" style={{ fontSize: '11px' }}>Supabase PostgreSQL</p>
          </div>
          <div className="rounded-lg bg-pale" style={{ padding: '10px 14px' }}>
            <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: '9px', marginBottom: '2px' }}>Hosting</p>
            <p className="text-ink font-semibold" style={{ fontSize: '11px' }}>Vercel</p>
          </div>
        </div>
      </div>

      {/* Benchmark Settings Modal */}
      {showBenchmarks && (
        <BenchmarkSettingsModal onClose={() => setShowBenchmarks(false)} />
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
            <h3 className="font-serif text-navy" style={{ fontSize: '18px' }}>Configuración de Benchmarks</h3>
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>Establezca los márgenes aceptables por industria</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors cursor-pointer" style={{ fontSize: '20px', padding: '4px' }}>
            ✕
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
              style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '12px', flex: 1 }}
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
            <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '10px', marginBottom: '14px' }}>Criterios de evaluación</p>
            <div className="grid grid-cols-2" style={{ gap: '14px' }}>
              <BenchmarkField label="Tolerancia (±%)" value={b.tolerancia} onChange={v => setBenchmark(activeSector, { tolerancia: v })} hint="Rango para 'En rango'" />
              <BenchmarkField label="Umbral crítico (%)" value={b.criticoUmbral} onChange={v => setBenchmark(activeSector, { criticoUmbral: v })} hint="Debajo de benchmark" />
            </div>
          </div>

          {/* Visual explanation */}
          <div className="rounded-xl bg-pale border border-border/30" style={{ padding: '16px 20px' }}>
            <p className="font-medium text-navy" style={{ fontSize: '11px', marginBottom: '10px' }}>Ejemplo: Margen Bruto ({b.margenBruto}%)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="rounded-full bg-success/15 text-success font-semibold" style={{ padding: '1px 8px', fontSize: '10px' }}>Arriba</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>&gt; {b.margenBruto + b.tolerancia}%</span>
              </div>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="rounded-full bg-mid/15 text-mid font-semibold" style={{ padding: '1px 8px', fontSize: '10px' }}>En rango</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>{b.margenBruto - b.tolerancia}% — {b.margenBruto + b.tolerancia}%</span>
              </div>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="rounded-full bg-warn/15 text-warn font-semibold" style={{ padding: '1px 8px', fontSize: '10px' }}>Debajo</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>{b.margenBruto - b.criticoUmbral}% — {b.margenBruto - b.tolerancia}%</span>
              </div>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="rounded-full bg-error/15 text-error font-semibold" style={{ padding: '1px 8px', fontSize: '10px' }}>Crítico</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>&lt; {b.margenBruto - b.criticoUmbral}% o negativo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex" style={{ gap: '12px' }}>
          <button
            onClick={() => { resetBenchmarks(); }}
            className="border border-border text-muted hover:text-ink font-medium transition-all cursor-pointer"
            style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '12px' }}
          >
            Restablecer valores
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
            style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}
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
      <label className="block font-medium text-ink" style={{ fontSize: '11px', marginBottom: '6px' }}>{label}</label>
      {hint && <p className="text-muted" style={{ fontSize: '10px', marginBottom: '4px' }}>{hint}</p>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        step="0.5"
        className="input-field"
        style={{ fontSize: '13px' }}
      />
    </div>
  );
}
