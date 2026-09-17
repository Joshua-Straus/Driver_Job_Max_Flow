import type { AlgorithmStep, Assignment, EdgeState, FlowGraph, FlowResult, Scenario } from './types';

const sourceId = 'source';
const sinkId = 'sink';
const driverNode = (id: string) => `driver:${id}`;
const shiftNode = (driverId: string, shift: string) => `driver-shift:${driverId}:${shift}`;
const jobNode = (id: string) => `job:${id}`;
const edgeId = (from: string, to: string) => `${from}->${to}`;

export function buildAssignmentNetwork(scenario: Scenario): FlowGraph {
  const nodes: FlowGraph['nodes'] = [
    { id: sourceId, label: 'Source', kind: 'source' as const },
    ...scenario.drivers.map((d) => ({ id: driverNode(d.id), label: d.name, kind: 'driver' as const, driverId: d.id })),
    ...scenario.drivers.flatMap((d) => d.shifts.map((shift) => ({ id: shiftNode(d.id, shift), label: `${d.name} · ${shift}`, kind: 'driverShift' as const, driverId: d.id, shift }))),
    ...scenario.jobs.map((j) => ({ id: jobNode(j.id), label: j.name, kind: 'job' as const, jobId: j.id, shift: j.shift })),
    { id: sinkId, label: 'Sink', kind: 'sink' as const },
  ].sort((a, b) => a.id.localeCompare(b.id));

  const edges: FlowGraph['edges'] = [];
  scenario.drivers.forEach((driver) => {
    edges.push({ id: edgeId(sourceId, driverNode(driver.id)), from: sourceId, to: driverNode(driver.id), capacity: 2 });
    driver.shifts.forEach((shift) => edges.push({ id: edgeId(driverNode(driver.id), shiftNode(driver.id, shift)), from: driverNode(driver.id), to: shiftNode(driver.id, shift), capacity: 1 }));
  });
  scenario.eligibility.forEach(({ driverId, jobId }) => {
    const job = scenario.jobs.find((item) => item.id === jobId);
    const driver = scenario.drivers.find((item) => item.id === driverId);
    if (job && driver?.shifts.includes(job.shift)) {
      edges.push({ id: edgeId(shiftNode(driverId, job.shift), jobNode(jobId)), from: shiftNode(driverId, job.shift), to: jobNode(jobId), capacity: 1 });
    }
  });
  scenario.jobs.forEach((job) => edges.push({ id: edgeId(jobNode(job.id), sinkId), from: jobNode(job.id), to: sinkId, capacity: job.demand }));
  edges.sort((a, b) => a.id.localeCompare(b.id));
  return { nodes, edges, source: sourceId, sink: sinkId };
}

type ResidualArc = { from: string; to: string; edgeId: string; residual: number; direction: 1 | -1 };

function edgeStates(graph: FlowGraph, flows: Map<string, number>): EdgeState[] {
  return graph.edges.map((edge) => ({ ...edge, flow: flows.get(edge.id) ?? 0, residual: edge.capacity - (flows.get(edge.id) ?? 0) }));
}

function snapshot(index: number, phase: AlgorithmStep['phase'], explanation: string, graph: FlowGraph, flows: Map<string, number>, maxFlow: number, path: ResidualArc[] = [], bottleneck?: number): AlgorithmStep {
  return {
    index, phase, explanation, maxFlow, bottleneck,
    activePath: path.length ? [path[0].from, ...path.map((arc) => arc.to)] : [],
    activeEdgeIds: path.map((arc) => arc.edgeId),
    edges: edgeStates(graph, flows),
  };
}

function residualArcs(graph: FlowGraph, flows: Map<string, number>): ResidualArc[] {
  return graph.edges.flatMap((edge) => {
    const flow = flows.get(edge.id) ?? 0;
    const arcs: ResidualArc[] = [];
    if (edge.capacity - flow > 0) arcs.push({ from: edge.from, to: edge.to, edgeId: edge.id, residual: edge.capacity - flow, direction: 1 });
    if (flow > 0) arcs.push({ from: edge.to, to: edge.from, edgeId: edge.id, residual: flow, direction: -1 });
    return arcs;
  }).sort((a, b) => `${a.from}|${a.to}|${a.edgeId}`.localeCompare(`${b.from}|${b.to}|${b.edgeId}`));
}

function bfs(graph: FlowGraph, flows: Map<string, number>): ResidualArc[] | null {
  const arcs = residualArcs(graph, flows);
  const queue = [graph.source];
  const visited = new Set(queue);
  const parent = new Map<string, ResidualArc>();
  while (queue.length) {
    const current = queue.shift()!;
    for (const arc of arcs.filter((candidate) => candidate.from === current)) {
      if (visited.has(arc.to)) continue;
      visited.add(arc.to);
      parent.set(arc.to, arc);
      if (arc.to === graph.sink) {
        const path: ResidualArc[] = [];
        let node = graph.sink;
        while (node !== graph.source) {
          const step = parent.get(node)!;
          path.unshift(step);
          node = step.from;
        }
        return path;
      }
      queue.push(arc.to);
    }
  }
  return null;
}

export function extractAssignments(scenario: Scenario, graph: FlowGraph, flows: Map<string, number>): Assignment[] {
  return graph.edges.filter((edge) => edge.from.startsWith('driver-shift:') && edge.to.startsWith('job:') && (flows.get(edge.id) ?? 0) === 1).map((edge) => {
    const node = graph.nodes.find((item) => item.id === edge.from)!;
    const driver = scenario.drivers.find((item) => item.id === node.driverId)!;
    const job = scenario.jobs.find((item) => item.id === graph.nodes.find((item) => item.id === edge.to)?.jobId)!;
    return { driverId: driver.id, driverName: driver.name, jobId: job.id, jobName: job.name, shift: job.shift };
  }).sort((a, b) => `${a.shift}|${a.jobId}|${a.driverId}`.localeCompare(`${b.shift}|${b.jobId}|${b.driverId}`));
}

export function runMaxFlow(scenario: Scenario, graph = buildAssignmentNetwork(scenario)): FlowResult {
  const flows = new Map(graph.edges.map((edge) => [edge.id, 0]));
  const trace: AlgorithmStep[] = [snapshot(0, 'initial', 'The network starts with zero flow. Search for a path from source to sink.', graph, flows, 0)];
  let maximumFlow = 0;
  while (true) {
    const path = bfs(graph, flows);
    if (!path) break;
    const bottleneck = Math.min(...path.map((arc) => arc.residual));
    trace.push(snapshot(trace.length, 'search', `Found an augmenting path with bottleneck ${bottleneck}.`, graph, flows, maximumFlow, path, bottleneck));
    path.forEach((arc) => flows.set(arc.edgeId, (flows.get(arc.edgeId) ?? 0) + arc.direction * bottleneck));
    maximumFlow += bottleneck;
    trace.push(snapshot(trace.length, 'augment', `Pushed ${bottleneck} unit${bottleneck === 1 ? '' : 's'} along the path. Total flow is now ${maximumFlow}.`, graph, flows, maximumFlow, path, bottleneck));
  }
  const requiredFlow = scenario.jobs.reduce((sum, job) => sum + job.demand, 0);
  const assignments = extractAssignments(scenario, graph, flows);
  const unmetDemand = scenario.jobs.map((job) => {
    const sinkEdge = graph.edges.find((edge) => edge.from === jobNode(job.id) && edge.to === sinkId)!;
    return { jobId: job.id, jobName: job.name, missing: job.demand - (flows.get(sinkEdge.id) ?? 0) };
  }).filter((job) => job.missing > 0);
  const feasible = maximumFlow === requiredFlow;
  trace.push(snapshot(trace.length, 'complete', feasible ? `Complete: all ${requiredFlow} required assignments were filled.` : `No augmenting path remains. ${requiredFlow - maximumFlow} assignment${requiredFlow - maximumFlow === 1 ? '' : 's'} remain unfilled.`, graph, flows, maximumFlow));
  return { maximumFlow, requiredFlow, feasible, assignments, unmetDemand, trace };
}
