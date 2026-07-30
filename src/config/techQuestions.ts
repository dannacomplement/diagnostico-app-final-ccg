import type { LucideIcon } from 'lucide-react';
import { Handshake, Truck, Users, Calculator, ShieldCheck } from 'lucide-react';
import type { TechMaturityArea, TechMaturityAnswer, TechMaturityScore } from '../lib/types';

/* ── Escala de madurez (1-5), igual para todas las afirmaciones ── */

export interface MaturityLevelInfo {
  score: TechMaturityScore;
  label: string;
  description: string;
}

export const MATURITY_LEVELS: MaturityLevelInfo[] = [
  { score: 1, label: 'Manual / Papel', description: 'El proceso se realiza en físico o sin un procedimiento formal estandarizado.' },
  { score: 2, label: 'Informal / Hojas de Cálculo', description: 'Se utilizan archivos individuales no centralizados (Excel, Word, correo electrónico).' },
  { score: 3, label: 'Básico / Parcial', description: 'Se utiliza un software o sistema, pero sus funciones son limitadas o trabaja de forma aislada.' },
  { score: 4, label: 'Especializado', description: 'Se cuenta con un software dedicado al área, pero no está completamente integrado con otras áreas.' },
  { score: 5, label: 'Integrado / Automatizado', description: 'Existe un sistema centralizado (ERP/CRM) totalmente integrado, con datos en tiempo real.' },
];

/* ── Áreas seleccionables (Sistemas y Seguridad NO se selecciona, aplica a todos) ── */

export interface TechAreaConfig {
  id: TechMaturityArea;
  name: string;
  icon: LucideIcon;
  description: string;
}

export const TECH_AREAS: TechAreaConfig[] = [
  { id: 'comercial', name: 'Comercial y Clientes', icon: Handshake, description: 'CRM, seguimiento de clientes, embudo de ventas' },
  { id: 'operaciones', name: 'Operaciones y Logística', icon: Truck, description: 'Inventario, producción, órdenes de compra' },
  { id: 'rrhh', name: 'Recursos Humanos', icon: Users, description: 'Expedientes, nómina, capacitación, reclutamiento' },
  { id: 'admin', name: 'Administración y Finanzas', icon: Calculator, description: 'Facturación, cuentas por cobrar/pagar, conciliación' },
];

export const GENERAL_AREA_LABEL = 'Sistemas y Seguridad';
export const GENERAL_AREA_ICON: LucideIcon = ShieldCheck;
export const GENERAL_AREA_DESCRIPTION = 'Integración entre áreas, reportes, respaldos y permisos';

/* ── Afirmaciones por área (del Cuestionario_Madurez_Digital de Alan) ── */

export interface TechStatement {
  id: string;
  text: string;
}

export const AREA_STATEMENTS: Record<TechMaturityArea, TechStatement[]> = {
  comercial: [
    { id: 'COM-01', text: 'Centralizamos la información de clientes e interacciones en una herramienta digital accesible para el equipo (ej. CRM).' },
    { id: 'COM-02', text: 'Clasificamos a los clientes según su valor, comportamiento o categoría para personalizar el seguimiento.' },
    { id: 'COM-03', text: 'Contamos con recordatorios o comunicaciones automáticas programadas (cumpleaños, renovaciones, seguimiento).' },
    { id: 'COM-04', text: 'El embudo de ventas (funnel) y sus etapas se gestionan y visualizan a través del sistema comercial.' },
    { id: 'COM-05', text: 'El cierre de ventas se registra en tiempo real e impacta automáticamente a las demás áreas.' },
  ],
  operaciones: [
    { id: 'OPE-01', text: 'La entrada y salida de existencias/inventarios se registran digitalmente en tiempo real.' },
    { id: 'OPE-02', text: 'Cada venta efectuada descuenta de forma automática el stock disponible de inventario.' },
    { id: 'OPE-03', text: 'La programación y planificación de actividades, producción o servicios se gestiona desde el sistema.' },
    { id: 'OPE-04', text: 'Las órdenes de compra a proveedores se generan, aprueban y rastrean dentro del sistema.' },
    { id: 'OPE-05', text: 'La documentación de entrega (despachos, guías, acuses) e incidencias se gestionan digitalmente.' },
  ],
  rrhh: [
    { id: 'RRHH-01', text: 'La información del personal (expedientes, contratos, datos clave) está centralizada en un sistema.' },
    { id: 'RRHH-02', text: 'El cálculo y procesamiento de la nómina se ejecuta mediante un software especializado de RRHH.' },
    { id: 'RRHH-03', text: 'El plan de capacitación, formación y evaluación del desempeño se administra digitalmente.' },
    { id: 'RRHH-04', text: 'Existen canales o plataformas digitales oficiales para comunicados institucionales y organizacionales.' },
    { id: 'RRHH-05', text: 'Las vacantes, recepción de candidatos y etapas de reclutamiento/selección se gestionan en una plataforma.' },
  ],
  admin: [
    { id: 'ADM-01', text: 'La emisión y recepción de facturas electrónicas se realiza directamente desde el sistema central.' },
    { id: 'ADM-02', text: 'El seguimiento de cuentas por cobrar y por pagar está automatizado con alertas de vencimiento.' },
    { id: 'ADM-03', text: 'Los movimientos bancarios se sincronizan con el sistema para realizar conciliaciones de forma rápida.' },
    { id: 'ADM-04', text: 'La gestión de presupuestos y el registro de gastos operativos se llevan rigurosamente dentro del sistema.' },
  ],
};

/** Afirmaciones de Sistemas y Seguridad — se le preguntan a TODOS los respondientes, sin importar su área. */
export const GENERAL_STATEMENTS: TechStatement[] = [
  { id: 'GEN-01', text: 'Los sistemas de las distintas áreas (ventas, finanzas, inventario) se comunican entre sí sin duplicar datos.' },
  { id: 'GEN-02', text: 'El sistema genera reportes e indicadores (KPIs) automáticos y en tiempo real para la toma de decisiones.' },
  { id: 'GEN-03', text: 'Es fácil extraer la información en formatos abiertos (Excel, CSV, PDF) para análisis adicionales.' },
  { id: 'GEN-04', text: 'La información cuenta con respaldos automáticos en la nube o servidores seguros de forma periódica.' },
  { id: 'GEN-05', text: 'Cada usuario tiene credenciales individuales y permisos delimitados según su rol dentro de la empresa.' },
];

/* ── Scoring ───────────────────────────────────────────── */

export function computeMaturityPercentage(answers: TechMaturityAnswer[]): number {
  if (answers.length === 0) return 0;
  const sum = answers.reduce((acc, a) => acc + a.score, 0);
  return Math.round((sum / (answers.length * 5)) * 100);
}
