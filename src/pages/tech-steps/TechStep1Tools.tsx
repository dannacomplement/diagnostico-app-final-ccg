import { useTechSurveyStore } from '../../store/techSurveyStore';

const EXCEL_NIVELES = [
  { value: 'basico' as const, icon: '📊', label: 'Basico', desc: 'Formulas simples' },
  { value: 'intermedio' as const, icon: '📈', label: 'Intermedio', desc: 'Tablas dinamicas' },
  { value: 'avanzado' as const, icon: '🧮', label: 'Avanzado', desc: 'Macros y VBA' },
];

const ERP_OPTIONS = ['SAP', 'Odoo', 'Oracle', 'NetSuite', 'Microsoft Dynamics', 'Epicor', 'Otro'];
const CRM_OPTIONS = ['Salesforce', 'HubSpot', 'Zoho', 'Pipedrive', 'Monday', 'Otro'];
const MRP_OPTIONS = ['SAP MRP', 'Oracle', 'Epicor', 'Otro'];

export default function TechStep1Tools() {
  const companyName = useTechSurveyStore(s => s.companyName);
  const setCompanyName = useTechSurveyStore(s => s.setCompanyName);
  const tools = useTechSurveyStore(s => s.tools);
  const update = useTechSurveyStore(s => s.updateTools);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>
        Herramientas y Software
      </h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '36px' }}>
        Identifiquemos las herramientas tecnologicas que utiliza actualmente su empresa.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Nombre de la empresa */}
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '8px' }}>
            Nombre de la empresa
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="Nombre comercial de la empresa"
            className="input-field"
            style={{ fontSize: '13px' }}
          />
        </div>

        {/* Excel */}
        <div>
          <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px', marginBottom: '12px' }}>
            <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Utiliza Excel?</span>
            <button
              onClick={() => update({ usaExcel: !tools.usaExcel, excelNivel: !tools.usaExcel ? tools.excelNivel : '' })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${tools.usaExcel ? 'bg-accent' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tools.usaExcel ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {tools.usaExcel && (
            <div style={{ marginLeft: '8px' }}>
              <p className="text-muted font-medium" style={{ fontSize: '11px', marginBottom: '8px' }}>Nivel de uso de Excel</p>
              <div className="grid grid-cols-3" style={{ gap: '10px' }}>
                {EXCEL_NIVELES.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update({ excelNivel: opt.value })}
                    className={`rounded-xl border-2 text-center transition-all cursor-pointer ${
                      tools.excelNivel === opt.value ? 'border-accent bg-accent/5' : 'border-border/40 bg-white hover:border-accent/30'
                    }`}
                    style={{ padding: '16px 12px' }}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <p className="font-semibold text-ink" style={{ fontSize: '12px', marginTop: '6px' }}>{opt.label}</p>
                    <p className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ERP */}
        <div>
          <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px', marginBottom: '12px' }}>
            <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Cuenta con ERP?</span>
            <button
              onClick={() => update({ tieneERP: !tools.tieneERP, erpNombre: !tools.tieneERP ? tools.erpNombre : '' })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${tools.tieneERP ? 'bg-accent' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tools.tieneERP ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {tools.tieneERP && (
            <div style={{ marginLeft: '8px' }}>
              <label className="block text-muted font-medium" style={{ fontSize: '11px', marginBottom: '6px' }}>
                ¿Cual ERP utiliza?
              </label>
              <select
                value={tools.erpNombre}
                onChange={e => update({ erpNombre: e.target.value })}
                className="input-field"
                style={{ fontSize: '13px', maxWidth: '280px' }}
              >
                <option value="">Seleccione una opcion</option>
                {ERP_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* CRM */}
        <div>
          <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px', marginBottom: '12px' }}>
            <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Cuenta con CRM?</span>
            <button
              onClick={() => update({ tieneCRM: !tools.tieneCRM, crmNombre: !tools.tieneCRM ? tools.crmNombre : '' })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${tools.tieneCRM ? 'bg-accent' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tools.tieneCRM ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {tools.tieneCRM && (
            <div style={{ marginLeft: '8px' }}>
              <label className="block text-muted font-medium" style={{ fontSize: '11px', marginBottom: '6px' }}>
                ¿Cual CRM utiliza?
              </label>
              <select
                value={tools.crmNombre}
                onChange={e => update({ crmNombre: e.target.value })}
                className="input-field"
                style={{ fontSize: '13px', maxWidth: '280px' }}
              >
                <option value="">Seleccione una opcion</option>
                {CRM_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* MRP */}
        <div>
          <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px', marginBottom: '12px' }}>
            <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Cuenta con MRP?</span>
            <button
              onClick={() => update({ tieneMRP: !tools.tieneMRP, mrpNombre: !tools.tieneMRP ? tools.mrpNombre : '' })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${tools.tieneMRP ? 'bg-accent' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tools.tieneMRP ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {tools.tieneMRP && (
            <div style={{ marginLeft: '8px' }}>
              <label className="block text-muted font-medium" style={{ fontSize: '11px', marginBottom: '6px' }}>
                ¿Cual MRP utiliza?
              </label>
              <select
                value={tools.mrpNombre}
                onChange={e => update({ mrpNombre: e.target.value })}
                className="input-field"
                style={{ fontSize: '13px', maxWidth: '280px' }}
              >
                <option value="">Seleccione una opcion</option>
                {MRP_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Otras herramientas */}
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '8px' }}>
            Otras herramientas tecnologicas
          </label>
          <p className="text-muted" style={{ fontSize: '11px', marginBottom: '8px' }}>
            Mencione cualquier otro software o herramienta que utilice (opcional)
          </p>
          <textarea
            value={tools.otrasHerramientas}
            onChange={e => update({ otrasHerramientas: e.target.value })}
            placeholder="Ej: Slack, Trello, QuickBooks, Google Workspace..."
            className="input-field"
            rows={3}
            style={{ fontSize: '13px', resize: 'vertical' }}
          />
        </div>
      </div>
    </div>
  );
}
