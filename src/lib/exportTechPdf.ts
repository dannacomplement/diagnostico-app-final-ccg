import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { computeTechMaturityScore, TECH_AREAS } from '../config/techQuestions';
import type { SavedTechSurvey, TechMaturityLevel } from './types';

/* ── Color palette (RGB arrays) ──────────────────────── */
const NAVY: [number, number, number] = [27, 42, 74];
const ACCENT: [number, number, number] = [59, 130, 246];
const WHITE: [number, number, number] = [255, 255, 255];
const PALE: [number, number, number] = [248, 250, 252];
const MUTED: [number, number, number] = [100, 116, 139];
const INK: [number, number, number] = [51, 65, 85];
const SUCCESS: [number, number, number] = [22, 163, 74];
const WARN: [number, number, number] = [245, 158, 11];
const ERROR: [number, number, number] = [220, 38, 38];
const MID: [number, number, number] = [99, 102, 241];
const BORDER: [number, number, number] = [203, 213, 225];

const LEVEL_COLORS: Record<TechMaturityLevel, [number, number, number]> = {
  basico: ERROR,
  intermedio: WARN,
  avanzado: SUCCESS,
  lider_digital: ACCENT,
};

const LEVEL_LABELS: Record<TechMaturityLevel, string> = {
  basico: 'Basico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  lider_digital: 'Lider Digital',
};

/* ── Main Export ──────────────────────────────────────── */

export function exportTechSurveyToPdf(
  survey: SavedTechSurvey,
  mode: 'download' | 'view' = 'download',
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Compute area scores
  const { areaScores } = computeTechMaturityScore({
    tools: survey.tools,
    digitalPresence: survey.digitalPresence,
    automation: survey.automation,
    dataAnalytics: survey.dataAnalytics,
    aiAdoption: survey.aiAdoption,
    security: survey.security,
    culture: survey.culture,
  });

  const levelColor = LEVEL_COLORS[survey.maturityLevel];
  const levelLabel = LEVEL_LABELS[survey.maturityLevel];
  const dateStr = new Date(survey.savedAt).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  /* ═══════════════════════════════════════════════════════
     PAGE 1: COVER
     ═══════════════════════════════════════════════════════ */
  // Full navy background
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text('PRUEBA DE', pageWidth / 2, 70, { align: 'center' });
  doc.text('TECNOLOGIA', pageWidth / 2, 82, { align: 'center' });

  // Subtitle
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text('COMPLEMENT CONSULTING GROUP', pageWidth / 2, 96, { align: 'center' });

  // Divider
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 30, 103, pageWidth / 2 + 30, 103);

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text(survey.companyName || 'Sin nombre', pageWidth / 2, 116, { align: 'center' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(180, 190, 210);
  doc.text(dateStr, pageWidth / 2, 126, { align: 'center' });

  // Score badge
  const badgeCenterY = 160;
  doc.setFillColor(...levelColor);
  doc.roundedRect(pageWidth / 2 - 30, badgeCenterY - 18, 60, 36, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...WHITE);
  doc.text(String(survey.maturityScore), pageWidth / 2, badgeCenterY, { align: 'center' });
  doc.setFontSize(9);
  doc.text('/ 100', pageWidth / 2, badgeCenterY + 10, { align: 'center' });

  // Level label below badge
  doc.setFontSize(12);
  doc.setTextColor(...levelColor);
  doc.text(levelLabel, pageWidth / 2, badgeCenterY + 28, { align: 'center' });

  // Footer on cover
  doc.setFontSize(7);
  doc.setTextColor(120, 140, 170);
  doc.text('Complement Consulting Group --- Prueba de Tecnologia', pageWidth / 2, pageHeight - 10, { align: 'center' });

  /* ═══════════════════════════════════════════════════════
     PAGE 2: EXECUTIVE SUMMARY — area scores
     ═══════════════════════════════════════════════════════ */
  doc.addPage();
  let y = margin;

  // Header banner
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text('RESUMEN EJECUTIVO', pageWidth / 2, 14, { align: 'center' });

  // Sub-header
  doc.setFillColor(239, 246, 255);
  doc.rect(0, 22, pageWidth, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(survey.companyName || 'Sin nombre', margin, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(dateStr, pageWidth - margin, 28, { align: 'right' });

  y = 38;

  // Score summary row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Score General:', margin, y);
  doc.setTextColor(...levelColor);
  doc.text(`${survey.maturityScore}/100 — ${levelLabel}`, margin + 35, y);
  y += 10;

  // Area scores as horizontal bars
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('DESGLOSE POR AREA', margin, y);
  y += 8;

  const barMaxWidth = contentWidth - 60;
  const barHeight = 5;

  for (const area of TECH_AREAS) {
    const areaScore = areaScores[area.id] ?? 0;
    const barW = Math.max(1, (areaScore / 100) * barMaxWidth);

    // Area label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${area.icon} ${area.name}`, margin, y + 3);

    // Score value
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(`${areaScore}`, pageWidth - margin, y + 3, { align: 'right' });

    // Bar background
    const barX = margin + 52;
    doc.setFillColor(...PALE);
    doc.roundedRect(barX, y - 1, barMaxWidth, barHeight, 1, 1, 'F');

    // Bar fill
    const barColor: [number, number, number] = areaScore <= 25 ? ERROR : areaScore <= 50 ? WARN : areaScore <= 75 ? SUCCESS : ACCENT;
    doc.setFillColor(...barColor);
    doc.roundedRect(barX, y - 1, barW, barHeight, 1, 1, 'F');

    y += 12;
  }

  y += 4;

  // Quick metrics table
  const metricsBody: string[][] = [
    ['ERP', survey.tools.tieneERP ? 'Si' : 'No'],
    ['CRM', survey.tools.tieneCRM ? 'Si' : 'No'],
    ['Website', survey.digitalPresence.tieneWebsite ? 'Si' : 'No'],
    ['E-commerce', survey.digitalPresence.tieneEcommerce ? 'Si' : 'No'],
    ['Usa IA', survey.aiAdoption.usaIAEnEmpresa ? 'Si' : 'No'],
    ['Nube', survey.security.usaNube ? 'Si' : 'No'],
    ['KPIs', survey.dataAnalytics.tieneKPIs ? 'Si' : 'No'],
    ['Equipo TI', survey.culture.equipoTI ? 'Si' : 'No'],
    ['Presupuesto Tech', survey.culture.presupuestoTech ? 'Si' : 'No'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['INDICADORES CLAVE', 'ESTADO']],
    body: metricsBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: NAVY },
      1: { cellWidth: contentWidth - 55 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = data.cell.raw as string;
        if (val === 'Si') data.cell.styles.textColor = SUCCESS;
        if (val === 'No') data.cell.styles.textColor = ERROR;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  /* ═══════════════════════════════════════════════════════
     PAGE 3: DETAIL — each area findings
     ═══════════════════════════════════════════════════════ */
  doc.addPage();
  y = margin;

  // Header
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text('DETALLE POR AREA', pageWidth / 2, 14, { align: 'center' });

  y = 28;

  // Tools detail
  const toolsFindings: string[][] = [
    ['Excel', survey.tools.usaExcel ? `Si (${survey.tools.excelNivel || 'N/A'})` : 'No'],
    ['ERP', survey.tools.tieneERP ? `Si${survey.tools.erpNombre ? ` — ${survey.tools.erpNombre}` : ''}` : 'No'],
    ['CRM', survey.tools.tieneCRM ? `Si${survey.tools.crmNombre ? ` — ${survey.tools.crmNombre}` : ''}` : 'No'],
    ['MRP', survey.tools.tieneMRP ? `Si${survey.tools.mrpNombre ? ` — ${survey.tools.mrpNombre}` : ''}` : 'No'],
  ];
  if (survey.tools.otrasHerramientas) {
    toolsFindings.push(['Otras', survey.tools.otrasHerramientas]);
  }

  autoTable(doc, {
    startY: y,
    head: [['HERRAMIENTAS Y SOFTWARE', `Score: ${areaScores.tools}/100`]],
    body: toolsFindings,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: NAVY } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val === 'No') data.cell.styles.textColor = ERROR;
        else if (val.startsWith('Si')) data.cell.styles.textColor = SUCCESS;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Digital Presence detail
  const digitalFindings: string[][] = [
    ['Sitio web', survey.digitalPresence.tieneWebsite ? 'Si' : 'No'],
    ['Actualizado', survey.digitalPresence.websiteActualizado ? 'Si' : 'No'],
    ['E-commerce', survey.digitalPresence.tieneEcommerce ? 'Si' : 'No'],
    ['Redes sociales', survey.digitalPresence.usaRedesSociales ? `Si (${survey.digitalPresence.redesActivas.join(', ') || 'N/A'})` : 'No'],
    ['Marketing digital', survey.digitalPresence.marketingDigital ? 'Si' : 'No'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['PRESENCIA DIGITAL', `Score: ${areaScores.digital_presence}/100`]],
    body: digitalFindings,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: NAVY } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val === 'No') data.cell.styles.textColor = ERROR;
        else if (val.startsWith('Si')) data.cell.styles.textColor = SUCCESS;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Automation detail
  const autoLabel = survey.automation.procesosAutomatizados === 'todos' ? 'Todos'
    : survey.automation.procesosAutomatizados === 'mayoria' ? 'Mayoria'
    : survey.automation.procesosAutomatizados === 'algunos' ? 'Algunos' : 'Ninguno';
  const autoFindings: string[][] = [
    ['Procesos automatizados', autoLabel],
    ['Factura electronica', survey.automation.facturaElectronica ? 'Si' : 'No'],
    ['Banca digital', survey.automation.bancaDigital ? 'Si' : 'No'],
    ['Firma electronica', survey.automation.firmaElectronica ? 'Si' : 'No'],
    ['Gestion documental digital', survey.automation.gestionDocumentalDigital ? 'Si' : 'No'],
  ];
  if (survey.automation.areasMasAutomatizadas) {
    autoFindings.push(['Areas mas automatizadas', survey.automation.areasMasAutomatizadas]);
  }

  autoTable(doc, {
    startY: y,
    head: [['AUTOMATIZACION', `Score: ${areaScores.automation}/100`]],
    body: autoFindings,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: NAVY } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val === 'No' || val === 'Ninguno') data.cell.styles.textColor = ERROR;
        else if (val === 'Si' || val === 'Todos' || val === 'Mayoria') data.cell.styles.textColor = SUCCESS;
        else if (val === 'Algunos') data.cell.styles.textColor = WARN;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Check if we need a new page
  if (y > pageHeight - 80) {
    doc.addPage();
    y = margin;
  }

  // Data & Analytics detail
  const dataLabel = survey.dataAnalytics.usaDatosParaDecisiones === 'siempre' ? 'Siempre'
    : survey.dataAnalytics.usaDatosParaDecisiones === 'frecuentemente' ? 'Frecuentemente'
    : survey.dataAnalytics.usaDatosParaDecisiones === 'a_veces' ? 'A veces' : 'Nunca';
  const dataFindings: string[][] = [
    ['Datos para decisiones', dataLabel],
    ['KPIs definidos', survey.dataAnalytics.tieneKPIs ? 'Si' : 'No'],
    ['Dashboards / BI', survey.dataAnalytics.dashboardsBI ? 'Si' : 'No'],
    ['Herramienta BI', survey.dataAnalytics.herramientaBI || 'Ninguna'],
    ['Analitica avanzada', survey.dataAnalytics.analiticaAvanzada ? 'Si' : 'No'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['DATOS Y ANALITICA', `Score: ${areaScores.data_analytics}/100`]],
    body: dataFindings,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: NAVY } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val === 'No' || val === 'Nunca' || val === 'Ninguna') data.cell.styles.textColor = ERROR;
        else if (val === 'Si' || val === 'Siempre') data.cell.styles.textColor = SUCCESS;
        else if (val === 'A veces') data.cell.styles.textColor = WARN;
        else if (val === 'Frecuentemente') data.cell.styles.textColor = MID;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  if (y > pageHeight - 80) {
    doc.addPage();
    y = margin;
  }

  // AI detail
  const interesLabel = survey.aiAdoption.interesEnIA === 'alto' ? 'Alto'
    : survey.aiAdoption.interesEnIA === 'medio' ? 'Medio'
    : survey.aiAdoption.interesEnIA === 'bajo' ? 'Bajo' : 'Ninguno';
  const inversionLabel = survey.aiAdoption.inversionTechAnual === 'menos_50k' ? 'Menos de $50k'
    : survey.aiAdoption.inversionTechAnual === '50k_200k' ? '$50k - $200k'
    : survey.aiAdoption.inversionTechAnual === '200k_500k' ? '$200k - $500k'
    : survey.aiAdoption.inversionTechAnual === 'mas_500k' ? 'Mas de $500k' : 'No sabe';
  const aiFindings: string[][] = [
    ['Conoce IA', survey.aiAdoption.conoceIA ? 'Si' : 'No'],
    ['Usa IA en empresa', survey.aiAdoption.usaIAEnEmpresa ? 'Si' : 'No'],
    ['Casos de uso', survey.aiAdoption.casosUsoIA.length > 0 ? survey.aiAdoption.casosUsoIA.join(', ') : 'Ninguno'],
    ['Interes en IA', interesLabel],
    ['Inversion tech anual', inversionLabel],
  ];

  autoTable(doc, {
    startY: y,
    head: [['INTELIGENCIA ARTIFICIAL', `Score: ${areaScores.ai}/100`]],
    body: aiFindings,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: NAVY } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val === 'No' || val === 'Ninguno') data.cell.styles.textColor = ERROR;
        else if (val === 'Si') data.cell.styles.textColor = SUCCESS;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  if (y > pageHeight - 70) {
    doc.addPage();
    y = margin;
  }

  // Security detail
  const respaldosLabel = survey.security.respaldosDatos === 'automatico' ? 'Automatico'
    : survey.security.respaldosDatos === 'manual' ? 'Manual' : 'Nunca';
  const secFindings: string[][] = [
    ['Antivirus', survey.security.tieneAntivirus ? 'Si' : 'No'],
    ['Respaldos', respaldosLabel],
    ['Politicas seguridad', survey.security.politicasSeguridad ? 'Si' : 'No'],
    ['Capacitacion seguridad', survey.security.capacitacionSeguridad ? 'Si' : 'No'],
    ['Usa nube', survey.security.usaNube ? 'Si' : 'No'],
  ];
  if (survey.security.proveedorNube) {
    secFindings.push(['Proveedor nube', survey.security.proveedorNube]);
  }

  autoTable(doc, {
    startY: y,
    head: [['CIBERSEGURIDAD', `Score: ${areaScores.security}/100`]],
    body: secFindings,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: NAVY } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val === 'No' || val === 'Nunca') data.cell.styles.textColor = ERROR;
        else if (val === 'Si' || val === 'Automatico') data.cell.styles.textColor = SUCCESS;
        else if (val === 'Manual') data.cell.styles.textColor = WARN;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  if (y > pageHeight - 70) {
    doc.addPage();
    y = margin;
  }

  // Culture detail
  const resistenciaLabel = survey.culture.resistenciaAlCambio === 'ninguna' ? 'Ninguna'
    : survey.culture.resistenciaAlCambio === 'baja' ? 'Baja'
    : survey.culture.resistenciaAlCambio === 'media' ? 'Media' : 'Alta';
  const cultureFindings: string[][] = [
    ['Resistencia al cambio', resistenciaLabel],
    ['Capacitacion tecnologica', survey.culture.capacitacionTecnologica ? 'Si' : 'No'],
    ['Equipo TI', survey.culture.equipoTI ? `Si${survey.culture.equipoTISize ? ` (${survey.culture.equipoTISize} personas)` : ''}` : 'No'],
    ['Presupuesto tech', survey.culture.presupuestoTech ? 'Si' : 'No'],
  ];
  if (survey.culture.retoPrincipalTech) {
    cultureFindings.push(['Reto principal', survey.culture.retoPrincipalTech]);
  }

  autoTable(doc, {
    startY: y,
    head: [['CULTURA DIGITAL', `Score: ${areaScores.culture}/100`]],
    body: cultureFindings,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: NAVY } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val === 'No' || val === 'Alta') data.cell.styles.textColor = ERROR;
        else if (val.startsWith('Si') || val === 'Ninguna' || val === 'Baja') data.cell.styles.textColor = SUCCESS;
        else if (val === 'Media') data.cell.styles.textColor = WARN;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  /* ═══════════════════════════════════════════════════════
     FOOTER on every page
     ═══════════════════════════════════════════════════════ */
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(
      'Complement Consulting Group --- Prueba de Tecnologia',
      pageWidth / 2,
      ph - 6,
      { align: 'center' },
    );
    doc.text(
      `Pagina ${i} de ${totalPages}`,
      pageWidth - margin,
      ph - 6,
      { align: 'right' },
    );
  }

  /* ═══════════════════════════════════════════════════════
     OUTPUT
     ═══════════════════════════════════════════════════════ */
  const safeName = (survey.companyName || 'prueba_tech')
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const filename = `Prueba_Tech_${safeName}.pdf`;

  if (mode === 'view') {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } else {
    doc.save(filename);
  }
}
