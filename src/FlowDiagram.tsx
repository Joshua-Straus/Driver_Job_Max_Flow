import { useMemo } from 'react';
import { Background, Controls, MarkerType, Position, ReactFlow, type Edge, type Node } from '@xyflow/react';
import type { AlgorithmStep, FlowGraph, NodeKind } from './types';

export const nodeColors: Record<NodeKind, string> = {
  source: '#ff4d00', driver: '#000000', driverShift: '#000000', job: '#000000', sink: '#ff4d00',
};
const colors = nodeColors;

function layout(graph: FlowGraph): Node[] {
  const columns: NodeKind[] = ['source', 'driver', 'driverShift', 'job', 'sink'];
  return graph.nodes.map((node) => {
    const items = graph.nodes.filter((candidate) => candidate.kind === node.kind);
    const index = items.findIndex((candidate) => candidate.id === node.id);
    return {
      id: node.id,
      position: { x: columns.indexOf(node.kind) * 245, y: index * 92 + 28 },
      width: 148, height: node.shift ? 49 : 37,
      data: { label: <div className="flow-node-label"><span>{node.label}</span>{node.shift && <small>{node.shift}</small>}</div> },
      style: { '--node-accent': colors[node.kind] } as React.CSSProperties,
      className: `flow-node flow-node--${node.kind}`,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}

export function FlowDiagram({ graph, step }: { graph: FlowGraph; step: AlgorithmStep }) {
  const nodes = useMemo(() => layout(graph), [graph]);
  const state = new Map(step.edges.map((edge) => [edge.id, edge]));
  const active = new Set(step.activeEdgeIds);
  const edges: Edge[] = graph.edges.map((edge) => {
    const current = state.get(edge.id)!;
    const isActive = active.has(edge.id);
    const saturated = current.flow === edge.capacity && edge.capacity > 0;
    return {
      id: edge.id, source: edge.from, target: edge.to,
      label: `${current.flow}/${edge.capacity}`,
      animated: isActive,
      markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? '#ff4d00' : saturated ? '#000000' : '#6b6b6b' },
      style: { stroke: isActive ? '#ff4d00' : saturated ? '#000000' : '#6b6b6b', strokeWidth: isActive ? 3 : saturated ? 2 : 1.5 },
      labelStyle: { fill: '#000000', fontWeight: 600, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 1 },
      labelBgPadding: [5, 3], labelBgBorderRadius: 0,
    };
  });

  return (
    <div className="diagram" aria-label="Flow network diagram">
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.25} maxZoom={1.6} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}>
        <Background color="#d9d9d6" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
