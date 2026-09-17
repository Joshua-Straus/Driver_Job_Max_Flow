import type { Scenario } from './types';

export const feasibleScenario: Scenario = {
  version: 1,
  name: 'Scenario',
  shifts: ['1', '2', '3', '4', '5', '6'],
  drivers: [
    { id: 'maya', name: 'Maya', shifts: ['2', '5'] },
    { id: 'liam', name: 'Liam', shifts: ['2'] },
    { id: 'noor', name: 'Noor', shifts: ['5'] },
  ],
  jobs: [
    { id: 'airport', name: 'Airport Highway Plow', shift: '2', demand: 1 },
    { id: 'downtown', name: 'Downtown Loop Plow', shift: '2', demand: 1 },
    { id: 'harbor', name: 'Harbor Road Plow', shift: '5', demand: 1 },
  ],
  eligibility: [
    { driverId: 'maya', jobId: 'airport' }, { driverId: 'maya', jobId: 'harbor' },
    { driverId: 'liam', jobId: 'airport' }, { driverId: 'liam', jobId: 'downtown' },
    { driverId: 'noor', jobId: 'harbor' },
  ],
};

export const infeasibleScenario: Scenario = {
  ...feasibleScenario,
  name: 'Coverage gap',
  drivers: feasibleScenario.drivers.filter((driver) => driver.id !== 'noor'),
  eligibility: feasibleScenario.eligibility.filter((edge) => edge.driverId !== 'noor'),
  jobs: feasibleScenario.jobs.map((job) => job.id === 'harbor' ? { ...job, demand: 2 } : job),
};
