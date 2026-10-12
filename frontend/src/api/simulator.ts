import { useMutation } from '@tanstack/react-query';
import type { SimulationPayload } from '../lib/simulator';
import type { ProjectedMonth } from '../types/api';
import { client } from './client';
import { toProjectedMonth, type RawProjectedMonth } from './projection';

export interface SimulationResult {
  baseline: ProjectedMonth[];
  scenario: ProjectedMonth[];
}

interface RawSimulationResult {
  baseline: RawProjectedMonth[];
  scenario: RawProjectedMonth[];
}

export const useSimulate = () =>
  useMutation<SimulationResult, Error, SimulationPayload>({
    mutationFn: async (payload) => {
      const res = await client.post<RawSimulationResult>('/projection/simulate', payload);
      return {
        baseline: res.data.baseline.map(toProjectedMonth),
        scenario: res.data.scenario.map(toProjectedMonth),
      };
    },
  });
