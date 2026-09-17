export interface Driver {
  id: string;
  name: string;
  shifts: string[];
}

export interface Job {
  id: string;
  name: string;
  shift: string;
  demand: number;
}

export interface Eligibility {
  driverId: string;
  jobId: string;
}

export interface Scenario {
  version: 1;
  name: string;
  shifts: string[];
  drivers: Driver[];
  jobs: Job[];
  eligibility: Eligibility[];
}

export type NodeKind = 'source' | 'driver' | 'driverShift' | 'job' | 'sink';

export interface FlowNode {
  id: string;
  label: string;
  kind: NodeKind;
  driverId?: string;
  jobId?: string;
  shift?: string;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  capacity: number;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  source: string;
  sink: string;
}

export interface EdgeState extends FlowEdge {
  flow: number;
  residual: number;
}

export type StepPhase = 'initial' | 'search' | 'augment' | 'complete';

export interface AlgorithmStep {
  index: number;
  phase: StepPhase;
  activePath: string[];
  activeEdgeIds: string[];
  bottleneck?: number;
  edges: EdgeState[];
  maxFlow: number;
  explanation: string;
}

export interface Assignment {
  driverId: string;
  driverName: string;
  jobId: string;
  jobName: string;
  shift: string;
}

export interface FlowResult {
  maximumFlow: number;
  requiredFlow: number;
  feasible: boolean;
  assignments: Assignment[];
  unmetDemand: Array<{ jobId: string; jobName: string; missing: number }>;
  trace: AlgorithmStep[];
}
