import { describe, expect, it } from 'vitest';
import { feasibleScenario } from './examples';
import { validateScenario } from './validation';

describe('validateScenario', () => {
  it('accepts the preset', () => expect(validateScenario(feasibleScenario).success).toBe(true));
  it('rejects duplicate IDs and dangling eligibility', () => {
    const bad = { ...feasibleScenario, drivers: [...feasibleScenario.drivers, feasibleScenario.drivers[0]], eligibility: [{ driverId: 'missing', jobId: 'airport' }] };
    const result = validateScenario(bad);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.join(' ')).toMatch(/unique|unknown/i);
  });
  it('rejects eligibility for a shift the driver is not available for', () => {
    const bad = { ...feasibleScenario, eligibility: [...feasibleScenario.eligibility, { driverId: 'liam', jobId: 'harbor' }] };
    const result = validateScenario(bad);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.join(' ')).toMatch(/not available/i);
  });
});
