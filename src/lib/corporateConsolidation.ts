/**
 * Consolidation for MULTI_BRANCH corporate expedientes.
 * Metodología (aprobada en el análisis de arquitectura):
 * - Suma: empleados, ventas, # sucursales, diagnósticos terminados.
 * - Promedio ponderado por empleados: profesionalización, institucionalización, desempeño.
 * - Áreas de oportunidad: por frecuencia/recurrencia entre sucursales (prioridad alta o media).
 * - Retos: no se consolidan automáticamente (serían texto libre, ver §14 del análisis) —
 *   se listan por sucursal en la UI, no aquí.
 */
import type { SavedDiagnostic, Branch, ServiceAreaId } from './types';
import { computeMaturityIndex } from './diagnosticAnalysis';
import { SERVICE_AREAS } from '../config/serviceAreas';

export interface BranchWithDiagnostic {
  branch: Branch;
  diagnostic?: SavedDiagnostic;
}

export interface CorporateConsolidation {
  totalSucursales: number;
  activas: number;
  pendiente: number;
  enProceso: number;
  terminado: number;
  porPais: { pais: string; count: number }[];
  totalEmpleados: number;
  ventasConsolidadas: number;
  ventasPorSucursal: { branchName: string; ventas: number | null }[];
  ventasPorPais: { pais: string; ventas: number }[];
  avanceGeneralPct: number;
  profesionalizacionPromedio: number | null;
  institucionalizacionPromedio: number | null;
  desempenoPromedio: number | null;
  areasOportunidadRecurrentes: { serviceAreaId: ServiceAreaId; name: string; count: number; branches: string[] }[];
}

function weightedAverage(items: { value: number; weight: number }[]): number | null {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  if (totalWeight <= 0) return null;
  const weightedSum = items.reduce((sum, i) => sum + i.value * i.weight, 0);
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

export function consolidateCorporateBranches(items: BranchWithDiagnostic[]): CorporateConsolidation {
  const totalSucursales = items.length;
  const activas = items.filter(i => i.branch.status === 'activa').length;
  const pendiente = items.filter(i => i.branch.diagnosticStatus === 'pendiente').length;
  const enProceso = items.filter(i => i.branch.diagnosticStatus === 'en_proceso').length;
  const terminado = items.filter(i => i.branch.diagnosticStatus === 'terminado').length;

  const porPaisMap = new Map<string, number>();
  for (const { branch } of items) {
    porPaisMap.set(branch.country, (porPaisMap.get(branch.country) ?? 0) + 1);
  }
  const porPais = Array.from(porPaisMap.entries()).map(([pais, count]) => ({ pais, count }));

  const withDiag = items.filter((i): i is BranchWithDiagnostic & { diagnostic: SavedDiagnostic } => !!i.diagnostic);

  const totalEmpleados = withDiag.reduce((sum, i) => sum + (i.diagnostic.situacionActual.empleadosTotales ?? 0), 0);
  const ventasConsolidadas = withDiag.reduce((sum, i) => sum + (i.diagnostic.situacionActual.ventasAnualesMDP ?? 0), 0);

  const ventasPorSucursal = items.map(i => ({
    branchName: i.branch.name,
    ventas: i.diagnostic?.situacionActual.ventasAnualesMDP ?? null,
  }));

  const ventasPorPaisMap = new Map<string, number>();
  for (const { branch, diagnostic } of withDiag) {
    const ventas = diagnostic.situacionActual.ventasAnualesMDP ?? 0;
    ventasPorPaisMap.set(branch.country, (ventasPorPaisMap.get(branch.country) ?? 0) + ventas);
  }
  const ventasPorPais = Array.from(ventasPorPaisMap.entries()).map(([pais, ventas]) => ({ pais, ventas }));

  const avanceGeneralPct = totalSucursales > 0 ? Math.round((terminado / totalSucursales) * 100) : 0;

  const weightable = withDiag
    .map(i => ({ diag: i.diagnostic, weight: i.diagnostic.situacionActual.empleadosTotales ?? 0 }))
    .filter(i => i.weight > 0);

  const profesionalizacionPromedio = weightedAverage(weightable.map(i => ({ value: i.diag.profesionalizacion.average, weight: i.weight })));
  const institucionalizacionPromedio = weightedAverage(weightable.map(i => ({ value: i.diag.institucionalizacion.average, weight: i.weight })));
  const desempenoPromedio = weightedAverage(weightable.map(i => ({ value: computeMaturityIndex(i.diag).score, weight: i.weight })));

  const areaCounts = new Map<ServiceAreaId, { count: number; branches: string[] }>();
  for (const { branch, diagnostic } of withDiag) {
    for (const area of diagnostic.opportunityAreas) {
      if (area.priority !== 'alta' && area.priority !== 'media') continue;
      const entry = areaCounts.get(area.serviceArea.id) ?? { count: 0, branches: [] };
      entry.count += 1;
      entry.branches.push(branch.name);
      areaCounts.set(area.serviceArea.id, entry);
    }
  }
  const areasOportunidadRecurrentes = Array.from(areaCounts.entries())
    .map(([serviceAreaId, data]) => ({
      serviceAreaId,
      name: SERVICE_AREAS.find(a => a.id === serviceAreaId)?.name ?? serviceAreaId,
      count: data.count,
      branches: data.branches,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalSucursales, activas, pendiente, enProceso, terminado, porPais,
    totalEmpleados, ventasConsolidadas, ventasPorSucursal, ventasPorPais,
    avanceGeneralPct, profesionalizacionPromedio, institucionalizacionPromedio, desempenoPromedio,
    areasOportunidadRecurrentes,
  };
}
