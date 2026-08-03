import type { CurrencyCode } from './types';

/**
 * 'millones': value is expressed in millions of the configured currency
 * (the existing MXN convention — e.g. 120 = $120 MDP). 'completo': value
 * is a full-amount figure (e.g. a monthly salary), no abbreviation.
 */
export type MoneyDisplayUnit = 'millones' | 'completo';

interface FormatMonetaryValueParams {
  value: number | null | undefined;
  currencyCode: CurrencyCode;
  displayUnit?: MoneyDisplayUnit;
}

/**
 * Single source of truth for money formatting across the app (forms,
 * cards, tables, dashboard, reports, PDF/PPTX). MXN output is byte-for-byte
 * identical to the previous per-file `formatMDP()` copies — this is a
 * centralization, not a visual change, for existing MXN clients.
 */
export function formatMonetaryValue({ value, currencyCode, displayUnit = 'millones' }: FormatMonetaryValueParams): string {
  if (value === null || value === undefined) return '—';

  const locale = currencyCode === 'USD' ? 'en-US' : 'es-MX';
  const prefix = currencyCode === 'USD' ? 'US$' : '$';

  if (displayUnit === 'completo') {
    return `${prefix}${value.toLocaleString(locale)}`;
  }

  const unitSuffix = currencyCode === 'USD' ? 'M' : 'MDP';
  if (value >= 1) {
    return `${prefix}${value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unitSuffix}`;
  }
  const thousands = value * 1000;
  return `${prefix}${thousands.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mil`;
}

/** Unit label shown next to sales/productivity inputs (e.g. wizard suffix). */
export function currencyUnitLabel(currencyCode: CurrencyCode): string {
  return currencyCode === 'USD' ? 'US$M' : 'MDP';
}

/** "MDP por empleado" / "US$M por empleado" — productivity index suffix. */
export function currencyPerEmployeeLabel(currencyCode: CurrencyCode): string {
  return currencyCode === 'USD' ? 'US$M por empleado' : 'MDP por empleado';
}
