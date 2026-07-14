import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SavedDiagnostic, SavedOrgSurvey } from './types';
import { buildPdfDoc } from './exportPdf';

/* ── Color palette ── */
const NAVY: [number, number, number] = [27, 42, 74];
const WHITE: [number, number, number] = [255, 255, 255];
const PALE: [number, number, number] = [248, 250, 252];
const MUTED: [number, number, number] = [100, 116, 139];
const INK: [number, number, number] = [51, 65, 85];
const SUCCESS: [number, number, number] = [22, 163, 74];
const ERROR: [number, number, number] = [220, 38, 38];
const MID: [number, number, number] = [99, 102, 241];
const BORDER: [number, number, number] = [203, 213, 225];
const ACCENT: [number, number, number] = [59, 130, 246];
const BRAND_ORANGE: [number, number, number] = [212, 146, 46];

/* ── Complement logo drawing (same as exportPdf.ts) ── */

function drawComplementIcon(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  variant: 'color' | 'white' = 'color',
) {
  const dotR = radius * 0.24;
  const numDots = 70;
  const startDeg = 47;
  const sweepDeg = 266;

  for (let i = 0; i <= numDots; i++) {
    const t = i / numDots;
    const angleDeg = startDeg + t * sweepDeg;
    const rad = (angleDeg * Math.PI) / 180;
    const dx = cx + radius * Math.cos(rad);
    const dy = cy + radius * Math.sin(rad);

    if (variant === 'white') {
      const lum = Math.round(210 + t * 45);
      doc.setFillColor(lum, lum, lum);
    } else {
      let r: number, g: number, b: number;
      if (t < 0.45) {
        const lt = t / 0.45;
        r = Math.round(10 + lt * 24);
        g = Math.round(42 + lt * 72);
        b = Math.round(82 + lt * 102);
      } else {
        const lt = (t - 0.45) / 0.55;
        r = Math.round(34 + lt * 75);
        g = Math.round(114 + lt * 70);
        b = Math.round(184 + lt * 40);
      }
      doc.setFillColor(r, g, b);
    }
    doc.circle(dx, dy, dotR, 'F');
  }

  doc.setFillColor(...BRAND_ORANGE);
  doc.triangle(
    cx + radius * 0.8, cy,
    cx + radius * 1.2, cy - radius * 0.625,
    cx + radius * 1.2, cy + radius * 0.625,
    'F',
  );
}

function drawBrandedHeader(doc: jsPDF, title: string, pageWidth: number, margin: number): number {
  const contentWidth = pageWidth - margin * 2;
  const iconR = 4;
  const iconCx = margin + iconR + 1;
  const iconCy = 8;
  drawComplementIcon(doc, iconCx, iconCy, iconR, 'color');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(title, margin + iconR * 2 + 6, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text('COMPLEMENT', pageWidth - margin, 10, { align: 'right' });

  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.6);
  doc.line(margin, 15, margin + contentWidth, 15);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  return 20;
}

/* drawRoundedRect available if needed */

/* ── Org survey sections ─────────────────────────────── */

function addOrgSurveySections(doc: jsPDF, survey: SavedOrgSurvey, margin: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const org = survey.orgStructure;
  const descLabel = org.descripcionesPuesto === 'todas' ? 'Todas'
    : org.descripcionesPuesto === 'algunas' ? 'Algunas' : 'Ninguna';

  /* Estructura y Organigrama */
  const estructuraBody: string[][] = [
    ['Organigrama Formal', org.tieneOrganigrama ? 'Sí' : 'No'],
  ];
  if (org.tieneOrganigrama) {
    estructuraBody.push(['Organigrama Actualizado', org.organigramaActualizado ? 'Sí' : 'No']);
  }
  estructuraBody.push(
    ['Descripciones de Puesto', descLabel],
    ['Tabulador de Sueldos', org.tieneTabulador ? 'Sí' : 'No'],
    ['Nómina Mensual Total', org.nominaMensualTotal !== null ? `$${org.nominaMensualTotal.toLocaleString('es-MX')}` : '---'],
  );

  autoTable(doc, {
    startY: y,
    head: [['ESTRUCTURA Y ORGANIGRAMA', '']],
    body: estructuraBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: NAVY },
      1: { cellWidth: contentWidth - 55 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = data.cell.raw as string;
        if (val === 'Sí') data.cell.styles.textColor = SUCCESS;
        if (val === 'No') data.cell.styles.textColor = ERROR;
        if (val === 'Ninguna') data.cell.styles.textColor = ERROR;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  /* Detalle por Area */
  const areaBody = survey.areaDetails.map(a => [
    a.nombre || '---',
    a.colaboradores !== null ? a.colaboradores.toString() : '---',
    a.sueldoPromedio !== null ? `$${a.sueldoPromedio.toLocaleString('es-MX')}` : '---',
    a.tieneLider ? 'Sí' : 'No',
    a.colaboradores !== null && a.sueldoPromedio !== null
      ? `$${(a.colaboradores * a.sueldoPromedio).toLocaleString('es-MX')}`
      : '---',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['DETALLE POR ÁREA', 'Colaboradores', 'Sueldo Prom.', 'Líder', 'Nómina Área']],
    body: areaBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: NAVY },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 28 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        data.cell.styles.textColor = data.cell.raw === 'Sí' ? SUCCESS : ERROR;
        data.cell.styles.fontStyle = 'bold';
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  /* Totales */
  const totalColab = survey.areaDetails.reduce((sum, a) => sum + (a.colaboradores ?? 0), 0);
  const totalNomina = survey.areaDetails.reduce((sum, a) => sum + (a.colaboradores ?? 0) * (a.sueldoPromedio ?? 0), 0);
  const areasConLider = survey.areaDetails.filter(a => a.tieneLider).length;

  autoTable(doc, {
    startY: y,
    head: [['TOTALES', '', '']],
    body: [[
      `Colaboradores: ${totalColab}`,
      `Nómina Mensual: $${totalNomina.toLocaleString('es-MX')}`,
      `Áreas con Líder: ${areasConLider} de ${survey.areaDetails.length}`,
    ]],
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 10, fontStyle: 'bold', textColor: ACCENT, halign: 'center' },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 4 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  /* Talento y Procesos */
  const tp = survey.talentProcesses;
  const evalLabel = tp.evaluacionesDesempeno === 'si' ? 'Sí'
    : tp.evaluacionesDesempeno === 'parcialmente' ? 'Parcialmente' : 'No';
  const compLabel = tp.competitividadSueldos === 'arriba' ? 'Arriba del mercado'
    : tp.competitividadSueldos === 'en_rango' ? 'En rango'
    : tp.competitividadSueldos === 'debajo' ? 'Debajo del mercado' : 'No sé';

  const talentoBody: string[][] = [
    ['Proceso de Reclutamiento', tp.procesoReclutamiento ? 'Sí' : 'No'],
    ['Evaluaciones de Desempeño', evalLabel],
    ['Programa de Capacitación', tp.programaCapacitacion ? 'Sí' : 'No'],
    ['Rotación Anual', tp.rotacionAnual !== null ? `${tp.rotacionAnual}%` : '---'],
    ['Competitividad de Sueldos', compLabel],
  ];
  if (tp.retoCapitalHumano) {
    talentoBody.push(['Principal Reto de Capital Humano', tp.retoCapitalHumano]);
  }

  autoTable(doc, {
    startY: y,
    head: [['TALENTO Y PROCESOS DE RH', '']],
    body: talentoBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: NAVY },
      1: { cellWidth: contentWidth - 55 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = data.cell.raw as string;
        if (val === 'Sí') data.cell.styles.textColor = SUCCESS;
        if (val === 'No') data.cell.styles.textColor = ERROR;
        if (val === 'Parcialmente') data.cell.styles.textColor = MID;
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT

   Strategy:
   - When there's a diagnostic, we start from buildPdfDoc()
     which already has the full branded report (cover, analysis,
     detailed data — identical to what the client receives).
   - If there's also an org survey, we append a separator page
     and the org survey tables with branded headers.
   - When there's only an org survey, we build a standalone doc.
   ═══════════════════════════════════════════════════════════ */

export function exportExpediente(
  companyName: string,
  diagnostic?: SavedDiagnostic,
  orgSurvey?: SavedOrgSurvey,
  mode: 'download' | 'view' = 'download',
): void {
  if (!diagnostic && !orgSurvey) return;

  const margin = 14;

  /* ─── Case 1 & 2: We have a diagnostic ─── */
  if (diagnostic) {
    // Start from the full branded diagnostic PDF (identical to what the client gets)
    const doc = buildPdfDoc(diagnostic);
    const pw = doc.internal.pageSize.getWidth();

    // If there's also an org survey, append it
    if (orgSurvey) {
      // Section separator page
      doc.addPage();
      const ph = doc.internal.pageSize.getHeight();
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pw, ph, 'F');

      doc.setFillColor(...BRAND_ORANGE);
      doc.rect(pw / 2 - 30, ph / 2 - 30, 60, 2, 'F');

      drawComplementIcon(doc, pw / 2, ph / 2 - 18, 8, 'white');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...WHITE);
      doc.text('ESTRUCTURA', pw / 2, ph / 2 + 5, { align: 'center' });
      doc.setFontSize(16);
      doc.text('ORGANIZACIONAL', pw / 2, ph / 2 + 16, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...BRAND_ORANGE);
      const orgDate = new Date(orgSurvey.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`${companyName} — ${orgDate}`, pw / 2, ph / 2 + 30, { align: 'center' });

      // Org survey data pages
      doc.addPage();
      drawBrandedHeader(doc, 'ESTRUCTURA ORGANIZACIONAL', pw, margin);
      addOrgSurveySections(doc, orgSurvey, margin);
    }

    // Update footers on ALL pages (override the diagnostic PDF's footers)
    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      const pageH = doc.internal.pageSize.getHeight();

      // Clear the old footer area
      doc.setFillColor(255, 255, 255);
      doc.rect(0, pageH - 16, pw, 16, 'F');

      // Orange accent line
      doc.setDrawColor(...BRAND_ORANGE);
      doc.setLineWidth(0.4);
      doc.line(margin, pageH - 14, pw - margin, pageH - 14);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);

      // Small C icon
      drawComplementIcon(doc, margin + 3.5, pageH - 10, 3, 'color');

      // Branded text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text('Complement Consulting Group', margin + 9, pageH - 8);

      doc.setTextColor(...BRAND_ORANGE);
      doc.text('·', margin + 53, pageH - 8);
      doc.setTextColor(...MUTED);
      doc.text(`Expediente: ${companyName}`, margin + 56, pageH - 8);

      // Page number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...NAVY);
      doc.text(`${i} / ${totalPages}`, pw - margin, pageH - 8, { align: 'right' });
    }

    // Output
    outputDoc(doc, companyName, mode);
    return;
  }

  /* ─── Case 3: Only org survey (no diagnostic) ─── */
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Branded cover page
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, ph, 'F');

  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, pw, 3, 'F');

  drawComplementIcon(doc, pw / 2, 60, 18, 'white');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text('C O M P L E M E N T', pw / 2, 92, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('C O N S U L T I N G   G R O U P', pw / 2, 102, { align: 'center' });

  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.8);
  doc.line(pw / 2 - 35, 112, pw / 2 + 35, 112);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...WHITE);
  doc.text('ESTRUCTURA', pw / 2, 132, { align: 'center' });
  doc.setFontSize(16);
  doc.text('ORGANIZACIONAL', pw / 2, 143, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(companyName.toUpperCase(), pw / 2, 162, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 135, 155);
  const coverDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(coverDate, pw / 2, 175, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Documento confidencial — Uso exclusivo del destinatario', pw / 2, ph - 26, { align: 'center' });

  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.4);
  doc.line(margin + 20, ph - 18, pw - margin - 20, ph - 18);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 135, 155);
  doc.text('Complement Consulting Group', pw / 2, ph - 12, { align: 'center' });

  // Org survey data pages
  doc.addPage();
  drawBrandedHeader(doc, 'ESTRUCTURA ORGANIZACIONAL', pw, margin);
  addOrgSurveySections(doc, orgSurvey!, margin);

  // Branded footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    doc.setDrawColor(...BRAND_ORANGE);
    doc.setLineWidth(0.4);
    doc.line(margin, pageH - 14, pw - margin, pageH - 14);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);

    drawComplementIcon(doc, margin + 3.5, pageH - 10, 3, 'color');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text('Complement Consulting Group', margin + 9, pageH - 8);

    doc.setTextColor(...BRAND_ORANGE);
    doc.text('·', margin + 53, pageH - 8);
    doc.setTextColor(...MUTED);
    doc.text(`Expediente: ${companyName}`, margin + 56, pageH - 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...NAVY);
    doc.text(`${i} / ${totalPages}`, pw - margin, pageH - 8, { align: 'right' });
  }

  outputDoc(doc, companyName, mode);
}

/* ── Helper: output the doc ── */
function outputDoc(doc: jsPDF, companyName: string, mode: 'download' | 'view') {
  const safeName = companyName
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  if (mode === 'view') {
    const blobUrl = doc.output('bloburl');
    window.open(String(blobUrl), '_blank');
  } else {
    doc.save(`Expediente_${safeName}.pdf`);
  }
}
