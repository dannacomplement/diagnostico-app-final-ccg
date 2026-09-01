import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { SavedDiagnostic, MarginLevel, CurrencyCode, AppUser } from './types';
import { ALL_CRITERIA, PROFESIONALIZACION_CRITERIA, INSTITUCIONALIZACION_CRITERIA } from '../config/questions';
import { buildSoftwareLabel } from './formatters';
import { formatMonetaryValue } from './money';
import { normalizeMarginLevel, getHighestPaidGerencia } from './calculations';

/* ── Color palette ────────────────────────────────────────── */
const NAVY    = '1B2A4A';
const ACCENT  = '3B82F6';
const PALE    = 'F8FAFC';
const BORDER  = 'CBD5E1';
const WHITE   = 'FFFFFF';
const SUCCESS = '16A34A';
const WARN    = 'F59E0B';
const ERROR   = 'DC2626';
const MID     = '6366F1';
const MUTED   = '64748B';

const MARGIN_LEVEL_LABELS: Record<MarginLevel, string> = {
  en_rango: 'Dentro de rango',
  fuera_de_rango: 'Fuera de rango',
};

const MARGIN_LEVEL_COLORS: Record<MarginLevel, string> = {
  en_rango: SUCCESS,
  fuera_de_rango: ERROR,
};

/* ── Helpers ──────────────────────────────────────────────── */

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BORDER } };
  return { top: side, bottom: side, left: side, right: side };
}

function sectionHeaderFill(): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
}

function sectionHeaderFont(): Partial<ExcelJS.Font> {
  return { bold: true, size: 11, color: { argb: WHITE }, name: 'Calibri' };
}

function labelFont(): Partial<ExcelJS.Font> {
  return { bold: true, size: 10, color: { argb: NAVY }, name: 'Calibri' };
}

function valueFont(): Partial<ExcelJS.Font> {
  return { size: 10, color: { argb: '334155' }, name: 'Calibri' };
}

function tableHeaderFill(): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
}

function tableHeaderFont(): Partial<ExcelJS.Font> {
  return { bold: true, size: 9.5, color: { argb: NAVY }, name: 'Calibri' };
}

function zebraFill(): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: PALE } };
}

/** Write a section header (full-width merged, navy background) */
function addSectionHeader(ws: ExcelJS.Worksheet, row: number, title: string, colCount: number): number {
  ws.mergeCells(row, 1, row, colCount);
  const cell = ws.getCell(row, 1);
  cell.value = title;
  cell.font = sectionHeaderFont();
  cell.fill = sectionHeaderFill();
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(row).height = 26;
  // Apply border to whole merged range
  for (let c = 1; c <= colCount; c++) {
    ws.getCell(row, c).border = thinBorder();
  }
  return row + 1;
}

/** Write a label→value pair in 2 cells */
function addKeyValue(ws: ExcelJS.Worksheet, row: number, label: string, value: string | number, colCount: number): number {
  const labelCell = ws.getCell(row, 1);
  labelCell.value = label;
  labelCell.font = labelFont();
  labelCell.alignment = { vertical: 'middle' };
  labelCell.border = thinBorder();
  labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALE } };

  // Merge cols 2 through colCount for the value
  if (colCount > 2) {
    ws.mergeCells(row, 2, row, colCount);
  }
  const valCell = ws.getCell(row, 2);
  valCell.value = typeof value === 'number' ? value : (value || '—');
  valCell.font = valueFont();
  valCell.alignment = { vertical: 'middle', wrapText: true };
  valCell.border = thinBorder();

  ws.getRow(row).height = 20;
  return row + 1;
}

/** Write a table header row */
function addTableHeader(ws: ExcelJS.Worksheet, row: number, headers: string[]): number {
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.font = tableHeaderFont();
    cell.fill = tableHeaderFill();
    cell.border = thinBorder();
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  ws.getRow(row).height = 22;
  return row + 1;
}

/** Add an empty spacer row */
function addSpacer(ws: ExcelJS.Worksheet, row: number): number {
  ws.getRow(row).height = 12;
  return row + 1;
}

/* ── Main Export ──────────────────────────────────────────── */

export async function exportToExcel(diagnostic: SavedDiagnostic, currencyCode: CurrencyCode = 'MXN'): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Complement Consulting Group';
  wb.created = new Date();

  const ws = wb.addWorksheet('Radiografía', {
    properties: { defaultRowHeight: 18 },
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });

  const COLS = 5; // Total columns used across the sheet

  // Column widths
  ws.columns = [
    { width: 32 },  // A — labels / criterion names
    { width: 18 },  // B — values / aplica
    { width: 14 },  // C — rating / extra
    { width: 16 },  // D — comments col 1 / evaluation
    { width: 28 },  // E — comments col 2 / details
  ];

  const dg = diagnostic.datosGenerales;
  const sa = diagnostic.situacionActual;
  let r = 1;

  /* ═══════════════════════════════════════════════════════
     TITLE BANNER
     ═══════════════════════════════════════════════════════ */
  ws.mergeCells(r, 1, r, COLS);
  const titleCell = ws.getCell(r, 1);
  titleCell.value = 'DIAGNÓSTICO EMPRESARIAL';
  titleCell.font = { bold: true, size: 16, color: { argb: WHITE }, name: 'Calibri' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let c = 1; c <= COLS; c++) ws.getCell(r, c).border = thinBorder();
  ws.getRow(r).height = 36;
  r++;

  ws.mergeCells(r, 1, r, COLS);
  const subtitleCell = ws.getCell(r, 1);
  subtitleCell.value = 'COMPLEMENT CONSULTING GROUP';
  subtitleCell.font = { bold: true, size: 11, color: { argb: ACCENT }, name: 'Calibri' };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let c = 1; c <= COLS; c++) ws.getCell(r, c).border = thinBorder();
  ws.getRow(r).height = 24;
  r++;

  // Company name + date row
  ws.mergeCells(r, 1, r, 3);
  const companyCell = ws.getCell(r, 1);
  companyCell.value = dg.nombreComercial || 'Sin nombre';
  companyCell.font = { bold: true, size: 12, color: { argb: NAVY }, name: 'Calibri' };
  companyCell.alignment = { vertical: 'middle' };
  for (let c = 1; c <= 3; c++) ws.getCell(r, c).border = thinBorder();

  ws.mergeCells(r, 4, r, COLS);
  const dateCell = ws.getCell(r, 4);
  dateCell.value = new Date(diagnostic.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  dateCell.font = { size: 10, color: { argb: MUTED }, name: 'Calibri' };
  dateCell.alignment = { vertical: 'middle', horizontal: 'right' };
  for (let c = 4; c <= COLS; c++) ws.getCell(r, c).border = thinBorder();
  ws.getRow(r).height = 24;
  r++;

  r = addSpacer(ws, r);

  /* ═══════════════════════════════════════════════════════
     DATOS GENERALES
     ═══════════════════════════════════════════════════════ */
  r = addSectionHeader(ws, r, '  DATOS GENERALES', COLS);
  r = addKeyValue(ws, r, 'Nombre Comercial', dg.nombreComercial, COLS);
  r = addKeyValue(ws, r, 'Sector', dg.sector === 'manufactura' ? 'Manufactura' : dg.sector === 'comercio' ? 'Comercio' : 'Servicios', COLS);
  r = addKeyValue(ws, r, 'Antigüedad Constituida', dg.antiguedadConstituida ? `${dg.antiguedadConstituida} años` : '', COLS);
  r = addKeyValue(ws, r, 'Antigüedad Operativa', dg.antiguedadOperativa ? `${dg.antiguedadOperativa} años` : '', COLS);
  const familiarLabel = dg.empresaFamiliar === 'no' ? 'No'
    : dg.empresaFamiliar === 'si_1era' ? 'Sí, 1ª generación'
    : dg.empresaFamiliar === 'si_2da' ? 'Sí, 2ª generación'
    : 'Sí, 3ª generación';
  r = addKeyValue(ws, r, 'Empresa Familiar', familiarLabel, COLS);
  r = addKeyValue(ws, r, 'Respondente', dg.respondente, COLS);
  if (dg.email) r = addKeyValue(ws, r, 'Correo electrónico', dg.email, COLS);
  r = addKeyValue(ws, r, 'Puesto en la Empresa', dg.puestoEmpresa || dg.puestoEmpresaFamilia || '', COLS);
  r = addKeyValue(ws, r, 'Puesto en la Familia', dg.puestoFamilia || '', COLS);
  const socioLabel = dg.esSocio === 'si'
    ? `Sí${dg.porcentajeAcciones ? ` — ${dg.porcentajeAcciones}% de acciones` : ''}`
    : dg.esSocio === 'no' ? 'No' : (dg.esSocio || '—');
  r = addKeyValue(ws, r, '¿Es socio?', socioLabel, COLS);
  r = addKeyValue(ws, r, 'Software de Gestión', buildSoftwareLabel(dg), COLS);

  r = addSpacer(ws, r);

  /* ═══════════════════════════════════════════════════════
     SITUACIÓN ACTUAL
     ═══════════════════════════════════════════════════════ */
  r = addSectionHeader(ws, r, '  SITUACIÓN ACTUAL', COLS);
  r = addKeyValue(ws, r, 'Ventas Anuales', formatMonetaryValue({ value: sa.ventasAnualesMDP, currencyCode }), COLS);
  r = addKeyValue(ws, r, 'Empleados Totales', sa.empleadosTotales ?? '—', COLS);
  if (sa.empleadosFamiliares !== null && sa.empleadosFamiliares !== undefined) {
    r = addKeyValue(ws, r, 'Empleados Familiares', sa.empleadosFamiliares, COLS);
  }
  r = addKeyValue(ws, r, 'Número de Socios', sa.socios, COLS);
  // Socios detail
  if (sa.sociosDetalle && sa.sociosDetalle.length > 0) {
    sa.sociosDetalle.forEach((s: any, i: number) => {
      const fam = s.esFamiliar === true ? 'Familiar' : s.esFamiliar === false ? 'No familiar' : '—';
      const pct = s.porcentaje ? `${s.porcentaje}%` : '—';
      r = addKeyValue(ws, r, `  Socio ${i + 1}`, `${fam}  |  ${pct}`, COLS);
    });
  }
  if (sa.familiaresEnPoder) {
    r = addKeyValue(ws, r, 'Familiares en el Poder', sa.familiaresEnPoder, COLS);
  }

  r = addSpacer(ws, r);

  /* ═══════════════════════════════════════════════════════
     CLASIFICACIÓN DE EMPRESA
     ═══════════════════════════════════════════════════════ */
  r = addSectionHeader(ws, r, '  CLASIFICACIÓN DE EMPRESA', COLS);

  // 3-column highlight cards
  const sizeLabels = ['Tamaño', 'Puntaje TMC', 'Productividad'];
  const sizeValues = [
    diagnostic.companySize.size,
    diagnostic.companySize.tmcScore.toString(),
    `${currencyCode === 'USD' ? 'US$' : '$'}${diagnostic.companySize.productivityIndex.toFixed(2)} ${currencyCode === 'USD' ? 'M' : 'MDP'}`,
  ];
  const sizeColors = [ACCENT, NAVY, SUCCESS];

  // Labels row
  for (let i = 0; i < 3; i++) {
    const colStart = i === 0 ? 1 : i === 1 ? 3 : 4;
    const colEnd = i === 0 ? 2 : i === 1 ? 3 : 5;
    if (colStart !== colEnd) ws.mergeCells(r, colStart, r, colEnd);
    const cell = ws.getCell(r, colStart);
    cell.value = sizeLabels[i];
    cell.font = { bold: true, size: 9, color: { argb: MUTED }, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    for (let c = colStart; c <= colEnd; c++) ws.getCell(r, c).border = thinBorder();
  }
  ws.getRow(r).height = 18;
  r++;

  // Values row
  for (let i = 0; i < 3; i++) {
    const colStart = i === 0 ? 1 : i === 1 ? 3 : 4;
    const colEnd = i === 0 ? 2 : i === 1 ? 3 : 5;
    if (colStart !== colEnd) ws.mergeCells(r, colStart, r, colEnd);
    const cell = ws.getCell(r, colStart);
    cell.value = sizeValues[i];
    cell.font = { bold: true, size: 14, color: { argb: sizeColors[i] }, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    for (let c = colStart; c <= colEnd; c++) ws.getCell(r, c).border = thinBorder();
  }
  ws.getRow(r).height = 30;
  r++;

  r = addSpacer(ws, r);

  /* ═══════════════════════════════════════════════════════
     MÁRGENES FINANCIEROS (if applicable)
     ═══════════════════════════════════════════════════════ */
  if (diagnostic.marginData?.tieneDatosFinancieros && diagnostic.marginEvaluation) {
    r = addSectionHeader(ws, r, '  MÁRGENES FINANCIEROS', COLS);

    const marginHeaders = ['Margen', 'Valor', 'Evaluación'];
    // Table header spanning cols nicely
    const mhCols = [
      { start: 1, end: 2 },
      { start: 3, end: 3 },
      { start: 4, end: 5 },
    ];
    mhCols.forEach((mc, i) => {
      if (mc.start !== mc.end) ws.mergeCells(r, mc.start, r, mc.end);
      const cell = ws.getCell(r, mc.start);
      cell.value = marginHeaders[i];
      cell.font = tableHeaderFont();
      cell.fill = tableHeaderFill();
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      for (let c = mc.start; c <= mc.end; c++) ws.getCell(r, c).border = thinBorder();
    });
    ws.getRow(r).height = 22;
    r++;

    const marginRows: { label: string; key: 'margenBruto' | 'margenOperativo' | 'margenNeto' }[] = [
      { label: 'Margen Bruto', key: 'margenBruto' },
      { label: 'Margen Operativo', key: 'margenOperativo' },
      { label: 'Margen Neto', key: 'margenNeto' },
    ];

    marginRows.forEach((m, idx) => {
      const rawEv = diagnostic.marginEvaluation![m.key];
      const ev = { ...rawEv, level: normalizeMarginLevel(rawEv.level) };
      const isZebra = idx % 2 === 1;

      // Label cell (merged 1-2)
      ws.mergeCells(r, 1, r, 2);
      const labelCell = ws.getCell(r, 1);
      labelCell.value = m.label;
      labelCell.font = labelFont();
      labelCell.alignment = { vertical: 'middle' };
      labelCell.border = thinBorder();
      if (isZebra) labelCell.fill = zebraFill();
      ws.getCell(r, 2).border = thinBorder();

      // Value cell (col 3)
      const valCell = ws.getCell(r, 3);
      valCell.value = ev.value !== null ? `${ev.value}%` : '—';
      valCell.font = { bold: true, size: 12, color: { argb: MARGIN_LEVEL_COLORS[ev.level] }, name: 'Calibri' };
      valCell.alignment = { vertical: 'middle', horizontal: 'center' };
      valCell.border = thinBorder();
      if (isZebra) valCell.fill = zebraFill();

      // Evaluation cell (merged 4-5)
      ws.mergeCells(r, 4, r, 5);
      const evalCell = ws.getCell(r, 4);
      evalCell.value = MARGIN_LEVEL_LABELS[ev.level];
      evalCell.font = { bold: true, size: 10, color: { argb: MARGIN_LEVEL_COLORS[ev.level] }, name: 'Calibri' };
      evalCell.alignment = { vertical: 'middle', horizontal: 'center' };
      evalCell.border = thinBorder();
      if (isZebra) evalCell.fill = zebraFill();
      ws.getCell(r, 5).border = thinBorder();

      ws.getRow(r).height = 24;
      r++;
    });

    r = addSpacer(ws, r);
  }

  /* ═══════════════════════════════════════════════════════
     RESULTADOS GENERALES
     ═══════════════════════════════════════════════════════ */
  r = addSectionHeader(ws, r, '  RESULTADOS GENERALES', COLS);

  // Summary metrics in a compact row
  const resultLabels = ['Profesionalización', 'Institucionalización', 'Urgencia'];
  const resultValues = [
    `${diagnostic.profesionalizacion.average.toFixed(0)}/100 — ${diagnostic.profesionalizacion.level}`,
    `${diagnostic.institucionalizacion.average.toFixed(0)}/100 — ${diagnostic.institucionalizacion.level}`,
    diagnostic.urgenciaLevel,
  ];

  const scoreLevelColor = (level: string): string => {
    switch (level) {
      case 'Bajo': return ERROR;
      case 'Medio': return WARN;
      case 'Alto': return SUCCESS;
      case 'Avanzado': return SUCCESS; // backward compat
      case 'Crítica': return ERROR;
      case 'Alta': return WARN;
      case 'Media': return MID;
      case 'Baja': return SUCCESS;
      default: return NAVY;
    }
  };

  // Labels
  for (let i = 0; i < 3; i++) {
    const colStart = i === 0 ? 1 : i === 1 ? 3 : 5;
    const colEnd = i === 0 ? 2 : i === 1 ? 4 : 5;
    if (colStart !== colEnd) ws.mergeCells(r, colStart, r, colEnd);
    const cell = ws.getCell(r, colStart);
    cell.value = resultLabels[i];
    cell.font = { bold: true, size: 9, color: { argb: MUTED }, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    for (let c = colStart; c <= colEnd; c++) ws.getCell(r, c).border = thinBorder();
  }
  ws.getRow(r).height = 18;
  r++;

  // Values
  const rLevels = [diagnostic.profesionalizacion.level, diagnostic.institucionalizacion.level, diagnostic.urgenciaLevel];
  for (let i = 0; i < 3; i++) {
    const colStart = i === 0 ? 1 : i === 1 ? 3 : 5;
    const colEnd = i === 0 ? 2 : i === 1 ? 4 : 5;
    if (colStart !== colEnd) ws.mergeCells(r, colStart, r, colEnd);
    const cell = ws.getCell(r, colStart);
    cell.value = resultValues[i];
    cell.font = { bold: true, size: 12, color: { argb: scoreLevelColor(rLevels[i]) }, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    for (let c = colStart; c <= colEnd; c++) ws.getCell(r, c).border = thinBorder();
  }
  ws.getRow(r).height = 28;
  r++;

  r = addSpacer(ws, r);

  /* ═══════════════════════════════════════════════════════
     PROFESIONALIZACIÓN — Detalle
     ═══════════════════════════════════════════════════════ */
  const xlRatingLabel = (r: number) => r <= 0 ? 'Bajo' : r <= 5 ? 'Medio' : 'Alto';
  const xlRatingColor = (r: number) => r <= 0 ? ERROR : r <= 5 ? WARN : SUCCESS;

  r = addSectionHeader(ws, r, `  PROFESIONALIZACIÓN  (Promedio: ${diagnostic.profesionalizacion.average.toFixed(0)}/100 — ${diagnostic.profesionalizacion.level})`, COLS);
  r = addTableHeader(ws, r, ['Criterio', 'Nivel', 'Comentario', '', '']);

  // Merge C+D+E for comments
  diagnostic.profesionalizacion.answers.forEach((a, idx) => {
    const criterion = ALL_CRITERIA.find(c => c.id === a.criterionId);
    const isZebra = idx % 2 === 1;

    const cellA = ws.getCell(r, 1);
    cellA.value = criterion?.shortLabel ?? a.criterionId;
    cellA.font = valueFont();
    cellA.alignment = { vertical: 'middle', wrapText: true };
    cellA.border = thinBorder();
    if (isZebra) cellA.fill = zebraFill();

    const cellB = ws.getCell(r, 2);
    cellB.value = xlRatingLabel(a.rating);
    cellB.font = { bold: true, size: 11, color: { argb: xlRatingColor(a.rating) }, name: 'Calibri' };
    cellB.alignment = { vertical: 'middle', horizontal: 'center' };
    cellB.border = thinBorder();
    if (isZebra) cellB.fill = zebraFill();

    ws.mergeCells(r, 3, r, 5);
    const cellC = ws.getCell(r, 3);
    cellC.value = a.comentario || '';
    cellC.font = { size: 9, color: { argb: MUTED }, name: 'Calibri' };
    cellC.alignment = { vertical: 'middle', wrapText: true };
    cellC.border = thinBorder();
    ws.getCell(r, 4).border = thinBorder();
    ws.getCell(r, 5).border = thinBorder();
    if (isZebra) { cellC.fill = zebraFill(); }

    ws.getRow(r).height = a.comentario ? 28 : 20;
    r++;
  });

  r = addSpacer(ws, r);

  /* ═══════════════════════════════════════════════════════
     INSTITUCIONALIZACIÓN — Detalle
     ═══════════════════════════════════════════════════════ */
  r = addSectionHeader(ws, r, `  INSTITUCIONALIZACIÓN  (Promedio: ${diagnostic.institucionalizacion.average.toFixed(0)}/100 — ${diagnostic.institucionalizacion.level})`, COLS);
  r = addTableHeader(ws, r, ['Criterio', 'Nivel', 'Comentario', '', '']);

  diagnostic.institucionalizacion.answers.forEach((a, idx) => {
    const criterion = ALL_CRITERIA.find(c => c.id === a.criterionId);
    const isZebra = idx % 2 === 1;

    const cellA = ws.getCell(r, 1);
    cellA.value = criterion?.shortLabel ?? a.criterionId;
    cellA.font = valueFont();
    cellA.alignment = { vertical: 'middle', wrapText: true };
    cellA.border = thinBorder();
    if (isZebra) cellA.fill = zebraFill();

    const cellB = ws.getCell(r, 2);
    cellB.value = xlRatingLabel(a.rating);
    cellB.font = { bold: true, size: 11, color: { argb: xlRatingColor(a.rating) }, name: 'Calibri' };
    cellB.alignment = { vertical: 'middle', horizontal: 'center' };
    cellB.border = thinBorder();
    if (isZebra) cellB.fill = zebraFill();

    ws.mergeCells(r, 3, r, 5);
    const cellC2 = ws.getCell(r, 3);
    cellC2.value = a.comentario || '';
    cellC2.font = { size: 9, color: { argb: MUTED }, name: 'Calibri' };
    cellC2.alignment = { vertical: 'middle', wrapText: true };
    cellC2.border = thinBorder();
    ws.getCell(r, 4).border = thinBorder();
    ws.getCell(r, 5).border = thinBorder();
    if (isZebra) { cellC2.fill = zebraFill(); }

    ws.getRow(r).height = a.comentario ? 28 : 20;
    r++;
  });

  r = addSpacer(ws, r);

  /* ═══════════════════════════════════════════════════════
     ÁREAS DE OPORTUNIDAD
     ═══════════════════════════════════════════════════════ */
  if (diagnostic.opportunityAreas.length > 0) {
    r = addSectionHeader(ws, r, '  ÁREAS DE OPORTUNIDAD', COLS);
    r = addTableHeader(ws, r, ['Área de Servicio', 'Prioridad', 'Score', 'Criterios Relacionados', '']);

    diagnostic.opportunityAreas.forEach((area, idx) => {
      const isZebra = idx % 2 === 1;
      const priorityColor = area.priority === 'alta' ? ERROR : area.priority === 'media' ? WARN : SUCCESS;

      const cellA = ws.getCell(r, 1);
      cellA.value = area.serviceArea.name;
      cellA.font = { bold: true, ...valueFont() };
      cellA.alignment = { vertical: 'middle', wrapText: true };
      cellA.border = thinBorder();
      if (isZebra) cellA.fill = zebraFill();

      const cellB = ws.getCell(r, 2);
      cellB.value = area.priority.charAt(0).toUpperCase() + area.priority.slice(1);
      cellB.font = { bold: true, size: 10, color: { argb: priorityColor }, name: 'Calibri' };
      cellB.alignment = { vertical: 'middle', horizontal: 'center' };
      cellB.border = thinBorder();
      if (isZebra) cellB.fill = zebraFill();

      const cellC = ws.getCell(r, 3);
      cellC.value = area.needScore;
      cellC.font = { bold: true, size: 11, color: { argb: NAVY }, name: 'Calibri' };
      cellC.alignment = { vertical: 'middle', horizontal: 'center' };
      cellC.border = thinBorder();
      if (isZebra) cellC.fill = zebraFill();

      ws.mergeCells(r, 4, r, 5);
      const cellD = ws.getCell(r, 4);
      cellD.value = area.triggeringCriteria.map(c => `${c.text} (${c.rating})`).join('; ');
      cellD.font = { size: 9, color: { argb: MUTED }, name: 'Calibri' };
      cellD.alignment = { vertical: 'middle', wrapText: true };
      cellD.border = thinBorder();
      ws.getCell(r, 5).border = thinBorder();
      if (isZebra) { cellD.fill = zebraFill(); }

      ws.getRow(r).height = 32;
      r++;
    });

    r = addSpacer(ws, r);
  }

  /* ═══════════════════════════════════════════════════════
     GERENCIAS / PUESTOS CLAVE
     ═══════════════════════════════════════════════════════ */
  r = addSectionHeader(ws, r, '  GERENCIAS / PUESTOS CLAVE', COLS);
  r = addTableHeader(ws, r, ['Área', 'Cubierto', 'Antigüedad', 'Calificado', 'Sueldo / Familiar']);

  diagnostic.gerencias.forEach((g, idx) => {
    const isZebra = idx % 2 === 1;

    const cellA = ws.getCell(r, 1);
    cellA.value = g.area;
    cellA.font = { bold: true, ...valueFont() };
    cellA.alignment = { vertical: 'middle' };
    cellA.border = thinBorder();
    if (isZebra) cellA.fill = zebraFill();

    const cellB = ws.getCell(r, 2);
    cellB.value = g.cubierto ? (g.soyYo ? 'Soy Yo' : 'Sí') : 'No';
    cellB.font = { ...valueFont(), color: { argb: g.cubierto ? SUCCESS : ERROR } };
    cellB.alignment = { vertical: 'middle', horizontal: 'center' };
    cellB.border = thinBorder();
    if (isZebra) cellB.fill = zebraFill();

    const cellC = ws.getCell(r, 3);
    cellC.value = g.antiguedad ? `${g.antiguedad} años` : '—';
    cellC.font = valueFont();
    cellC.alignment = { vertical: 'middle', horizontal: 'center' };
    cellC.border = thinBorder();
    if (isZebra) cellC.fill = zebraFill();

    const cellD = ws.getCell(r, 4);
    cellD.value = g.calificado === 'si' ? 'Sí' : g.calificado === 'no' ? 'No' : 'No lo sé';
    cellD.font = valueFont();
    cellD.alignment = { vertical: 'middle', horizontal: 'center' };
    cellD.border = thinBorder();
    if (isZebra) { cellD.fill = zebraFill(); }

    const cellE = ws.getCell(r, 5);
    const infoParts: string[] = [];
    if ((g as any).rangoSueldo) infoParts.push((g as any).rangoSueldo);
    if ((g as any).esFamiliar === true) infoParts.push('Familiar');
    else if ((g as any).esFamiliar === false) infoParts.push('No familiar');
    cellE.value = infoParts.length > 0 ? infoParts.join(' | ') : '—';
    cellE.font = valueFont();
    cellE.alignment = { vertical: 'middle', horizontal: 'center' };
    cellE.border = thinBorder();
    if (isZebra) { cellE.fill = zebraFill(); }

    ws.getRow(r).height = 20;
    r++;
  });

  const highestPaid = getHighestPaidGerencia(diagnostic.gerencias, currencyCode);
  if (highestPaid) {
    r = addKeyValue(ws, r, 'Sueldo Más Alto', `$${highestPaid.rangoSueldo} — ${highestPaid.area}`, COLS);
  }

  r = addSpacer(ws, r);

  /* ═══════════════════════════════════════════════════════
     RETOS
     ═══════════════════════════════════════════════════════ */
  const filteredRetos = diagnostic.retos.filter(r => r);
  if (filteredRetos.length > 0) {
    r = addSectionHeader(ws, r, '  RETOS PRINCIPALES', COLS);

    filteredRetos.forEach((reto, idx) => {
      const isZebra = idx % 2 === 1;

      const cellA = ws.getCell(r, 1);
      cellA.value = `Reto ${idx + 1}`;
      cellA.font = labelFont();
      cellA.alignment = { vertical: 'middle' };
      cellA.border = thinBorder();
      if (isZebra) cellA.fill = zebraFill();

      ws.mergeCells(r, 2, r, COLS);
      const cellB = ws.getCell(r, 2);
      cellB.value = reto;
      cellB.font = valueFont();
      cellB.alignment = { vertical: 'middle', wrapText: true };
      cellB.border = thinBorder();
      for (let c = 2; c <= COLS; c++) ws.getCell(r, c).border = thinBorder();
      if (isZebra) { cellB.fill = zebraFill(); }

      ws.getRow(r).height = 24;
      r++;
    });

    // Urgencia row
    const cellA = ws.getCell(r, 1);
    cellA.value = 'Nivel de Urgencia';
    cellA.font = labelFont();
    cellA.alignment = { vertical: 'middle' };
    cellA.border = thinBorder();
    cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALE } };

    ws.mergeCells(r, 2, r, COLS);
    const cellB = ws.getCell(r, 2);
    cellB.value = diagnostic.urgenciaLevel;
    cellB.font = { bold: true, size: 11, color: { argb: scoreLevelColor(diagnostic.urgenciaLevel) }, name: 'Calibri' };
    cellB.alignment = { vertical: 'middle' };
    cellB.border = thinBorder();
    for (let c = 2; c <= COLS; c++) ws.getCell(r, c).border = thinBorder();
    ws.getRow(r).height = 22;
    r++;

    r = addSpacer(ws, r);
  }

  /* ═══════════════════════════════════════════════════════
     DESCRIPCIÓN DEL NEGOCIO
     ═══════════════════════════════════════════════════════ */
  if (diagnostic.descripcionNegocio) {
    r = addSectionHeader(ws, r, '  DESCRIPCIÓN DEL NEGOCIO', COLS);

    ws.mergeCells(r, 1, r, COLS);
    const descCell = ws.getCell(r, 1);
    descCell.value = diagnostic.descripcionNegocio;
    descCell.font = { size: 10, color: { argb: '334155' }, name: 'Calibri' };
    descCell.alignment = { vertical: 'top', wrapText: true };
    descCell.border = thinBorder();
    for (let c = 1; c <= COLS; c++) ws.getCell(r, c).border = thinBorder();
    // Estimate row height based on text length
    ws.getRow(r).height = Math.max(40, Math.ceil(diagnostic.descripcionNegocio.length / 80) * 16);
    r++;

    r = addSpacer(ws, r);
  }

  /* ═══════════════════════════════════════════════════════
     FOOTER
     ═══════════════════════════════════════════════════════ */
  ws.mergeCells(r, 1, r, COLS);
  const footerCell = ws.getCell(r, 1);
  footerCell.value = 'Generado por Complement Consulting Group — Radiografía Empresarial';
  footerCell.font = { italic: true, size: 9, color: { argb: MUTED }, name: 'Calibri' };
  footerCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(r).height = 24;

  /* ═══════════════════════════════════════════════════════
     PRINT SETTINGS
     ═══════════════════════════════════════════════════════ */
  ws.headerFooter = {
    oddFooter: '&C&"Calibri,Italic"&8Complement Consulting Group — Página &P de &N',
  };

  /* ═══════════════════════════════════════════════════════
     DOWNLOAD
     ═══════════════════════════════════════════════════════ */
  const safeName = (dg.nombreComercial || 'radiografia')
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Diagnostico_${safeName}.xlsx`);
}

/* ── Multi-client export — one workbook, several clients ───── */

interface SelectedDiagEntry {
  account: AppUser;
  diagnostic: SavedDiagnostic;
}

function ratingLabel(rating: number): string {
  return rating <= 0 ? 'Bajo' : rating <= 5 ? 'Medio' : 'Alto';
}

function ratingColor(rating: number): string {
  return rating <= 0 ? ERROR : rating <= 5 ? WARN : SUCCESS;
}

const DG_NIVEL_ESTUDIOS = [
  { label: 'Sin estudios profesionales', value: 0 },
  { label: 'Carrera técnica / trunca', value: 3 },
  { label: 'Licenciatura', value: 6 },
  { label: 'Posgrado / Maestría', value: 8 },
  { label: 'Formación ejecutiva continua', value: 10 },
];

const DG_EXPERIENCIA = [
  { label: 'Sin experiencia directiva', value: 0 },
  { label: '1-2 años general', value: 2 },
  { label: '1-2 años en el sector', value: 4 },
  { label: '3-5 años general', value: 5 },
  { label: '3-5 años en el sector', value: 7 },
  { label: 'Más de 5 años general', value: 8 },
  { label: 'Más de 5 años en el sector', value: 10 },
];

const DG_SEGUIMIENTO = [
  { label: 'No da seguimiento a resultados', value: 0 },
  { label: 'Revisa solo cuando hay problemas', value: 2 },
  { label: 'Revisa de forma ocasional', value: 4 },
  { label: 'Revisa periódicamente', value: 6 },
  { label: 'Revisa con indicadores y responsables', value: 8 },
  { label: 'Seguimiento formal con KPIs, responsables, fechas y acuerdos', value: 10 },
];

function dgOptionLabel(options: { label: string; value: number }[], value: number | null | undefined): string {
  if (value == null) return '—';
  return options.find(o => o.value === value)?.label ?? '—';
}

function dgScoreLabel(score: number): string {
  if (score >= 8) return 'Excelente';
  if (score >= 6) return 'Bueno';
  if (score >= 4) return 'Regular';
  return 'Bajo';
}

function styleHeaderRow(ws: ExcelJS.Worksheet, row: number, colCount: number) {
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(row, c);
    cell.font = tableHeaderFont();
    cell.fill = tableHeaderFill();
    cell.border = thinBorder();
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }
  ws.getRow(row).height = 26;
}

export async function exportSelectedDiagnosticsToExcel(entries: SelectedDiagEntry[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Complement Consulting Group';
  wb.created = new Date();

  const companyName = (e: SelectedDiagEntry) => e.diagnostic.datosGenerales.nombreComercial || e.account.displayName || 'Sin nombre';

  /* ── Sheet 1: Resumen ── */
  const wsResumen = wb.addWorksheet('Resumen');
  wsResumen.columns = [
    { header: 'Empresa', key: 'empresa', width: 28 },
    { header: 'Grupo', key: 'grupo', width: 14 },
    { header: 'Sector', key: 'sector', width: 14 },
    { header: 'Empresa Familiar', key: 'familiar', width: 18 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Ventas Anuales', key: 'ventas', width: 16 },
    { header: 'Moneda', key: 'moneda', width: 10 },
    { header: 'Empleados', key: 'empleados', width: 12 },
    { header: 'Tamaño', key: 'tamano', width: 12 },
    { header: 'Profesionalización (nivel)', key: 'profNivel', width: 20 },
    { header: 'Profesionalización (score)', key: 'profScore', width: 20 },
    { header: 'Institucionalización (nivel)', key: 'instNivel', width: 20 },
    { header: 'Institucionalización (score)', key: 'instScore', width: 20 },
    { header: 'Urgencia', key: 'urgencia', width: 12 },
    { header: 'Margen Bruto', key: 'margenBruto', width: 14 },
    { header: 'Margen Operativo', key: 'margenOperativo', width: 16 },
    { header: 'Margen Neto', key: 'margenNeto', width: 14 },
  ];
  styleHeaderRow(wsResumen, 1, wsResumen.columns.length);
  wsResumen.views = [{ state: 'frozen', ySplit: 1 }];

  entries.forEach((e, idx) => {
    const d = e.diagnostic;
    const cc = e.account.currencyCode ?? 'MXN';
    const familiarLabel = d.datosGenerales.empresaFamiliar === 'no' ? 'No'
      : d.datosGenerales.empresaFamiliar === 'si_1era' ? 'Sí, 1ª generación'
      : d.datosGenerales.empresaFamiliar === 'si_1era_transicion' ? 'Sí, 1ª en transición'
      : d.datosGenerales.empresaFamiliar === 'si_2da' ? 'Sí, 2ª generación'
      : 'Sí, 3ª generación';
    const me = d.marginEvaluation;
    const row = wsResumen.addRow({
      empresa: companyName(e),
      grupo: e.account.corporateGroup ?? '—',
      sector: d.datosGenerales.sector === 'manufactura' ? 'Manufactura' : d.datosGenerales.sector === 'comercio' ? 'Comercio' : 'Servicios',
      familiar: familiarLabel,
      fecha: new Date(d.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
      ventas: formatMonetaryValue({ value: d.situacionActual.ventasAnualesMDP, currencyCode: cc }),
      moneda: cc,
      empleados: d.situacionActual.empleadosTotales ?? '—',
      tamano: d.companySize.size,
      profNivel: d.profesionalizacion.level,
      profScore: Math.round(d.profesionalizacion.average),
      instNivel: d.institucionalizacion.level,
      instScore: Math.round(d.institucionalizacion.average),
      urgencia: d.urgenciaLevel,
      margenBruto: me ? (me.margenBruto.value !== null ? `${me.margenBruto.value}%` : 'No lo conoce') : '—',
      margenOperativo: me ? (me.margenOperativo.value !== null ? `${me.margenOperativo.value}%` : 'No lo conoce') : '—',
      margenNeto: me ? (me.margenNeto.value !== null ? `${me.margenNeto.value}%` : 'No lo conoce') : '—',
    });
    row.eachCell(cell => {
      cell.border = thinBorder();
      cell.font = valueFont();
      cell.alignment = { vertical: 'middle' };
      if (idx % 2 === 1) cell.fill = zebraFill();
    });
  });

  /* ── Sheets 2 & 3: Profesionalización / Institucionalización ── */
  function addCriteriaSheet(title: string, criteria: typeof PROFESIONALIZACION_CRITERIA, getScore: (d: SavedDiagnostic) => { average: number; level: string; answers: { criterionId: string; rating: number }[] }) {
    const ws = wb.addWorksheet(title);
    ws.columns = [
      { header: 'Empresa', key: 'empresa', width: 28 },
      ...criteria.map(c => ({ header: c.shortLabel, key: c.id, width: 16 })),
      { header: 'Promedio', key: 'promedio', width: 12 },
      { header: 'Nivel', key: 'nivel', width: 10 },
    ];
    styleHeaderRow(ws, 1, ws.columns.length);
    ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

    entries.forEach((e, idx) => {
      const score = getScore(e.diagnostic);
      const rowData: Record<string, string | number> = { empresa: companyName(e), promedio: Math.round(score.average), nivel: score.level };
      criteria.forEach(c => {
        const answer = score.answers.find(a => a.criterionId === c.id);
        rowData[c.id] = answer ? ratingLabel(answer.rating) : '—';
      });
      const row = ws.addRow(rowData);
      row.eachCell((cell, colNumber) => {
        cell.border = thinBorder();
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
        cell.font = valueFont();
        if (idx % 2 === 1) cell.fill = zebraFill();
      });
      criteria.forEach((c, i) => {
        const answer = score.answers.find(a => a.criterionId === c.id);
        if (answer) {
          const cell = row.getCell(i + 2);
          cell.font = { bold: true, size: 10, color: { argb: ratingColor(answer.rating) }, name: 'Calibri' };
        }
      });
    });
  }

  addCriteriaSheet('Profesionalización', PROFESIONALIZACION_CRITERIA, d => d.profesionalizacion);
  addCriteriaSheet('Institucionalización', INSTITUCIONALIZACION_CRITERIA, d => d.institucionalizacion);

  /* ── Sheet 4: Gerencias ── */
  const wsGer = wb.addWorksheet('Gerencias');
  wsGer.columns = [
    { header: 'Empresa', key: 'empresa', width: 28 },
    { header: 'Área', key: 'area', width: 22 },
    { header: 'Nombre', key: 'nombre', width: 24 },
    { header: 'Cubierto', key: 'cubierto', width: 12 },
    { header: 'Es Familiar', key: 'esFamiliar', width: 12 },
    { header: 'Antigüedad', key: 'antiguedad', width: 12 },
    { header: 'Calificado', key: 'calificado', width: 12 },
    { header: 'Sueldo', key: 'sueldo', width: 16 },
    { header: 'Nivel de Estudios', key: 'nivelEstudios', width: 24 },
    { header: 'Experiencia Laboral', key: 'experiencia', width: 26 },
    { header: 'Nivel de Gestión', key: 'gestion', width: 32 },
    { header: 'Calificación', key: 'calificacion', width: 18 },
  ];
  styleHeaderRow(wsGer, 1, wsGer.columns.length);
  wsGer.views = [{ state: 'frozen', ySplit: 1 }];

  entries.forEach((e, idx) => {
    e.diagnostic.gerencias.forEach(g => {
      const ev = g.dgEvaluation;
      const score = ev && ev.nivelEstudios != null && ev.experienciaLaboral != null && ev.seguimientoResultados != null
        ? ev.nivelEstudios * 0.4 + ev.experienciaLaboral * 0.4 + ev.seguimientoResultados * 0.2
        : null;
      const row = wsGer.addRow({
        empresa: companyName(e),
        area: g.area,
        nombre: g.nombre || '—',
        cubierto: g.cubierto ? (g.soyYo ? 'Soy Yo' : 'Sí') : 'No',
        esFamiliar: g.esFamiliar === true ? 'Sí' : g.esFamiliar === false ? 'No' : '—',
        antiguedad: g.antiguedad ? `${g.antiguedad} años` : '—',
        calificado: g.calificado === 'si' ? 'Sí' : g.calificado === 'no' ? 'No' : 'Por evaluar',
        sueldo: g.rangoSueldo ?? '—',
        nivelEstudios: dgOptionLabel(DG_NIVEL_ESTUDIOS, ev?.nivelEstudios),
        experiencia: dgOptionLabel(DG_EXPERIENCIA, ev?.experienciaLaboral),
        gestion: dgOptionLabel(DG_SEGUIMIENTO, ev?.seguimientoResultados),
        calificacion: score != null ? `${score.toFixed(1)}/10 (${dgScoreLabel(score)})` : '—',
      });
      row.eachCell(cell => {
        cell.border = thinBorder();
        cell.font = valueFont();
        cell.alignment = { vertical: 'middle' };
        if (idx % 2 === 1) cell.fill = zebraFill();
      });
    });
    // Espacio en blanco entre empresa y empresa
    if (idx < entries.length - 1) wsGer.addRow([]);
  });

  /* ── Sheet 5: Retos ── */
  const wsRetos = wb.addWorksheet('Retos');
  wsRetos.columns = [
    { header: 'Empresa', key: 'empresa', width: 28 },
    { header: 'Reto #', key: 'num', width: 10 },
    { header: 'Descripción', key: 'texto', width: 50 },
    { header: 'Urgencia', key: 'urgencia', width: 12 },
  ];
  styleHeaderRow(wsRetos, 1, wsRetos.columns.length);
  wsRetos.views = [{ state: 'frozen', ySplit: 1 }];

  entries.forEach((e, idx) => {
    e.diagnostic.retos.filter(r => r).forEach((reto, i) => {
      const row = wsRetos.addRow({
        empresa: companyName(e),
        num: i + 1,
        texto: reto,
        urgencia: e.diagnostic.urgenciaLevel,
      });
      row.eachCell(cell => {
        cell.border = thinBorder();
        cell.font = valueFont();
        cell.alignment = { vertical: 'middle', wrapText: true };
        if (idx % 2 === 1) cell.fill = zebraFill();
      });
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(blob, `Radiografias_${entries.length}_clientes_${dateStr}.xlsx`);
}
