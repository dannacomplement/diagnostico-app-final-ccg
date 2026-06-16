export const EMPRESA_FAMILIAR_OPTIONS = [
  { value: 'si_1era' as const, label: 'Sí, 1ª generación' },
  { value: 'si_2da' as const, label: 'Sí, 2ª generación' },
  { value: 'si_3era' as const, label: 'Sí, 3ª generación' },
  { value: 'no' as const, label: 'No' },
];

export const SECTOR_OPTIONS = [
  { value: 'manufactura' as const, label: 'Manufactura' },
  { value: 'comercio' as const, label: 'Comercio' },
  { value: 'servicios' as const, label: 'Servicios' },
];

export const SOFTWARE_OPTIONS = [
  { value: 'erp' as const, label: 'ERP' },
  { value: 'mrp' as const, label: 'MRP' },
  { value: 'crm' as const, label: 'CRM' },
  { value: 'excel' as const, label: 'Excel' },
  { value: 'nada' as const, label: 'Nada' },
];

export const EXCEL_NIVEL_OPTIONS = [
  { value: 'basico' as const, label: 'Básico' },
  { value: 'intermedio' as const, label: 'Intermedio' },
  { value: 'avanzado' as const, label: 'Avanzado' },
];

export const URGENCY_OPTIONS = [
  {
    value: 'muy_urgente' as const,
    label: 'Muy urgente',
    description: 'Nuestro crecimiento y armonía depende de ello.',
  },
  {
    value: 'necesario' as const,
    label: 'Necesario, pero no urgente',
    description: 'Podemos avanzar.',
  },
  {
    value: 'deseable' as const,
    label: 'Deseable en algún momento',
    description: 'Pero nada urgente.',
  },
];

export const GERENCIA_AREAS = [
  'Dirección General',
  'Administración y Finanzas',
  'Comercial y Ventas',
  'Operaciones',
  'Capital Humano',
];

export const CLASSIFICATION_OPTIONS = [
  { value: 'prospecto' as const, label: 'Prospecto', color: 'bg-accent/15 text-accent' },
  { value: 'en_proceso' as const, label: 'En proceso', color: 'bg-warn/15 text-warn' },
  { value: 'cerrado' as const, label: 'Cerrado', color: 'bg-success/15 text-success' },
  { value: 'seguimiento' as const, label: 'Seguimiento', color: 'bg-mid/15 text-mid' },
];

export const SCORE_LEVELS = {
  Bajo: { min: 0, max: 3.99, color: 'error' },
  Medio: { min: 4, max: 7.49, color: 'warn' },
  Alto: { min: 7.5, max: 10, color: 'success' },
} as const;

export const HISTORY_PASSWORD = 'CCG2026';

export const PUESTO_EMPRESA_OPTIONS = [
  { value: 'Director General', label: 'Director General' },
  { value: 'Gerente de Operaciones', label: 'Gerente de Operaciones' },
  { value: 'Gerente Comercial', label: 'Gerente Comercial' },
  { value: 'Gerente de Administración y Finanzas', label: 'Gerente de Administración y Finanzas' },
  { value: 'Gerente de Capital Humano', label: 'Gerente de Capital Humano' },
  { value: 'Director de Producción', label: 'Director de Producción' },
  { value: 'Coordinador', label: 'Coordinador' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Analista', label: 'Analista' },
  { value: 'Asistente', label: 'Asistente' },
  { value: 'Otro', label: 'Otro' },
];

export const PUESTO_FAMILIA_OPTIONS = [
  { value: 'Fundador', label: 'Fundador' },
  { value: 'Papá', label: 'Papá' },
  { value: 'Mamá', label: 'Mamá' },
  { value: 'Hijo mayor', label: 'Hijo mayor' },
  { value: 'Hijo menor', label: 'Hijo menor' },
  { value: 'Hija', label: 'Hija' },
  { value: 'Nieto/a', label: 'Nieto/a' },
  { value: 'Hermano/a', label: 'Hermano/a' },
  { value: 'Cónyuge', label: 'Cónyuge' },
  { value: 'Sobrino/a', label: 'Sobrino/a' },
  { value: 'Tío/a', label: 'Tío/a' },
  { value: 'Primo/a', label: 'Primo/a' },
  { value: 'Otro', label: 'Otro' },
];

export const ERP_OPTIONS = [
  { value: 'SAP', label: 'SAP' },
  { value: 'Odoo', label: 'Odoo' },
  { value: 'Oracle', label: 'Oracle' },
  { value: 'NetSuite', label: 'NetSuite' },
  { value: 'Infor', label: 'Infor' },
  { value: 'Microsoft Dynamics', label: 'Microsoft Dynamics' },
  { value: 'Epicor', label: 'Epicor' },
  { value: 'TOTVS', label: 'TOTVS' },
  { value: 'Sage', label: 'Sage' },
  { value: 'Otro', label: 'Otro' },
];

export const MRP_OPTIONS = [
  { value: 'SAP MRP', label: 'SAP MRP' },
  { value: 'NetSuite', label: 'NetSuite' },
  { value: 'Infor', label: 'Infor' },
  { value: 'Epicor', label: 'Epicor' },
  { value: 'Oracle', label: 'Oracle' },
  { value: 'Microsoft Dynamics', label: 'Microsoft Dynamics' },
  { value: 'TOTVS', label: 'TOTVS' },
  { value: 'Otro', label: 'Otro' },
];

export const CRM_OPTIONS = [
  { value: 'Salesforce', label: 'Salesforce' },
  { value: 'HubSpot', label: 'HubSpot' },
  { value: 'Zoho CRM', label: 'Zoho CRM' },
  { value: 'Pipedrive', label: 'Pipedrive' },
  { value: 'Microsoft Dynamics 365', label: 'Microsoft Dynamics 365' },
  { value: 'Freshsales', label: 'Freshsales' },
  { value: 'Monday CRM', label: 'Monday CRM' },
  { value: 'Otro', label: 'Otro' },
];

export const DEFAULT_INDUSTRY_BENCHMARKS = {
  manufactura: {
    margenBruto: 30,
    margenOperativo: 10,
    margenNeto: 5,
    tolerancia: 5,
    criticoUmbral: 15,
  },
  comercio: {
    margenBruto: 25,
    margenOperativo: 5,
    margenNeto: 3,
    tolerancia: 5,
    criticoUmbral: 12,
  },
  servicios: {
    margenBruto: 50,
    margenOperativo: 15,
    margenNeto: 10,
    tolerancia: 8,
    criticoUmbral: 20,
  },
} as const;
