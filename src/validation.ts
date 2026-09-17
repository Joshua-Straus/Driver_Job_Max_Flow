import { z } from 'zod';
import type { Scenario } from './types';

const id = z.string().trim().min(1, 'ID is required').regex(/^[a-zA-Z0-9_-]+$/, 'Use letters, numbers, - or _');

export const scenarioSchema = z.object({
  version: z.literal(1),
  name: z.string().trim().min(1, 'Scenario name is required'),
  shifts: z.array(id).min(1, 'Add at least one shift'),
  drivers: z.array(z.object({ id, name: z.string().trim().min(1), shifts: z.array(id) })),
  jobs: z.array(z.object({ id, name: z.string().trim().min(1), shift: id, demand: z.number().int().min(0).max(20) })),
  eligibility: z.array(z.object({ driverId: id, jobId: id })),
}).superRefine((value, ctx) => {
  const unique = (values: string[]) => new Set(values).size === values.length;
  if (!unique(value.shifts)) ctx.addIssue({ code: 'custom', path: ['shifts'], message: 'Shift IDs must be unique' });
  if (!unique(value.drivers.map((x) => x.id))) ctx.addIssue({ code: 'custom', path: ['drivers'], message: 'Driver IDs must be unique' });
  if (!unique(value.jobs.map((x) => x.id))) ctx.addIssue({ code: 'custom', path: ['jobs'], message: 'Job IDs must be unique' });
  const shifts = new Set(value.shifts);
  const drivers = new Set(value.drivers.map((x) => x.id));
  const jobs = new Set(value.jobs.map((x) => x.id));
  value.drivers.forEach((driver, i) => driver.shifts.forEach((shift) => {
    if (!shifts.has(shift)) ctx.addIssue({ code: 'custom', path: ['drivers', i, 'shifts'], message: `Unknown shift: ${shift}` });
  }));
  value.jobs.forEach((job, i) => {
    if (!shifts.has(job.shift)) ctx.addIssue({ code: 'custom', path: ['jobs', i, 'shift'], message: `Unknown shift: ${job.shift}` });
  });
  const driverShifts = new Map(value.drivers.map((driver) => [driver.id, new Set(driver.shifts)]));
  const jobShift = new Map(value.jobs.map((job) => [job.id, job.shift]));
  value.eligibility.forEach((edge, i) => {
    if (!drivers.has(edge.driverId) || !jobs.has(edge.jobId)) {
      ctx.addIssue({ code: 'custom', path: ['eligibility', i], message: 'Eligibility references an unknown driver or job' });
      return;
    }
    const shift = jobShift.get(edge.jobId)!;
    if (!driverShifts.get(edge.driverId)!.has(shift)) {
      ctx.addIssue({ code: 'custom', path: ['eligibility', i], message: `Driver ${edge.driverId} is not available during ${shift}, the shift of job ${edge.jobId}` });
    }
  });
});

export function validateScenario(input: unknown): { success: true; data: Scenario } | { success: false; errors: string[] } {
  const parsed = scenarioSchema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'scenario'}: ${issue.message}`) };
}
