import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SavedOrgSurvey } from './types';

/* ── Color palette (RGB arrays) — matches exportPdf.ts ── */
const NAVY: [number, number, number] = [27, 42, 74];
const ACCENT: [number, number, number] = [59, 130, 246];
const WHITE: [number, number, number] = [255, 255, 255];
const PALE: [number, number, number] = [248, 250, 252];
const MUTED: [number, number, number] = [100, 116, 139];
const INK: [number, number, number] = [51, 65, 85];
const SUCCESS: [number, number, number] = [22, 163, 74];
const ERROR: [number, number, number] = [220, 38, 38];
const MID: [number, number, number] = [99, 102, 241];
const BORDER: [number, number, number] = [203, 213, 225];

/* ── Main Export ──────────────────────────────────────── */

export function exportOrgSurveyToPdf(survey: SavedOrgSurvey): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  /* ═══════════════════════════════════════════════════════
     TITLE BANNER
     ═══════════════════════════════════════════════════════ */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text('ESTRUCTURA ORGANIZACIONAL', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text('COMPLEMENT CONSULTING GROUP', pageWidth / 2, 20, { align: 'center' });

  // Company name + date bar
  doc.setFillColor(239, 246, 255);
  doc.rect(0, 28, pageWidth, 10, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text(survey.companyName || 'Sin nombre', margin, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const dateStr = new Date(survey.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(dateStr, pageWidth - margin, 34, { align: 'right' });

  y = 44;

  /* ═══════════════════════════════════════════════════════
     ESTRUCTURA Y ORGANIGRAMA
     ═══════════════════════════════════════════════════════ */
  const org = survey.orgStructure;
  const descLabel = org.descripcionesPuesto === 'todas' ? 'Todas'
    : org.descripcionesPuesto === 'algunas' ? 'Algunas' : 'Ninguna';

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

  /* ═══════════════════════════════════════════════════════
     DETALLE POR ÁREA
     ═══════════════════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════════════════
     TOTALES
     ═══════════════════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════════════════
     TALENTO Y PROCESOS DE RH
     ═══════════════════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════════════════
     FOOTER on every page
     ═══════════════════════════════════════════════════════ */
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(
      'Complement Consulting Group --- Estructura Organizacional',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  /* ═══════════════════════════════════════════════════════
     DOWNLOAD
     ═══════════════════════════════════════════════════════ */
  const safeName = (survey.companyName || 'estructura_org')
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  doc.save(`Estructura_Org_${safeName}.pdf`);
}
