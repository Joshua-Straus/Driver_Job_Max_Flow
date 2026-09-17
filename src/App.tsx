import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, CircleHelp, Pause, Play, RotateCcw, Waypoints, X } from 'lucide-react';
import { buildAssignmentNetwork, runMaxFlow } from './algorithm';
import { feasibleScenario } from './examples';
import { FlowDiagram } from './FlowDiagram';
import { PaperSection } from './PaperSection';
import { EligibilityEditor, ScenarioEditor } from './ScenarioEditor';
import type { Scenario } from './types';
import { validateScenario } from './validation';

type State = { scenario: Scenario; step: number; playing: boolean; speed: number };
type Action = { type: 'scenario'; scenario: Scenario } | { type: 'step'; step: number } | { type: 'playing'; playing: boolean } | { type: 'speed'; speed: number } | { type: 'reset' };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function reducer(state: State, action: Action): State {
  if (action.type === 'scenario') return { ...state, scenario: action.scenario, step: 0, playing: false };
  if (action.type === 'step') return { ...state, step: action.step };
  if (action.type === 'playing') return { ...state, playing: action.playing };
  if (action.type === 'speed') return { ...state, speed: action.speed };
  return { ...state, step: 0, playing: false };
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, { scenario: clone(feasibleScenario), step: 0, playing: false, speed: 900 });
  const [jsonOpen, setJsonOpen] = useState<'import' | 'export' | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const validation = useMemo(() => validateScenario(state.scenario), [state.scenario]);
  const graph = useMemo(() => validation.success ? buildAssignmentNetwork(validation.data) : null, [validation]);
  const result = useMemo(() => graph && validation.success ? runMaxFlow(validation.data, graph) : null, [graph, validation]);
  const maxStep = result ? result.trace.length - 1 : 0;
  const current = result?.trace[Math.min(state.step, maxStep)];
  const timer = useRef<number>();

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (!state.playing || !result) return;
    if (state.step >= maxStep) { dispatch({ type: 'playing', playing: false }); return; }
    timer.current = window.setTimeout(() => dispatch({ type: 'step', step: state.step + 1 }), state.speed);
    return () => window.clearTimeout(timer.current);
  }, [state.playing, state.step, state.speed, maxStep, result]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowRight') dispatch({ type: 'step', step: Math.min(maxStep, state.step + 1) });
      if (event.key === 'ArrowLeft') dispatch({ type: 'step', step: Math.max(0, state.step - 1) });
      if (event.key === ' ') { event.preventDefault(); dispatch({ type: 'playing', playing: !state.playing }); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [state.step, state.playing, maxStep]);

  useEffect(() => {
    if (window.location.hash === '#paper') document.getElementById('paper')?.scrollIntoView({ block: 'start' });
  }, []);

  const scrollToPaper = (event: React.MouseEvent) => {
    event.preventDefault();
    document.getElementById('paper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', '#paper');
  };

  useEffect(() => {
    if (!jsonOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    textareaRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setJsonOpen(null); return; }
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>('button, textarea, input, select, [href], [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); previouslyFocused?.focus(); };
  }, [jsonOpen]);

  const openJson = (mode: 'import' | 'export') => { setJsonOpen(mode); setJsonError(''); setJsonText(mode === 'export' ? JSON.stringify(state.scenario, null, 2) : ''); };
  const importJson = () => {
    try {
      const parsed: unknown = JSON.parse(jsonText); const checked = validateScenario(parsed);
      if (!checked.success) { setJsonError(checked.errors.join('\n')); return; }
      dispatch({ type: 'scenario', scenario: checked.data }); setJsonOpen(null);
    } catch { setJsonError('The text is not valid JSON.'); }
  };
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(state.scenario, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${state.scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <header className="topbar"><a className="brand" href="./" aria-label="Home"><span className="brand-mark"><Waypoints size={17} /></span></a><div className="header-copy">Network Flow Visualizer</div><a className="about-link" href="#paper" onClick={scrollToPaper}><CircleHelp size={16} /> How it works</a></header>
      <main>
        <aside className="sidebar">
          <ScenarioEditor scenario={state.scenario} onChange={(scenario) => dispatch({ type: 'scenario', scenario })} onImport={() => openJson('import')} onExport={() => openJson('export')} />
        </aside>

        <section className="workspace">
          <EligibilityEditor scenario={state.scenario} onChange={(scenario) => dispatch({ type: 'scenario', scenario })} status={result && <div className={`status-pill ${result.feasible ? 'success' : 'warning'}`}>{result.feasible ? <Check size={16} /> : <AlertTriangle size={16} />}{result.feasible ? 'Feasible' : 'Demand unmet'}</div>} />
          {!validation.success ? <div className="validation-panel"><AlertTriangle /><div><h2>Fix the scenario to continue</h2>{validation.errors.map((error) => <p key={error}>{error}</p>)}</div></div> : graph && current && result ? <>
            <div className="graph-card"><FlowDiagram graph={graph} step={current} /><div className="legend"><span><i className="legend-line idle" />Available</span><span><i className="legend-line used" />Carrying flow</span><span><i className="legend-line active" />Active path</span><span>flow / capacity</span></div></div>
            <div className="playback-card">
              <div className="playback-controls"><button className="control-secondary" aria-label="Reset" onClick={() => dispatch({ type: 'reset' })}><RotateCcw size={17} /></button><button className="control-secondary" aria-label="Previous step" disabled={state.step === 0} onClick={() => dispatch({ type: 'step', step: Math.max(0, state.step - 1) })}><ChevronLeft size={19} /></button><button className="play-button" onClick={() => state.step >= maxStep ? (dispatch({ type: 'step', step: 0 }), dispatch({ type: 'playing', playing: true })) : dispatch({ type: 'playing', playing: !state.playing })}>{state.playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}{state.playing ? 'Pause' : 'Play'}</button><button className="control-secondary" aria-label="Next step" disabled={state.step >= maxStep} onClick={() => dispatch({ type: 'step', step: Math.min(maxStep, state.step + 1) })}><ChevronRight size={19} /></button>
              </div>
              <div className="step-story"><div className="step-meta"><span>Step {state.step + 1} of {result.trace.length}</span><span className={`phase phase-${current.phase}`}>{current.phase}</span></div><p>{current.explanation}</p><div className="progress"><i style={{ width: `${maxStep ? state.step / maxStep * 100 : 100}%` }} /></div></div>
              <label className="speed">Speed<select value={state.speed} onChange={(e) => dispatch({ type: 'speed', speed: Number(e.target.value) })}><option value="1500">Slow</option><option value="900">Normal</option><option value="450">Fast</option></select></label>
            </div>
            <Results result={result} currentFlow={current.maxFlow} complete={current.phase === 'complete'} />
          </> : null}
          <section id="about" className="about"><h2>The model</h2><div className="layers"><span>Source</span><b>→</b><span>Drivers</span><b>→</b><span>Shifts</span><b>→</b><span>Jobs</span><b>→</b><span>Sink</span></div></section>
        </section>
      </main>
      <PaperSection />
      {jsonOpen && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="json-title" ref={modalRef}><div className="section-heading"><h2 id="json-title">{jsonOpen === 'import' ? 'Import' : 'Export'}</h2><button className="icon-button" aria-label="Close" onClick={() => setJsonOpen(null)}><X size={18} /></button></div><textarea ref={textareaRef} aria-label="Scenario JSON" readOnly={jsonOpen === 'export'} value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder="Paste scenario JSON here" />{jsonError && <pre className="json-error">{jsonError}</pre>}<div className="modal-actions"><button className="control-secondary labeled" onClick={() => setJsonOpen(null)}>Cancel</button><button className="play-button" onClick={jsonOpen === 'import' ? importJson : downloadJson}>{jsonOpen === 'import' ? 'Import' : 'Download JSON'}</button></div></div></div>}
    </div>
  );
}

function Results({ result, currentFlow, complete }: { result: ReturnType<typeof runMaxFlow>; currentFlow: number; complete: boolean }) {
  return <section className="results-card" aria-live="polite"><div className="result-summary"><div><span className="eyebrow">Flow</span><strong>{currentFlow}<small> / {result.requiredFlow}</small></strong></div><div><span className="eyebrow">Status</span><strong className={result.feasible ? 'success-text' : 'warning-text'}>{complete ? result.feasible ? 'All covered' : `${result.requiredFlow - result.maximumFlow} unfilled` : 'In progress'}</strong></div></div><div className="assignment-table"><table><caption>Final assignment</caption><thead><tr><th>Shift</th><th>Job</th><th>Driver</th></tr></thead><tbody>{result.assignments.length ? result.assignments.map((assignment) => <tr key={`${assignment.driverId}-${assignment.jobId}`}><td><span className="shift-badge">{assignment.shift}</span></td><td>{assignment.jobName}</td><td>{assignment.driverName}</td></tr>) : <tr><td colSpan={3}>None.</td></tr>}</tbody></table>{result.unmetDemand.length > 0 && <div className="unmet"><AlertTriangle size={18} /><div><strong>Unmet</strong>{result.unmetDemand.map((job) => <span key={job.jobId}>{job.jobName}: {job.missing} missing</span>)}</div></div>}</div></section>;
}
