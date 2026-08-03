import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AREA_STATEMENTS, GENERAL_STATEMENTS, TECH_AREAS, GENERAL_AREA_LABEL, MATURITY_LEVELS } from '../config/techQuestions';
import type { SavedTechSurvey, TechMaturityScore } from './types';

const NAVY: [number, number, number] = [27, 42, 74];
const ACCENT: [number, number, number] = [212, 146, 46];
const WHITE: [number, number, number] = [255, 255, 255];
const PALE: [number, number, number] = [248, 250, 252];
const MUTED: [number, number, number] = [100, 116, 139];
const INK: [number, number, number] = [51, 65, 85];
const BORDER: [number, number, number] = [203, 213, 225];

function levelInfo(score: TechMaturityScore | undefined) {
  return MATURITY_LEVELS.find(l => l.score === score);
}

export function exportTechSurveyToPdf(
  survey: SavedTechSurvey,
  mode: 'download' | 'view' = 'download',
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const areaConfig = TECH_AREAS.find(a => a.id === survey.respondentArea);
  const areaAnswerMap = Object.fromEntries(survey.areaAnswers.map(a => [a.id, a.score]));
  const generalAnswerMap = Object.fromEntries(survey.generalAnswers.map(a => [a.id, a.score]));
  const dateStr = new Date(survey.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  /* ── PAGE 1: COVER ── */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...WHITE);
  doc.text('PRUEBA DE TECNOLOGÍA', pageWidth / 2, 70, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text('COMPLEMENT CONSULTING GROUP', pageWidth / 2, 82, { align: 'center' });

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 30, 89, pageWidth / 2 + 30, 89);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text(survey.companyName || 'Sin nombre', pageWidth / 2, 102, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text(`${areaConfig?.name ?? 'Área'} — ${survey.rolCargo || 'Sin rol'}`, pageWidth / 2, 110, { align: 'center' });
  doc.setTextColor(200, 200, 210);
  doc.text(dateStr, pageWidth / 2, 117, { align: 'center' });

  // Score boxes
  const boxY = 135, boxW = 60, boxH = 34, gap = 10;
  const startX = pageWidth / 2 - boxW - gap / 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(startX, boxY, boxW, boxH, 3, 3, 'F');
  doc.roundedRect(startX + boxW + gap, boxY, boxW, boxH, 3, 3, 'F');
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(`${survey.areaScore}%`, startX + boxW / 2, boxY + 18, { align: 'center' });
  doc.text(`${survey.generalScore}%`, startX + boxW + gap + boxW / 2, boxY + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(areaConfig?.name ?? 'Área', startX + boxW / 2, boxY + 27, { align: 'center' });
  doc.text(GENERAL_AREA_LABEL, startX + boxW + gap + boxW / 2, boxY + 27, { align: 'center' });

  /* ── PAGE 2: DETALLE — Área ── */
  doc.addPage();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(`AFIRMACIONES — ${(areaConfig?.name ?? 'ÁREA').toUpperCase()}`, pageWidth / 2, 14, { align: 'center' });
  let y = 28;

  const areaBody = (survey.respondentArea ? AREA_STATEMENTS[survey.respondentArea] : []).map(st => {
    const info = levelInfo(areaAnswerMap[st.id]);
    return [st.text, info ? `Nivel ${info.score} — ${info.label}` : '—'];
  });

  autoTable(doc, {
    startY: y,
    head: [['AFIRMACIÓN', 'NIVEL']],
    body: areaBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: INK },
    columnStyles: { 0: { cellWidth: contentWidth - 55 }, 1: { cellWidth: 55, fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  /* ── PAGE 3: DETALLE — Sistemas y Seguridad ── */
  doc.addPage();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(`AFIRMACIONES — ${GENERAL_AREA_LABEL.toUpperCase()}`, pageWidth / 2, 14, { align: 'center' });
  y = 28;

  const generalBody = GENERAL_STATEMENTS.map(st => {
    const info = levelInfo(generalAnswerMap[st.id]);
    return [st.text, info ? `Nivel ${info.score} — ${info.label}` : '—'];
  });

  autoTable(doc, {
    startY: y,
    head: [['AFIRMACIÓN', 'NIVEL']],
    body: generalBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: INK },
    columnStyles: { 0: { cellWidth: contentWidth - 55 }, 1: { cellWidth: 55, fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  const oportunidades = [...(survey.respondentArea ? AREA_STATEMENTS[survey.respondentArea] : []), ...GENERAL_STATEMENTS]
    .filter(st => (areaAnswerMap[st.id] ?? generalAnswerMap[st.id]) !== undefined && (areaAnswerMap[st.id] ?? generalAnswerMap[st.id])! <= 2);

  if (oportunidades.length > 0) {
    if (y > pageHeight - 40) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text('ÁREAS DE OPORTUNIDAD', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    for (const st of oportunidades) {
      const lines = doc.splitTextToSize(`• ${st.text}`, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 4.5 + 2;
    }
  }

  const filename = `Prueba_Tecnologia_${(survey.companyName || 'empresa').replace(/\s+/g, '_')}.pdf`;
  if (mode === 'view') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(filename);
  }
}
