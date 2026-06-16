import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IndustryBenchmarks, IndustryBenchmark, Sector } from '../lib/types';
import { DEFAULT_INDUSTRY_BENCHMARKS } from '../config/constants';

interface BenchmarkState {
  benchmarks: IndustryBenchmarks;
  setBenchmark: (sector: Sector, data: Partial<IndustryBenchmark>) => void;
  resetBenchmarks: () => void;
}

export const useBenchmarkStore = create<BenchmarkState>()(
  persist(
    (set) => ({
      benchmarks: { ...DEFAULT_INDUSTRY_BENCHMARKS } as IndustryBenchmarks,

      setBenchmark: (sector, data) =>
        set((state) => ({
          benchmarks: {
            ...state.benchmarks,
            [sector]: { ...state.benchmarks[sector], ...data },
          },
        })),

      resetBenchmarks: () =>
        set({ benchmarks: { ...DEFAULT_INDUSTRY_BENCHMARKS } as IndustryBenchmarks }),
    }),
    {
      name: 'ccg_industry_benchmarks',
    }
  )
);
