import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SavedDiagnostic, MarginLevel, Sector } from './types';
import { ALL_CRITERIA } from '../config/questions';
import { buildSoftwareLabel } from './formatters';
import { DEFAULT_INDUSTRY_BENCHMARKS } from '../config/constants';
import { computeMaturityIndex, computeRiskProfile, generateDiagnosticNarrative, generateGrowthReadiness } from './diagnosticAnalysis';

/* -- Color palette (RGB arrays) -- */
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
const LIGHT_BLUE: [number, number, number] = [239, 246, 255];

/* -- Complement brand colors -- */
const BRAND_ORANGE: [number, number, number] = [212, 146, 46];
/* BRAND_LIGHT_ORANGE available: [255, 247, 235] */

const MARGIN_LEVEL_LABELS: Record<MarginLevel, string> = {
  arriba_industria: 'Arriba de industria',
  en_rango: 'En rango',
  debajo_industria: 'Debajo de industria',
  critico: 'Crítico',
};

const MARGIN_LEVEL_COLORS: Record<MarginLevel, [number, number, number]> = {
  arriba_industria: SUCCESS,
  en_rango: MID,
  debajo_industria: WARN,
  critico: ERROR,
};

/* -- Helpers -- */

function ratingLabel(rating: number): string {
  if (rating <= 0) return 'Bajo';
  if (rating <= 5) return 'Medio';
  return 'Alto';
}

function levelColor(level: string): [number, number, number] {
  if (level === 'Bajo') return ERROR;
  if (level === 'Medio') return WARN;
  if (level === 'Alto' || level === 'Avanzado') return SUCCESS;
  return INK;
}

function urgencyColor(level: string): [number, number, number] {
  if (level === 'Critica' || level === 'Crítica') return ERROR;
  if (level === 'Alta') return WARN;
  if (level === 'Media') return MID;
  return SUCCESS;
}

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, color: [number, number, number]) {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

function ensureSpace(doc: jsPDF, y: number, needed: number, _margin: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - _margin) {
    doc.addPage();
    return _margin;
  }
  return y;
}

/* -- Visual Drawing Helpers -- */

function drawSegmentedBar(doc: jsPDF, x: number, y: number, width: number, height: number, value: number, fillColor: [number, number, number]) {
  const segments = 10;
  const gap = 1.2;
  const segW = (width - (segments - 1) * gap) / segments;
  const filled = Math.round(Math.max(0, Math.min(10, value)));
  const trackColor: [number, number, number] = [226, 232, 240];

  for (let i = 0; i < segments; i++) {
    const sx = x + i * (segW + gap);
    const color = i < filled ? fillColor : trackColor;
    doc.setFillColor(...color);
    doc.roundedRect(sx, y, segW, height, 1, 1, 'F');
  }
}

function drawProgressBar(doc: jsPDF, x: number, y: number, width: number, height: number, value: number, max: number, fillColor: [number, number, number]) {
  const trackColor: [number, number, number] = [226, 232, 240];
  const fillW = Math.max(0, Math.min(width, (value / max) * width));

  doc.setFillColor(...trackColor);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, 'F');

  if (fillW > 0) {
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, fillW, height, height / 2, height / 2, 'F');
  }
}

function drawStatusDot(doc: jsPDF, x: number, y: number, diameter: number, color: [number, number, number], filled: boolean = true) {
  if (filled) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, diameter, diameter, diameter / 2, diameter / 2, 'F');
  } else {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.6);
    doc.roundedRect(x, y, diameter, diameter, diameter / 2, diameter / 2, 'S');
  }
}

function drawUrgencyBattery(doc: jsPDF, x: number, y: number, level: string) {
  const segColors: [number, number, number][] = [SUCCESS, MID, WARN, ERROR];
  const segLabels = ['Baja', 'Media', 'Alta', 'Crítica'];
  const trackColor: [number, number, number] = [226, 232, 240];

  let activeLevels = 1;
  if (level === 'Media') activeLevels = 2;
  else if (level === 'Alta') activeLevels = 3;
  else if (level === 'Critica' || level === 'Crítica') activeLevels = 4;

  const segW = 12;
  const segH = 6;
  const gap = 2;

  for (let i = 0; i < 4; i++) {
    const sx = x + i * (segW + gap);
    const isActive = i < activeLevels;
    const color = isActive ? segColors[i] : trackColor;
    doc.setFillColor(...color);
    doc.roundedRect(sx, y, segW, segH, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(...(isActive ? color : MUTED));
    doc.text(segLabels[i], sx + segW / 2, y + segH + 4, { align: 'center' });
  }
}

function drawMarginGauge(doc: jsPDF, x: number, y: number, width: number, value: number | null, level: MarginLevel) {
  const barH = 5;
  const maxVal = 60;
  const trackColor: [number, number, number] = [226, 232, 240];
  const color = MARGIN_LEVEL_COLORS[level];

  doc.setFillColor(...trackColor);
  doc.roundedRect(x, y, width, barH, barH / 2, barH / 2, 'F');

  if (value !== null && value > 0) {
    const fillW = Math.max(4, Math.min(width, (value / maxVal) * width));
    doc.setFillColor(...color);
    doc.roundedRect(x, y, fillW, barH, barH / 2, barH / 2, 'F');
  }
}

function ratingColor(rating: number): [number, number, number] {
  if (rating <= 3) return ERROR;
  if (rating <= 6) return WARN;
  return SUCCESS;
}

/** Draw a circular score gauge (arc approximated with segments) */
function drawScoreRing(doc: jsPDF, cx: number, cy: number, radius: number, score: number, maxScore: number, color: [number, number, number]) {
  const trackColor: [number, number, number] = [226, 232, 240];
  const steps = 36;
  const filled = Math.round((score / maxScore) * steps);
  const segAngle = (2 * Math.PI) / steps;
  const dotR = 1.8;

  for (let i = 0; i < steps; i++) {
    const angle = -Math.PI / 2 + i * segAngle;
    const dx = cx + radius * Math.cos(angle);
    const dy = cy + radius * Math.sin(angle);
    const c = i < filled ? color : trackColor;
    doc.setFillColor(...c);
    doc.roundedRect(dx - dotR / 2, dy - dotR / 2, dotR, dotR, dotR / 2, dotR / 2, 'F');
  }
}

/* -- Maturity color helper (PDF-only, needs RGB tuples) -- */
function maturityColor(score: number): [number, number, number] {
  if (score < 30) return ERROR;
  if (score < 60) return WARN;
  if (score < 85) return MID;
  return SUCCESS;
}

/* ── Complement Logo Primitives ────────────────────────────── */

/**
 * Draw the Complement C+triangle icon using vector primitives.
 * `variant` controls coloring: 'color' = blue gradient (light bg), 'white' = white ring (dark bg).
 */
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
  const sweepDeg = 266; // 313 − 47

  for (let i = 0; i <= numDots; i++) {
    const t = i / numDots;
    const angleDeg = startDeg + t * sweepDeg;
    const rad = (angleDeg * Math.PI) / 180;
    const dx = cx + radius * Math.cos(rad);
    const dy = cy + radius * Math.sin(rad);

    if (variant === 'white') {
      const lum = Math.round(210 + t * 45); // subtle light → white gradient
      doc.setFillColor(lum, lum, lum);
    } else {
      // Blue gradient: #0a2a52 → #2272b8 (at 45%) → #6db8e0
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

  // Orange triangle in the gap (right side)
  doc.setFillColor(...BRAND_ORANGE);
  doc.triangle(
    cx + radius * 0.8,  cy,
    cx + radius * 1.2,  cy - radius * 0.625,
    cx + radius * 1.2,  cy + radius * 0.625,
    'F',
  );
}

/** Draw a full-width branded page header for interior pages. Returns the Y after the header. */
function drawBrandedHeader(doc: jsPDF, title: string, pageWidth: number, margin: number): number {
  const contentWidth = pageWidth - margin * 2;

  // Small icon on the left
  const iconR = 4;
  const iconCx = margin + iconR + 1;
  const iconCy = 8;
  drawComplementIcon(doc, iconCx, iconCy, iconR, 'color');

  // Section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(title, margin + iconR * 2 + 6, 11);

  // "COMPLEMENT" small text on the right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text('COMPLEMENT', pageWidth - margin, 10, { align: 'right' });

  // Orange accent line under header
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.6);
  doc.line(margin, 15, margin + contentWidth, 15);

  // Reset
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  return 20; // y position after the header
}

/* -- Main Export -- */

export function buildPdfDoc(diagnostic: SavedDiagnostic): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const dg = diagnostic.datosGenerales;
  const sa = diagnostic.situacionActual;
  const dateStr = new Date(diagnostic.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const sectorLabel = dg.sector === 'manufactura' ? 'Manufactura' : dg.sector === 'comercio' ? 'Comercio' : 'Servicios';

  // Compute analysis data upfront
  const maturity = computeMaturityIndex(diagnostic);
  const risks = computeRiskProfile(diagnostic);
  const growth = generateGrowthReadiness(diagnostic);
  const narrative = generateDiagnosticNarrative(diagnostic, maturity);

  /* ============================
     PAGE 1: BRANDED COVER PAGE
     ============================ */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Orange accent bar at very top
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Complement logo icon (white variant on dark background) — centered
  const coverIconR = 18;
  const coverIconCy = 60;
  drawComplementIcon(doc, pageWidth / 2, coverIconCy, coverIconR, 'white');

  // "COMPLEMENT" — spaced out, large
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text('C O M P L E M E N T', pageWidth / 2, coverIconCy + coverIconR + 16, { align: 'center', charSpace: 0.8 });

  // "CONSULTING GROUP" subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('C O N S U L T I N G   G R O U P', pageWidth / 2, coverIconCy + coverIconR + 26, { align: 'center' });

  // Orange divider line
  const dividerY = coverIconCy + coverIconR + 36;
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 35, dividerY, pageWidth / 2 + 35, dividerY);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...WHITE);
  const companyName = dg.nombreComercial || 'Radiografía Empresarial';
  const splitName = doc.splitTextToSize(companyName, contentWidth - 10);
  doc.text(splitName, pageWidth / 2, dividerY + 20, { align: 'center' });

  const nameEndY = dividerY + 20 + splitName.length * 11;

  // "REPORTE EJECUTIVO" — with brand orange
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text('REPORTE EJECUTIVO', pageWidth / 2, nameEndY + 10, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('RADIOGRAFÍA EMPRESARIAL', pageWidth / 2, nameEndY + 20, { align: 'center' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 135, 155);
  doc.text(dateStr, pageWidth / 2, nameEndY + 34, { align: 'center' });

  // Cover badges — Tamano | Sector | Madurez
  const badgeY = pageHeight - 55;
  const badges = [
    { label: 'Tamaño', value: diagnostic.companySize.size },
    { label: 'Sector', value: sectorLabel },
    { label: 'Madurez', value: `${maturity.score}%` },
  ];
  const badgeWidth = 50;
  const badgeGap = 8;
  const totalBadgeWidth = badges.length * badgeWidth + (badges.length - 1) * badgeGap;
  let bx = (pageWidth - totalBadgeWidth) / 2;
  badges.forEach(b => {
    drawRoundedRect(doc, bx, badgeY, badgeWidth, 18, 3, [45, 60, 90]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(b.label.toUpperCase(), bx + badgeWidth / 2, badgeY + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text(b.value, bx + badgeWidth / 2, badgeY + 13, { align: 'center' });
    bx += badgeWidth + badgeGap;
  });

  // Confidentiality notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Documento confidencial — Uso exclusivo del destinatario', pageWidth / 2, pageHeight - 26, { align: 'center' });

  // Footer text + thin orange line
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.4);
  doc.line(margin + 20, pageHeight - 18, pageWidth - margin - 20, pageHeight - 18);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 135, 155);
  doc.text('Complement Consulting Group', pageWidth / 2, pageHeight - 12, { align: 'center' });

  /* ============================
     PAGE 2: EXECUTIVE SUMMARY
     ============================ */
  doc.addPage();
  let y = drawBrandedHeader(doc, 'RESUMEN EJECUTIVO', pageWidth, margin);

  // --- MATURITY INDEX (Hero metric) ---
  const maturityBoxW = contentWidth;
  drawRoundedRect(doc, margin, y, maturityBoxW, 34, 3, PALE);

  // Score ring on left
  const ringCx = margin + 20;
  const ringCy = y + 17;
  drawScoreRing(doc, ringCx, ringCy, 11, maturity.score, 100, maturityColor(maturity.score));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...maturityColor(maturity.score));
  doc.text(`${maturity.score}`, ringCx, ringCy + 5, { align: 'center' });

  // Label and level
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text('ÍNDICE DE MADUREZ EMPRESARIAL', margin + 38, y + 8);

  // Level badge
  drawRoundedRect(doc, margin + 38, y + 11, 30, 8, 2, maturityColor(maturity.score));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(maturity.level, margin + 53, y + 16.5, { align: 'center' });

  // Contribution breakdown bars
  const breakdownX = margin + 38;
  const breakdownY = y + 23;
  const contribs = [
    { label: 'Profesionalización', value: maturity.profContrib, max: 35 },
    { label: 'Institucionalización', value: maturity.instContrib, max: 25 },
    { label: 'Gerencias', value: maturity.gerContrib, max: 20 },
    { label: 'Márgenes', value: maturity.marginContrib, max: 20 },
  ];
  const contribBarW = (contentWidth - 44) / 4;
  contribs.forEach((c, i) => {
    const cx = breakdownX + i * (contribBarW + 2);
    const pct = c.max > 0 ? Math.round((c.value / c.max) * 100) : 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(...MUTED);
    doc.text(c.label, cx, breakdownY);
    drawProgressBar(doc, cx, breakdownY + 2, contribBarW - 4, 3, c.value, c.max, ACCENT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(...NAVY);
    doc.text(`${pct}%`, cx + contribBarW - 3, breakdownY, { align: 'right' });
  });

  y += 38;

  // --- KEY INDICATORS ---
  const indicatorWidth = (contentWidth - 6) / 3;

  // Prof indicator
  const profX = margin;
  const profAvg = diagnostic.profesionalizacion.average;
  const profLevel = diagnostic.profesionalizacion.level;
  drawRoundedRect(doc, profX, y, indicatorWidth, 32, 3, PALE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text('PROFESIONALIZACIÓN', profX + indicatorWidth / 2, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...levelColor(profLevel));
  doc.text(`${profAvg.toFixed(0)}/100`, profX + indicatorWidth / 2, y + 17, { align: 'center' });
  const profBadgeColor = levelColor(profLevel);
  drawRoundedRect(doc, profX + indicatorWidth / 2 - 10, y + 19, 20, 7, 2, profBadgeColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...WHITE);
  doc.text(profLevel, profX + indicatorWidth / 2, y + 24, { align: 'center' });
  drawSegmentedBar(doc, profX + 4, y + 27, indicatorWidth - 8, 3, profAvg / 10, profBadgeColor);

  // Inst indicator
  const instX = margin + indicatorWidth + 3;
  const instAvg = diagnostic.institucionalizacion.average;
  const instLevel = diagnostic.institucionalizacion.level;
  drawRoundedRect(doc, instX, y, indicatorWidth, 32, 3, PALE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text('INSTITUCIONALIZACIÓN', instX + indicatorWidth / 2, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...levelColor(instLevel));
  doc.text(`${instAvg.toFixed(0)}/100`, instX + indicatorWidth / 2, y + 17, { align: 'center' });
  const instBadgeColor = levelColor(instLevel);
  drawRoundedRect(doc, instX + indicatorWidth / 2 - 10, y + 19, 20, 7, 2, instBadgeColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...WHITE);
  doc.text(instLevel, instX + indicatorWidth / 2, y + 24, { align: 'center' });
  drawSegmentedBar(doc, instX + 4, y + 27, indicatorWidth - 8, 3, instAvg / 10, instBadgeColor);

  // Urgency indicator
  const urgX = margin + 2 * (indicatorWidth + 3);
  const urgLevel = diagnostic.urgenciaLevel;
  drawRoundedRect(doc, urgX, y, indicatorWidth, 32, 3, PALE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text('NIVEL DE URGENCIA', urgX + indicatorWidth / 2, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...urgencyColor(urgLevel));
  doc.text(urgLevel, urgX + indicatorWidth / 2, y + 16, { align: 'center' });
  const batteryTotalW = 4 * 12 + 3 * 2;
  drawUrgencyBattery(doc, urgX + (indicatorWidth - batteryTotalW) / 2, y + 20, urgLevel);

  y += 36;

  // --- DIAGNOSTIC NARRATIVE ---
  drawRoundedRect(doc, margin, y, contentWidth, 8, 2, NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('DIAGNÓSTICO DE SU EMPRESA', margin + 6, y + 6);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  const narrativeLines = doc.splitTextToSize(narrative, contentWidth - 8);
  doc.text(narrativeLines, margin + 4, y);
  y += narrativeLines.length * 3.8 + 4;

  // Company info row
  const infoWidth = (contentWidth - 9) / 4;
  const infoItems = [
    { label: 'EMPRESA', value: dg.nombreComercial || '—' },
    { label: 'SECTOR', value: sectorLabel },
    { label: 'EMPLEADOS', value: sa.empleadosTotales?.toString() ?? '—' },
    { label: 'VENTAS ANUALES', value: sa.ventasAnualesMDP ? `$${sa.ventasAnualesMDP} MDP` : '—' },
  ];
  infoItems.forEach((item, i) => {
    const ix = margin + i * (infoWidth + 3);
    drawRoundedRect(doc, ix, y, infoWidth, 16, 2, LIGHT_BLUE);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...MUTED);
    doc.text(item.label, ix + infoWidth / 2, y + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    const truncated = item.value.length > 20 ? item.value.substring(0, 18) + '...' : item.value;
    doc.text(truncated, ix + infoWidth / 2, y + 12, { align: 'center' });
  });
  y += 20;

  // --- MARGINS with benchmark comparison ---
  const pdfHasAnyMargin = diagnostic.marginData?.tieneDatosFinancieros ||
    diagnostic.marginData?.conoceMargenBruto || diagnostic.marginData?.conoceMargenOperativo || diagnostic.marginData?.conoceMargenNeto;
  if (pdfHasAnyMargin && diagnostic.marginEvaluation) {
    const bench = DEFAULT_INDUSTRY_BENCHMARKS[dg.sector as Sector];
    drawRoundedRect(doc, margin, y, contentWidth, 34, 2, PALE);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...NAVY);
    doc.text('MÁRGENES FINANCIEROS', margin + 6, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...MUTED);
    doc.text(`Benchmark: ${sectorLabel}`, margin + contentWidth - 6, y + 6, { align: 'right' });

    const marginItems = [
      { label: 'M. Bruto', ...diagnostic.marginEvaluation.margenBruto, bench: bench.margenBruto },
      { label: 'M. Operativo', ...diagnostic.marginEvaluation.margenOperativo, bench: bench.margenOperativo },
      { label: 'M. Neto', ...diagnostic.marginEvaluation.margenNeto, bench: bench.margenNeto },
    ];
    const mw = contentWidth / 3;
    marginItems.forEach((m, i) => {
      const mx = margin + i * mw + 6;
      const barW = mw - 16;
      const barY = y + 14;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(m.label, mx, barY - 2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...MARGIN_LEVEL_COLORS[m.level]);
      const valText = m.value !== null ? `${m.value}%` : '—';
      doc.text(valText, mx + barW, barY - 2, { align: 'right' });

      drawMarginGauge(doc, mx, barY + 1, barW, m.value, m.level);

      // Benchmark marker line
      const benchX = mx + (m.bench / 60) * barW;
      doc.setDrawColor(...NAVY);
      doc.setLineWidth(0.5);
      doc.line(benchX, barY, benchX, barY + 6);

      // Level + benchmark comparison text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(...MARGIN_LEVEL_COLORS[m.level]);
      doc.text(MARGIN_LEVEL_LABELS[m.level], mx, barY + 10);
      doc.setTextColor(...MUTED);
      doc.text(`Industria: ${m.bench}%`, mx + barW, barY + 10, { align: 'right' });
    });
    y += 40;
  }

  // Strengths & Risks side by side
  y = ensureSpace(doc, y, 50, margin);
  const halfWidth = (contentWidth - 4) / 2;

  const highCriteria = [...diagnostic.profesionalizacion.answers, ...diagnostic.institucionalizacion.answers]
    .filter(a => a.rating >= 8)
    .map(a => ALL_CRITERIA.find(c => c.id === a.criterionId)?.shortLabel)
    .filter(Boolean)
    .slice(0, 5);

  const lowCriteria = [...diagnostic.profesionalizacion.answers, ...diagnostic.institucionalizacion.answers]
    .filter(a => a.rating >= 0 && a.rating < 4)
    .map(a => ALL_CRITERIA.find(c => c.id === a.criterionId)?.shortLabel)
    .filter(Boolean)
    .slice(0, 5);

  const fortalezaBoxH = 6 + Math.max(highCriteria.length, 1) * 7 + 4;
  drawRoundedRect(doc, margin, y, halfWidth, fortalezaBoxH, 2, [240, 253, 244]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SUCCESS);
  doc.text('PRINCIPALES FORTALEZAS', margin + 6, y + 5);
  if (highCriteria.length > 0) {
    highCriteria.forEach((c, i) => {
      const iy = y + 11 + i * 7;
      drawStatusDot(doc, margin + 6, iy - 2.5, 3.5, SUCCESS);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      doc.text(c!, margin + 12, iy + 0.5);
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Sin datos suficientes', margin + 6, y + 12);
  }

  const riskBoxX = margin + halfWidth + 4;
  const riskBoxH = 6 + Math.max(lowCriteria.length, 1) * 7 + 4;
  drawRoundedRect(doc, riskBoxX, y, halfWidth, riskBoxH, 2, [254, 242, 242]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ERROR);
  doc.text('FOCOS ROJOS / RIESGOS', riskBoxX + 6, y + 5);
  if (lowCriteria.length > 0) {
    lowCriteria.forEach((c, i) => {
      const iy = y + 11 + i * 7;
      drawStatusDot(doc, riskBoxX + 6, iy - 2.5, 3.5, ERROR);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      doc.text(c!, riskBoxX + 12, iy + 0.5);
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('No se detectaron focos rojos', riskBoxX + 6, y + 12);
  }

  const boxHeight = Math.max(fortalezaBoxH, riskBoxH);
  y += boxHeight + 6;

  /* ============================
     PAGE 3: STRATEGIC ANALYSIS
     ============================ */
  doc.addPage();
  y = drawBrandedHeader(doc, 'ANÁLISIS ESTRATÉGICO', pageWidth, margin);

  // --- RISK PROFILE ---
  if (risks.length > 0) {
    drawRoundedRect(doc, margin, y, contentWidth, 8, 2, [127, 29, 29]); // dark red
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text('PERFIL DE RIESGO — HALLAZGOS CRÍTICOS', margin + 6, y + 6);
    y += 12;

    risks.forEach(risk => {
      y = ensureSpace(doc, y, 18, margin);
      const severityColor = risk.severity === 'critico' ? ERROR : risk.severity === 'alto' ? WARN : MID;
      const bgColor: [number, number, number] = risk.severity === 'critico' ? [254, 242, 242] : risk.severity === 'alto' ? [255, 251, 235] : PALE;

      drawRoundedRect(doc, margin, y, contentWidth, 16, 2, bgColor);

      // Severity strip
      doc.setFillColor(...severityColor);
      doc.roundedRect(margin, y, 3, 16, 1, 1, 'F');
      doc.rect(margin + 1.5, y, 1.5, 16, 'F');

      // Risk title + severity badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...NAVY);
      doc.text(risk.risk, margin + 6, y + 5.5);

      const sevText = risk.severity === 'critico' ? 'CRÍTICO' : risk.severity === 'alto' ? 'ALTO' : 'MODERADO';
      const sevW = doc.getTextWidth(sevText) + 5;
      drawRoundedRect(doc, pageWidth - margin - sevW - 3, y + 1, sevW, 6.5, 2, severityColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(...WHITE);
      doc.text(sevText, pageWidth - margin - sevW / 2 - 3, y + 5.5, { align: 'center' });

      // Impact text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...INK);
      const impactLines = doc.splitTextToSize(risk.impact, contentWidth - 14);
      doc.text(impactLines[0], margin + 6, y + 12);
      if (impactLines.length > 1) {
        doc.text(impactLines[1], margin + 6, y + 15.5);
      }

      y += 18;
    });
    y += 4;
  }

  // --- GROWTH READINESS ---
  y = ensureSpace(doc, y, 35, margin);
  drawRoundedRect(doc, margin, y, contentWidth, 8, 2, BRAND_ORANGE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('PREPARACIÓN PARA CRECIMIENTO', margin + 6, y + 6);
  y += 12;

  // Score + status
  const growthColor = growth.ready ? SUCCESS : WARN;
  const growthLabel = growth.ready ? 'LISTA PARA CRECER' : 'CONSOLIDAR PRIMERO';
  drawRoundedRect(doc, margin, y, contentWidth, 22, 2, PALE);

  // Score number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...growthColor);
  doc.text(`${growth.score}%`, margin + 18, y + 15, { align: 'center' });

  // Progress bar
  drawProgressBar(doc, margin + 32, y + 9, 50, 5, growth.score, 100, growthColor);

  // Status badge
  drawRoundedRect(doc, margin + 86, y + 6, 36, 10, 2, growthColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...WHITE);
  doc.text(growthLabel, margin + 104, y + 12.5, { align: 'center' });

  // Factors
  const factorsX = margin + 128;
  growth.factors.slice(0, 3).forEach((factor, i) => {
    const isPositive = !factor.startsWith('Falta');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...(isPositive ? SUCCESS : WARN));
    doc.text(`${isPositive ? '+' : '−'} ${factor}`, factorsX, y + 6 + i * 5.5);
  });

  y += 28;

  // --- SECTOR BENCHMARK ---
  if (pdfHasAnyMargin && diagnostic.marginEvaluation) {
    y = ensureSpace(doc, y, 40, margin);
    const bench = DEFAULT_INDUSTRY_BENCHMARKS[dg.sector as Sector];

    drawRoundedRect(doc, margin, y, contentWidth, 8, 2, NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(`COMPARATIVO VS. INDUSTRIA — ${sectorLabel.toUpperCase()}`, margin + 6, y + 6);
    y += 12;

    const benchItems = [
      { label: 'Margen Bruto', actual: diagnostic.marginEvaluation.margenBruto.value, benchmark: bench.margenBruto, level: diagnostic.marginEvaluation.margenBruto.level },
      { label: 'Margen Operativo', actual: diagnostic.marginEvaluation.margenOperativo.value, benchmark: bench.margenOperativo, level: diagnostic.marginEvaluation.margenOperativo.level },
      { label: 'Margen Neto', actual: diagnostic.marginEvaluation.margenNeto.value, benchmark: bench.margenNeto, level: diagnostic.marginEvaluation.margenNeto.level },
    ];

    benchItems.forEach(item => {
      y = ensureSpace(doc, y, 14, margin);
      drawRoundedRect(doc, margin, y, contentWidth, 12, 2, PALE);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...NAVY);
      doc.text(item.label, margin + 5, y + 5);

      // Company value
      const compColor = MARGIN_LEVEL_COLORS[item.level];
      const compVal = item.actual !== null ? `${item.actual}%` : '—';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...compColor);
      doc.text(compVal, margin + 80, y + 7, { align: 'center' });

      // vs text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text('vs.', margin + 95, y + 7, { align: 'center' });

      // Benchmark value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...NAVY);
      doc.text(`${item.benchmark}%`, margin + 110, y + 7, { align: 'center' });

      // Difference
      if (item.actual !== null) {
        const diff = item.actual - item.benchmark;
        const diffStr = diff >= 0 ? `+${diff.toFixed(1)}pp` : `${diff.toFixed(1)}pp`;
        const diffColor = diff >= 0 ? SUCCESS : diff >= -5 ? WARN : ERROR;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...diffColor);
        doc.text(diffStr, pageWidth - margin - 5, y + 7, { align: 'right' });
      }

      // Comparison bar
      const barX = margin + 125;
      const barW = contentWidth - 125 - 25 + margin;
      if (barW > 10 && item.actual !== null) {
        const maxDisplay = Math.max(item.benchmark * 1.5, item.actual * 1.2, 30);
        drawProgressBar(doc, barX, y + 8.5, barW, 2, item.benchmark, maxDisplay, [180, 190, 205]);
        drawProgressBar(doc, barX, y + 8.5, barW, 2, item.actual, maxDisplay, compColor);
      }

      y += 14;
    });
    y += 4;
  }

  // --- AREAS DE OPORTUNIDAD + RECOMENDACIONES + SIGUIENTES PASOS ---

  // Opportunity Areas
  if (diagnostic.opportunityAreas.length > 0) {
    y = ensureSpace(doc, y, 30, margin);
    drawRoundedRect(doc, margin, y, contentWidth, 8, 2, NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text('ÁREAS DE OPORTUNIDAD PRINCIPALES', margin + 6, y + 6);
    y += 10;

    diagnostic.opportunityAreas.slice(0, 5).forEach(area => {
      y = ensureSpace(doc, y, 10, margin);
      const priorityColor = area.priority === 'alta' ? ERROR : area.priority === 'media' ? WARN : SUCCESS;

      drawRoundedRect(doc, margin, y, contentWidth, 9, 1, PALE);
      doc.setFillColor(...priorityColor);
      doc.roundedRect(margin, y, 3, 9, 1, 1, 'F');
      doc.rect(margin + 1.5, y, 1.5, 9, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...NAVY);
      doc.text(area.serviceArea.name, margin + 6, y + 6.5);

      const prioText = area.priority.charAt(0).toUpperCase() + area.priority.slice(1);
      const prioTextW = doc.getTextWidth(prioText) + 6;
      drawRoundedRect(doc, pageWidth - margin - prioTextW - 2, y + 1.5, prioTextW, 6, 2, priorityColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...WHITE);
      doc.text(prioText, pageWidth - margin - prioTextW / 2 - 2, y + 5.8, { align: 'center' });

      y += 11;
    });
    y += 4;
  }

  // Next steps
  y = ensureSpace(doc, y, 30, margin);
  y += 2;
  drawRoundedRect(doc, margin, y, contentWidth, 8, 2, NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('SIGUIENTES PASOS SUGERIDOS', margin + 6, y + 6);
  y += 11;

  const nextSteps = [
    'Agendar una sesión de revisión de resultados con un consultor de Complement.',
    'Priorizar las áreas de oportunidad con mayor impacto para su empresa.',
    'Definir un plan de acción con plazos y responsables para cada área.',
    'Implementar mejoras de forma gradual, comenzando por los focos rojos identificados.',
  ];
  nextSteps.forEach((step) => {
    y = ensureSpace(doc, y, 7, margin);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(`→ ${step}`, margin + 4, y);
    y += 5.5;
  });

  /* ============================
     PAGE 4+: DETAILED DATA
     ============================ */
  doc.addPage();
  y = drawBrandedHeader(doc, 'DETALLE DE DATOS', pageWidth, margin);

  /* -- DATOS GENERALES -- */
  const familiarLabelMap: Record<string, string> = {
    si_1era: '1era Generación',
    si_1era_transicion: '1era Gen. en transición',
    si_2da: '2da Generación',
    si_3era: '3era Generación',
    no: 'No es familiar',
  };
  const familiarLabel = familiarLabelMap[dg.empresaFamiliar] || dg.empresaFamiliar;

  const softwareLabel = buildSoftwareLabel(dg);
  const socioLabel = dg.esSocio === 'si'
    ? `Si${dg.porcentajeAcciones ? ` — ${dg.porcentajeAcciones}%` : ''}`
    : dg.esSocio === 'no' ? 'No' : (dg.esSocio || '—');

  autoTable(doc, {
    startY: y,
    head: [['DATOS GENERALES', '']],
    body: [
      ['Sector', sectorLabel],
      ['Ubicación', (dg as any).ubicacion || '—'],
      ['Antigüedad Constituida', dg.antiguedadConstituida ? `${dg.antiguedadConstituida} años` : '—'],
      ['Antigüedad Operativa', dg.antiguedadOperativa ? `${dg.antiguedadOperativa} años` : '—'],
      ['Empresa Familiar', familiarLabel],
      ['Respondente', dg.respondente || '—'],
      ['Correo electrónico', dg.email || '—'],
      ['Puesto en la Empresa', dg.puestoEmpresa || dg.puestoEmpresaFamilia || '—'],
      ['¿Es socio?', socioLabel],
      ['Software de Gestión', softwareLabel],
    ],
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: NAVY }, 1: { cellWidth: contentWidth - 50 } },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  /* -- SITUACIÓN ACTUAL -- */
  const sitBody: string[][] = [
    ['Ventas Anuales', sa.ventasAnualesMDP !== null ? `$${sa.ventasAnualesMDP} MDP` : '—'],
    ['Empleados Totales', sa.empleadosTotales?.toString() ?? '—'],
    ['Número de Socios', sa.socios || '—'],
  ];
  if (sa.empleadosFamiliares !== null && sa.empleadosFamiliares !== undefined) {
    sitBody.splice(2, 0, ['Empleados Familiares', sa.empleadosFamiliares.toString()]);
  }
  if (sa.sociosDetalle && sa.sociosDetalle.length > 0) {
    sa.sociosDetalle.forEach((s: any, i: number) => {
      const nombre = s.nombre || '';
      const fam = s.esFamiliar === true ? 'Familiar' : s.esFamiliar === false ? 'No familiar' : '—';
      const pct = s.porcentaje ? `${s.porcentaje}%` : '—';
      const label = nombre ? `  ${nombre}` : `  Socio ${i + 1}`;
      sitBody.push([label, `${fam}  |  ${pct}`]);
    });
  }
  if (sa.familiaresEnPoder) sitBody.push(['Familiares en el Poder', sa.familiaresEnPoder]);
  if (sa.sueldoMasAlto) sitBody.push(['Sueldo más alto mensual', `$${Number(sa.sueldoMasAlto).toLocaleString('es-MX')}`]);
  if (sa.pctIngresoFiscalizado != null) sitBody.push(['% Ingreso Fiscalizado', `${sa.pctIngresoFiscalizado}%`]);
  if (sa.pctEgresoFiscalizado != null) sitBody.push(['% Egreso Fiscalizado', `${sa.pctEgresoFiscalizado}%`]);

  autoTable(doc, {
    startY: y,
    head: [['SITUACIÓN ACTUAL', '']],
    body: sitBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: NAVY } },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  /* -- CLASIFICACION DE EMPRESA -- */
  y = ensureSpace(doc, y, 50, margin);
  drawRoundedRect(doc, margin, y, contentWidth, 8, 2, NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('CLASIFICACIÓN DE EMPRESA', margin + 6, y + 6);
  y += 12;

  const sizeOptions = ['Micro', 'Pequeña', 'Mediana', 'Grande'];
  const scaleBoxW = (contentWidth - 12) / 4;
  const scaleBoxH = 14;
  sizeOptions.forEach((size, i) => {
    const sx = margin + i * (scaleBoxW + 4);
    const isActive = diagnostic.companySize.size === size;
    const bgColor: [number, number, number] = isActive ? ACCENT : [226, 232, 240];
    const textClr: [number, number, number] = isActive ? WHITE : MUTED;
    drawRoundedRect(doc, sx, y, scaleBoxW, scaleBoxH, 3, bgColor);
    if (isActive) {
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(0.8);
      doc.roundedRect(sx - 0.5, y - 0.5, scaleBoxW + 1, scaleBoxH + 1, 3.5, 3.5, 'S');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...textClr);
    doc.text(size, sx + scaleBoxW / 2, y + scaleBoxH / 2 + 3, { align: 'center' });
  });
  y += scaleBoxH + 6;

  const metricHalfW = (contentWidth - 4) / 2;
  drawRoundedRect(doc, margin, y, metricHalfW, 18, 2, LIGHT_BLUE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(...MUTED);
  doc.text('PRODUCTIVIDAD PER CÁPITA', margin + metricHalfW / 2, y + 5.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(`$${diagnostic.companySize.productivityIndex.toFixed(2)} MDP`, margin + metricHalfW / 2, y + 13, { align: 'center' });

  const antX = margin + metricHalfW + 4;
  drawRoundedRect(doc, antX, y, metricHalfW, 18, 2, LIGHT_BLUE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(...MUTED);
  doc.text('ANTIGÜEDAD', antX + metricHalfW / 2, y + 5.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  const antConstStr = dg.antiguedadConstituida ? `${dg.antiguedadConstituida} años constituida` : '';
  const antOperStr = dg.antiguedadOperativa ? `${dg.antiguedadOperativa} años operativa` : '';
  doc.text(antConstStr || antOperStr || '—', antX + metricHalfW / 2, y + 12, { align: 'center' });
  if (antConstStr && antOperStr) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text(antOperStr, antX + metricHalfW / 2, y + 16, { align: 'center' });
  }
  y += 24;

  /* -- MÁRGENES FINANCIEROS TABLE -- */
  if (pdfHasAnyMargin && diagnostic.marginEvaluation) {
    y = ensureSpace(doc, y, 30, margin);
    const marginBody = (['margenBruto', 'margenOperativo', 'margenNeto'] as const).map(key => {
      const ev = diagnostic.marginEvaluation![key];
      const label = key === 'margenBruto' ? 'Margen Bruto' : key === 'margenOperativo' ? 'Margen Operativo' : 'Margen Neto';
      return [label, ev.value !== null ? `${ev.value}%` : '—', MARGIN_LEVEL_LABELS[ev.level]];
    });

    autoTable(doc, {
      startY: y,
      head: [['MÁRGENES FINANCIEROS', 'Valor', 'Evaluación']],
      body: marginBody,
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: INK },
      columnStyles: { 0: { fontStyle: 'bold', textColor: NAVY }, 1: { halign: 'center', fontStyle: 'bold' }, 2: { halign: 'center', fontStyle: 'bold' } },
      didParseCell: (data) => {
        if (data.section === 'body' && (data.column.index === 1 || data.column.index === 2)) {
          const key = (['margenBruto', 'margenOperativo', 'margenNeto'] as const)[data.row.index];
          if (key && diagnostic.marginEvaluation) {
            data.cell.styles.textColor = MARGIN_LEVEL_COLORS[diagnostic.marginEvaluation[key].level];
          }
        }
      },
      alternateRowStyles: { fillColor: PALE },
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  /* -- PROFESIONALIZACIÓN with visual bars -- */
  y = ensureSpace(doc, y, 30, margin);
  const profRatings = diagnostic.profesionalizacion.answers.map(a => a.rating);
  const profBody = diagnostic.profesionalizacion.answers.map(a => {
    const criterion = ALL_CRITERIA.find(c => c.id === a.criterionId);
    return [criterion?.shortLabel ?? a.criterionId, '', a.comentario || ''];
  });

  autoTable(doc, {
    startY: y,
    head: [[`PROFESIONALIZACIÓN (${diagnostic.profesionalizacion.average.toFixed(0)}/100 — ${diagnostic.profesionalizacion.level})`, 'Calificación', 'Comentario']],
    body: profBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK, minCellHeight: 8 },
    columnStyles: { 0: { cellWidth: 55, textColor: NAVY }, 1: { cellWidth: 30, halign: 'center' }, 2: { fontSize: 7, textColor: MUTED } },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const rating = profRatings[data.row.index];
        if (rating >= 0) {
          const cellX = data.cell.x + 3;
          const cellY = data.cell.y + (data.cell.height - 4) / 2;
          const barW = data.cell.width - 6;
          const color = ratingColor(rating);
          drawProgressBar(doc, cellX, cellY, barW, 4, rating, 10, color);
        }
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 2.5 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  /* -- INSTITUCIONALIZACIÓN with visual bars -- */
  y = ensureSpace(doc, y, 30, margin);
  const instRatings = diagnostic.institucionalizacion.answers.map(a => a.rating);
  const instBody = diagnostic.institucionalizacion.answers.map(a => {
    const criterion = ALL_CRITERIA.find(c => c.id === a.criterionId);
    return [criterion?.shortLabel ?? a.criterionId, '', a.comentario || ''];
  });

  autoTable(doc, {
    startY: y,
    head: [[`INSTITUCIONALIZACIÓN (${diagnostic.institucionalizacion.average.toFixed(0)}/100 — ${diagnostic.institucionalizacion.level})`, 'Calificación', 'Comentario']],
    body: instBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK, minCellHeight: 8 },
    columnStyles: { 0: { cellWidth: 55, textColor: NAVY }, 1: { cellWidth: 30, halign: 'center' }, 2: { fontSize: 7, textColor: MUTED } },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const rating = instRatings[data.row.index];
        if (rating >= 0) {
          const cellX = data.cell.x + 3;
          const cellY = data.cell.y + (data.cell.height - 4) / 2;
          const barW = data.cell.width - 6;
          const color = ratingColor(rating);
          drawProgressBar(doc, cellX, cellY, barW, 4, rating, 10, color);
        }
      }
    },
    alternateRowStyles: { fillColor: PALE },
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 2.5 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  /* -- AREAS DE OPORTUNIDAD -- */
  if (diagnostic.opportunityAreas.length > 0) {
    y = ensureSpace(doc, y, 30, margin);
    const aoBody = diagnostic.opportunityAreas.map(area => [
      area.serviceArea.name,
      area.priority.charAt(0).toUpperCase() + area.priority.slice(1),
      area.needScore.toString(),
      area.triggeringCriteria.map(c => `${c.text} (${ratingLabel(c.rating)})`).join('; '),
    ]);
    const aoPriorities = diagnostic.opportunityAreas.map(a => a.priority);

    autoTable(doc, {
      startY: y,
      head: [['ÁREAS DE OPORTUNIDAD', 'Prioridad', 'Score', 'Criterios']],
      body: aoBody,
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: INK },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40, textColor: NAVY },
        1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        3: { fontSize: 7, textColor: MUTED },
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const prio = aoPriorities[data.row.index];
          const stripColor = prio === 'alta' ? ERROR : prio === 'media' ? WARN : SUCCESS;
          doc.setFillColor(...stripColor);
          doc.rect(data.cell.x, data.cell.y, 2.5, data.cell.height, 'F');
        }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const p = (data.cell.raw as string).toLowerCase();
          data.cell.styles.textColor = p === 'alta' ? ERROR : p === 'media' ? WARN : SUCCESS;
        }
        if (data.section === 'body' && data.column.index === 0) {
          data.cell.styles.cellPadding = { top: 2.5, right: 2.5, bottom: 2.5, left: 5 };
        }
      },
      alternateRowStyles: { fillColor: PALE },
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 2.5 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  /* -- GERENCIAS Dashboard -- */
  y = ensureSpace(doc, y, 50, margin);
  drawRoundedRect(doc, margin, y, contentWidth, 8, 2, NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('GERENCIAS / PUESTOS CLAVE', margin + 6, y + 6);
  y += 12;

  const coveredCount = diagnostic.gerencias.filter(g => g.cubierto).length;
  const totalGerencias = diagnostic.gerencias.length;

  diagnostic.gerencias.forEach(g => {
    y = ensureSpace(doc, y, 14, margin);
    drawRoundedRect(doc, margin, y, contentWidth, 11, 2, PALE);

    const dotSize = 6;
    const dotY = y + (11 - dotSize) / 2;

    if (!g.cubierto) {
      drawStatusDot(doc, margin + 5, dotY, dotSize, ERROR, false);
    } else if (g.calificado === 'si') {
      drawStatusDot(doc, margin + 5, dotY, dotSize, SUCCESS, true);
    } else if (g.calificado === 'no') {
      drawStatusDot(doc, margin + 5, dotY, dotSize, ERROR, true);
    } else {
      drawStatusDot(doc, margin + 5, dotY, dotSize, WARN, true);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    const gerNombre = (g as any).nombre as string || '';
    const areaLabel = gerNombre ? `${g.area} — ${gerNombre}` : g.area;
    doc.text(areaLabel, margin + 14, y + 7);

    const statusText = !g.cubierto ? 'No cubierto'
      : g.soyYo ? 'Soy Yo'
      : g.calificado === 'si' ? 'Calificado'
      : g.calificado === 'no' ? 'No calificado'
      : 'No lo sé';
    const statusColor = !g.cubierto ? ERROR : g.calificado === 'si' ? SUCCESS : g.calificado === 'no' ? ERROR : WARN;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...statusColor);
    doc.text(statusText, margin + 75, y + 7);

    const infoParts: string[] = [];
    if (g.antiguedad) infoParts.push(`${g.antiguedad} años`);
    if ((g as any).rangoSueldo) infoParts.push((g as any).rangoSueldo);
    if ((g as any).esFamiliar === true) infoParts.push('Familiar');

    if (infoParts.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(infoParts.join('  |  '), pageWidth - margin - 5, y + 7, { align: 'right' });
    }

    y += 13;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text(`${coveredCount} de ${totalGerencias} puestos cubiertos`, margin + 5, y);
  y += 8;

  // DG Evaluation
  const dgGer = diagnostic.gerencias[0];
  const dgEv = dgGer?.dgEvaluation;
  if (dgEv && dgEv.nivelEstudios != null && dgEv.experienciaLaboral != null && dgEv.seguimientoResultados != null) {
    y = ensureSpace(doc, y, 24, margin);
    const dgScore = dgEv.nivelEstudios * 0.4 + dgEv.experienciaLaboral * 0.4 + dgEv.seguimientoResultados * 0.2;
    const dgColor: [number, number, number] = dgScore >= 8 ? SUCCESS : dgScore >= 5 ? WARN : ERROR;
    const dgLabel = dgScore >= 8 ? 'Excelente' : dgScore >= 6 ? 'Bueno' : dgScore >= 4 ? 'Regular' : 'Bajo';

    drawRoundedRect(doc, margin, y, contentWidth, 20, 2, PALE);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...NAVY);
    doc.text('CALIFICACIÓN DIRECTOR GENERAL', margin + 5, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...dgColor);
    doc.text(`${dgScore.toFixed(1)}`, margin + 5, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('/ 10', margin + 20, y + 15);

    drawRoundedRect(doc, margin + 30, y + 9, 18, 7, 2, dgColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...WHITE);
    doc.text(dgLabel, margin + 39, y + 14, { align: 'center' });

    const dgItems = [
      { label: 'Estudios (40%)', value: dgEv.nivelEstudios },
      { label: 'Experiencia (40%)', value: dgEv.experienciaLaboral },
      { label: 'Seguimiento (20%)', value: dgEv.seguimientoResultados },
    ];
    dgItems.forEach((item, i) => {
      const dx = margin + 55 + i * 38;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...MUTED);
      doc.text(item.label, dx, y + 6);
      drawProgressBar(doc, dx, y + 8, 30, 3, item.value, 10, ACCENT);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...NAVY);
      doc.text(`${item.value}/10`, dx, y + 16);
    });
    y += 24;
  }

  /* -- RETOS -- */
  const filteredRetos = diagnostic.retos.filter(r => r);
  if (filteredRetos.length > 0) {
    y = ensureSpace(doc, y, 20, margin);
    const retosBody = filteredRetos.map((reto, i) => [`Reto ${i + 1}`, reto]);
    retosBody.push(['Urgencia', diagnostic.urgenciaLevel]);
    if (diagnostic.tieneLiderInterno != null) {
      retosBody.push(['Líder Interno', diagnostic.tieneLiderInterno ? 'Sí' : 'No']);
    }

    autoTable(doc, {
      startY: y,
      head: [['RETOS PRINCIPALES', '']],
      body: retosBody,
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: INK },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30, textColor: NAVY } },
      alternateRowStyles: { fillColor: PALE },
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  /* -- DESCRIPCIÓN DEL NEGOCIO -- */
  if (diagnostic.descripcionNegocio) {
    y = ensureSpace(doc, y, 20, margin);
    autoTable(doc, {
      startY: y,
      head: [['DESCRIPCIÓN DEL NEGOCIO']],
      body: [[diagnostic.descripcionNegocio]],
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: INK },
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 4 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  /* -- LÍNEAS DE NEGOCIO -- */
  if ((diagnostic as any).lineasNegocio && (diagnostic as any).lineasNegocio.length > 0) {
    y = ensureSpace(doc, y, 20, margin);
    const lineasBody = (diagnostic as any).lineasNegocio.map((l: { nombre: string; porcentaje: string }) => [
      l.nombre || '—',
      l.porcentaje ? `${l.porcentaje}%` : '—',
    ]);
    autoTable(doc, {
      startY: y,
      head: [['LÍNEAS DE NEGOCIO', 'Porcentaje']],
      body: lineasBody,
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: INK },
      columnStyles: { 0: { fontStyle: 'bold', textColor: NAVY }, 1: { halign: 'center', fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: PALE },
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
    });
  }

  /* -- BRANDED FOOTER on every page (except cover) -- */
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();

    // Orange accent line
    doc.setDrawColor(...BRAND_ORANGE);
    doc.setLineWidth(0.4);
    doc.line(margin, ph - 14, pageWidth - margin, ph - 14);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);

    // Small C icon in footer
    drawComplementIcon(doc, margin + 3.5, ph - 10, 3, 'color');

    // Branded text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text('Complement Consulting Group', margin + 9, ph - 8);

    // Separator dot + report type
    doc.setTextColor(...BRAND_ORANGE);
    doc.text('·', margin + 53, ph - 8);
    doc.setTextColor(...MUTED);
    doc.text('Radiografía Empresarial', margin + 56, ph - 8);

    // Page number on the right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...NAVY);
    doc.text(`${i} / ${totalPages}`, pageWidth - margin, ph - 8, { align: 'right' });
  }

  return doc;
}

export function exportToPdf(diagnostic: SavedDiagnostic): void {
  const doc = buildPdfDoc(diagnostic);
  const safeName = (diagnostic.datosGenerales.nombreComercial || 'radiografia')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  doc.save(`Reporte_${safeName}.pdf`);
}

export function getPdfBase64(diagnostic: SavedDiagnostic): string {
  const doc = buildPdfDoc(diagnostic);
  return doc.output('datauristring').split(',')[1];
}
