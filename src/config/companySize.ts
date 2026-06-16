import type { CompanySize, Sector } from '../lib/types';

interface SizeThreshold {
  size: CompanySize;
  maxWorkers: number;
  maxSalesMDP: number;
  maxTMC: number;
}

const MICRO_ALL: SizeThreshold = { size: 'Micro', maxWorkers: 10, maxSalesMDP: 4, maxTMC: 4.6 };

const THRESHOLDS: Record<Sector, SizeThreshold[]> = {
  comercio: [
    MICRO_ALL,
    { size: 'Pequeña', maxWorkers: 30, maxSalesMDP: 100, maxTMC: 93 },
    { size: 'Mediana', maxWorkers: 100, maxSalesMDP: 250, maxTMC: 235 },
  ],
  servicios: [
    MICRO_ALL,
    { size: 'Pequeña', maxWorkers: 50, maxSalesMDP: 100, maxTMC: 95 },
    { size: 'Mediana', maxWorkers: 100, maxSalesMDP: 100, maxTMC: 100 },
  ],
  manufactura: [
    MICRO_ALL,
    { size: 'Pequeña', maxWorkers: 50, maxSalesMDP: 100, maxTMC: 95 },
    { size: 'Mediana', maxWorkers: 250, maxSalesMDP: 250, maxTMC: 250 },
  ],
};

export function classifyCompanySize(
  sector: Sector,
  workers: number,
  salesMDP: number
): { size: CompanySize; tmcScore: number } {
  const tmcScore = workers * 0.1 + salesMDP * 0.9;
  const sectorThresholds = THRESHOLDS[sector];

  for (const threshold of sectorThresholds) {
    if (
      workers <= threshold.maxWorkers &&
      salesMDP <= threshold.maxSalesMDP &&
      tmcScore <= threshold.maxTMC
    ) {
      return { size: threshold.size, tmcScore };
    }
  }

  return { size: 'Grande', tmcScore };
}
