import type { ServiceAreaConfig } from '../lib/types';

export const SERVICE_AREAS: ServiceAreaConfig[] = [
  {
    id: 'estructura_organizacional',
    name: 'Estructura Organizacional',
    description: 'Organigrama, funciones, responsabilidades, evaluación de desempeño y tabulación de salarios.',
    icon: '🏗️',
  },
  {
    id: 'planeacion_estrategica',
    name: 'Planeación Estratégica',
    description: 'Misión, visión, presupuestos de inversión, política de dividendos y estrategia a largo plazo.',
    icon: '🎯',
  },
  {
    id: 'business_analytics',
    name: 'Business Analytics',
    description: 'Indicadores clave, análisis financiero, productividad per cápita y seguimiento de resultados.',
    icon: '📊',
  },
  {
    id: 'procesos',
    name: 'Procesos',
    description: 'Mapeo, estandarización, control de compras, almacenes, inventarios y documentación.',
    icon: '⚙️',
  },
  {
    id: 'investigacion_mercado',
    name: 'Investigación de Mercado',
    description: 'Encuestas de clima, satisfacción de clientes, benchmark de mercado y análisis de sueldos.',
    icon: '🔍',
  },
  {
    id: 'juntas_directivas',
    name: 'Juntas Directivas',
    description: 'Consejo consultivo, consejo de administración, evaluación de dirección, sucesión y gobierno familiar.',
    icon: '👥',
  },
];

export function getServiceArea(id: string): ServiceAreaConfig | undefined {
  return SERVICE_AREAS.find(a => a.id === id);
}
