import { useDiagnosticStore } from '../../store/diagnosticStore';
import { EMPRESA_FAMILIAR_OPTIONS, SECTOR_OPTIONS, SOFTWARE_OPTIONS, EXCEL_NIVEL_OPTIONS, PUESTO_EMPRESA_OPTIONS, PUESTO_FAMILIA_OPTIONS, ERP_OPTIONS, MRP_OPTIONS, CRM_OPTIONS } from '../../config/constants';
import type { SoftwareOption } from '../../lib/types';
import SearchableCombobox from '../../components/ui/SearchableCombobox';

const EMPTY_SELECTIONS = { selected: [] as SoftwareOption[], erpDetalle: '', mrpDetalle: '', crmDetalle: '', excelNivel: '' as const };

export default function Step1DatosGenerales() {
  const datos = useDiagnosticStore(s => s.datosGenerales);
  const update = useDiagnosticStore(s => s.updateDatosGenerales);
  const isFamilyBusiness = useDiagnosticStore(s => s.isFamilyBusiness);
  const isFamily = isFamilyBusiness();

  // Defensive: handle old persisted data that may lack softwareSelections
  const sel = datos.softwareSelections ?? EMPTY_SELECTIONS;

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>Datos Generales de la Empresa</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '40px' }}>Informaci&oacute;n general del cliente y su empresa.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <Field label="Nombre Comercial / Raz&oacute;n Social" required>
          <input
            type="text"
            value={datos.nombreComercial}
            onChange={e => update({ nombreComercial: e.target.value })}
            placeholder="Ej: Grupo Industrial Monterrey S.A. de C.V."
            className="input-field"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '28px' }}>
          <InlineField label="Antigüedad Constituida" suffix="años">
            <input
              type="number"
              value={datos.antiguedadConstituida}
              onChange={e => update({ antiguedadConstituida: e.target.value })}
              placeholder="Ej: 15"
              min="0"
              className="input-field"
              style={{ maxWidth: '100px' }}
            />
          </InlineField>
          <InlineField label="Antigüedad Operativa" suffix="años">
            <input
              type="number"
              value={datos.antiguedadOperativa}
              onChange={e => update({ antiguedadOperativa: e.target.value })}
              placeholder="Ej: 12"
              min="0"
              className="input-field"
              style={{ maxWidth: '100px' }}
            />
          </InlineField>
        </div>

        <Field label="&iquest;Es Empresa Familiar?" required>
          <div className="flex flex-wrap" style={{ gap: '10px' }}>
            {EMPRESA_FAMILIAR_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ empresaFamiliar: opt.value })}
                className={`font-medium transition-all cursor-pointer
                  ${datos.empresaFamiliar === opt.value
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-pale text-muted hover:bg-light hover:text-ink border border-border'
                  }
                `}
                style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '12px' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="border-t border-border/50" style={{ paddingTop: '32px' }}>
          <h3 className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '11px', marginBottom: '24px' }}>Persona que contesta</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '28px' }}>
              <Field label="Nombre completo">
                <input
                  type="text"
                  value={datos.respondente}
                  onChange={e => update({ respondente: e.target.value })}
                  placeholder="Nombre de la persona que contesta"
                  className="input-field"
                />
              </Field>
              <Field label="Correo electrónico">
                <input
                  type="email"
                  value={datos.email}
                  onChange={e => update({ email: e.target.value })}
                  placeholder="Ej: nombre@empresa.com"
                  className="input-field"
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '28px' }}>
              <Field label="Puesto en la empresa">
                <SearchableCombobox
                  value={datos.puestoEmpresa}
                  onChange={val => update({ puestoEmpresa: val })}
                  options={PUESTO_EMPRESA_OPTIONS}
                  placeholder="Ej: Director General"
                />
              </Field>
              {isFamily && (
                <Field label="Puesto en la familia">
                  <SearchableCombobox
                    value={datos.puestoFamilia}
                    onChange={val => update({ puestoFamilia: val })}
                    options={PUESTO_FAMILIA_OPTIONS}
                    placeholder="Ej: Hijo mayor"
                  />
                </Field>
              )}
            </div>
            <Field label="¿Es socio?">
              <div className="flex" style={{ gap: '10px' }}>
                {(['si', 'no'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update({ esSocio: opt, ...(opt === 'no' ? { porcentajeAcciones: '' } : {}) })}
                    className={`font-medium transition-all cursor-pointer
                      ${datos.esSocio === opt
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-pale text-muted hover:bg-light hover:text-ink border border-border'
                      }
                    `}
                    style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '12px' }}
                  >
                    {opt === 'si' ? 'Sí' : 'No'}
                  </button>
                ))}
              </div>
              {datos.esSocio === 'si' && (
                <div className="flex items-center" style={{ marginTop: '12px', gap: '8px' }}>
                  <span className="text-muted" style={{ fontSize: '12px' }}>% de acciones:</span>
                  <input
                    type="number"
                    value={datos.porcentajeAcciones}
                    onChange={e => update({ porcentajeAcciones: e.target.value })}
                    placeholder="Ej: 40"
                    min="0"
                    max="100"
                    step="1"
                    className="input-field"
                    style={{ maxWidth: '90px' }}
                  />
                  <span className="text-muted font-medium" style={{ fontSize: '12px' }}>%</span>
                </div>
              )}
            </Field>
          </div>
        </div>

        <div className="border-t border-border/50" style={{ paddingTop: '32px' }}>
          <h3 className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '11px', marginBottom: '24px' }}>Giro y herramientas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <Field label="Giro / Principales Servicios" required>
              <div className="flex flex-wrap" style={{ gap: '10px' }}>
                {SECTOR_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ sector: opt.value })}
                    className={`font-medium transition-all cursor-pointer
                      ${datos.sector === opt.value
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-pale text-muted hover:bg-light hover:text-ink border border-border'
                      }
                    `}
                    style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '12px' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Software de Gestión (puede seleccionar varios)">
              <div className="flex flex-wrap" style={{ gap: '10px' }}>
                {SOFTWARE_OPTIONS.map(opt => {
                  const isSelected = sel.selected.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        let newSelected: SoftwareOption[];
                        if (opt.value === 'nada') {
                          newSelected = isSelected ? [] : ['nada'];
                        } else {
                          const withoutNada = sel.selected.filter(s => s !== 'nada');
                          newSelected = withoutNada.includes(opt.value)
                            ? withoutNada.filter(s => s !== opt.value)
                            : [...withoutNada, opt.value];
                        }
                        update({
                          softwareSelections: {
                            ...sel,
                            selected: newSelected,
                            ...(!newSelected.includes('erp') ? { erpDetalle: '' } : {}),
                            ...(!newSelected.includes('mrp') ? { mrpDetalle: '' } : {}),
                            ...(!newSelected.includes('crm') ? { crmDetalle: '' } : {}),
                            ...(!newSelected.includes('excel') ? { excelNivel: '' as const } : {}),
                          },
                        });
                      }}
                      className={`font-medium transition-all cursor-pointer
                        ${isSelected
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-pale text-muted hover:bg-light hover:text-ink border border-border'
                        }
                      `}
                      style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '12px' }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Sub-campos condicionales */}
              {(sel.selected.includes('erp') ||
                sel.selected.includes('mrp') ||
                sel.selected.includes('crm') ||
                sel.selected.includes('excel')) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                  {sel.selected.includes('erp') && (
                    <SearchableCombobox
                      value={sel.erpDetalle}
                      onChange={val => update({
                        softwareSelections: { ...sel, erpDetalle: val },
                      })}
                      options={ERP_OPTIONS}
                      placeholder="¿Cuál ERP? Ej: SAP, Odoo, Oracle..."
                    />
                  )}
                  {sel.selected.includes('mrp') && (
                    <SearchableCombobox
                      value={sel.mrpDetalle}
                      onChange={val => update({
                        softwareSelections: { ...sel, mrpDetalle: val },
                      })}
                      options={MRP_OPTIONS}
                      placeholder="¿Cuál MRP? Ej: SAP MRP, NetSuite, Infor..."
                    />
                  )}
                  {sel.selected.includes('crm') && (
                    <SearchableCombobox
                      value={sel.crmDetalle}
                      onChange={val => update({
                        softwareSelections: { ...sel, crmDetalle: val },
                      })}
                      options={CRM_OPTIONS}
                      placeholder="¿Cuál CRM? Ej: Salesforce, HubSpot, Zoho..."
                    />
                  )}
                  {sel.selected.includes('excel') && (
                    <div>
                      <label className="block text-muted" style={{ fontSize: '11px', marginBottom: '6px' }}>
                        Nivel de Excel (opcional)
                      </label>
                      <div className="flex flex-wrap" style={{ gap: '8px' }}>
                        {EXCEL_NIVEL_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => update({
                              softwareSelections: {
                                ...sel,
                                excelNivel: sel.excelNivel === opt.value ? '' : opt.value,
                              },
                            })}
                            className={`font-medium transition-all cursor-pointer
                              ${sel.excelNivel === opt.value
                                ? 'bg-accent text-white shadow-sm'
                                : 'bg-pale text-muted hover:bg-light hover:text-ink border border-border'
                              }
                            `}
                            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11px' }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineField({ label, required, suffix, children }: { label: string; required?: boolean; suffix?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center" style={{ gap: '8px' }}>
      <label className="font-medium text-ink shrink-0" style={{ fontSize: '12px' }}>
        {label}{required && <span className="text-error" style={{ marginLeft: '3px' }}>*</span>}:
      </label>
      {children}
      {suffix && <span className="text-muted font-medium shrink-0" style={{ fontSize: '12px' }}>{suffix}</span>}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '8px' }}>
        {label}
        {required && <span className="text-error" style={{ marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}
