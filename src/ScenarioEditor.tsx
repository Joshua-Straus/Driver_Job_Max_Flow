import type { ReactNode } from 'react';
import { Download, Plus, Trash2, Upload } from 'lucide-react';
import type { Scenario } from './types';

interface Props {
  scenario: Scenario;
  onChange: (next: Scenario) => void;
  onImport: () => void;
  onExport: () => void;
}

export function ScenarioEditor({ scenario, onChange, onImport, onExport }: Props) {
  const patch = (next: Partial<Scenario>) => onChange({ ...scenario, ...next });
  const updateDriver = (index: number, updates: Partial<Scenario['drivers'][number]>) => patch({ drivers: scenario.drivers.map((item, i) => i === index ? { ...item, ...updates } : item) });
  const updateJob = (index: number, updates: Partial<Scenario['jobs'][number]>) => patch({ jobs: scenario.jobs.map((item, i) => i === index ? { ...item, ...updates } : item) });

  return (
    <div className="editor-stack">
      <section className="editor-section">
        <div className="section-heading"><h2>Scenario</h2><div className="icon-actions"><button className="icon-button" onClick={onImport} title="Import JSON" aria-label="Import JSON"><Upload size={16} /></button><button className="icon-button" onClick={onExport} title="Export JSON" aria-label="Export JSON"><Download size={16} /></button></div></div>
      </section>

      <section className="editor-section">
        <div className="section-heading"><h2>Drivers</h2><button className="text-button" onClick={() => {
          const n = scenario.drivers.length + 1; let id = `driver-${n}`; while (scenario.drivers.some((d) => d.id === id)) id = `${id}-new`;
          patch({ drivers: [...scenario.drivers, { id, name: `Driver ${n}`, shifts: [...scenario.shifts] }] });
        }}><Plus size={15} /> Add</button></div>
        <div className="editor-list">
          {scenario.drivers.map((driver, index) => <div className="editor-card" key={driver.id}>
            <div className="card-row"><input aria-label={`Driver ${index + 1} name`} value={driver.name} onChange={(e) => updateDriver(index, { name: e.target.value })} /><button className="delete-button" aria-label={`Delete ${driver.name}`} onClick={() => patch({ drivers: scenario.drivers.filter((_, i) => i !== index), eligibility: scenario.eligibility.filter((edge) => edge.driverId !== driver.id) })}><Trash2 size={15} /></button></div>
            <span className="mini-eyebrow">Shifts</span>
            <div className="checks">{scenario.shifts.map((shift) => <label key={shift}><input type="checkbox" checked={driver.shifts.includes(shift)} onChange={() => {
              const hasShift = driver.shifts.includes(shift);
              const shifts = hasShift ? driver.shifts.filter((item) => item !== shift) : [...driver.shifts, shift];
              const eligibility = hasShift ? scenario.eligibility.filter((edge) => edge.driverId !== driver.id || scenario.jobs.find((job) => job.id === edge.jobId)?.shift !== shift) : scenario.eligibility;
              patch({ drivers: scenario.drivers.map((item, i) => i === index ? { ...item, shifts } : item), eligibility });
            }} />{shift}</label>)}</div>
          </div>)}
        </div>
      </section>

      <section className="editor-section">
        <div className="section-heading"><h2>Jobs</h2><button className="text-button" onClick={() => {
          const n = scenario.jobs.length + 1; let id = `job-${n}`; while (scenario.jobs.some((j) => j.id === id)) id = `${id}-new`;
          patch({ jobs: [...scenario.jobs, { id, name: `Job ${n}`, shift: scenario.shifts[0], demand: 1 }] });
        }}><Plus size={15} /> Add</button></div>
        <div className="editor-list">
          {scenario.jobs.map((job, index) => <div className="editor-card" key={job.id}>
            <div className="card-row"><input aria-label={`Job ${index + 1} name`} value={job.name} onChange={(e) => updateJob(index, { name: e.target.value })} /><button className="delete-button" aria-label={`Delete ${job.name}`} onClick={() => patch({ jobs: scenario.jobs.filter((_, i) => i !== index), eligibility: scenario.eligibility.filter((edge) => edge.jobId !== job.id) })}><Trash2 size={15} /></button></div>
            <div className="compact-row"><label>Shift<select value={job.shift} onChange={(e) => updateJob(index, { shift: e.target.value })}>{scenario.shifts.map((shift) => <option key={shift}>{shift}</option>)}</select></label><label>Demand<input type="number" min="0" max="20" value={job.demand} onChange={(e) => updateJob(index, { demand: Number(e.target.value) })} /></label></div>
          </div>)}
        </div>
      </section>
    </div>
  );
}

export function EligibilityEditor({ scenario, onChange, status }: { scenario: Scenario; onChange: (next: Scenario) => void; status?: ReactNode }) {
  const eligible = (driverId: string, jobId: string) => scenario.eligibility.some((edge) => edge.driverId === driverId && edge.jobId === jobId);
  const toggleEligibility = (driverId: string, jobId: string) => onChange({ ...scenario, eligibility: eligible(driverId, jobId) ? scenario.eligibility.filter((edge) => edge.driverId !== driverId || edge.jobId !== jobId) : [...scenario.eligibility, { driverId, jobId }] });

  return (
    <section className="eligibility-card">
      <div className="section-heading"><h2>Eligibility</h2><div className="eligibility-heading-right"><span className="eyebrow">Who can cover which job</span>{status}</div></div>
      {scenario.drivers.length === 0 || scenario.jobs.length === 0 ? (
        <p className="empty-note">Add at least one driver and one job to set eligibility.</p>
      ) : (
        <>
          <div className="eligibility-scroll">
            <table className="eligibility-table">
              <caption className="sr-only">Driver and job eligibility matrix. Checked cells mean the driver can be assigned to that job.</caption>
              <thead>
                <tr>
                  <th scope="col" className="corner-cell">Driver</th>
                  {scenario.jobs.map((job) => <th scope="col" key={job.id}><span className="job-col-name">{job.name}</span><span className="shift-badge">{job.shift}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {scenario.drivers.map((driver) => <tr key={driver.id}>
                  <th scope="row">{driver.name}</th>
                  {scenario.jobs.map((job) => {
                    const onShift = driver.shifts.includes(job.shift);
                    return <td key={job.id} className={onShift ? '' : 'off-shift'}>
                      <label title={onShift ? `${driver.name} can cover ${job.name}` : `${driver.name} is not on shift ${job.shift}`}>
                        <input type="checkbox" aria-label={`${driver.name} eligible for ${job.name}`} checked={eligible(driver.id, job.id)} disabled={!onShift} onChange={() => toggleEligibility(driver.id, job.id)} />
                      </label>
                    </td>;
                  })}
                </tr>)}
              </tbody>
            </table>
          </div>
          <p className="eligibility-note">Dimmed cells: driver is off shift for that job.</p>
        </>
      )}
    </section>
  );
}
