import { describe, expect, it } from 'vitest';
import { buildAssignmentNetwork, runMaxFlow } from './algorithm';
import { feasibleScenario, infeasibleScenario } from './examples';
import type { Scenario } from './types';

describe('assignment network', () => {
  it('builds the five-layer graph with documented capacities', () => {
    const graph = buildAssignmentNetwork(feasibleScenario);
    expect(graph.edges.find((e) => e.from === 'source' && e.to === 'driver:maya')?.capacity).toBe(2);
    expect(graph.edges.find((e) => e.from === 'driver:maya' && e.to === 'driver-shift:maya:2')?.capacity).toBe(1);
    expect(graph.edges.find((e) => e.from === 'job:airport' && e.to === 'sink')?.capacity).toBe(1);
  });

  it('finds a complete deterministic assignment', () => {
    const result = runMaxFlow(feasibleScenario);
    expect(result.feasible).toBe(true);
    expect(result.maximumFlow).toBe(3);
    expect(result.assignments).toHaveLength(3);
    expect(result.trace.at(-1)?.phase).toBe('complete');
  });

  it('reports unmet demand', () => {
    const result = runMaxFlow(infeasibleScenario);
    expect(result.feasible).toBe(false);
    expect(result.maximumFlow).toBeLessThan(result.requiredFlow);
    expect(result.unmetDemand).toContainEqual(expect.objectContaining({ jobId: 'harbor', missing: 1 }));
  });

  it.each([
    ['empty', { version: 1, name: 'Empty', shifts: ['AM'], drivers: [], jobs: [], eligibility: [] }],
    ['zero demand', { version: 1, name: 'Zero', shifts: ['AM'], drivers: [{ id: 'd', name: 'D', shifts: ['AM'] }], jobs: [{ id: 'j', name: 'J', shift: 'AM', demand: 0 }], eligibility: [{ driverId: 'd', jobId: 'j' }] }],
  ] satisfies Array<[string, Scenario]>)('handles %s scenarios', (_, scenario) => {
    const result = runMaxFlow(scenario);
    expect(result.feasible).toBe(true);
    expect(result.maximumFlow).toBe(0);
  });

  it('keeps snapshots immutable and consistent', () => {
    const result = runMaxFlow(feasibleScenario);
    const first = result.trace[0];
    expect(first.edges.every((edge) => edge.flow === 0)).toBe(true);
    expect(result.trace.at(-1)?.edges.some((edge) => edge.flow > 0)).toBe(true);
    expect(new Set(result.trace.map((step) => step.index)).size).toBe(result.trace.length);
  });
});
