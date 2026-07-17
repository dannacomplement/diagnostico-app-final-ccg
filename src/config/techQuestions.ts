import type { LucideIcon } from 'lucide-react';
import { Monitor, Globe, Settings, BarChart3, Bot, Lock, Brain } from 'lucide-react';
import type {
  TechToolsData,
  TechDigitalPresence,
  TechAutomation,
  TechDataAnalytics,
  TechAIAdoption,
  TechSecurity,
  TechCulture,
  TechMaturityLevel,
} from '../lib/types';

/* ── Area Configuration ──────────────────────────────── */

export interface TechAreaConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  weight: number; // contribution to maturity score (sum = 100)
}

export const TECH_AREAS: TechAreaConfig[] = [
  { id: 'tools', name: 'Herramientas y Software', icon: Monitor, description: 'ERP, CRM, Excel y herramientas de gestión', weight: 15 },
  { id: 'digital_presence', name: 'Presencia Digital', icon: Globe, description: 'Website, e-commerce y redes sociales', weight: 10 },
  { id: 'automation', name: 'Automatización', icon: Settings, description: 'Automatización de procesos y operaciones', weight: 20 },
  { id: 'data_analytics', name: 'Datos y Analítica', icon: BarChart3, description: 'Uso de datos, KPIs y business intelligence', weight: 20 },
  { id: 'ai', name: 'Inteligencia Artificial', icon: Bot, description: 'Adopción de IA y tecnologías emergentes', weight: 15 },
  { id: 'security', name: 'Ciberseguridad', icon: Lock, description: 'Seguridad, respaldos y nube', weight: 10 },
  { id: 'culture', name: 'Cultura Digital', icon: Brain, description: 'Mindset digital, capacitación y equipo TI', weight: 10 },
];

/* ── Per-area scoring functions (each returns 0-100) ─── */

function scoreTools(t: TechToolsData): number {
  // Max raw = 30 (Excel avanzado=5, ERP=10, CRM=10, MRP=5)
  let raw = 0;
  if (t.usaExcel) {
    switch (t.excelNivel) {
      case 'basico': raw += 1; break;
      case 'intermedio': raw += 3; break;
      case 'avanzado': raw += 5; break;
    }
  }
  if (t.tieneERP) raw += 10;
  if (t.tieneCRM) raw += 10;
  if (t.tieneMRP) raw += 5;
  // Normalize to 0-100
  return Math.min(100, Math.round((raw / 30) * 100));
}

function scoreDigitalPresence(d: TechDigitalPresence): number {
  // website=20, actualizado=10, ecommerce=20, redes=20, marketing=30
  let score = 0;
  if (d.tieneWebsite) score += 20;
  if (d.websiteActualizado) score += 10;
  if (d.tieneEcommerce) score += 20;
  if (d.usaRedesSociales && d.redesActivas.length > 0) score += 20;
  if (d.marketingDigital) score += 30;
  return Math.min(100, score);
}

function scoreAutomation(a: TechAutomation): number {
  // Base: ninguno=0, algunos=30, mayoria=70, todos=100
  let score = 0;
  switch (a.procesosAutomatizados) {
    case 'ninguno': score = 0; break;
    case 'algunos': score = 30; break;
    case 'mayoria': score = 70; break;
    case 'todos': score = 100; break;
  }
  // Bonuses (+5 each, max 20 bonus)
  if (a.facturaElectronica) score += 5;
  if (a.bancaDigital) score += 5;
  if (a.firmaElectronica) score += 5;
  if (a.gestionDocumentalDigital) score += 5;
  return Math.min(100, score);
}

function scoreDataAnalytics(d: TechDataAnalytics): number {
  // Base: nunca=0, a_veces=25, frecuentemente=60, siempre=80
  let score = 0;
  switch (d.usaDatosParaDecisiones) {
    case 'nunca': score = 0; break;
    case 'a_veces': score = 25; break;
    case 'frecuentemente': score = 60; break;
    case 'siempre': score = 80; break;
  }
  if (d.tieneKPIs) score += 10;
  if (d.dashboardsBI) score += 10;
  return Math.min(100, score);
}

function scoreAI(ai: TechAIAdoption): number {
  // conoceIA=20, usaIA=40, each caso uso=+10 (max 40 from cases)
  let score = 0;
  if (ai.conoceIA) score += 20;
  if (ai.usaIAEnEmpresa) score += 40;
  // Each caso de uso = +10, capped at 40
  score += Math.min(40, ai.casosUsoIA.length * 10);
  // Bonus for high interest (only if not already maxed)
  if (ai.interesEnIA === 'alto') score += 5;
  return Math.min(100, score);
}

function scoreSecurity(s: TechSecurity): number {
  // antivirus=20, respaldos auto=30/manual=15, politicas=20, capacitacion=15, nube=15
  let score = 0;
  if (s.tieneAntivirus) score += 20;
  switch (s.respaldosDatos) {
    case 'automatico': score += 30; break;
    case 'manual': score += 15; break;
    case 'nunca': score += 0; break;
  }
  if (s.politicasSeguridad) score += 20;
  if (s.capacitacionSeguridad) score += 15;
  if (s.usaNube) score += 15;
  return Math.min(100, score);
}

function scoreCulture(c: TechCulture): number {
  // resistencia baja/ninguna=30, capacitacion=25, equipoTI=25, presupuesto=20
  let score = 0;
  switch (c.resistenciaAlCambio) {
    case 'ninguna': score += 30; break;
    case 'baja': score += 30; break;
    case 'media': score += 15; break;
    case 'alta': score += 0; break;
  }
  if (c.capacitacionTecnologica) score += 25;
  if (c.equipoTI) score += 25;
  if (c.presupuestoTech) score += 20;
  return Math.min(100, score);
}

/* ── Maturity level classification ────────────────────── */

function classifyMaturity(score: number): TechMaturityLevel {
  if (score <= 25) return 'basico';
  if (score <= 50) return 'intermedio';
  if (score <= 75) return 'avanzado';
  return 'lider_digital';
}

/* ── Main scoring function ────────────────────────────── */

export function computeTechMaturityScore(survey: {
  tools: TechToolsData;
  digitalPresence: TechDigitalPresence;
  automation: TechAutomation;
  dataAnalytics: TechDataAnalytics;
  aiAdoption: TechAIAdoption;
  security: TechSecurity;
  culture: TechCulture;
}): { score: number; level: TechMaturityLevel; areaScores: Record<string, number> } {
  const areaScores: Record<string, number> = {
    tools: scoreTools(survey.tools),
    digital_presence: scoreDigitalPresence(survey.digitalPresence),
    automation: scoreAutomation(survey.automation),
    data_analytics: scoreDataAnalytics(survey.dataAnalytics),
    ai: scoreAI(survey.aiAdoption),
    security: scoreSecurity(survey.security),
    culture: scoreCulture(survey.culture),
  };

  // Weighted average
  let weightedSum = 0;
  for (const area of TECH_AREAS) {
    weightedSum += (areaScores[area.id] ?? 0) * area.weight;
  }
  const score = Math.round(weightedSum / 100);

  return {
    score,
    level: classifyMaturity(score),
    areaScores,
  };
}
