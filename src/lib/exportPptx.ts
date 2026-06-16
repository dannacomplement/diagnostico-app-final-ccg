/**
 * PowerPoint export for Diagnostic Results — v2 (Dense & Visual).
 * Uses pptxgenjs to generate a branded presentation for consultants.
 * Slide canvas: LAYOUT_WIDE = 13.33" x 7.5"
 */
import PptxGenJS from 'pptxgenjs';
import type { SavedDiagnostic, MarginLevel, Sector } from './types';
import { ALL_CRITERIA } from '../config/questions';
import { DEFAULT_INDUSTRY_BENCHMARKS } from '../config/constants';
import { buildSoftwareLabel } from './formatters';
import {
  computeMaturityIndex,
  computeRiskProfile,
  generateSmartRecommendations,
  generateDiagnosticNarrative,
  generateGrowthReadiness,
} from './diagnosticAnalysis';

/* ── Brand Colors ─────────────────────────────── */
const NAVY = '1B2A4A';
const NAVY_LIGHT = '243756';
const BRAND_ORANGE = 'D4922E';
const ORANGE_LIGHT = 'F5E6D0';
const WHITE = 'FFFFFF';
const MUTED = '64748B';
const INK = '334155';
const LIGHT_BG = 'F1F5F9';
const LIGHT_BORDER = 'E2E8F0';
const SUCCESS = '22C55E';
const SUCCESS_BG = 'DCFCE7';
const WARN = 'F59E0B';
const WARN_BG = 'FEF3C7';
const ERROR = 'EF4444';
const ERROR_BG = 'FEE2E2';
const MID = '6366F1';
const MID_BG = 'E0E7FF';

/* ── Layout constants (13.33" x 7.5") ─────────── */
const W = 13.33;
const MARGIN_L = 0.6;
const MARGIN_R = 0.6;
const CONTENT_W = W - MARGIN_L - MARGIN_R; // ~12.13"
const FOOTER_Y = 7.1;
const ACCENT_BAR_W = 0.06;

/* ── Helpers ─────────────────────────────────────── */

function levelColor(level: string): string {
  if (level === 'Bajo' || level === 'Muy Bajo') return ERROR;
  if (level === 'Medio') return WARN;
  return SUCCESS;
}

function levelBg(level: string): string {
  if (level === 'Bajo' || level === 'Muy Bajo') return ERROR_BG;
  if (level === 'Medio') return WARN_BG;
  return SUCCESS_BG;
}

function urgencyColor(level: string): string {
  if (level === 'Crítica' || level === 'Critica') return ERROR;
  if (level === 'Alta') return WARN;
  if (level === 'Media') return MID;
  return SUCCESS;
}

function urgencyBg(level: string): string {
  if (level === 'Crítica' || level === 'Critica') return ERROR_BG;
  if (level === 'Alta') return WARN_BG;
  if (level === 'Media') return MID_BG;
  return SUCCESS_BG;
}

const MARGIN_LABELS: Record<MarginLevel, string> = {
  arriba_industria: 'Arriba de industria',
  en_rango: 'En rango',
  debajo_industria: 'Debajo',
  critico: 'Critico',
};

const MARGIN_COLORS: Record<MarginLevel, string> = {
  arriba_industria: SUCCESS,
  en_rango: MID,
  debajo_industria: WARN,
  critico: ERROR,
};

function sectorLabel(s: string): string {
  const m: Record<string, string> = { manufactura: 'Manufactura', comercio: 'Comercio', servicios: 'Servicios' };
  return m[s] || s;
}

function familiarLabel(ef: string): string {
  const m: Record<string, string> = { si_1era: 'Si, 1a gen.', si_2da: 'Si, 2a gen.', si_3era: 'Si, 3a gen.', no: 'No' };
  return m[ef] || ef;
}

function ratingLabel(r: number): string {
  if (r <= 0) return 'Bajo';
  if (r <= 5) return 'Medio';
  return 'Alto';
}

function ratingColor(r: number): string {
  if (r <= 0) return ERROR;
  if (r <= 5) return WARN;
  return SUCCESS;
}

function calificadoLabel(c: string): string {
  if (c === 'si') return 'Calificado';
  if (c === 'no') return 'No calificado';
  return 'Por evaluar';
}

function calificadoColor(c: string): string {
  if (c === 'si') return SUCCESS;
  if (c === 'no') return ERROR;
  return MUTED;
}

/* ── Shared: slide header + footer ───────────── */

function addSlideHeader(slide: PptxGenJS.Slide, title: string, subtitle?: string) {
  // Top orange accent line (full width)
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.05, fill: { color: BRAND_ORANGE } });
  // Left navy accent bar
  slide.addShape('rect', { x: 0, y: 0, w: ACCENT_BAR_W, h: 7.5, fill: { color: NAVY } });

  // Title
  slide.addText(title, {
    x: MARGIN_L + 0.15, y: 0.2, w: CONTENT_W - 0.3, h: 0.45,
    fontSize: 22, color: NAVY, fontFace: 'Arial', bold: true,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: MARGIN_L + 0.15, y: 0.6, w: CONTENT_W - 0.3, h: 0.25,
      fontSize: 10, color: MUTED, fontFace: 'Arial', italic: true,
    });
  }

  // Header underline
  slide.addShape('rect', { x: MARGIN_L + 0.15, y: 0.9, w: 2, h: 0.025, fill: { color: BRAND_ORANGE } });
}

function addFooter(slide: PptxGenJS.Slide, companyName: string, slideNum?: number) {
  slide.addShape('rect', { x: 0, y: FOOTER_Y, w: W, h: 0.015, fill: { color: BRAND_ORANGE } });
  const leftText = `${companyName}  |  Complement Consulting Group`;
  slide.addText(leftText, {
    x: MARGIN_L, y: FOOTER_Y + 0.05, w: 8, h: 0.25,
    fontSize: 7, color: MUTED, fontFace: 'Arial',
  });
  if (slideNum !== undefined) {
    slide.addText(`${slideNum}`, {
      x: W - MARGIN_R - 0.5, y: FOOTER_Y + 0.05, w: 0.5, h: 0.25,
      fontSize: 7, color: MUTED, fontFace: 'Arial', align: 'right',
    });
  }
}

/* ── Mini card helper ────────────────────────── */

function addInfoCard(
  slide: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  label: string, value: string,
  opts?: { accentColor?: string; valueFontSize?: number }
) {
  const accent = opts?.accentColor;
  const valSize = opts?.valueFontSize ?? 12;

  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: 0.06,
    fill: { color: WHITE },
    line: { color: LIGHT_BORDER, width: 0.5 },
    shadow: { type: 'outer', blur: 2, offset: 1, color: '00000008' },
  });

  // Left color accent inside card
  if (accent) {
    slide.addShape('rect', { x: x + 0.02, y: y + 0.08, w: 0.04, h: h - 0.16, fill: { color: accent } });
  }

  const textX = accent ? x + 0.14 : x + 0.1;
  const textW = accent ? w - 0.24 : w - 0.2;

  slide.addText(label.toUpperCase(), {
    x: textX, y: y + 0.06, w: textW, h: 0.2,
    fontSize: 6.5, color: MUTED, fontFace: 'Arial', bold: true,
  });
  slide.addText(value, {
    x: textX, y: y + 0.28, w: textW, h: h - 0.36,
    fontSize: valSize, color: INK, fontFace: 'Arial', bold: true, shrinkText: true,
    valign: 'top',
  });
}

/* ── Progress bar helper ─────────────────────── */

function addProgressBar(
  slide: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  pct: number, color: string
) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: h / 2, fill: { color: LIGHT_BORDER } });
  const fillW = Math.max(h, (pct / 100) * w);
  slide.addShape('roundRect', { x, y, w: fillW, h, rectRadius: h / 2, fill: { color } });
}

/* ══════════════════════════════════════════════════════
   SLIDE 1: Title
   ══════════════════════════════════════════════════════ */

function addTitleSlide(pptx: PptxGenJS, d: SavedDiagnostic, companyName: string) {
  const slide = pptx.addSlide();
  slide.background = { fill: NAVY };

  // Top orange accent
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.06, fill: { color: BRAND_ORANGE } });

  // Decorative side bar
  slide.addShape('rect', { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: BRAND_ORANGE } });

  // Company name (big)
  slide.addText(companyName, {
    x: 1.2, y: 1.5, w: 10, h: 1.2,
    fontSize: 40, color: WHITE, fontFace: 'Arial', bold: true,
  });

  // Subtitle
  slide.addText('Diagnostico Empresarial', {
    x: 1.2, y: 2.7, w: 10, h: 0.6,
    fontSize: 22, color: BRAND_ORANGE, fontFace: 'Arial', bold: true,
  });

  // Date
  const dateStr = new Date(d.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  slide.addText(dateStr, {
    x: 1.2, y: 3.4, w: 10, h: 0.4,
    fontSize: 14, color: `${WHITE}99`, fontFace: 'Arial',
  });

  // Separator
  slide.addShape('rect', { x: 1.2, y: 4.2, w: 2.5, h: 0.03, fill: { color: BRAND_ORANGE } });

  // ── Key metrics strip at bottom ──
  const maturity = computeMaturityIndex(d);
  const stripY = 5.3;
  const stripH = 1.0;
  slide.addShape('roundRect', { x: 1.2, y: stripY, w: 10.5, h: stripH, rectRadius: 0.08, fill: { color: NAVY_LIGHT } });

  const metrics = [
    { label: 'Madurez', value: `${Math.round(maturity.score)}/100`, sub: maturity.level },
    { label: 'Profesionalizacion', value: `${Math.round(d.profesionalizacion.average)}/100`, sub: d.profesionalizacion.level },
    { label: 'Institucionalizacion', value: `${Math.round(d.institucionalizacion.average)}/100`, sub: d.institucionalizacion.level },
    { label: 'Tamano', value: d.companySize.size, sub: `${d.situacionActual.empleadosTotales ?? '—'} empleados` },
    { label: 'Urgencia', value: d.urgenciaLevel, sub: '' },
  ];

  metrics.forEach((m, i) => {
    const mx = 1.4 + i * 2.1;
    // Separator line between items
    if (i > 0) {
      slide.addShape('rect', { x: mx - 0.2, y: stripY + 0.15, w: 0.01, h: stripH - 0.3, fill: { color: `${WHITE}20` } });
    }
    slide.addText(m.label.toUpperCase(), {
      x: mx, y: stripY + 0.12, w: 1.8, h: 0.2,
      fontSize: 7, color: `${WHITE}80`, fontFace: 'Arial', bold: true,
    });
    slide.addText(m.value, {
      x: mx, y: stripY + 0.35, w: 1.8, h: 0.3,
      fontSize: 16, color: WHITE, fontFace: 'Arial', bold: true,
    });
    if (m.sub) {
      slide.addText(m.sub, {
        x: mx, y: stripY + 0.65, w: 1.8, h: 0.2,
        fontSize: 8, color: BRAND_ORANGE, fontFace: 'Arial',
      });
    }
  });

  // Footer
  slide.addShape('rect', { x: 0, y: FOOTER_Y, w: W, h: 0.015, fill: { color: BRAND_ORANGE } });
  slide.addText('Complement Consulting Group  |  Diagnostico Empresarial', {
    x: 1.2, y: FOOTER_Y + 0.05, w: 8, h: 0.25,
    fontSize: 7, color: `${WHITE}60`, fontFace: 'Arial',
  });
}

/* ══════════════════════════════════════════════════════
   SLIDE 2: Panorama Ejecutivo (dense overview)
   ══════════════════════════════════════════════════════ */

function addPanoramaSlide(pptx: PptxGenJS, d: SavedDiagnostic, companyName: string) {
  const slide = pptx.addSlide();
  const maturity = computeMaturityIndex(d);
  const narrative = generateDiagnosticNarrative(d, maturity);

  addSlideHeader(slide, 'Panorama Ejecutivo', 'Informacion general y contexto de la empresa');

  const startY = 1.05;

  // ── LEFT COLUMN: Company info cards (3x3 grid) ──
  const leftW = 7.0;
  const cardW = 2.15;
  const cardH = 0.72;
  const gap = 0.12;

  const items = [
    { label: 'Empresa', value: companyName },
    { label: 'Sector', value: sectorLabel(d.datosGenerales.sector) },
    { label: 'Tamano', value: `${d.companySize.size} (TMC: ${d.companySize.tmcScore})` },
    { label: 'Empleados', value: d.situacionActual.empleadosTotales?.toString() ?? '—' },
    { label: 'Emp. Familiares', value: d.situacionActual.empleadosFamiliares?.toString() ?? '—' },
    { label: 'Ventas Anuales', value: d.situacionActual.ventasAnualesMDP ? `$${d.situacionActual.ventasAnualesMDP} MDP` : '—' },
    { label: 'Empresa Familiar', value: familiarLabel(d.datosGenerales.empresaFamiliar) },
    { label: 'Respondente', value: d.datosGenerales.respondente || '—' },
    { label: 'Puesto', value: d.datosGenerales.puestoEmpresa || '—' },
    { label: 'Socios', value: d.situacionActual.socios || '—' },
    { label: 'Software', value: buildSoftwareLabel(d.datosGenerales) || '—' },
    { label: 'Productividad', value: d.companySize.productivityIndex ? `${d.companySize.productivityIndex.toFixed(1)} MDP/emp` : '—' },
  ];

  items.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = MARGIN_L + 0.15 + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    addInfoCard(slide, x, y, cardW, cardH, item.label, item.value);
  });

  // ── RIGHT COLUMN: Urgency + Key scores ──
  const rightX = MARGIN_L + 0.15 + leftW + 0.15;
  const rightW = CONTENT_W - leftW - 0.45;

  // Urgency box
  const urgY = startY;
  const urgH = 1.2;
  slide.addShape('roundRect', {
    x: rightX, y: urgY, w: rightW, h: urgH,
    rectRadius: 0.08, fill: { color: urgencyBg(d.urgenciaLevel) },
    line: { color: urgencyColor(d.urgenciaLevel), width: 0.8 },
  });
  slide.addText('URGENCIA', {
    x: rightX + 0.15, y: urgY + 0.08, w: rightW - 0.3, h: 0.2,
    fontSize: 7, color: urgencyColor(d.urgenciaLevel), fontFace: 'Arial', bold: true,
  });
  slide.addText(d.urgenciaLevel, {
    x: rightX + 0.15, y: urgY + 0.32, w: rightW - 0.3, h: 0.35,
    fontSize: 22, color: urgencyColor(d.urgenciaLevel), fontFace: 'Arial', bold: true,
  });
  const urgDesc = d.urgenciaSelection === 'muy_urgente'
    ? 'Crecimiento y armonia dependen de ello'
    : d.urgenciaSelection === 'necesario'
    ? 'Necesario, pero no urgente'
    : 'Deseable en algun momento';
  slide.addText(urgDesc, {
    x: rightX + 0.15, y: urgY + 0.72, w: rightW - 0.3, h: 0.35,
    fontSize: 8, color: INK, fontFace: 'Arial', wrap: true,
  });

  // Quick scores summary
  const scoresY = urgY + urgH + gap;
  const scoreItems = [
    { label: 'Prof.', value: Math.round(d.profesionalizacion.average), level: d.profesionalizacion.level },
    { label: 'Inst.', value: Math.round(d.institucionalizacion.average), level: d.institucionalizacion.level },
  ];

  scoreItems.forEach((s, i) => {
    const sy = scoresY + i * (0.7 + gap);
    slide.addShape('roundRect', {
      x: rightX, y: sy, w: rightW, h: 0.7,
      rectRadius: 0.06, fill: { color: WHITE },
      line: { color: LIGHT_BORDER, width: 0.5 },
    });
    slide.addText(`${s.label}`, {
      x: rightX + 0.1, y: sy + 0.05, w: 1.6, h: 0.2,
      fontSize: 7, color: MUTED, fontFace: 'Arial', bold: true,
    });
    slide.addText(`${s.value}`, {
      x: rightX + 0.1, y: sy + 0.22, w: 1, h: 0.35,
      fontSize: 20, color: NAVY, fontFace: 'Arial', bold: true,
    });
    slide.addText(s.level, {
      x: rightX + 1.1, y: sy + 0.28, w: rightW - 1.3, h: 0.25,
      fontSize: 9, color: levelColor(s.level), fontFace: 'Arial', bold: true,
    });
    // Mini bar
    addProgressBar(slide, rightX + 0.1, sy + 0.56, rightW - 0.2, 0.07, s.value, levelColor(s.level));
  });

  // ── BOTTOM: Narrative ──
  const narY = startY + 4 * (cardH + gap) + 0.05;
  if (narrative) {
    slide.addShape('roundRect', {
      x: MARGIN_L + 0.15, y: narY, w: CONTENT_W - 0.3, h: 1.55,
      rectRadius: 0.08, fill: { color: LIGHT_BG },
      line: { color: LIGHT_BORDER, width: 0.5 },
    });
    // Left accent
    slide.addShape('rect', { x: MARGIN_L + 0.17, y: narY + 0.06, w: 0.04, h: 1.43, fill: { color: BRAND_ORANGE } });

    slide.addText('NARRATIVA DEL DIAGNOSTICO', {
      x: MARGIN_L + 0.4, y: narY + 0.08, w: CONTENT_W - 0.7, h: 0.22,
      fontSize: 8, color: BRAND_ORANGE, fontFace: 'Arial', bold: true,
    });
    slide.addText(narrative, {
      x: MARGIN_L + 0.4, y: narY + 0.32, w: CONTENT_W - 0.7, h: 1.15,
      fontSize: 9.5, color: INK, fontFace: 'Arial', wrap: true, valign: 'top', lineSpacingMultiple: 1.15,
    });
  }

  // Business description (if present, add to narrative box or below)
  if (d.descripcionNegocio && !narrative) {
    slide.addText('Descripcion del Negocio', {
      x: MARGIN_L + 0.4, y: narY + 0.08, w: CONTENT_W - 0.7, h: 0.22,
      fontSize: 8, color: BRAND_ORANGE, fontFace: 'Arial', bold: true,
    });
    slide.addText(d.descripcionNegocio, {
      x: MARGIN_L + 0.4, y: narY + 0.32, w: CONTENT_W - 0.7, h: 1.1,
      fontSize: 9.5, color: INK, fontFace: 'Arial', wrap: true, valign: 'top',
    });
  }

  addFooter(slide, companyName, 2);
}

/* ══════════════════════════════════════════════════════
   SLIDE 3: Resultados Generales (Scores + Maturity + Growth)
   ══════════════════════════════════════════════════════ */

function addResultsSlide(pptx: PptxGenJS, d: SavedDiagnostic, companyName: string) {
  const slide = pptx.addSlide();
  const maturity = computeMaturityIndex(d);
  const growth = generateGrowthReadiness(d);

  addSlideHeader(slide, 'Resultados de Evaluacion', 'Calificaciones, madurez empresarial y preparacion para el crecimiento');

  const startY = 1.1;

  // ── TWO BIG SCORE CARDS ──
  const scoreCardW = 5.5;
  const scoreCardH = 2.5;

  const scoreData = [
    {
      label: 'Profesionalizacion',
      avg: d.profesionalizacion.average,
      level: d.profesionalizacion.level,
      answers: d.profesionalizacion.answers,
      category: 'profesionalizacion' as const,
    },
    {
      label: 'Institucionalizacion',
      avg: d.institucionalizacion.average,
      level: d.institucionalizacion.level,
      answers: d.institucionalizacion.answers,
      category: 'institucionalizacion' as const,
    },
  ];

  scoreData.forEach((s, i) => {
    const x = MARGIN_L + 0.15 + i * (scoreCardW + 0.25);
    const y = startY;
    const color = levelColor(s.level);

    slide.addShape('roundRect', {
      x, y, w: scoreCardW, h: scoreCardH,
      rectRadius: 0.1, fill: { color: WHITE },
      line: { color: LIGHT_BORDER, width: 0.7 },
      shadow: { type: 'outer', blur: 3, offset: 1, color: '00000010' },
    });

    // Header bar
    slide.addShape('rect', { x, y, w: scoreCardW, h: 0.42, fill: { color: NAVY } });
    slide.addText(s.label, {
      x: x + 0.2, y: y + 0.05, w: 3, h: 0.32,
      fontSize: 13, color: WHITE, fontFace: 'Arial', bold: true,
    });
    // Level badge in header
    slide.addShape('roundRect', {
      x: x + scoreCardW - 1.5, y: y + 0.06, w: 1.3, h: 0.3,
      rectRadius: 0.15, fill: { color: color + '30' },
    });
    slide.addText(s.level, {
      x: x + scoreCardW - 1.5, y: y + 0.06, w: 1.3, h: 0.3,
      fontSize: 10, color: WHITE, fontFace: 'Arial', bold: true, align: 'center',
    });

    // Big score number
    slide.addText(`${Math.round(s.avg)}`, {
      x: x + 0.2, y: y + 0.5, w: 1.4, h: 0.8,
      fontSize: 44, color: NAVY, fontFace: 'Arial', bold: true,
    });
    slide.addText('/100', {
      x: x + 1.5, y: y + 0.85, w: 0.8, h: 0.3,
      fontSize: 12, color: MUTED, fontFace: 'Arial',
    });

    // Progress bar
    addProgressBar(slide, x + 0.2, y + 1.35, scoreCardW - 0.4, 0.12, s.avg, color);

    // ── Mini criteria breakdown (top 3 best + worst 3) ──
    const sorted = [...s.answers].filter(a => a.rating >= 0).sort((a, b) => b.rating - a.rating);
    const top3 = sorted.slice(0, 3);
    const bottom3 = sorted.slice(-3).reverse();

    // Best criteria
    slide.addText('Fortalezas:', {
      x: x + 0.2, y: y + 1.55, w: 2.4, h: 0.2,
      fontSize: 7, color: SUCCESS, fontFace: 'Arial', bold: true,
    });
    top3.forEach((a, j) => {
      const cfg = ALL_CRITERIA.find(c => c.id === a.criterionId);
      if (!cfg) return;
      const ty = y + 1.75 + j * 0.22;
      slide.addText(`${cfg.shortLabel} (${a.rating}/10)`, {
        x: x + 0.3, y: ty, w: 2.3, h: 0.2,
        fontSize: 7, color: INK, fontFace: 'Arial',
      });
    });

    // Weak criteria
    slide.addText('A mejorar:', {
      x: x + 2.7, y: y + 1.55, w: 2.6, h: 0.2,
      fontSize: 7, color: ERROR, fontFace: 'Arial', bold: true,
    });
    bottom3.forEach((a, j) => {
      const cfg = ALL_CRITERIA.find(c => c.id === a.criterionId);
      if (!cfg) return;
      const ty = y + 1.75 + j * 0.22;
      slide.addText(`${cfg.shortLabel} (${a.rating}/10)`, {
        x: x + 2.8, y: ty, w: 2.5, h: 0.2,
        fontSize: 7, color: INK, fontFace: 'Arial',
      });
    });
  });

  // ── MATURITY INDEX (bottom-left) ──
  const matY = startY + scoreCardH + 0.2;
  const matW = 7.3;
  const matH = 2.8;

  slide.addShape('roundRect', {
    x: MARGIN_L + 0.15, y: matY, w: matW, h: matH,
    rectRadius: 0.1, fill: { color: WHITE },
    line: { color: LIGHT_BORDER, width: 0.7 },
    shadow: { type: 'outer', blur: 3, offset: 1, color: '00000010' },
  });

  slide.addShape('rect', {
    x: MARGIN_L + 0.15, y: matY, w: matW, h: 0.4,
    fill: { color: NAVY },
  });
  slide.addText('Indice de Madurez Empresarial', {
    x: MARGIN_L + 0.35, y: matY + 0.04, w: 4, h: 0.32,
    fontSize: 12, color: WHITE, fontFace: 'Arial', bold: true,
  });

  // Score + level
  slide.addText(`${Math.round(maturity.score)}`, {
    x: MARGIN_L + 0.35, y: matY + 0.5, w: 1.2, h: 0.7,
    fontSize: 38, color: NAVY, fontFace: 'Arial', bold: true,
  });
  slide.addText('/100', {
    x: MARGIN_L + 1.4, y: matY + 0.8, w: 0.6, h: 0.3,
    fontSize: 11, color: MUTED, fontFace: 'Arial',
  });

  // Level badge
  const matColor = levelColor(maturity.level);
  slide.addShape('roundRect', {
    x: MARGIN_L + 0.35, y: matY + 1.25, w: 1.4, h: 0.3,
    rectRadius: 0.15, fill: { color: matColor + '20' },
  });
  slide.addText(maturity.level, {
    x: MARGIN_L + 0.35, y: matY + 1.25, w: 1.4, h: 0.3,
    fontSize: 10, color: matColor, fontFace: 'Arial', bold: true, align: 'center',
  });

  // Contribution breakdown bars (stacked horizontally)
  const barStartX = MARGIN_L + 2.3;
  const barW = matW - 2.5;
  const contribs = [
    { label: 'Profesionalizacion', val: maturity.profContrib, max: 35, color: '3B82F6' },
    { label: 'Institucionalizacion', val: maturity.instContrib, max: 25, color: '8B5CF6' },
    { label: 'Gerencias', val: maturity.gerContrib, max: 20, color: BRAND_ORANGE },
    { label: 'Margenes', val: maturity.marginContrib, max: 20, color: SUCCESS },
  ];

  contribs.forEach((c, i) => {
    const cy = matY + 0.55 + i * 0.52;
    slide.addText(c.label, {
      x: barStartX, y: cy, w: 1.8, h: 0.18,
      fontSize: 7.5, color: INK, fontFace: 'Arial', bold: true,
    });
    // Bar track
    const trackX = barStartX + 1.9;
    const trackW = barW - 2.6;
    slide.addShape('roundRect', { x: trackX, y: cy + 0.02, w: trackW, h: 0.14, rectRadius: 0.07, fill: { color: LIGHT_BORDER } });
    const fillW = Math.max(0.07, (c.val / c.max) * trackW);
    slide.addShape('roundRect', { x: trackX, y: cy + 0.02, w: fillW, h: 0.14, rectRadius: 0.07, fill: { color: c.color } });
    // Value text
    slide.addText(`${Math.round(c.val)}/${c.max}`, {
      x: trackX + trackW + 0.08, y: cy, w: 0.6, h: 0.18,
      fontSize: 7.5, color: MUTED, fontFace: 'Arial',
    });
  });

  // ── GROWTH READINESS (bottom-right) ──
  const grX = MARGIN_L + 0.15 + matW + 0.2;
  const grW = CONTENT_W - matW - 0.5;

  slide.addShape('roundRect', {
    x: grX, y: matY, w: grW, h: matH,
    rectRadius: 0.1, fill: { color: WHITE },
    line: { color: LIGHT_BORDER, width: 0.7 },
    shadow: { type: 'outer', blur: 3, offset: 1, color: '00000010' },
  });

  // Header
  const grColor = growth.ready ? SUCCESS : WARN;
  slide.addShape('rect', { x: grX, y: matY, w: grW, h: 0.4, fill: { color: grColor } });
  slide.addText('Preparacion para Crecer', {
    x: grX + 0.15, y: matY + 0.04, w: grW - 0.3, h: 0.32,
    fontSize: 12, color: WHITE, fontFace: 'Arial', bold: true,
  });

  // Score circle representation
  slide.addText(`${growth.score}%`, {
    x: grX + 0.15, y: matY + 0.55, w: grW - 0.3, h: 0.6,
    fontSize: 32, color: grColor, fontFace: 'Arial', bold: true, align: 'center',
  });

  // Status text
  slide.addText(growth.ready ? 'LISTA PARA CRECER' : 'NECESITA CONSOLIDAR', {
    x: grX + 0.15, y: matY + 1.15, w: grW - 0.3, h: 0.3,
    fontSize: 10, color: grColor, fontFace: 'Arial', bold: true, align: 'center',
  });

  // Factors
  addProgressBar(slide, grX + 0.15, matY + 1.5, grW - 0.3, 0.1, growth.score, grColor);

  growth.factors.slice(0, 4).forEach((f, i) => {
    const fy = matY + 1.75 + i * 0.22;
    const isPositive = !f.startsWith('Falta') && !f.includes('insuficiente') && !f.includes('no formal');
    const dot = isPositive ? '●' : '○';
    const dotColor = isPositive ? SUCCESS : ERROR;
    slide.addText(`${dot} ${f}`, {
      x: grX + 0.15, y: fy, w: grW - 0.3, h: 0.2,
      fontSize: 7.5, color: dotColor === SUCCESS ? INK : ERROR, fontFace: 'Arial',
    });
  });

  addFooter(slide, companyName, 3);
}

/* ══════════════════════════════════════════════════════
   SLIDE 4 & 5: Criteria Detail (Prof + Inst)
   ══════════════════════════════════════════════════════ */

function addCriteriaSlide(
  pptx: PptxGenJS, d: SavedDiagnostic, companyName: string,
  category: 'prof' | 'inst', slideNum: number
) {
  const slide = pptx.addSlide();
  const isProf = category === 'prof';
  const title = isProf ? 'Criterios de Profesionalizacion' : 'Criterios de Institucionalizacion';
  const answers = isProf ? d.profesionalizacion.answers : d.institucionalizacion.answers;
  const score = isProf ? d.profesionalizacion : d.institucionalizacion;
  const subtitle = `Calificacion general: ${Math.round(score.average)}/100 — Nivel: ${score.level}`;

  addSlideHeader(slide, title, subtitle);

  // ── Summary stats strip ──
  const stripY = 1.0;
  const appliedCount = answers.filter(a => a.siNo).length;
  const avgRating = answers.filter(a => a.rating >= 0).reduce((sum, a) => sum + a.rating, 0) / (answers.filter(a => a.rating >= 0).length || 1);
  const lowCount = answers.filter(a => a.rating >= 0 && a.rating <= 3).length;
  const highCount = answers.filter(a => a.rating >= 7).length;

  const stats = [
    { label: 'Criterios Aplicados', value: `${appliedCount}/${answers.length}`, color: NAVY },
    { label: 'Calificacion Promedio', value: `${avgRating.toFixed(1)}/10`, color: ratingColor(avgRating) },
    { label: 'Criterios Altos (7+)', value: `${highCount}`, color: SUCCESS },
    { label: 'Criterios Bajos (0-3)', value: `${lowCount}`, color: lowCount > 0 ? ERROR : SUCCESS },
  ];

  const statW = 2.5;
  const statGap = 0.15;
  stats.forEach((s, i) => {
    const sx = MARGIN_L + 0.15 + i * (statW + statGap);
    slide.addShape('roundRect', {
      x: sx, y: stripY, w: statW, h: 0.55,
      rectRadius: 0.06, fill: { color: LIGHT_BG },
      line: { color: LIGHT_BORDER, width: 0.5 },
    });
    slide.addText(s.label.toUpperCase(), {
      x: sx + 0.1, y: stripY + 0.04, w: statW - 0.2, h: 0.18,
      fontSize: 6.5, color: MUTED, fontFace: 'Arial', bold: true,
    });
    slide.addText(s.value, {
      x: sx + 0.1, y: stripY + 0.22, w: statW - 0.2, h: 0.28,
      fontSize: 15, color: s.color, fontFace: 'Arial', bold: true,
    });
  });

  // ── Criteria table with visual bars ──
  const tableY = stripY + 0.7;
  const rows: PptxGenJS.TableRow[] = [];

  rows.push([
    { text: '#', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle' } },
    { text: 'Criterio', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'left', valign: 'middle' } },
    { text: 'Aplica', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle' } },
    { text: 'Calif.', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle' } },
    { text: 'Nivel', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle' } },
    { text: 'Comentario', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'left', valign: 'middle' } },
  ]);

  answers.forEach((a, i) => {
    const config = ALL_CRITERIA.find(c => c.id === a.criterionId);
    if (!config) return;
    const rl = a.rating >= 0 ? ratingLabel(a.rating) : '—';
    const rc = a.rating >= 0 ? ratingColor(a.rating) : MUTED;
    const ratingText = a.rating >= 0 ? `${a.rating}/10` : '—';
    const rowFill = i % 2 === 0 ? WHITE : LIGHT_BG;
    const comentario = a.comentario ? (a.comentario.length > 50 ? a.comentario.substring(0, 47) + '...' : a.comentario) : '—';

    rows.push([
      { text: `${i + 1}`, options: { fontSize: 8, color: MUTED, fill: { color: rowFill }, align: 'center', valign: 'middle' } },
      { text: config.shortLabel, options: { fontSize: 8, color: INK, fill: { color: rowFill }, align: 'left', valign: 'middle' } },
      { text: a.siNo ? 'Si' : 'No', options: { fontSize: 8, color: a.siNo ? SUCCESS : ERROR, bold: true, fill: { color: rowFill }, align: 'center', valign: 'middle' } },
      { text: ratingText, options: { fontSize: 8, color: rc, bold: true, fill: { color: rowFill }, align: 'center', valign: 'middle' } },
      { text: rl, options: { fontSize: 8, color: rc, bold: true, fill: { color: rowFill }, align: 'center', valign: 'middle' } },
      { text: comentario, options: { fontSize: 7, color: MUTED, fill: { color: rowFill }, align: 'left', valign: 'middle' } },
    ]);
  });

  slide.addTable(rows, {
    x: MARGIN_L + 0.15, y: tableY, w: CONTENT_W - 0.3,
    colW: [0.45, 3.2, 0.8, 0.9, 0.9, 5.58],
    border: { type: 'solid', color: LIGHT_BORDER, pt: 0.5 },
    rowH: 0.38,
    margin: [2, 5, 2, 5],
  });

  addFooter(slide, companyName, slideNum);
}

/* ══════════════════════════════════════════════════════
   SLIDE 6: Gerencias + Familia
   ══════════════════════════════════════════════════════ */

function addGerenciasSlide(pptx: PptxGenJS, d: SavedDiagnostic, companyName: string) {
  const slide = pptx.addSlide();
  const isFamily = d.datosGenerales.empresaFamiliar !== 'no';

  addSlideHeader(slide, 'Estructura Organizacional', 'Gerencias, puestos clave y analisis familiar');

  const startY = 1.05;

  // ── Summary stats ──
  const cubiertas = d.gerencias.filter(g => g.cubierto).length;
  const total = d.gerencias.length;
  const calificados = d.gerencias.filter(g => g.cubierto && g.calificado === 'si').length;
  const familiares = d.gerencias.filter(g => g.esFamiliar).length;
  const pct = Math.round((cubiertas / total) * 100);

  const summaryItems = [
    { label: 'Cubiertas', value: `${cubiertas}/${total} (${pct}%)`, color: pct >= 80 ? SUCCESS : pct >= 60 ? WARN : ERROR },
    { label: 'Calificados', value: `${calificados}/${cubiertas}`, color: calificados >= cubiertas * 0.7 ? SUCCESS : WARN },
    { label: 'Familiares', value: `${familiares}`, color: BRAND_ORANGE },
  ];

  summaryItems.forEach((s, i) => {
    const sx = MARGIN_L + 0.15 + i * 2.6;
    slide.addShape('roundRect', {
      x: sx, y: startY, w: 2.4, h: 0.55,
      rectRadius: 0.06, fill: { color: LIGHT_BG },
    });
    slide.addText(s.label.toUpperCase(), {
      x: sx + 0.1, y: startY + 0.04, w: 2.2, h: 0.18,
      fontSize: 6.5, color: MUTED, fontFace: 'Arial', bold: true,
    });
    slide.addText(s.value, {
      x: sx + 0.1, y: startY + 0.22, w: 2.2, h: 0.28,
      fontSize: 14, color: s.color, fontFace: 'Arial', bold: true,
    });
  });

  // Coverage bar
  addProgressBar(slide, MARGIN_L + 0.15, startY + 0.65, 7.7, 0.12, pct, pct >= 80 ? SUCCESS : pct >= 60 ? WARN : ERROR);

  // ── Gerencias table (more informative than cards) ──
  const tableY = startY + 0.95;
  const rows: PptxGenJS.TableRow[] = [];

  rows.push([
    { text: 'Area', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'left', valign: 'middle' } },
    { text: 'Estado', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle' } },
    { text: 'Calificacion', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle' } },
    { text: 'Antiguedad', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle' } },
    { text: 'Familiar', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle' } },
    { text: 'Rango Sueldo', options: { fontSize: 8, bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle' } },
  ]);

  d.gerencias.forEach((g, i) => {
    const rowFill = i % 2 === 0 ? WHITE : LIGHT_BG;
    const statusColor = g.cubierto ? SUCCESS : ERROR;
    const statusText = g.cubierto ? 'Cubierto' : 'Sin cubrir';
    const calColor = calificadoColor(g.calificado);

    rows.push([
      { text: g.area, options: { fontSize: 8.5, color: INK, bold: true, fill: { color: rowFill }, align: 'left', valign: 'middle' } },
      { text: statusText, options: { fontSize: 8, color: statusColor, bold: true, fill: { color: rowFill }, align: 'center', valign: 'middle' } },
      { text: calificadoLabel(g.calificado), options: { fontSize: 8, color: calColor, fill: { color: rowFill }, align: 'center', valign: 'middle' } },
      { text: g.antiguedad || '—', options: { fontSize: 8, color: MUTED, fill: { color: rowFill }, align: 'center', valign: 'middle' } },
      { text: g.esFamiliar ? 'Si' : 'No', options: { fontSize: 8, color: g.esFamiliar ? BRAND_ORANGE : MUTED, fill: { color: rowFill }, align: 'center', valign: 'middle' } },
      { text: g.rangoSueldo || '—', options: { fontSize: 8, color: MUTED, fill: { color: rowFill }, align: 'center', valign: 'middle' } },
    ]);
  });

  const tableW = isFamily ? 7.8 : CONTENT_W - 0.3;
  slide.addTable(rows, {
    x: MARGIN_L + 0.15, y: tableY, w: tableW,
    colW: isFamily ? [2.0, 1.1, 1.2, 1.1, 0.8, 1.6] : [2.8, 1.4, 1.8, 1.5, 1.0, 2.33],
    border: { type: 'solid', color: LIGHT_BORDER, pt: 0.5 },
    rowH: 0.4,
    margin: [2, 5, 2, 5],
  });

  // ── Family Analysis Panel (right side if family business) ──
  if (isFamily && d.analisisFamiliar) {
    const fa = d.analisisFamiliar;
    const faX = MARGIN_L + 0.15 + tableW + 0.2;
    const faW = CONTENT_W - tableW - 0.5;

    slide.addShape('roundRect', {
      x: faX, y: tableY, w: faW, h: 4.8,
      rectRadius: 0.08, fill: { color: ORANGE_LIGHT },
      line: { color: BRAND_ORANGE, width: 0.6 },
    });

    slide.addText('ANALISIS FAMILIAR', {
      x: faX + 0.12, y: tableY + 0.08, w: faW - 0.24, h: 0.25,
      fontSize: 8, color: BRAND_ORANGE, fontFace: 'Arial', bold: true,
    });

    const faItems = [
      { label: 'Gobierno Familiar', value: fa.gobiernoFamiliar || '—' },
      { label: 'Plan de Sucesion', value: fa.planSucesion || '—' },
      { label: 'Protocolo Familiar', value: fa.protocoloFamiliar || '—' },
      { label: 'Conflictos', value: fa.conflictosFamiliares || '—' },
      { label: 'Roles en Operacion', value: fa.rolesOperacion || '—' },
      { label: 'Profesionalizacion Fam.', value: fa.profesionalizacionFamiliares || '—' },
    ];

    faItems.forEach((item, i) => {
      const iy = tableY + 0.45 + i * 0.72;
      slide.addText(item.label.toUpperCase(), {
        x: faX + 0.12, y: iy, w: faW - 0.24, h: 0.18,
        fontSize: 6.5, color: BRAND_ORANGE, fontFace: 'Arial', bold: true,
      });
      slide.addText(item.value, {
        x: faX + 0.12, y: iy + 0.2, w: faW - 0.24, h: 0.45,
        fontSize: 8, color: INK, fontFace: 'Arial', wrap: true, valign: 'top',
      });
    });
  }

  // ── Additional employee info below table ──
  const empY = tableY + (d.gerencias.length + 1) * 0.4 + 0.2;
  if (empY < 6.5) {
    const empItems = [
      { label: 'Empleados Totales', value: d.situacionActual.empleadosTotales?.toString() ?? '—' },
      { label: 'Empleados Familiares', value: d.situacionActual.empleadosFamiliares?.toString() ?? '—' },
      { label: 'Socios', value: d.situacionActual.socios || '—' },
      { label: 'Familiares en Poder', value: d.situacionActual.familiaresEnPoder || '—' },
      { label: 'Sueldo Mas Alto', value: d.situacionActual.sueldoMasAlto ? `$${d.situacionActual.sueldoMasAlto}` : '—' },
    ];

    empItems.forEach((item, i) => {
      const ex = MARGIN_L + 0.15 + i * 1.6;
      if (ex + 1.5 < MARGIN_L + tableW) {
        addInfoCard(slide, ex, empY, 1.45, 0.6, item.label, item.value);
      }
    });
  }

  addFooter(slide, companyName, 6);
}

/* ══════════════════════════════════════════════════════
   SLIDE 7: Situacion Financiera (conditional)
   ══════════════════════════════════════════════════════ */

function addFinancialsSlide(pptx: PptxGenJS, d: SavedDiagnostic, companyName: string) {
  if (!d.marginEvaluation || !d.marginData?.tieneDatosFinancieros) return;

  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Situacion Financiera', 'Margenes vs. benchmarks de la industria');

  const bench = DEFAULT_INDUSTRY_BENCHMARKS[d.datosGenerales.sector as Sector];
  const startY = 1.1;

  const margins = [
    { label: 'Margen Bruto', data: d.marginEvaluation.margenBruto, benchmark: bench.margenBruto },
    { label: 'Margen Operativo', data: d.marginEvaluation.margenOperativo, benchmark: bench.margenOperativo },
    { label: 'Margen Neto', data: d.marginEvaluation.margenNeto, benchmark: bench.margenNeto },
  ];

  // ── Three big margin cards ──
  const cardW = 3.7;
  const cardH = 3.5;
  const gap = 0.25;

  margins.forEach((m, i) => {
    const x = MARGIN_L + 0.15 + i * (cardW + gap);
    const y = startY;
    const color = MARGIN_COLORS[m.data.level];

    slide.addShape('roundRect', {
      x, y, w: cardW, h: cardH,
      rectRadius: 0.1, fill: { color: WHITE },
      line: { color: LIGHT_BORDER, width: 0.7 },
      shadow: { type: 'outer', blur: 3, offset: 1, color: '00000010' },
    });

    // Header
    slide.addShape('rect', { x, y, w: cardW, h: 0.4, fill: { color: NAVY } });
    slide.addText(m.label, {
      x: x + 0.2, y: y + 0.04, w: cardW - 0.4, h: 0.32,
      fontSize: 12, color: WHITE, fontFace: 'Arial', bold: true,
    });

    // Big value
    const valText = m.data.value !== null ? `${m.data.value}%` : '—';
    slide.addText(valText, {
      x: x + 0.2, y: y + 0.55, w: cardW - 0.4, h: 0.7,
      fontSize: 36, color, fontFace: 'Arial', bold: true, align: 'center',
    });

    // Level badge
    slide.addShape('roundRect', {
      x: x + 0.5, y: y + 1.3, w: cardW - 1.0, h: 0.32,
      rectRadius: 0.16, fill: { color: color + '18' },
    });
    slide.addText(MARGIN_LABELS[m.data.level], {
      x: x + 0.5, y: y + 1.3, w: cardW - 1.0, h: 0.32,
      fontSize: 10, color, fontFace: 'Arial', bold: true, align: 'center',
    });

    // ── Benchmark comparison ──
    const compY = y + 1.85;
    slide.addShape('rect', { x: x + 0.2, y: compY, w: cardW - 0.4, h: 0.01, fill: { color: LIGHT_BORDER } });

    slide.addText('COMPARATIVO INDUSTRIA', {
      x: x + 0.2, y: compY + 0.08, w: cardW - 0.4, h: 0.2,
      fontSize: 7, color: MUTED, fontFace: 'Arial', bold: true, align: 'center',
    });

    // Benchmark value
    slide.addText(`Benchmark ${sectorLabel(d.datosGenerales.sector)}: ${bench ? m.benchmark : '—'}%`, {
      x: x + 0.2, y: compY + 0.3, w: cardW - 0.4, h: 0.2,
      fontSize: 9, color: INK, fontFace: 'Arial', align: 'center',
    });

    // Difference
    if (m.data.value !== null) {
      const diff = m.data.value - m.benchmark;
      const diffSign = diff >= 0 ? '+' : '';
      const diffColor = diff >= 0 ? SUCCESS : ERROR;
      slide.addText(`${diffSign}${diff.toFixed(1)}pp vs. industria`, {
        x: x + 0.2, y: compY + 0.55, w: cardW - 0.4, h: 0.2,
        fontSize: 10, color: diffColor, fontFace: 'Arial', bold: true, align: 'center',
      });

      // Visual comparison bar
      const barY = compY + 0.85;
      const barCenter = x + cardW / 2;
      const maxBar = 1.2;

      // Center line (benchmark)
      slide.addShape('rect', { x: barCenter - 0.01, y: barY, w: 0.02, h: 0.25, fill: { color: INK } });
      slide.addText('Benchmark', { x: barCenter - 0.5, y: barY + 0.25, w: 1, h: 0.15, fontSize: 6, color: MUTED, fontFace: 'Arial', align: 'center' });

      // Diff bar
      const barWidth = Math.min(maxBar, Math.abs(diff) / 20 * maxBar);
      if (diff >= 0) {
        slide.addShape('roundRect', { x: barCenter, y: barY + 0.03, w: barWidth, h: 0.19, rectRadius: 0.03, fill: { color: SUCCESS + '60' } });
      } else {
        slide.addShape('roundRect', { x: barCenter - barWidth, y: barY + 0.03, w: barWidth, h: 0.19, rectRadius: 0.03, fill: { color: ERROR + '60' } });
      }
    }

    // Tolerance info
    slide.addText(`Tolerancia: ±${bench.tolerancia}%  |  Critico: -${bench.criticoUmbral}%`, {
      x: x + 0.2, y: y + cardH - 0.35, w: cardW - 0.4, h: 0.2,
      fontSize: 6.5, color: MUTED, fontFace: 'Arial', align: 'center',
    });
  });

  // ── Financial health summary ──
  const summY = startY + cardH + 0.3;
  const criticalCount = (['margenBruto', 'margenOperativo', 'margenNeto'] as const)
    .filter(k => d.marginEvaluation![k].level === 'critico').length;
  const aboveCount = (['margenBruto', 'margenOperativo', 'margenNeto'] as const)
    .filter(k => d.marginEvaluation![k].level === 'arriba_industria').length;

  let healthText: string;
  let healthColor: string;
  if (criticalCount >= 2) {
    healthText = 'ALERTA: Multiples margenes en nivel critico. Se requiere un analisis urgente de estructura de costos y estrategia de precios para asegurar la viabilidad del negocio.';
    healthColor = ERROR;
  } else if (criticalCount === 1) {
    healthText = 'ATENCION: Un margen en nivel critico. Es importante analizar la causa raiz y tomar acciones correctivas a corto plazo.';
    healthColor = WARN;
  } else if (aboveCount >= 2) {
    healthText = 'POSITIVO: La mayoria de los margenes estan por encima del promedio de la industria. La empresa tiene una posicion financiera saludable para invertir en crecimiento.';
    healthColor = SUCCESS;
  } else {
    healthText = 'Los margenes se encuentran dentro de los rangos esperados para la industria. Se recomienda monitorear continuamente y buscar optimizaciones incrementales.';
    healthColor = MID;
  }

  slide.addShape('roundRect', {
    x: MARGIN_L + 0.15, y: summY, w: CONTENT_W - 0.3, h: 0.7,
    rectRadius: 0.06, fill: { color: healthColor + '10' },
    line: { color: healthColor, width: 0.6 },
  });
  slide.addShape('rect', { x: MARGIN_L + 0.17, y: summY + 0.06, w: 0.04, h: 0.58, fill: { color: healthColor } });
  slide.addText(healthText, {
    x: MARGIN_L + 0.4, y: summY + 0.05, w: CONTENT_W - 0.7, h: 0.6,
    fontSize: 9, color: INK, fontFace: 'Arial', wrap: true, valign: 'middle',
  });

  addFooter(slide, companyName, 7);
}

/* ══════════════════════════════════════════════════════
   SLIDE 8: Risks & Opportunities (combined)
   ══════════════════════════════════════════════════════ */

function addRisksOpportunitiesSlide(pptx: PptxGenJS, d: SavedDiagnostic, companyName: string) {
  const risks = computeRiskProfile(d);
  const opportunities = d.opportunityAreas;
  if (risks.length === 0 && opportunities.length === 0) return;

  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Mapa de Riesgos y Oportunidades', 'Perfil de riesgo identificado y areas de servicio prioritarias');

  const startY = 1.05;
  const halfW = (CONTENT_W - 0.6) / 2;

  // ══ LEFT: RISKS ══
  if (risks.length > 0) {
    const riskX = MARGIN_L + 0.15;

    // Section header
    slide.addShape('roundRect', {
      x: riskX, y: startY, w: halfW, h: 0.4,
      rectRadius: 0.06, fill: { color: ERROR_BG },
    });
    slide.addText(`PERFIL DE RIESGO  (${risks.length} riesgos identificados)`, {
      x: riskX + 0.12, y: startY + 0.05, w: halfW - 0.24, h: 0.3,
      fontSize: 9, color: ERROR, fontFace: 'Arial', bold: true,
    });

    // Count by severity
    const critCount = risks.filter(r => r.severity === 'critico').length;
    const highCount = risks.filter(r => r.severity === 'alto').length;
    const modCount = risks.filter(r => r.severity === 'moderado').length;

    const sevY = startY + 0.5;
    const sevItems = [
      { label: 'Criticos', count: critCount, color: ERROR },
      { label: 'Altos', count: highCount, color: WARN },
      { label: 'Moderados', count: modCount, color: MID },
    ];
    sevItems.forEach((s, i) => {
      const sx = riskX + i * 1.9;
      slide.addShape('ellipse', { x: sx + 0.05, y: sevY + 0.04, w: 0.12, h: 0.12, fill: { color: s.color } });
      slide.addText(`${s.count} ${s.label}`, {
        x: sx + 0.22, y: sevY, w: 1.5, h: 0.2,
        fontSize: 8, color: INK, fontFace: 'Arial',
      });
    });

    // Risk cards
    risks.forEach((r, i) => {
      const ry = sevY + 0.35 + i * 0.82;
      const sevColor = r.severity === 'critico' ? ERROR : r.severity === 'alto' ? WARN : MID;
      const sevBg = r.severity === 'critico' ? ERROR_BG : r.severity === 'alto' ? WARN_BG : MID_BG;

      slide.addShape('roundRect', {
        x: riskX, y: ry, w: halfW, h: 0.72,
        rectRadius: 0.06, fill: { color: WHITE },
        line: { color: LIGHT_BORDER, width: 0.5 },
      });
      // Severity indicator
      slide.addShape('rect', { x: riskX + 0.02, y: ry + 0.06, w: 0.04, h: 0.6, fill: { color: sevColor } });

      // Severity badge
      const sevLabel = r.severity === 'critico' ? 'CRITICO' : r.severity === 'alto' ? 'ALTO' : 'MODERADO';
      slide.addShape('roundRect', {
        x: riskX + 0.15, y: ry + 0.06, w: 0.75, h: 0.2,
        rectRadius: 0.1, fill: { color: sevBg },
      });
      slide.addText(sevLabel, {
        x: riskX + 0.15, y: ry + 0.06, w: 0.75, h: 0.2,
        fontSize: 6, color: sevColor, fontFace: 'Arial', bold: true, align: 'center',
      });

      // Risk name
      slide.addText(r.risk, {
        x: riskX + 1.0, y: ry + 0.04, w: halfW - 1.15, h: 0.22,
        fontSize: 8.5, color: NAVY, fontFace: 'Arial', bold: true,
      });

      // Impact
      slide.addText(r.impact, {
        x: riskX + 0.15, y: ry + 0.3, w: halfW - 0.3, h: 0.38,
        fontSize: 7.5, color: MUTED, fontFace: 'Arial', wrap: true, valign: 'top',
      });
    });
  }

  // ══ RIGHT: OPPORTUNITIES ══
  if (opportunities.length > 0) {
    const oppX = MARGIN_L + 0.15 + halfW + 0.3;

    // Section header
    slide.addShape('roundRect', {
      x: oppX, y: startY, w: halfW, h: 0.4,
      rectRadius: 0.06, fill: { color: SUCCESS_BG },
    });
    slide.addText(`AREAS DE OPORTUNIDAD  (${opportunities.length} areas)`, {
      x: oppX + 0.12, y: startY + 0.05, w: halfW - 0.24, h: 0.3,
      fontSize: 9, color: SUCCESS, fontFace: 'Arial', bold: true,
    });

    // Opportunity cards
    opportunities.forEach((area, i) => {
      const oy = startY + 0.5 + i * 0.92;
      if (oy > 6.3) return; // Don't overflow

      const priColor = area.priority === 'alta' ? ERROR : area.priority === 'media' ? WARN : MID;
      const priLabel = area.priority === 'alta' ? 'ALTA' : area.priority === 'media' ? 'MEDIA' : 'BAJA';

      slide.addShape('roundRect', {
        x: oppX, y: oy, w: halfW, h: 0.82,
        rectRadius: 0.06, fill: { color: WHITE },
        line: { color: LIGHT_BORDER, width: 0.5 },
      });
      // Priority indicator
      slide.addShape('rect', { x: oppX + 0.02, y: oy + 0.06, w: 0.04, h: 0.7, fill: { color: priColor } });

      // Number badge
      slide.addShape('ellipse', { x: oppX + 0.14, y: oy + 0.08, w: 0.3, h: 0.3, fill: { color: NAVY } });
      slide.addText(`${i + 1}`, {
        x: oppX + 0.14, y: oy + 0.08, w: 0.3, h: 0.3,
        fontSize: 10, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle',
      });

      // Service area name + icon
      slide.addText(`${area.serviceArea.icon} ${area.serviceArea.name}`, {
        x: oppX + 0.52, y: oy + 0.06, w: halfW - 1.5, h: 0.25,
        fontSize: 9.5, color: NAVY, fontFace: 'Arial', bold: true,
      });

      // Priority badge
      slide.addShape('roundRect', {
        x: oppX + halfW - 0.9, y: oy + 0.08, w: 0.75, h: 0.22,
        rectRadius: 0.11, fill: { color: priColor + '20' },
      });
      slide.addText(priLabel, {
        x: oppX + halfW - 0.9, y: oy + 0.08, w: 0.75, h: 0.22,
        fontSize: 7, color: priColor, fontFace: 'Arial', bold: true, align: 'center',
      });

      // Triggering criteria
      const criterios = area.triggeringCriteria.map((c: { text: string }) => c.text).join(', ');
      slide.addText(criterios, {
        x: oppX + 0.15, y: oy + 0.38, w: halfW - 0.3, h: 0.38,
        fontSize: 7, color: MUTED, fontFace: 'Arial', wrap: true, valign: 'top',
      });
    });
  }

  addFooter(slide, companyName, 8);
}

/* ══════════════════════════════════════════════════════
   SLIDE 9: Retos & Recomendaciones (combined)
   ══════════════════════════════════════════════════════ */

function addRetosRecsSlide(pptx: PptxGenJS, d: SavedDiagnostic, companyName: string) {
  const maturity = computeMaturityIndex(d);
  const risks = computeRiskProfile(d);
  const recs = generateSmartRecommendations(d, maturity, risks);
  const retos = d.retos.filter(r => r);
  if (retos.length === 0 && recs.length === 0) return;

  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Retos y Plan de Accion', 'Desafios identificados y recomendaciones estrategicas');

  const startY = 1.05;
  const halfW = (CONTENT_W - 0.6) / 2;

  // ══ LEFT: RETOS ══
  if (retos.length > 0) {
    const retX = MARGIN_L + 0.15;

    slide.addShape('roundRect', {
      x: retX, y: startY, w: halfW, h: 0.35,
      rectRadius: 0.06, fill: { color: WARN_BG },
    });
    slide.addText(`RETOS PRINCIPALES  (${retos.length})`, {
      x: retX + 0.12, y: startY + 0.04, w: halfW - 0.24, h: 0.27,
      fontSize: 9, color: WARN, fontFace: 'Arial', bold: true,
    });

    retos.forEach((reto, i) => {
      const ry = startY + 0.5 + i * 1.15;
      if (ry > 6.0) return;

      slide.addShape('roundRect', {
        x: retX, y: ry, w: halfW, h: 1.0,
        rectRadius: 0.06, fill: { color: WHITE },
        line: { color: LIGHT_BORDER, width: 0.5 },
      });

      // Number badge
      slide.addShape('roundRect', { x: retX + 0.12, y: ry + 0.12, w: 0.4, h: 0.4, rectRadius: 0.2, fill: { color: BRAND_ORANGE } });
      slide.addText(`${i + 1}`, {
        x: retX + 0.12, y: ry + 0.12, w: 0.4, h: 0.4,
        fontSize: 14, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle',
      });

      // Text
      slide.addText(reto, {
        x: retX + 0.65, y: ry + 0.08, w: halfW - 0.85, h: 0.84,
        fontSize: 9.5, color: INK, fontFace: 'Arial', valign: 'middle', wrap: true,
      });
    });
  }

  // ══ RIGHT: RECOMMENDATIONS ══
  if (recs.length > 0) {
    const recX = MARGIN_L + 0.15 + halfW + 0.3;

    slide.addShape('roundRect', {
      x: recX, y: startY, w: halfW, h: 0.35,
      rectRadius: 0.06, fill: { color: SUCCESS_BG },
    });
    slide.addText(`RECOMENDACIONES  (${recs.length})`, {
      x: recX + 0.12, y: startY + 0.04, w: halfW - 0.24, h: 0.27,
      fontSize: 9, color: SUCCESS, fontFace: 'Arial', bold: true,
    });

    recs.forEach((rec, i) => {
      const ry = startY + 0.5 + i * 0.88;
      if (ry > 6.0) return;

      slide.addShape('roundRect', {
        x: recX, y: ry, w: halfW, h: 0.78,
        rectRadius: 0.06, fill: { color: i < 2 ? `${NAVY}08` : WHITE },
        line: { color: LIGHT_BORDER, width: 0.5 },
      });

      // Priority indicator (first 2 are most important)
      const dotColor = i < 2 ? ERROR : i < 4 ? WARN : MID;
      slide.addShape('ellipse', { x: recX + 0.1, y: ry + 0.12, w: 0.22, h: 0.22, fill: { color: dotColor } });
      slide.addText(`${i + 1}`, {
        x: recX + 0.1, y: ry + 0.12, w: 0.22, h: 0.22,
        fontSize: 8, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle',
      });

      // Text
      slide.addText(rec, {
        x: recX + 0.4, y: ry + 0.05, w: halfW - 0.55, h: 0.68,
        fontSize: 8, color: INK, fontFace: 'Arial', valign: 'middle', wrap: true, lineSpacingMultiple: 1.1,
      });
    });
  }

  addFooter(slide, companyName, 9);
}

/* ══════════════════════════════════════════════════════
   SLIDE 10: Resumen Ejecutivo (dashboard)
   ══════════════════════════════════════════════════════ */

function addExecutiveSummarySlide(pptx: PptxGenJS, d: SavedDiagnostic, companyName: string) {
  const slide = pptx.addSlide();
  const maturity = computeMaturityIndex(d);
  const growth = generateGrowthReadiness(d);
  const risks = computeRiskProfile(d);

  addSlideHeader(slide, 'Resumen Ejecutivo', 'Vista consolidada de resultados y siguientes pasos');

  const startY = 1.05;

  // ── TOP ROW: 5 KPI cards ──
  const kpiW = 2.1;
  const kpiH = 1.3;
  const kpiGap = 0.18;

  const kpis = [
    {
      label: 'Madurez',
      value: `${Math.round(maturity.score)}`,
      sub: maturity.level,
      color: levelColor(maturity.level),
      bg: levelBg(maturity.level),
    },
    {
      label: 'Profesionalizacion',
      value: `${Math.round(d.profesionalizacion.average)}`,
      sub: d.profesionalizacion.level,
      color: levelColor(d.profesionalizacion.level),
      bg: levelBg(d.profesionalizacion.level),
    },
    {
      label: 'Institucionalizacion',
      value: `${Math.round(d.institucionalizacion.average)}`,
      sub: d.institucionalizacion.level,
      color: levelColor(d.institucionalizacion.level),
      bg: levelBg(d.institucionalizacion.level),
    },
    {
      label: 'Crecimiento',
      value: `${growth.score}%`,
      sub: growth.ready ? 'Lista' : 'Consolidar',
      color: growth.ready ? SUCCESS : WARN,
      bg: growth.ready ? SUCCESS_BG : WARN_BG,
    },
    {
      label: 'Riesgos',
      value: `${risks.length}`,
      sub: `${risks.filter(r => r.severity === 'critico').length} criticos`,
      color: risks.filter(r => r.severity === 'critico').length > 0 ? ERROR : risks.length > 3 ? WARN : SUCCESS,
      bg: risks.filter(r => r.severity === 'critico').length > 0 ? ERROR_BG : risks.length > 3 ? WARN_BG : SUCCESS_BG,
    },
  ];

  kpis.forEach((k, i) => {
    const x = MARGIN_L + 0.15 + i * (kpiW + kpiGap);
    const y = startY;

    slide.addShape('roundRect', {
      x, y, w: kpiW, h: kpiH,
      rectRadius: 0.08, fill: { color: k.bg },
      line: { color: k.color + '40', width: 0.7 },
    });
    slide.addText(k.label.toUpperCase(), {
      x: x + 0.1, y: y + 0.08, w: kpiW - 0.2, h: 0.2,
      fontSize: 7, color: k.color, fontFace: 'Arial', bold: true,
    });
    slide.addText(k.value, {
      x: x + 0.1, y: y + 0.3, w: kpiW - 0.2, h: 0.55,
      fontSize: 28, color: k.color, fontFace: 'Arial', bold: true, align: 'center',
    });
    slide.addText(k.sub, {
      x: x + 0.1, y: y + 0.9, w: kpiW - 0.2, h: 0.25,
      fontSize: 9, color: k.color, fontFace: 'Arial', bold: true, align: 'center',
    });
  });

  // ── MIDDLE: Gerencias + Financial summary ──
  const midY = startY + kpiH + 0.25;
  const midH = 1.6;

  // Gerencias summary card
  const cubiertas = d.gerencias.filter(g => g.cubierto).length;
  const total = d.gerencias.length;
  const gerPct = Math.round((cubiertas / total) * 100);

  slide.addShape('roundRect', {
    x: MARGIN_L + 0.15, y: midY, w: 5.5, h: midH,
    rectRadius: 0.08, fill: { color: WHITE },
    line: { color: LIGHT_BORDER, width: 0.5 },
  });
  slide.addText('ESTRUCTURA ORGANIZACIONAL', {
    x: MARGIN_L + 0.35, y: midY + 0.06, w: 5, h: 0.2,
    fontSize: 8, color: NAVY, fontFace: 'Arial', bold: true,
  });
  slide.addText(`${cubiertas}/${total} gerencias cubiertas (${gerPct}%)`, {
    x: MARGIN_L + 0.35, y: midY + 0.3, w: 5, h: 0.2,
    fontSize: 10, color: INK, fontFace: 'Arial',
  });
  addProgressBar(slide, MARGIN_L + 0.35, midY + 0.55, 4.9, 0.1, gerPct, gerPct >= 80 ? SUCCESS : gerPct >= 60 ? WARN : ERROR);

  // List uncovered positions
  const uncovered = d.gerencias.filter(g => !g.cubierto);
  if (uncovered.length > 0) {
    slide.addText('Sin cubrir: ' + uncovered.map(g => g.area).join(', '), {
      x: MARGIN_L + 0.35, y: midY + 0.75, w: 5, h: 0.2,
      fontSize: 8, color: ERROR, fontFace: 'Arial',
    });
  }

  // Socios breakdown
  const socioDetails = d.situacionActual.sociosDetalle;
  if (socioDetails && socioDetails.length > 0) {
    const famSocios = socioDetails.filter(s => s.esFamiliar).length;
    slide.addText(`Socios: ${socioDetails.length} (${famSocios} familiares)`, {
      x: MARGIN_L + 0.35, y: midY + 1.0, w: 5, h: 0.2,
      fontSize: 8, color: INK, fontFace: 'Arial',
    });
  }

  // Financial summary card
  if (d.marginEvaluation && d.marginData?.tieneDatosFinancieros) {
    slide.addShape('roundRect', {
      x: MARGIN_L + 5.85, y: midY, w: CONTENT_W - 6, h: midH,
      rectRadius: 0.08, fill: { color: WHITE },
      line: { color: LIGHT_BORDER, width: 0.5 },
    });
    slide.addText('SITUACION FINANCIERA', {
      x: MARGIN_L + 6.05, y: midY + 0.06, w: CONTENT_W - 6.4, h: 0.2,
      fontSize: 8, color: NAVY, fontFace: 'Arial', bold: true,
    });

    const marginItems = [
      { label: 'M. Bruto', data: d.marginEvaluation.margenBruto },
      { label: 'M. Operativo', data: d.marginEvaluation.margenOperativo },
      { label: 'M. Neto', data: d.marginEvaluation.margenNeto },
    ];

    marginItems.forEach((m, i) => {
      const my = midY + 0.35 + i * 0.38;
      const mc = MARGIN_COLORS[m.data.level];
      slide.addText(m.label, {
        x: MARGIN_L + 6.05, y: my, w: 1.5, h: 0.3,
        fontSize: 8, color: INK, fontFace: 'Arial',
      });
      slide.addText(m.data.value !== null ? `${m.data.value}%` : '—', {
        x: MARGIN_L + 7.5, y: my, w: 1, h: 0.3,
        fontSize: 10, color: mc, fontFace: 'Arial', bold: true,
      });
      slide.addText(MARGIN_LABELS[m.data.level], {
        x: MARGIN_L + 8.5, y: my, w: 2.5, h: 0.3,
        fontSize: 8, color: mc, fontFace: 'Arial',
      });
    });
  }

  // ── BOTTOM: Key takeaways ──
  const takeY = midY + midH + 0.2;
  const narrative = generateDiagnosticNarrative(d, maturity);
  const recs = generateSmartRecommendations(d, maturity, risks);

  slide.addShape('roundRect', {
    x: MARGIN_L + 0.15, y: takeY, w: CONTENT_W - 0.3, h: 2.4,
    rectRadius: 0.08, fill: { color: LIGHT_BG },
    line: { color: LIGHT_BORDER, width: 0.5 },
  });

  // Left section: Summary
  slide.addShape('rect', { x: MARGIN_L + 0.17, y: takeY + 0.06, w: 0.04, h: 2.28, fill: { color: BRAND_ORANGE } });

  slide.addText('CONCLUSION', {
    x: MARGIN_L + 0.4, y: takeY + 0.06, w: 5.5, h: 0.22,
    fontSize: 8, color: BRAND_ORANGE, fontFace: 'Arial', bold: true,
  });
  slide.addText(narrative, {
    x: MARGIN_L + 0.4, y: takeY + 0.3, w: 5.5, h: 1.0,
    fontSize: 8.5, color: INK, fontFace: 'Arial', wrap: true, valign: 'top', lineSpacingMultiple: 1.15,
  });

  // Right section: Top 3 recommendations
  slide.addText('PROXIMOS PASOS', {
    x: MARGIN_L + 6.2, y: takeY + 0.06, w: 5.5, h: 0.22,
    fontSize: 8, color: BRAND_ORANGE, fontFace: 'Arial', bold: true,
  });

  recs.slice(0, 3).forEach((rec, i) => {
    const ry = takeY + 0.35 + i * 0.65;
    slide.addShape('ellipse', {
      x: MARGIN_L + 6.2, y: ry + 0.02, w: 0.18, h: 0.18,
      fill: { color: BRAND_ORANGE },
    });
    slide.addText(`${i + 1}`, {
      x: MARGIN_L + 6.2, y: ry + 0.02, w: 0.18, h: 0.18,
      fontSize: 7, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle',
    });
    slide.addText(rec, {
      x: MARGIN_L + 6.5, y: ry, w: CONTENT_W - 6.7, h: 0.6,
      fontSize: 7.5, color: INK, fontFace: 'Arial', wrap: true, valign: 'top', lineSpacingMultiple: 1.05,
    });
  });

  addFooter(slide, companyName, 10);
}

/* ══════════════════════════════════════════════════════
   SLIDE 11: Closing
   ══════════════════════════════════════════════════════ */

function addClosingSlide(pptx: PptxGenJS, companyName: string) {
  const slide = pptx.addSlide();
  slide.background = { fill: NAVY };

  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.06, fill: { color: BRAND_ORANGE } });
  slide.addShape('rect', { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: BRAND_ORANGE } });

  slide.addText('Gracias', {
    x: 1.2, y: 2.0, w: 10, h: 1,
    fontSize: 44, color: WHITE, fontFace: 'Arial', bold: true,
  });

  slide.addText(companyName, {
    x: 1.2, y: 3.0, w: 10, h: 0.6,
    fontSize: 20, color: BRAND_ORANGE, fontFace: 'Arial', bold: true,
  });

  slide.addShape('rect', { x: 1.2, y: 3.9, w: 2.5, h: 0.03, fill: { color: BRAND_ORANGE } });

  slide.addText('Complement Consulting Group\nDiagnostico Empresarial', {
    x: 1.2, y: 4.2, w: 5, h: 0.7,
    fontSize: 12, color: `${WHITE}80`, fontFace: 'Arial', lineSpacingMultiple: 1.4,
  });

  // Bottom info strip
  slide.addShape('roundRect', {
    x: 1.2, y: 5.4, w: 10.5, h: 0.6,
    rectRadius: 0.06, fill: { color: NAVY_LIGHT },
  });
  slide.addText('Este diagnostico fue generado como herramienta de apoyo para la sesion de consultoria.  Los resultados se basan en la informacion proporcionada por la empresa.', {
    x: 1.5, y: 5.45, w: 10, h: 0.5,
    fontSize: 8, color: `${WHITE}70`, fontFace: 'Arial', wrap: true, valign: 'middle',
  });

  slide.addShape('rect', { x: 0, y: FOOTER_Y, w: W, h: 0.015, fill: { color: BRAND_ORANGE } });
}

/* ══════════════════════════════════════════════════════
   Main export function
   ══════════════════════════════════════════════════════ */

export async function exportToPptx(d: SavedDiagnostic): Promise<void> {
  const companyName = d.datosGenerales.nombreComercial || 'Cliente';

  const pptx = new PptxGenJS();
  pptx.author = 'Complement Consulting Group';
  pptx.company = 'Complement Consulting Group';
  pptx.subject = `Diagnostico Empresarial - ${companyName}`;
  pptx.title = `Diagnostico - ${companyName}`;
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

  // Build slides
  addTitleSlide(pptx, d, companyName);                      // 1
  addPanoramaSlide(pptx, d, companyName);                   // 2
  addResultsSlide(pptx, d, companyName);                    // 3
  addCriteriaSlide(pptx, d, companyName, 'prof', 4);        // 4
  addCriteriaSlide(pptx, d, companyName, 'inst', 5);        // 5
  addGerenciasSlide(pptx, d, companyName);                  // 6
  addFinancialsSlide(pptx, d, companyName);                 // 7 (conditional)
  addRisksOpportunitiesSlide(pptx, d, companyName);         // 8
  addRetosRecsSlide(pptx, d, companyName);                  // 9
  addExecutiveSummarySlide(pptx, d, companyName);           // 10
  addClosingSlide(pptx, companyName);                       // 11

  // Download
  const safeName = companyName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').trim().replace(/\s+/g, '_');
  await pptx.writeFile({ fileName: `Diagnostico_${safeName}.pptx` });
}
