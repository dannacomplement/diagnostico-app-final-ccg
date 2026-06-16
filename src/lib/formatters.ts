import type { DatosGenerales } from './types';

/** Format a raw number string as currency: 1000000 → $1,000,000 */
export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num) || num === 0) return '';
  return '$' + num.toLocaleString('es-MX', { maximumFractionDigits: 0 });
}

/** Format a raw number string as percentage: 35 → 35% */
export function formatPercent(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return `${num}%`;
}

/** Build a human-readable label for the software de gestion field.
 *  Handles both new multi-select format and old single-select format. */
export function buildSoftwareLabel(dg: DatosGenerales): string {
  // New format: softwareSelections
  if (dg.softwareSelections) {
    const sel = dg.softwareSelections;
    if (sel.selected.length === 0 || (sel.selected.length === 1 && sel.selected[0] === 'nada')) {
      return 'Ninguno';
    }

    const parts: string[] = [];
    if (sel.selected.includes('erp')) {
      parts.push(sel.erpDetalle ? `ERP (${sel.erpDetalle})` : 'ERP');
    }
    if (sel.selected.includes('mrp')) {
      parts.push(sel.mrpDetalle ? `MRP (${sel.mrpDetalle})` : 'MRP');
    }
    if (sel.selected.includes('crm')) {
      parts.push(sel.crmDetalle ? `CRM (${sel.crmDetalle})` : 'CRM');
    }
    if (sel.selected.includes('excel')) {
      const nivelLabel = sel.excelNivel
        ? ` (${sel.excelNivel.charAt(0).toUpperCase() + sel.excelNivel.slice(1)})`
        : '';
      parts.push(`Excel${nivelLabel}`);
    }
    return parts.join(', ') || 'Ninguno';
  }

  // Fallback: old single-select format for backward compat
  if (dg.software === 'erp_crm') {
    return `ERP / CRM${dg.softwareDetalle ? ` (${dg.softwareDetalle})` : ''}`;
  }
  if (dg.software === 'excel') return 'Excel';
  return 'Ninguno';
}
