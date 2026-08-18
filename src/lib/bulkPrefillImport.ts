import ExcelJS from 'exceljs';
import { PROFESIONALIZACION_CRITERIA, INSTITUCIONALIZACION_CRITERIA, CRITERION_CARD_OPTIONS } from '../config/questions';
import type { CriterionAnswer, EmpresaFamiliar } from './types';

export const EMPRESA_FAMILIAR_VALUES: EmpresaFamiliar[] = ['si_1era', 'si_1era_transicion', 'si_2da', 'si_3era', 'no'];

export interface PrefillImportIssue {
  criterionId: string;
  raw: string;
  reason: 'unrecognized' | 'missing_required';
}

export interface PrefillImportRow {
  rowNumber: number;
  correo: string;
  nombre: string;
  empresa: string;
  empresaFamiliar: EmpresaFamiliar | null;
  profAnswers: CriterionAnswer[];
  instAnswers: CriterionAnswer[];
  issues: PrefillImportIssue[];
  recognizedCount: number;
  totalAnswerCells: number;
}

export interface ParsedPrefillWorkbook {
  rows: PrefillImportRow[];
  parseError?: string;
}

function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('text' in value && value.text !== undefined) return String(value.text);
    if ('result' in value && value.result !== undefined) return String(value.result);
    if ('richText' in value && Array.isArray(value.richText)) return value.richText.map(r => r.text).join('');
  }
  return String(value);
}

function defaultAnswer(criterionId: string): CriterionAnswer {
  return { criterionId, siNo: true, rating: -1, comentario: '' };
}

function matchOptionScore(criterionId: string, raw: string): number | null {
  const options = CRITERION_CARD_OPTIONS[criterionId] ?? [];
  const target = normalizeText(raw);
  const found = options.find(o => normalizeText(o.title) === target);
  return found ? found.score : null;
}

const ALL_ANSWER_CRITERIA = [...PROFESIONALIZACION_CRITERIA, ...INSTITUCIONALIZACION_CRITERIA];

export async function parseBulkPrefillExcel(buffer: ArrayBuffer): Promise<ParsedPrefillWorkbook> {
  let wb: ExcelJS.Workbook;
  try {
    wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
  } catch {
    return { rows: [], parseError: 'No se pudo leer el archivo. Asegúrate de que sea un .xlsx válido.' };
  }

  const ws = wb.worksheets[0];
  if (!ws) {
    return { rows: [], parseError: 'El archivo no tiene hojas con datos.' };
  }

  const headerRow = ws.getRow(1);
  const headerByCol = new Map<number, string>();
  for (let i = 1; i <= ws.columnCount; i++) {
    headerByCol.set(i, normalizeText(cellText(headerRow.getCell(i).value)));
  }

  const findCol = (needles: string[]) => {
    for (const [col, h] of headerByCol) {
      if (needles.some(n => h.includes(n))) return col;
    }
    return -1;
  };

  const findExactCol = (headerId: string) => {
    for (const [col, h] of headerByCol) {
      if (h === headerId) return col;
    }
    return -1;
  };

  const colCorreo = findCol(['correo', 'email']);
  const colNombre = findCol(['nombre']);
  const colEmpresa = findCol(['empresa']);
  const colEmpresaFamiliar = findExactCol('empresa_familiar');

  if (colCorreo === -1) {
    return { rows: [], parseError: 'El Excel debe tener una columna de Correo para identificar al cliente.' };
  }

  const criterionCols = new Map<string, number>();
  for (const criterion of ALL_ANSWER_CRITERIA) {
    for (const [col, h] of headerByCol) {
      if (h === criterion.id) {
        criterionCols.set(criterion.id, col);
        break;
      }
    }
  }

  if (criterionCols.size === 0) {
    return { rows: [], parseError: 'No se reconoció ninguna columna de pregunta (prof_01…prof_10, inst_01…inst_10). Descarga la plantilla para ver el formato exacto.' };
  }

  const rows: PrefillImportRow[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const correo = cellText(row.getCell(colCorreo).value).trim();
    const nombre = colNombre !== -1 ? cellText(row.getCell(colNombre).value).trim() : '';
    const empresa = colEmpresa !== -1 ? cellText(row.getCell(colEmpresa).value).trim() : '';
    if (!correo) return;

    const issues: PrefillImportIssue[] = [];

    const empresaFamiliarRaw = colEmpresaFamiliar !== -1 ? cellText(row.getCell(colEmpresaFamiliar).value).trim().toLowerCase() : '';
    let empresaFamiliar: EmpresaFamiliar | null = null;
    if (empresaFamiliarRaw) {
      if ((EMPRESA_FAMILIAR_VALUES as string[]).includes(empresaFamiliarRaw)) {
        empresaFamiliar = empresaFamiliarRaw as EmpresaFamiliar;
      } else {
        issues.push({ criterionId: 'empresa_familiar', raw: empresaFamiliarRaw, reason: 'unrecognized' });
      }
    }

    const profAnswers: CriterionAnswer[] = [];
    const instAnswers: CriterionAnswer[] = [];
    let recognizedCount = 0;
    let totalAnswerCells = 0;

    for (const criterion of ALL_ANSWER_CRITERIA) {
      const col = criterionCols.get(criterion.id);
      const raw = col !== undefined ? cellText(row.getCell(col).value).trim() : '';
      const target = criterion.category === 'profesionalizacion' ? profAnswers : instAnswers;

      if (!raw) {
        // Preguntas que solo aplican a empresas familiares: en blanco es normal, no es un error.
        if (!criterion.requiresFamilyBusiness) {
          issues.push({ criterionId: criterion.id, raw: '', reason: 'missing_required' });
        }
        target.push(defaultAnswer(criterion.id));
        continue;
      }

      totalAnswerCells++;
      const score = matchOptionScore(criterion.id, raw);
      if (score === null) {
        issues.push({ criterionId: criterion.id, raw, reason: 'unrecognized' });
        target.push(defaultAnswer(criterion.id));
      } else {
        recognizedCount++;
        target.push({ criterionId: criterion.id, siNo: score > 0, rating: score, comentario: '' });
      }
    }

    rows.push({ rowNumber, correo, nombre, empresa, empresaFamiliar, profAnswers, instAnswers, issues, recognizedCount, totalAnswerCells });
  });

  return { rows };
}
